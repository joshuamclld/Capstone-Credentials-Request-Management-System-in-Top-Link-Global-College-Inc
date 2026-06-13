<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\DigitalDocumentMail;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Notification;
use App\Models\StudentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
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

        $request = StudentRequest::find($id);

        if (!$request) {
            return response()->json(['message' => 'Request not found.'], 404);
        }

        $documents = Document::whereIn('code', $request->document_ids ?? [])->get()->keyBy('code');
        $documentNames = collect($request->document_ids ?? [])->map(fn ($code) => $documents->get($code)?->name ?? $code)->toArray();

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
            'paymongo_checkout_id' => $request->paymongo_checkout_id,
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
            'digitally_sent_by_name' => $request->digitally_sent_by ? \App\Models\User::find($request->digitally_sent_by)?->name : null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $studentRequest = StudentRequest::find($id);

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
            Notification::notifyRole('registrar', 'status_update', 'Request Status Updated', "Request {$studentRequest->tracking_number} moved to {$newStatus}", (string) $studentRequest->id, "/admin/requests/{$studentRequest->id}", auth()->id());
        }

        AuditLog::create([
            'action' => $newStatus !== $currentStatus ? 'update_status' : 'update_remarks',
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

    public function sendDigitalDocument(Request $request, int $id): JsonResponse
    {
        $studentRequest = StudentRequest::find($id);

        if (!$studentRequest) {
            return response()->json(['success' => false, 'message' => 'Request not found.'], 404);
        }

        if ($studentRequest->is_digitally_sent) {
            return response()->json(['success' => false, 'message' => 'Digital document has already been sent.'], 422);
        }

        if (!in_array($studentRequest->status, ['Ready for Release', 'Claimed'])) {
            return response()->json(['success' => false, 'message' => 'Document can only be sent when status is Ready for Release or Claimed.'], 422);
        }

        if (!$studentRequest->email) {
            return response()->json(['success' => false, 'message' => 'Student has no email address on file.'], 422);
        }

        $request->validate([
            'pdf' => 'required|mimes:pdf|max:10240',
        ]);

        $user = auth()->user();
        $documents = Document::whereIn('code', $studentRequest->document_ids ?? [])->get()->keyBy('code');
        $documentNames = collect($studentRequest->document_ids ?? [])->map(fn ($code) => $documents->get($code)?->name ?? $code)->toArray();
        $documentName = implode(', ', $documentNames);

        try {
            DB::transaction(function () use ($request, $studentRequest, $user, $documentName, $documentNames) {
                $safeTracking = preg_replace('/[^A-Za-z0-9\-]/', '', $studentRequest->tracking_number);
                $filename = $safeTracking . '-' . time() . '.pdf';
                $path = $request->file('pdf')->storeAs('documents', $filename, 'local');

                Mail::to($studentRequest->email)->queue(new DigitalDocumentMail($studentRequest, $documentName, $path));

                $studentRequest->update([
                    'digital_document_path' => $path,
                    'is_digitally_sent' => true,
                    'digitally_sent_at' => now(),
                    'digitally_sent_by' => $user->id,
                    'delivery_type' => $studentRequest->delivery_type ?: ($studentRequest->status === 'Claimed' ? 'digital' : 'both'),
                ]);

                AuditLog::create([
                    'action' => 'digital_document_sent',
                    'performed_by' => $user->name,
                    'performed_by_id' => $user->id,
                    'target_type' => 'StudentRequest',
                    'target_id' => $studentRequest->id,
                    'description' => "Sent {$documentName} digitally to {$studentRequest->email}",
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send digital document. Please check mail configuration and try again.',
            ], 500);
        }

        $studentRequest->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Digital document sent successfully.',
            'request' => [
                'id' => $studentRequest->id,
                'tracking_number' => $studentRequest->tracking_number,
                'student_name' => $studentRequest->full_name,
                'student_number' => $studentRequest->student_number,
                'course' => $studentRequest->course,
                'year_level' => $studentRequest->year_level,
                'section' => $studentRequest->section,
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
                'is_digitally_sent' => true,
                'digitally_sent_at' => $studentRequest->digitally_sent_at,
                'digitally_sent_by' => $user->id,
                'delivery_type' => $studentRequest->delivery_type,
                'digitally_sent_by_name' => $user->name,
            ],
        ]);
    }
}
