<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Notification;
use App\Models\StudentRequest;

use App\Services\PayMongoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CashierPaymentController extends Controller
{
    public function getPaymentsData(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

        $baseCounts = StudentRequest::selectRaw("
            SUM(CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END) as pending_payments,
            SUM(CASE WHEN payment_status = 'pending_verification' THEN 1 ELSE 0 END) as pending_verification,
            SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as total_paid
        ")->first();

        $todayStats = StudentRequest::where('payment_status', 'paid')
            ->whereDate(\DB::raw('COALESCE(verified_at, created_at)'), today())
            ->selectRaw("
                COUNT(*) as paid_today,
                SUM(CASE WHEN payment_method = 'online' THEN 1 ELSE 0 END) as daily_online_count,
                SUM(CASE WHEN payment_method = 'online' THEN total_fee ELSE 0 END) as daily_online_total,
                SUM(CASE WHEN payment_method != 'online' OR payment_method IS NULL THEN 1 ELSE 0 END) as daily_cash_count,
                SUM(CASE WHEN payment_method != 'online' OR payment_method IS NULL THEN total_fee ELSE 0 END) as daily_cash_total
            ")->first();

        $stats = [
            'pending_payments' => (int) $baseCounts->pending_payments,
            'pending_verification' => (int) $baseCounts->pending_verification,
            'paid_today' => (int) $todayStats->paid_today,
            'total_paid' => (int) $baseCounts->total_paid,
            'daily_online_count' => (int) $todayStats->daily_online_count,
            'daily_online_total' => (float) ($todayStats->daily_online_total ?? 0),
            'daily_cash_count' => (int) $todayStats->daily_cash_count,
            'daily_cash_total' => (float) ($todayStats->daily_cash_total ?? 0),
        ];

        $paymentFilter = $request->query('payment_status');

        if ($paymentFilter === 'pending') {
            $requests = StudentRequest::whereIn('payment_status', ['unpaid', 'pending_verification'])
                ->latest()
                ->paginate($perPage);
        } elseif ($paymentFilter === 'paid') {
            $requests = StudentRequest::where('payment_status', 'paid')
                ->latest()
                ->paginate($perPage);
        } else {
            $requests = StudentRequest::latest()->paginate($perPage);
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

    public function verify(int $id): JsonResponse
    {
        $studentRequest = StudentRequest::find($id);

        if (!$studentRequest) {
            return response()->json(['message' => 'Request not found.'], 404);
        }

        if (!in_array($studentRequest->payment_status, ['unpaid', 'pending_payment', 'pending_verification'])) {
            return response()->json(['message' => 'Invalid payment state.'], 422);
        }

        if ($studentRequest->status === 'Cancelled') {
            return response()->json(['message' => 'Cannot verify payment for a cancelled request.'], 422);
        }

        $alreadyVerified = false;

        DB::transaction(function () use ($id, &$alreadyVerified) {
            $locked = StudentRequest::where('id', $id)->lockForUpdate()->first();

            if ($locked->payment_status === 'paid') {
                $alreadyVerified = true;
                return;
            }

            $locked->payment_status = 'paid';
            $locked->verified_by = auth()->user()->name;
            $locked->verified_by_user_id = auth()->id();
            $locked->verified_at = now();
            $locked->save();

            Notification::notifyRole('admin', 'payment_verified', 'Payment Verified', "Payment verified for {$locked->tracking_number}", (string) $locked->id, "/admin/requests/{$locked->id}", auth()->id());

            AuditLog::create([
                'action' => 'verify_payment',
                'performed_by' => auth()->user()->name,
                'performed_by_id' => auth()->id(),
                'target_type' => 'StudentRequest',
                'target_id' => $locked->id,
                'description' => "Verified payment for request {$locked->tracking_number}",
            ]);
        });

        if ($alreadyVerified) {
            return response()->json(['message' => 'Payment already verified.'], 200);
        }

        $studentRequest->refresh();

        $documents = Document::whereIn('code', $studentRequest->document_ids ?? [])->get()->keyBy('code');
        $documentNames = collect($studentRequest->document_ids ?? [])->map(fn ($code) => $documents->get($code)?->name ?? $code)->toArray();

        return response()->json([
            'success' => true,
            'message' => 'Payment verified successfully.',
            'request' => [
                'id' => $studentRequest->id,
                'tracking_number' => $studentRequest->tracking_number,
                'student_name' => $studentRequest->full_name,
                'student_number' => $studentRequest->student_number,
                'course' => $studentRequest->course,
                'email' => $studentRequest->email,
                'document_names' => $documentNames,
                'semesters' => $studentRequest->semesters ?? [],
                'pages' => $studentRequest->pages,
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

    public function checkPayMongo(int $id): JsonResponse
    {
        $studentRequest = StudentRequest::find($id);

        if (!$studentRequest) {
            return response()->json(['message' => 'Request not found.'], 404);
        }

        if ($studentRequest->payment_method !== 'online') {
            return response()->json(['message' => 'Not an online payment request.'], 422);
        }

        if (!$studentRequest->paymongo_checkout_id) {
            return response()->json(['message' => 'No PayMongo checkout session found.', 'paymongo_status' => null], 200);
        }

        try {
            $paymongo = app(PayMongoService::class);
            $session = $paymongo->retrieveCheckoutSession($studentRequest->paymongo_checkout_id);
            $attributes = $session['attributes'] ?? [];

            // Try checkout-level payment_status first, then fall back to payment_intent status
            $paymongoStatus = $attributes['payment_status'] ?? null;
            if (!$paymongoStatus) {
                $paymentIntent = $attributes['payment_intent'] ?? [];
                $intentStatus = $paymentIntent['attributes']['status'] ?? null;
                // Map payment intent statuses to human-readable values
                $statusMap = [
                    'awaiting_payment_method' => 'unpaid',
                    'awaiting_next_action' => 'unpaid',
                    'processing' => 'processing',
                    'succeeded' => 'paid',
                    'cancelled' => 'cancelled',
                    'failed' => 'failed',
                    'expired' => 'expired',
                ];
                $paymongoStatus = $statusMap[$intentStatus] ?? $intentStatus;
            }

            // If PayMongo confirms payment is paid and our DB still shows unpaid, auto-update
            $wasUpdated = false;
            if ($paymongoStatus === 'paid' && $studentRequest->payment_status !== 'paid') {
                $studentRequest->payment_status = 'paid';
                $studentRequest->verified_by = auth()->user()->name;
                $studentRequest->verified_by_user_id = auth()->id();
                $studentRequest->verified_at = now();
                $studentRequest->save();
                $wasUpdated = true;

                Notification::notifyRole('admin', 'payment_verified', 'Payment Verified', "Payment auto-verified for {$studentRequest->tracking_number}", (string) $studentRequest->id, "/admin/requests/{$studentRequest->id}", auth()->id());

                AuditLog::create([
                    'action' => 'verify_payment',
                    'performed_by' => auth()->user()->name,
                    'performed_by_id' => auth()->id(),
                    'target_type' => 'StudentRequest',
                    'target_id' => $studentRequest->id,
                    'description' => "Auto-verified PayMongo payment for {$studentRequest->tracking_number} (checkout: {$studentRequest->paymongo_checkout_id})",
                ]);
            }

            return response()->json([
                'success' => true,
                'paymongo_status' => $paymongoStatus,
                'paymongo_checkout_id' => $studentRequest->paymongo_checkout_id,
                'payment_status' => $studentRequest->payment_status,
                'auto_updated' => $wasUpdated,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve PayMongo session: ' . $e->getMessage(),
                'paymongo_status' => null,
                'paymongo_checkout_id' => $studentRequest->paymongo_checkout_id,
                'payment_status' => $studentRequest->payment_status,
            ], 200);
        }
    }

    public function getOnlinePaymentStatus(): JsonResponse
    {
        $enabled = Cache::get('enable_online_payment', true);

        return response()->json([
            'success' => true,
            'enabled' => $enabled,
        ]);
    }

    public function toggleOnlinePayment(Request $request): JsonResponse
    {
        $request->validate(['enabled' => 'required|boolean']);

        Cache::forever('enable_online_payment', $request->input('enabled'));

        return response()->json([
            'success' => true,
            'message' => 'Online payment setting updated.',
            'enabled' => $request->input('enabled'),
        ]);
    }
}
