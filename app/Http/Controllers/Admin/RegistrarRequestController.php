<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Notification;
use App\Models\StudentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegistrarRequestController extends Controller
{
    public function getRequestsData(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 10), 1), 50);

        $stats = [
            'total' => StudentRequest::count(),
            'pending_payment' => StudentRequest::whereIn('payment_status', ['unpaid', 'pending_verification'])->count(),
            'processing' => StudentRequest::where('status', 'Processing')->count(),
            'ready_for_release' => StudentRequest::where('status', 'Ready for Release')->count(),
            'claimed' => StudentRequest::where('status', 'Claimed')->count(),
        ];

        $requests = StudentRequest::latest()->paginate($perPage);

        $documentCodes = collect($requests->items())->pluck('document_ids')->flatten()->unique()->values()->toArray();
        $documents = Document::whereIn('code', $documentCodes)->get()->keyBy('code');

        $formatted = collect($requests->items())->map(function ($req) use ($documents) {
            $names = collect($req->document_ids ?? [])->map(fn ($code) => $documents->get($code)?->name ?? $code)->toArray();

            return [
                'id' => $req->id,
                'tracking_number' => $req->tracking_number,
                'student_name' => $req->full_name,
                'student_number' => $req->student_number,
                'course' => $req->course,
                'document_names' => $names,
                'payment_method' => $req->payment_method,
                'payment_status' => $req->payment_status,
                'status' => $req->status,
                'total_fee' => (float) $req->total_fee,
                'created_at' => $req->created_at->format('Y-m-d'),
            ];
        });

        return response()->json([
            'stats' => $stats,
            'requests' => $formatted,
            'pagination' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $user = auth()->user();
        if (!in_array($user->role, ['admin', 'system_admin', 'cashier']) && !$user->hasRole('registrar')) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

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

            if (in_array($newStatus, ['Processing', 'Ready for Release', 'Claimed']) && $studentRequest->payment_status !== 'paid') {
                return response()->json([
                    'message' => 'Payment must be verified before processing this request.',
                ], 422);
            }

            $studentRequest->status = $newStatus;
        }

        if (array_key_exists('remarks', $validated)) {
            $studentRequest->remarks = $validated['remarks'];
        }

        $studentRequest->save();

        if ($currentStatus !== $newStatus) {
            Notification::notifyRole('admin', 'status_update', 'Request Status Updated', "Request {$studentRequest->tracking_number} moved to {$newStatus}", (string) $studentRequest->id, "/admin/requests/{$studentRequest->id}", auth()->id());
        }

        AuditLog::create([
            'action' => $currentStatus !== $newStatus ? 'update_status' : 'update_remarks',
            'performed_by' => auth()->user()->name,
            'performed_by_id' => auth()->id(),
            'target_type' => 'StudentRequest',
            'target_id' => $studentRequest->id,
            'description' => $currentStatus !== $newStatus
                ? "Updated request {$studentRequest->tracking_number}: {$currentStatus} → {$newStatus}"
                : "Updated remarks for request {$studentRequest->tracking_number}",
        ]);

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
