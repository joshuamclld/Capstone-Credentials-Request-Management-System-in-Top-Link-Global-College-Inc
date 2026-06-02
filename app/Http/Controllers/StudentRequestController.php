<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStudentRequest;
use App\Models\StudentRequest;
use App\Models\Document;
use Illuminate\Support\Facades\DB;

class StudentRequestController extends Controller
{
    public function store(StoreStudentRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $validated = $request->validated();

            $documents = Document::whereIn('code', $validated['selectedDocs'])->get();

            $totalFee = $this->calculateFee(
                $documents,
                $validated['selectedSemesters'] ?? [],
                $validated['pages'] ?? null
            );

            $trackingNumber = $this->generateTrackingNumber();

            $paymentMethod = $validated['paymentMethod'];
            $paymentStatus = $paymentMethod === 'online' ? 'pending_verification' : 'unpaid';

            StudentRequest::create([
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
