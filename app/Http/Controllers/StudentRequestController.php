<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStudentRequest;
use App\Models\Notification;
use App\Models\StudentRequest;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentRequestController extends Controller
{
    public function store(StoreStudentRequest $request)
    {
        $validated = $request->validated();

        return DB::transaction(function () use ($validated) {

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
            ]);

            Notification::notifyRole('admin', 'new_request', 'New Credential Request', "{$validated['fullName']} submitted a request", (string) $studentRequest->id, "/admin/requests/{$studentRequest->id}");
            Notification::notifyRole('cashier', 'new_request', 'New Credential Request', "{$validated['fullName']} submitted a new request waiting for payment.", (string) $studentRequest->id, "/cashier/payments/{$studentRequest->id}");

            return response()->json([
                'success' => true,
                'message' => 'Request submitted successfully',
                'tracking_number' => $trackingNumber,
            ], 201);
        });
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
            ],
        ]);
    }

    public function cancel(Request $cancelRequest, string $trackingNumber)
    {
        $request = StudentRequest::where('tracking_number', $trackingNumber)->first();

        if (!$request) {
            return response()->json([
                'success' => false,
                'message' => 'Tracking number not found.',
            ], 404);
        }

        $studentNumber = $cancelRequest->input('student_number');
        if (!$studentNumber || $studentNumber !== $request->student_number) {
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
