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
    public function store(StoreStudentRequest $request)
    {
        $validated = $request->validated();

        if (auth('student')->check()) {
            $student = auth('student')->user();
            $validated['studentId'] = $student->student_number;
            $validated['fullName'] = $student->last_name . ', ' . $student->first_name;
            $validated['email'] = $student->email;
        }

        $checkoutUrl = null;

        $result = DB::transaction(function () use ($validated, &$checkoutUrl) {

            $documents = Document::whereIn('code', $validated['selectedDocs'])->get();

            $totalFee = $this->calculateFee(
                $documents,
                $validated['selectedSemesters'] ?? [],
                $validated['pages'] ?? null
            );

            $trackingNumber = $this->generateTrackingNumber();

            $paymentMethod = $validated['paymentMethod'];
            $paymentStatus = $paymentMethod === 'online' ? 'pending_verification' : 'unpaid';

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
            ]);

            if ($paymentMethod === 'online') {
                try {
                    $paymongo = app(PayMongoService::class);
                    $session = $paymongo->createCheckoutSession([
                        'name' => $validated['fullName'],
                        'email' => $validated['email'],
                        'amount' => $totalFee,
                        'description' => "Credential Request - {$trackingNumber}",
                        'tracking_number' => $trackingNumber,
                        'success_url' => url("/payment/success?tracking_number={$trackingNumber}&session_id={CHECKOUT_SESSION_ID}"),
                        'cancel_url' => url("/payment/failed?tracking_number={$trackingNumber}"),
                    ]);

                    $checkoutUrl = $session['attributes']['checkout_url'];
                    $studentRequest->paymongo_checkout_id = $session['id'];
                    $studentRequest->save();
                } catch (\RuntimeException $e) {
                    Log::error('PayMongo checkout failed: ' . $e->getMessage());
                }
            }

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
            'checkout_url' => $checkoutUrl,
        ], 201);
    }

    public function show(string $trackingNumber)
    {
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
            ],
        ]);
    }

    public function cancel(string $trackingNumber)
    {
        $student = auth('student')->user();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'You must be logged in to cancel a request.',
            ], 401);
        }

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

        $request->status = 'Cancelled';
        $request->save();

        $trackingNumberDisplay = $request->tracking_number;
        Notification::notifyRole('admin', 'request_cancelled', 'Request Cancelled', "{$trackingNumberDisplay} was cancelled by the student.", (string) $request->id, "/admin/requests/{$request->id}");
        Notification::notifyRole('cashier', 'request_cancelled', 'Request Cancelled', "{$trackingNumberDisplay} was cancelled.", (string) $request->id, "/cashier/payments/{$request->id}");

        return response()->json([
            'success' => true,
            'message' => 'Request cancelled successfully.',
        ]);
    }

    public function paymentSuccess(Request $request)
    {
        $trackingNumber = $request->query('tracking_number');
        $sessionId = $request->query('session_id');

        if ($sessionId && $trackingNumber) {
            try {
                $paymongo = app(PayMongoService::class);
                $session = $paymongo->retrieveCheckoutSession($sessionId);
                $attributes = $session['attributes'];

                if (($attributes['payment_status'] ?? '') === 'paid') {
                    StudentRequest::where('tracking_number', $trackingNumber)
                        ->where('payment_status', 'pending_verification')
                        ->update(['payment_status' => 'paid']);
                }
            } catch (\RuntimeException $e) {
                Log::error('PayMongo success verification failed: ' . $e->getMessage());
            }
        }

        return redirect('/track');
    }

    public function paymentFailed(Request $request)
    {
        return redirect('/request');
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
                        ->where('payment_status', 'pending_verification')
                        ->update(['payment_status' => 'paid']);
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
