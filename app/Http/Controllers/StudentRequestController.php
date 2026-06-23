<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStudentRequest;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\StudentNotification;
use App\Models\StudentRequest;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class StudentRequestController extends Controller
{
    public function myRequests(Request $request)
    {
        if (!$request->expectsJson()) {
            return view('welcome');
        }

        $student = auth('student')->user();
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $requests = StudentRequest::with('documents')
            ->where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $requests = $requests->map(function ($request) {
            $documentNames = $request->documents->pluck('name')->toArray();
            return [
                'id' => $request->id,
                'tracking_number' => $request->tracking_number,
                'documents' => $documentNames,
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

        $studentRequest = StudentRequest::with('documents')->where('tracking_number', $trackingNumber)->first();

        if (!$studentRequest) {
            return response()->json(['success' => false, 'message' => 'Request not found.'], 404);
        }

        if ($studentRequest->student_id !== $student->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $documents = $studentRequest->documents;
        $documentNames = $documents->pluck('name')->toArray();
        $processingDays = $documents->max('processing_days');

        return response()->json([
            'success' => true,
            'request' => [
                'tracking_number' => $studentRequest->tracking_number,
                'student_name' => $studentRequest->full_name,
                'documents' => $documentNames,
                'semesters' => $studentRequest->semesters ?? [],
                'pages' => $studentRequest->pages,
                'payment_method' => $studentRequest->payment_method,
                'payment_status' => $studentRequest->payment_status,
                'status' => $studentRequest->status,
                'remarks' => $studentRequest->remarks,
                'total_fee' => (float) $studentRequest->total_fee,
                'processing_days' => $processingDays,
                'created_at' => $studentRequest->created_at->format('F d, Y'),
                'year_level' => $studentRequest->year_level,
                'section' => $studentRequest->section,
                'is_digitally_sent' => $studentRequest->is_digitally_sent,
                'digitally_sent_at' => $studentRequest->digitally_sent_at,
                'delivery_type' => $studentRequest->delivery_type,
                'payment_proof' => $studentRequest->payment_proof ? url('/payment-proof/' . $studentRequest->tracking_number) : null,
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

            if (!$student->date_of_birth || !$student->gender || !$student->emergency_contact_person || !$student->emergency_contact_number || !$student->complete_address) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please complete your profile (Date of Birth, Gender, Emergency Contact, and Complete Address) before submitting a request.',
                ], 422);
            }
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
            $paymentStatus = 'unpaid';

            $deliveryType = 'physical';

            $studentRequest = StudentRequest::create([
                'tracking_number' => $trackingNumber,
                'student_id' => auth('student')->id(),
                'student_number' => $validated['studentId'],
                'full_name' => $validated['fullName'],
                'contact_number' => $validated['contactNo'],
                'email' => $validated['email'],
                'course' => $validated['course'],
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

            $docIds = Document::whereIn('code', $validated['selectedDocs'])->pluck('id');
            $studentRequest->documents()->attach($docIds);

            Notification::notifyRole('registrar', 'new_request', 'New Credential Request', "{$validated['fullName']} submitted a request", (string) $studentRequest->id, "/admin/requests/{$studentRequest->id}");
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

        $studentRequest = StudentRequest::with('documents')->where('tracking_number', $trackingNumber)->first();

        if (!$studentRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Tracking number not found.',
            ], 404);
        }

        $studentId = auth('student')->id();
        $isOwner = $studentId !== null && $studentRequest->student_id === $studentId;

        $documents = $studentRequest->documents;
        $documentNames = $documents->pluck('name')->toArray();
        $processingDays = $documents->max('processing_days');

        if (!$isOwner && $studentRequest->status === 'Claimed') {
            return response()->json([
                'success' => false,
                'message' => 'Tracking number not found.',
            ], 404);
        }

        if ($isOwner) {
            return response()->json([
                'success' => true,
                'is_authenticated' => true,
                'is_owner' => true,
                'request' => [
                    'tracking_number' => $studentRequest->tracking_number,
                    'student_name' => $studentRequest->full_name,
                    'documents' => $documentNames,
                    'semesters' => $studentRequest->semesters ?? [],
                    'pages' => $studentRequest->pages,
                    'payment_method' => $studentRequest->payment_method,
                    'payment_status' => $studentRequest->payment_status,
                    'status' => $studentRequest->status,
                    'remarks' => $studentRequest->remarks,
                    'total_fee' => (float) $studentRequest->total_fee,
                    'processing_days' => $processingDays,
                    'created_at' => $studentRequest->created_at->format('F d, Y'),
                    'year_level' => $studentRequest->year_level,
                    'section' => $studentRequest->section,
                    'date_of_birth' => $studentRequest->student?->date_of_birth?->format('Y-m-d'),
                    'gender' => $studentRequest->student?->gender,
                    'emergency_contact_person' => $studentRequest->student?->emergency_contact_person,
                    'emergency_contact_number' => $studentRequest->student?->emergency_contact_number,
                    'complete_address' => $studentRequest->student?->complete_address,
                    'delivery_type' => $studentRequest->delivery_type,
                    'payment_proof' => $studentRequest->payment_proof ? url('/payment-proof/' . $studentRequest->tracking_number) : null,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'is_authenticated' => false,
            'is_owner' => false,
            'request' => [
                'tracking_number' => $studentRequest->tracking_number,
                'documents' => $documentNames,
                'semesters' => $studentRequest->semesters ?? [],
                'pages' => $studentRequest->pages,
                'payment_method' => $studentRequest->payment_method,
                'payment_status' => $studentRequest->payment_status,
                'status' => $studentRequest->status,
                'remarks' => $studentRequest->remarks,
                'total_fee' => (float) $studentRequest->total_fee,
                'processing_days' => $processingDays,
                'created_at' => $studentRequest->created_at->format('F d, Y'),
                'year_level' => $studentRequest->year_level,
                'section' => $studentRequest->section,
                'delivery_type' => $studentRequest->delivery_type,
                'payment_proof' => $studentRequest->payment_proof ? url('/payment-proof/' . $studentRequest->tracking_number) : null,
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
        $request->save();

        $trackingNumberDisplay = $request->tracking_number;
        Notification::notifyRole('registrar', 'request_cancelled', 'Request Cancelled', "{$trackingNumberDisplay} was cancelled by the student.", (string) $request->id, "/admin/requests/{$request->id}");
        Notification::notifyRole('cashier', 'request_cancelled', 'Request Cancelled', "{$trackingNumberDisplay} was cancelled.", (string) $request->id, "/cashier/payments/{$request->id}");

        return response()->json([
            'success' => true,
            'message' => 'Request cancelled successfully.',
        ]);
    }



    public function uploadPaymentProof(Request $request, string $trackingNumber)
    {
        $student = auth('student')->user();
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $studentRequest = StudentRequest::where('tracking_number', $trackingNumber)
            ->where('student_id', $student->id)
            ->first();

        if (!$studentRequest) {
            return response()->json(['success' => false, 'message' => 'Request not found.'], 404);
        }

        if ($studentRequest->payment_status === 'paid') {
            return response()->json(['success' => false, 'message' => 'Payment already verified.'], 422);
        }

        $request->validate([
            'proof' => 'required|file|image|max:5120',
        ]);

        $path = $request->file('proof')->store('payment-proofs');

        $studentRequest->payment_proof = $path;
        $studentRequest->payment_status = 'pending_verification';
        $studentRequest->save();

        return response()->json([
            'success' => true,
            'message' => 'Payment proof uploaded successfully.',
            'proof_url' => url('/payment-proof/' . $trackingNumber),
        ]);
    }

    public function getPaymentProof(string $trackingNumber)
    {
        $studentRequest = StudentRequest::where('tracking_number', $trackingNumber)->first();

        if (!$studentRequest || !$studentRequest->payment_proof) {
            abort(404);
        }

        $student = auth('student')->user();
        $admin = auth()->user();

        $isOwner = $student && $studentRequest->student_id === $student->id;
        $isAdmin = $admin && in_array($admin->role, ['registrar', 'cashier', 'system_admin']);

        if (!$isOwner && !$isAdmin) {
            abort(403);
        }

        $disk = Storage::disk('local');
        if ($disk->exists($studentRequest->payment_proof)) {
            return response()->file($disk->path($studentRequest->payment_proof));
        }

        $path = storage_path('app/public/' . $studentRequest->payment_proof);

        if (!file_exists($path)) {
            abort(404);
        }

        return response()->file($path);
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
        $maxAttempts = 5;
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            $year = date('Y');
            $last = StudentRequest::whereYear('created_at', $year)
                ->lockForUpdate()
                ->orderBy('id', 'desc')
                ->first();

            $nextNumber = $last ? ((int) substr($last->tracking_number, -5)) + 1 : 1;
            $trackingNumber = sprintf('TLGC-%s-%05d', $year, $nextNumber);

            try {
                // Attempt to insert is done outside this method,
                // but we check existence to avoid retries on DB constraint
                $exists = StudentRequest::where('tracking_number', $trackingNumber)->exists();
                if (!$exists) {
                    return $trackingNumber;
                }
            } catch (\Exception $e) {
                // Fall through to retry
            }

            $attempt++;
        }

        throw new \RuntimeException('Unable to generate unique tracking number after ' . $maxAttempts . ' attempts.');
    }
}
