<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Notification;
use App\Models\StudentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CashierPaymentController extends Controller
{
    public function getPaymentsData(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 10);

        $stats = [
            'pending_payments' => StudentRequest::where('payment_status', 'unpaid')->count(),
            'pending_verification' => StudentRequest::where('payment_status', 'pending_verification')->count(),
            'paid_today' => StudentRequest::where('payment_status', 'paid')
                ->whereDate('verified_at', today())->count(),
            'total_paid' => StudentRequest::where('payment_status', 'paid')->count(),
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
                'document_names' => $names,
                'payment_method' => $req->payment_method,
                'payment_status' => $req->payment_status,
                'status' => $req->status,
                'total_fee' => (float) $req->total_fee,
                'created_at' => $req->created_at->format('Y-m-d'),
                'updated_at' => $req->updated_at->format('Y-m-d'),
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

    public function verify(int $id): JsonResponse
    {
        $studentRequest = StudentRequest::find($id);

        if (!$studentRequest) {
            return response()->json(['message' => 'Request not found.'], 404);
        }

        if ($studentRequest->payment_status === 'paid') {
            return response()->json(['message' => 'Payment is already verified.'], 422);
        }

        if (!in_array($studentRequest->payment_status, ['unpaid', 'pending_verification'])) {
            return response()->json(['message' => 'Invalid payment state.'], 422);
        }

        $studentRequest->payment_status = 'paid';
        $studentRequest->verified_by = auth()->user()->name;
        $studentRequest->verified_by_user_id = auth()->id();
        $studentRequest->verified_at = now();
        $studentRequest->save();

        Notification::notifyRole('admin', 'payment_verified', 'Payment Verified', "Payment verified for {$studentRequest->tracking_number}", (string) $studentRequest->id, "/admin/requests/{$studentRequest->id}");

        AuditLog::create([
            'action' => 'verify_payment',
            'performed_by' => auth()->user()->name,
            'performed_by_id' => auth()->id(),
            'target_type' => 'StudentRequest',
            'target_id' => $studentRequest->id,
            'description' => "Verified payment for request {$studentRequest->tracking_number}",
        ]);

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
