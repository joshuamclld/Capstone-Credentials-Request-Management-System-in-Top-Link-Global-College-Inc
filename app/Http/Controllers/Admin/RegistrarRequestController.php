<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\StudentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegistrarRequestController extends Controller
{
    public function getRequestsData(): JsonResponse
    {
        $requests = StudentRequest::latest()->get();

        $stats = [
            'total' => $requests->count(),
            'pending_payment' => $requests->whereIn('payment_status', ['unpaid', 'pending_verification'])->count(),
            'processing' => $requests->where('status', 'Processing')->count(),
            'ready_for_release' => $requests->where('status', 'Ready for Release')->count(),
            'claimed' => $requests->where('status', 'Claimed')->count(),
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
                'course' => $request->course,
                'document_names' => $names,
                'payment_method' => $request->payment_method,
                'payment_status' => $request->payment_status,
                'status' => $request->status,
                'total_fee' => (float) $request->total_fee,
                'created_at' => $request->created_at->format('Y-m-d'),
            ];
        });

        return response()->json([
            'stats' => $stats,
            'requests' => $formatted,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $request = StudentRequest::find($id);

        if (!$request) {
            return response()->json(['message' => 'Request not found.'], 404);
        }

        $documents = Document::whereIn('code', $request->document_ids ?? [])->get()->keyBy('code');
        $documentNames = collect($request->document_ids ?? [])->map(fn ($code) => $documents->get($code)?->name ?? $code)->toArray();

        return response()->json([
            'id' => $request->id,
            'tracking_number' => $request->tracking_number,
            'student_name' => $request->full_name,
            'student_number' => $request->student_number,
            'course' => $request->course,
            'year_level' => '',
            'email' => $request->email,
            'phone' => $request->contact_number,
            'purpose' => $request->purpose,
            'document_names' => $documentNames,
            'semesters' => $request->semesters ?? [],
            'pages' => $request->pages,
            'payment_method' => $request->payment_method,
            'payment_status' => $request->payment_status,
            'status' => $request->status,
            'total_fee' => (float) $request->total_fee,
            'remarks' => $request->remarks ?? '',
            'verified_by' => $request->verified_by,
            'verified_at' => $request->verified_at,
            'created_at' => $request->created_at->format('Y-m-d'),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $studentRequest = StudentRequest::find($id);

        if (!$studentRequest) {
            return response()->json(['message' => 'Request not found.'], 404);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:Pending,Processing,Ready for Release,Claimed',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $allowedTransitions = [
            'Pending' => 'Processing',
            'Processing' => 'Ready for Release',
            'Ready for Release' => 'Claimed',
        ];

        $newStatus = $validated['status'];
        $currentStatus = $studentRequest->status;

        if ($currentStatus !== $newStatus) {
            if (!isset($allowedTransitions[$currentStatus]) || $allowedTransitions[$currentStatus] !== $newStatus) {
                return response()->json([
                    'message' => 'Invalid request status transition.',
                ], 422);
            }
        }

        if (in_array($newStatus, ['Processing', 'Ready for Release', 'Claimed']) && $studentRequest->payment_status !== 'paid') {
            return response()->json([
                'message' => 'Payment must be verified before processing this request.',
            ], 422);
        }

        $studentRequest->status = $newStatus;

        if (array_key_exists('remarks', $validated)) {
            $studentRequest->remarks = $validated['remarks'];
        }

        $studentRequest->save();

        $documents = Document::whereIn('code', $studentRequest->document_ids ?? [])->get()->keyBy('code');
        $documentNames = collect($studentRequest->document_ids ?? [])->map(fn ($code) => $documents->get($code)?->name ?? $code)->toArray();

        return response()->json([
            'message' => 'Request updated successfully.',
            'request' => [
                'id' => $studentRequest->id,
                'tracking_number' => $studentRequest->tracking_number,
                'student_name' => $studentRequest->full_name,
                'student_number' => $studentRequest->student_number,
                'course' => $studentRequest->course,
                'year_level' => '',
                'email' => $studentRequest->email,
                'phone' => $studentRequest->contact_number,
                'purpose' => $studentRequest->purpose,
                'document_names' => $documentNames,
                'semesters' => $studentRequest->semesters ?? [],
                'pages' => $studentRequest->pages,
                'payment_method' => $studentRequest->payment_method,
                'payment_status' => $studentRequest->payment_status,
                'status' => $studentRequest->status,
                'total_fee' => (float) $studentRequest->total_fee,
                'remarks' => $studentRequest->remarks ?? '',
                'verified_by' => $studentRequest->verified_by,
                'verified_at' => $studentRequest->verified_at,
                'created_at' => $studentRequest->created_at->format('Y-m-d'),
            ],
        ]);
    }
}
