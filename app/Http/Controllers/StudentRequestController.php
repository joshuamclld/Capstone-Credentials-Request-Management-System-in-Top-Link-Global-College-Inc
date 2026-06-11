<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStudentRequest;
use App\Models\Notification;
use App\Models\StudentRequest;
use App\Models\Document;
use App\Models\User;
use App\Services\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StudentRequestController extends Controller
{
    /**
     * Extract payment status from a PayMongo checkout session response.
     * Tries checkout-level payment_status first, then falls back to payment_intent.attributes.status.
     */
    private function getPayMongoPaymentStatus(array $session): string
    {
        $attributes = $session['attributes'] ?? [];

        $status = $attributes['payment_status'] ?? null;
        if ($status) {
            return $status;
        }

        $paymentIntent = $attributes['payment_intent'] ?? [];
        $intentStatus = $paymentIntent['attributes']['status'] ?? null;

        $statusMap = [
            'awaiting_payment_method' => 'unpaid',
            'awaiting_next_action' => 'unpaid',
            'processing' => 'processing',
            'succeeded' => 'paid',
            'cancelled' => 'cancelled',
            'failed' => 'failed',
            'expired' => 'expired',
        ];

        return $statusMap[$intentStatus] ?? ($intentStatus ?? 'unpaid');
    }
    public function myRequests(Request $request)
    {
        if (!$request->expectsJson()) {
            return view('welcome');
        }

        $student = auth('student')->user();
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $requests = StudentRequest::where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                $documents = Document::whereIn('code', $request->document_ids ?? [])->get();
                return [
                    'id' => $request->id,
                    'tracking_number' => $request->tracking_number,
                    'documents' => $documents->pluck('name')->toArray(),
                    'semesters' => $request->semesters ?? [],
                    'pages' => $request->pages,
                    'payment_method' => $request->payment_method,
                    'payment_status' => $request->payment_status,
                    'status' => $request->status,
                    'total_fee' => (float) $request->total_fee,
                    'created_at' => $request->created_at->format('F d, Y'),
                    'year_level' => $request->year_level,
                    'section' => $request->section,
                    'remarks' => $request->remarks,
                    'paymongo_checkout_id' => $request->paymongo_checkout_id,
                    'delivery_type' => $request->delivery_type,
                ];
            });

        return response()->json([
            'success' => true,
            'requests' => $requests,
        ]);
    }

    public function myRequestDetail(Request $request, $trackingNumber)
    {
        if (!$request->expectsJson()) {
            return view('welcome');
        }
        $student = auth('student')->user();
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request = StudentRequest::where('tracking_number', $trackingNumber)->first();

        if (!$request) {
            return response()->json(['success' => false, 'message' => 'Request not found.'], 404);
        }

        if ($request->student_id !== $student->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $documents = Document::whereIn('code', $request->document_ids ?? [])->get();
        $documentNames = $documents->pluck('name')->toArray();
        $processingDays = $documents->max('processing_days');

        return response()->json([
            'success' => true,
            'request' => [
                'tracking_number' => $request->tracking_number,
                'student_name' => $request->full_name,
                'documents' => $documentNames,
                'semesters' => $request->semesters ?? [],
                'pages' => $request->pages,
                'payment_method' => $request->payment_method,
                'payment_status' => $request->payment_status,
                'status' => $request->status,
                'remarks' => $request->remarks,
                'total_fee' => (float) $request->total_fee,
                'processing_days' => $processingDays,
                'created_at' => $request->created_at->format('F d, Y'),
                'year_level' => $request->year_level,
                'section' => $request->section,
                'paymongo_checkout_id' => $request->paymongo_checkout_id,
                'is_digitally_sent' => $request->is_digitally_sent,
                'digitally_sent_at' => $request->digitally_sent_at,
                'delivery_type' => $request->delivery_type,
            ],
        ]);
    }

    public function store(StoreStudentRequest $request)
    {
        $validated = $request->validated();

        if (auth('student')->check()) {
            $student = auth('student')->user();
            $validated['studentId'] = $student->student_number;
            $validated['fullName'] = $student->last_name . ', ' . $student->first_name;
            $validated['email'] = $student->email;
        }

        $result = DB::transaction(function () use ($validated) {

            $documents = Document::whereIn('code', $validated['selectedDocs'])->get();

            $totalFee = $this->calculateFee(
                $documents,
                $validated['selectedSemesters'] ?? [],
                $validated['pages'] ?? null
            );

            $trackingNumber = $this->generateTrackingNumber();

            $paymentMethod = $validated['paymentMethod'];
            $paymentStatus = $paymentMethod === 'online' ? 'pending_payment' : 'unpaid';

            $deliveryType = $validated['deliveryType'] === 'pickup' ? 'physical' : 'digital';

            $studentRequest = StudentRequest::create([
                'tracking_number' => $trackingNumber,
                'student_id' => auth('student')->id(),
                'student_number' => $validated['studentId'],
                'full_name' => $validated['fullName'],
                'contact_number' => $validated['contactNo'],
                'email' => $validated['email'],
                'course' => $validated['course'],
                'document_ids' => $validated['selectedDocs'],
                'semesters' => $validated['selectedSemesters'] ?? [],
                'pages' => $validated['pages'] ?? null,
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentStatus,
                'purpose' => $validated['purpose'],
                'total_fee' => $totalFee,
                'status' => 'Pending',
                'year_level' => $validated['yearLevel'],
                'section' => $validated['section'],
                'delivery_type' => $deliveryType,
            ]);

            Notification::notifyRole('admin', 'new_request', 'New Credential Request', "{$validated['fullName']} submitted a request", (string) $studentRequest->id, "/admin/requests/{$studentRequest->id}");
            Notification::notifyRole('cashier', 'new_request', 'New Credential Request', "{$validated['fullName']} submitted a new request waiting for payment.", (string) $studentRequest->id, "/cashier/payments/{$studentRequest->id}");

            return [
                'tracking_number' => $trackingNumber,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Request submitted successfully',
            'tracking_number' => $result['tracking_number'],
        ], 201);
    }

    public function show(Request $request, string $trackingNumber)
    {
        if (!$request->expectsJson()) {
            return view('welcome');
        }

        $request = StudentRequest::where('tracking_number', $trackingNumber)->first();

        if (!$request) {
            return response()->json([
                'success' => false,
                'message' => 'Tracking number not found.',
            ], 404);
        }

        $documents = Document::whereIn('code', $request->document_ids)->get();
        $documentNames = $documents->pluck('name')->toArray();
        $processingDays = $documents->max('processing_days');

        $studentId = auth('student')->id();

        return response()->json([
            'success' => true,
            'is_authenticated' => $studentId !== null,
            'is_owner' => $studentId !== null && $request->student_id === $studentId,
            'request' => [
                'tracking_number' => $request->tracking_number,
                'student_name' => $request->full_name,
                'documents' => $documentNames,
                'semesters' => $request->semesters ?? [],
                'pages' => $request->pages,
                'payment_method' => $request->payment_method,
                'payment_status' => $request->payment_status,
                'status' => $request->status,
                'remarks' => $request->remarks,
                'total_fee' => (float) $request->total_fee,
                'processing_days' => $processingDays,
                'created_at' => $request->created_at->format('F d, Y'),
                'year_level' => $request->year_level,
                'section' => $request->section,
                'delivery_type' => $request->delivery_type,
            ],
        ]);
    }

    public function cancel(string $trackingNumber)
    {
        $student = auth('student')->user();

        $request = StudentRequest::where('tracking_number', $trackingNumber)->first();

        if (!$request) {
            return response()->json([
                'success' => false,
                'message' => 'Tracking number not found.',
            ], 404);
        }

        if (!$request->student_id || $request->student_id !== $student->id) {
            return response()->json([
                'success' => false,
                'message' => 'This request does not belong to you.',
            ], 403);
        }

        if ($request->status !== 'Pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending requests can be cancelled.',
            ], 422);
        }

        // Cash: always cancellable while Pending
        // Online: only block if already paid (inconsistent state: Cancelled + Paid)
        if ($request->payment_method === 'online' && $request->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Payment has already been completed for this request.',
            ], 422);
        }

        $request->status = 'Cancelled';
        $request->payment_status = 'unpaid';
        $request->paymongo_checkout_id = null;
        $request->save();

        $trackingNumberDisplay = $request->tracking_number;
        Notification::notifyRole('admin', 'request_cancelled', 'Request Cancelled', "{$trackingNumberDisplay} was cancelled by the student.", (string) $request->id, "/admin/requests/{$request->id}");
        Notification::notifyRole('cashier', 'request_cancelled', 'Request Cancelled', "{$trackingNumberDisplay} was cancelled.", (string) $request->id, "/cashier/payments/{$request->id}");

        return response()->json([
            'success' => true,
            'message' => 'Request cancelled successfully.',
        ]);
    }

    public function continuePayment(string $trackingNumber)
    {
        $student = auth('student')->user();

        $request = StudentRequest::where('tracking_number', $trackingNumber)->first();
        if (!$request) {
            return response()->json(['success' => false, 'message' => 'Request not found.'], 404);
        }
        if ($request->student_id !== $student->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }
        if ($request->payment_method !== 'online') {
            return response()->json(['success' => false, 'message' => 'This request is not an online payment request.'], 422);
        }
        if ($request->payment_status === 'paid') {
            return response()->json(['success' => false, 'message' => 'Payment has already been completed.'], 422);
        }

        // If existing checkout still valid, reuse it
        if ($request->paymongo_checkout_id) {
            try {
                $paymongo = app(PayMongoService::class);
                $session = $paymongo->retrieveCheckoutSession($request->paymongo_checkout_id);
                $checkoutUrl = $session['attributes']['checkout_url'];
                $status = $this->getPayMongoPaymentStatus($session);

                if ($status === 'paid') {
                    $request->payment_status = 'paid';
                    $request->save();
                    return response()->json(['success' => true, 'already_paid' => true, 'message' => 'Payment already completed.']);
                }

                // Session still valid — reuse it
                return response()->json([
                    'success' => true,
                    'checkout_url' => $checkoutUrl,
                ]);
            } catch (\RuntimeException $e) {
                // Session expired or invalid — fall through to create new one
                $request->paymongo_checkout_id = null;
            }
        }

        // Create new checkout session
        try {
            $paymongo = app(PayMongoService::class);
            $session = $paymongo->createCheckoutSession([
                'name' => $request->full_name,
                'email' => $request->email,
                'amount' => (float) $request->total_fee,
                'description' => "Credential Request - {$trackingNumber}",
                'tracking_number' => $trackingNumber,
                'success_url' => url("/payment/success?tracking_number={$trackingNumber}&session_id={CHECKOUT_SESSION_ID}"),
                'cancel_url' => url("/payment/failed?tracking_number={$trackingNumber}"),
            ]);

            $request->paymongo_checkout_id = $session['id'];
            $request->payment_status = 'pending_verification';
            $request->save();

            return response()->json([
                'success' => true,
                'checkout_url' => $session['attributes']['checkout_url'],
            ]);
        } catch (\RuntimeException $e) {
            Log::error('PayMongo continue-payment failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Unable to initiate payment. Please try again later.',
            ], 502);
        }
    }

    public function verifyPayment(Request $request, string $trackingNumber)
    {
        if (!$request->expectsJson()) {
            return view('welcome');
        }

        $student = auth('student')->user();
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request = StudentRequest::where('tracking_number', $trackingNumber)->first();
        if (!$request) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        if ($request->student_id !== $student->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        if ($request->payment_status === 'paid') {
            return response()->json(['success' => true, 'payment_status' => 'paid']);
        }
        if (!$request->paymongo_checkout_id) {
            return response()->json(['success' => true, 'payment_status' => $request->payment_status]);
        }

        try {
            $paymongo = app(PayMongoService::class);
            $session = $paymongo->retrieveCheckoutSession($request->paymongo_checkout_id);
            $status = $this->getPayMongoPaymentStatus($session);

            if ($status === 'paid') {
                $request->payment_status = 'paid';
                $request->save();
                return response()->json(['success' => true, 'payment_status' => 'paid']);
            }

            return response()->json(['success' => true, 'payment_status' => $request->payment_status]);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => true, 'payment_status' => $request->payment_status]);
        }
    }

    public function paymentSuccess(Request $request)
    {
        $trackingNumber = $request->query('tracking_number');
        $sessionId = $request->query('session_id');

        if ($trackingNumber) {
            $studentRequest = StudentRequest::where('tracking_number', $trackingNumber)->first();

            if ($studentRequest && $studentRequest->payment_status !== 'paid') {
                try {
                    $paymongo = app(PayMongoService::class);

                    // Use session_id from URL if available and valid, otherwise fall back to stored checkout ID
                    $checkoutId = null;
                    if ($sessionId && $sessionId !== '{CHECKOUT_SESSION_ID}') {
                        $checkoutId = $sessionId;
                    }
                    if (!$checkoutId && $studentRequest->paymongo_checkout_id) {
                        $checkoutId = $studentRequest->paymongo_checkout_id;
                    }

                    if ($checkoutId) {
                        $session = $paymongo->retrieveCheckoutSession($checkoutId);
                        $status = $this->getPayMongoPaymentStatus($session);

                        if ($status === 'paid') {
                            $studentRequest->payment_status = 'paid';
                            $studentRequest->save();
                        }
                    }
                } catch (\RuntimeException $e) {
                    Log::error('PayMongo success verification failed: ' . $e->getMessage());
                }
            }
        }

        if ($trackingNumber) {
            return redirect('/student/requests/' . $trackingNumber . '?payment_redirect=1');
        }
        return redirect('/student/dashboard');
    }

    public function paymentFailed(Request $request)
    {
        $trackingNumber = $request->query('tracking_number');
        if ($trackingNumber) {
            return redirect('/student/requests/' . $trackingNumber);
        }
        return redirect('/student/dashboard');
    }

    public function webhook(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('Paymongo-Signature');

        if (!$signature) {
            return response()->json(['error' => 'Missing signature'], 400);
        }

        $webhookSecret = config('services.paymongo.webhook_secret');
        if (!$webhookSecret) {
            return response()->json(['error' => 'Webhook not configured'], 500);
        }

        $computedSignature = hash_hmac('sha256', $payload, $webhookSecret);

        if (!hash_equals($computedSignature, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $event = json_decode($payload, true);
        $eventType = $event['data']['attributes']['type'] ?? '';

        if ($eventType === 'checkout_session.payment.paid') {
            $checkoutData = $event['data']['attributes']['data']['attributes'] ?? [];

            if (($checkoutData['payment_status'] ?? '') === 'paid') {
                $trackingNumber = $checkoutData['metadata']['tracking_number'] ?? null;

                if ($trackingNumber) {
                    StudentRequest::where('tracking_number', $trackingNumber)
                        ->whereIn('payment_status', ['pending_payment', 'pending_verification'])
                        ->update(['payment_status' => 'paid', 'verified_at' => now()]);
                }
            }
        }

        return response()->json(['success' => true]);
    }

    private function calculateFee($documents, array $semesters, ?int $pages): float
    {
        $total = 0;

        foreach ($documents as $document) {
            if ($document->is_per_semester) {
                $total += $document->price * count($semesters);
            } elseif ($document->is_per_page) {
                $total += $document->price * ($pages ?? 1);
            } else {
                $total += $document->price;
            }
        }

        return (float) $total;
    }

    private function generateTrackingNumber(): string
    {
        $year = date('Y');
        $last = StudentRequest::whereYear('created_at', $year)
            ->lockForUpdate()
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = $last ? ((int) substr($last->tracking_number, -5)) + 1 : 1;

        return sprintf('TLGC-%s-%05d', $year, $nextNumber);
    }
}
