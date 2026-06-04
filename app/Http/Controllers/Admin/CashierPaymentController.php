<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\StudentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CashierPaymentController extends Controller
{
    public function getPaymentsData(): JsonResponse
    {
        $requests = StudentRequest::latest()->get();

        $stats = [
            'pending_payments' => $requests->where('payment_status', 'unpaid')->count(),
            'pending_verification' => $requests->where('payment_status', 'pending_verification')->count(),
            'paid_today' => StudentRequest::where('payment_status', 'paid')
                ->whereDate('updated_at', today())->count(),
            'total_paid' => $requests->where('payment_status', 'paid')->count(),
        ];

        $documentCodes = $requests->pluck('document_ids')->flatten()->unique()->values()->toArray();
        $documents = Document::whereIn('code', $documentCodes)->get()->keyBy('code');

        $formatted = $requests->map(function ($request) use ($documents) {
            $names = collect($request->document_ids ?? [])->map(fn ($code) => $documents->get($code)?->name ?? $code)->toArray();

            return [
                'id' => $request->id,
                'tracking_number' => $request->tracking_number,
                'student_name' => $request->full_name,
                'student_number' => $request->student_number,
                'document_names' => $names,
                'payment_method' => $request->payment_method,
                'payment_status' => $request->payment_status,
                'status' => $request->status,
                'total_fee' => (float) $request->total_fee,
                'created_at' => $request->created_at->format('Y-m-d'),
                'updated_at' => $request->updated_at->format('Y-m-d'),
            ];
        });

        return response()->json([
            'stats' => $stats,
            'requests' => $formatted,
        ]);
    }

    public function verify(int $id): JsonResponse
    {
        $studentRequest = StudentRequest::find($id);

        if (!$studentRequest) {
            return response()->json(['message' => 'Request not found.'], 404);
        }

        if ($studentRequest->payment_status === 'paid') {
            return response()->json(['message' => 'Payment is already verified.'], 422);
        }

        $studentRequest->payment_status = 'paid';
        $studentRequest->verified_by = auth()->user()->name;
        $studentRequest->verified_at = now();
        $studentRequest->save();

        $documents = Document::whereIn('code', $studentRequest->document_ids ?? [])->get()->keyBy('code');
        $documentNames = collect($studentRequest->document_ids ?? [])->map(fn ($code) => $documents->get($code)?->name ?? $code)->toArray();

        return response()->json([
            'message' => 'Payment verified successfully.',
            'request' => [
                'id' => $studentRequest->id,
                'tracking_number' => $studentRequest->tracking_number,
                'student_name' => $studentRequest->full_name,
                'student_number' => $studentRequest->student_number,
                'document_names' => $documentNames,
                'payment_method' => $studentRequest->payment_method,
                'payment_status' => $studentRequest->payment_status,
                'status' => $studentRequest->status,
                'total_fee' => (float) $studentRequest->total_fee,
                'verified_by' => $studentRequest->verified_by,
                'verified_at' => $studentRequest->verified_at,
                'created_at' => $studentRequest->created_at->format('Y-m-d'),
            ],
        ]);
    }
}
