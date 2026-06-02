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

            $document = Document::where('code', $validated['selectedDoc'])->firstOrFail();

            $totalFee = $this->calculateFee(
                $document,
                $validated['selectedSemesters'] ?? []
            );

            $trackingNumber = $this->generateTrackingNumber();

            StudentRequest::create([
                'tracking_number' => $trackingNumber,
                'student_number' => $validated['studentId'],
                'full_name' => $validated['fullName'],
                'contact_number' => $validated['contactNo'],
                'email' => $validated['email'],
                'course' => $validated['course'],
                'document_id' => $document->id,
                'semesters' => $validated['selectedSemesters'] ?? [],
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

    private function calculateFee(Document $document, array $semesters): float
    {
        if ($document->is_per_semester) {
            return (float) ($document->price * count($semesters));
        }

        return (float) $document->price;
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
