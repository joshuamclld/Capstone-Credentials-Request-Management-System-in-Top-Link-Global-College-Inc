<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Notification;
use App\Models\StudentNotification;
use App\Models\StudentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RegistrarRequestController extends Controller
{
    public function getRequestsData(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
        $daily = $request->boolean('daily');

        $statsQuery = StudentRequest::query();
        if ($daily) {
            $statsQuery->whereDate('created_at', today());
        }

        $counts = (clone $statsQuery)->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN payment_status IN ('unpaid','pending_verification') THEN 1 ELSE 0 END) as pending_payment,
            SUM(CASE WHEN status = 'Processing' THEN 1 ELSE 0 END) as processing,
            SUM(CASE WHEN status = 'Ready for Release' THEN 1 ELSE 0 END) as ready_for_release,
            SUM(CASE WHEN status = 'Claimed' THEN 1 ELSE 0 END) as claimed
        ")->first();

        $claimedThisMonth = StudentRequest::where('status', 'Claimed')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->count();

        $stats = [
            'total' => (int) $counts->total,
            'pending_payment' => (int) $counts->pending_payment,
            'processing' => (int) $counts->processing,
            'ready_for_release' => (int) $counts->ready_for_release,
            'claimed' => (int) $counts->claimed,
            'claimed_this_month' => $claimedThisMonth,
        ];

        $statusFilter = $request->query('status');

        $baseQuery = StudentRequest::query();
        if ($daily) {
            $baseQuery->whereDate('created_at', today());
        }

        if ($statusFilter === 'claimed') {
            $requests = (clone $baseQuery)->where('status', 'Claimed')
                ->latest()
                ->paginate($perPage);
        } elseif ($statusFilter === 'processable') {
            $requests = (clone $baseQuery)->where(function ($q) {
                $q->where('payment_status', 'paid')
                  ->orWhere('status', 'Processing');
            })->whereNotIn('status', ['Claimed', 'Cancelled'])
              ->latest()
              ->paginate($perPage);
        } else {
            $requests = (clone $baseQuery)->latest()->paginate($perPage);
        }

        $requests->load('documents');

        $formatted = collect($requests->items())->map(function ($req) {
            $names = $req->documents->pluck('name')->toArray();

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
                'created_at' => $req->created_at?->format('Y-m-d') ?? '',
                'updated_at' => $req->updated_at?->format('Y-m-d') ?? '',
            ];
        });

        return response()->json([
            'success' => true,
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
        if (!in_array($user->role, ['registrar', 'cashier', 'system_admin'])) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        $request = StudentRequest::with('documents')->find($id);

        if (!$request) {
            return response()->json(['message' => 'Request not found.'], 404);
        }

        $documentNames = $request->documents->pluck('name')->toArray();

        return response()->json([
            'success' => true,
            'id' => $request->id,
            'tracking_number' => $request->tracking_number,
            'student_name' => $request->full_name,
            'student_number' => $request->student_number,
            'course' => $request->course,
            'year_level' => $request->year_level,
            'section' => $request->section,
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
            'is_digitally_sent' => $request->is_digitally_sent,
            'digitally_sent_at' => $request->digitally_sent_at,
            'digitally_sent_by' => $request->digitally_sent_by,
            'delivery_type' => $request->delivery_type,
            'payment_proof' => $request->payment_proof ? url('/payment-proof/' . $request->tracking_number) : null,
            'digitally_sent_by_name' => $request->digitally_sent_by ? \App\Models\User::find($request->digitally_sent_by)?->name : null,
            'date_of_birth' => $request->student?->date_of_birth?->format('Y-m-d'),
            'gender' => $request->student?->gender,
            'emergency_contact_person' => $request->student?->emergency_contact_person,
            'emergency_contact_number' => $request->student?->emergency_contact_number,
            'complete_address' => $request->student?->complete_address,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $studentRequest = StudentRequest::with('documents')->find($id);

        if (!$studentRequest) {
            return response()->json(['message' => 'Request not found.'], 404);
        }

        $validated = $request->validate([
            'status' => 'nullable|string|in:Pending,Processing,Ready for Release,Claimed',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $currentStatus = $studentRequest->status;
        $newStatus = $validated['status'] ?? $currentStatus;

        if ($newStatus !== $currentStatus) {
            $allowedTransitions = [
                'Pending' => 'Processing',
                'Processing' => 'Ready for Release',
                'Ready for Release' => 'Claimed',
            ];

            $allowedReverseTransitions = [
                'Processing' => 'Pending',
                'Ready for Release' => 'Processing',
                'Claimed' => 'Ready for Release',
            ];

            $isForward = isset($allowedTransitions[$currentStatus]) && $allowedTransitions[$currentStatus] === $newStatus;
            $isReverse = isset($allowedReverseTransitions[$currentStatus]) && $allowedReverseTransitions[$currentStatus] === $newStatus;

            if (!$isForward && !$isReverse) {
                return response()->json([
                    'message' => 'Invalid request status transition.',
                ], 422);
            }

            if ($isForward && in_array($newStatus, ['Processing', 'Ready for Release', 'Claimed']) && $studentRequest->payment_status !== 'paid') {
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

        if ($newStatus !== $currentStatus) {
            if ($newStatus === 'Claimed') {
                Notification::notifyRole('registrar', 'request_claimed', 'Request Claimed', "Request {$studentRequest->tracking_number} was marked as claimed.", (string) $studentRequest->id, "/admin/requests/{$studentRequest->id}", auth()->id());
            } else {
                Notification::notifyRole('registrar', 'status_update', 'Request Status Updated', "Request {$studentRequest->tracking_number} moved to {$newStatus}", (string) $studentRequest->id, "/admin/requests/{$studentRequest->id}", auth()->id());
            }

            if ($studentRequest->student_id) {
                $title = $newStatus === 'Claimed' ? 'Request Claimed' : 'Request Status Updated';
                $message = $newStatus === 'Claimed'
                    ? "Your request {$studentRequest->tracking_number} has been marked as claimed."
                    : "Your request {$studentRequest->tracking_number} has been updated to: {$newStatus}";
                StudentNotification::create([
                    'student_id' => $studentRequest->student_id,
                    'type' => $newStatus === 'Claimed' ? 'request_claimed' : 'status_update',
                    'title' => $title,
                    'message' => $message,
                    'action_url' => "/student/requests/{$studentRequest->tracking_number}",
                    'created_by' => auth()->id(),
                ]);
            }
        }

        AuditLog::create([
            'action' => $newStatus !== $currentStatus
                ? ($newStatus === 'Claimed' ? 'claim_request' : 'update_status')
                : 'update_remarks',
            'performed_by' => auth()->user()->name,
            'performed_by_id' => auth()->id(),
            'target_type' => 'StudentRequest',
            'target_id' => $studentRequest->id,
            'description' => $currentStatus !== $newStatus
                ? "Updated request {$studentRequest->tracking_number}: {$currentStatus} → {$newStatus}"
                : "Updated remarks for request {$studentRequest->tracking_number}",
        ]);

        $documentNames = $studentRequest->documents->pluck('name')->toArray();

        return response()->json([
            'success' => true,
            'message' => 'Request updated successfully.',
            'request' => [
                'id' => $studentRequest->id,
                'tracking_number' => $studentRequest->tracking_number,
                'student_name' => $studentRequest->full_name,
                'student_number' => $studentRequest->student_number,
                'course' => $studentRequest->course,
                'year_level' => $studentRequest->year_level,
                'section' => $studentRequest->section,
                'date_of_birth' => $studentRequest->student?->date_of_birth?->format('Y-m-d'),
                'gender' => $studentRequest->student?->gender,
                'emergency_contact_person' => $studentRequest->student?->emergency_contact_person,
                'emergency_contact_number' => $studentRequest->student?->emergency_contact_number,
                'complete_address' => $studentRequest->student?->complete_address,
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
                'is_digitally_sent' => $studentRequest->is_digitally_sent,
                'digitally_sent_at' => $studentRequest->digitally_sent_at,
                'digitally_sent_by' => $studentRequest->digitally_sent_by,
                'delivery_type' => $studentRequest->delivery_type,
                'digitally_sent_by_name' => $studentRequest->digitally_sent_by ? \App\Models\User::find($studentRequest->digitally_sent_by)?->name : null,
            ],
        ]);
    }
}
