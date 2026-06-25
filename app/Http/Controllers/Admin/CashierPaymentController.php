<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\PaymentSetting;
use App\Models\StudentNotification;
use App\Models\StudentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CashierPaymentController extends Controller
{
    // ─── Payments Dashboard ──────────────────────────────────────────────────

    // Fetch paginated payments with daily stats (pending, verified counts, online vs cash totals)
    public function getPaymentsData(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', config('requests.per_page')), 1), 100);
        $daily = $request->boolean('daily');
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');
        $hasDateRange = $dateFrom && $dateTo;

        $requestsQuery = StudentRequest::query();
        $dailyStatsQuery = StudentRequest::query();

        if ($hasDateRange) {
            $dailyStatsQuery->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo);
            $requestsQuery->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo);
        } elseif ($daily) {
            $dailyStatsQuery->whereDate('created_at', today());
            $requestsQuery->whereDate('created_at', today());
        }

        $dailyCounts = (clone $dailyStatsQuery)->selectRaw("
            SUM(CASE WHEN payment_status = 'unpaid' AND status != 'Cancelled' THEN 1 ELSE 0 END) as pending_payments,
            SUM(CASE WHEN payment_status = 'pending_verification' THEN 1 ELSE 0 END) as pending_verification
        ")->first();

        $totalPaid = StudentRequest::where('payment_status', 'paid')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $paidStatsQuery = StudentRequest::where('payment_status', 'paid');
        if ($hasDateRange) {
            $paidStatsQuery->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo);
        } else {
            $paidStatsQuery->whereDate(\DB::raw('COALESCE(verified_at, created_at)'), today());
        }

        $todayStats = (clone $paidStatsQuery)->selectRaw("
            COUNT(*) as paid_today,
            SUM(CASE WHEN payment_method = 'online' THEN 1 ELSE 0 END) as daily_online_count,
            SUM(CASE WHEN payment_method = 'online' THEN total_fee ELSE 0 END) as daily_online_total,
            SUM(CASE WHEN payment_method != 'online' OR payment_method IS NULL THEN 1 ELSE 0 END) as daily_cash_count,
            SUM(CASE WHEN payment_method != 'online' OR payment_method IS NULL THEN total_fee ELSE 0 END) as daily_cash_total
        ")->first();

        $stats = [
            'pending_payments' => (int) $dailyCounts->pending_payments,
            'pending_verification' => (int) $dailyCounts->pending_verification,
            'paid_today' => (int) $todayStats->paid_today,
            'total_paid' => $totalPaid,
            'daily_online_count' => (int) $todayStats->daily_online_count,
            'daily_online_total' => (float) ($todayStats->daily_online_total ?? 0),
            'daily_cash_count' => (int) $todayStats->daily_cash_count,
            'daily_cash_total' => (float) ($todayStats->daily_cash_total ?? 0),
        ];

        $paymentFilter = $request->query('payment_status');

        // Apply status filter: pending (unpaid + pending_verification), paid, or all
        if ($paymentFilter === 'pending') {
            $requests = (clone $requestsQuery)->whereIn('payment_status', ['unpaid', 'pending_verification'])
                ->latest()
                ->paginate($perPage);
        } elseif ($paymentFilter === 'paid') {
            $requests = (clone $requestsQuery)->where('payment_status', 'paid')
                ->latest()
                ->paginate($perPage);
        } else {
            $requests = (clone $requestsQuery)->latest()->paginate($perPage);
        }

        $requests->load('documents');

        $formatted = collect($requests->items())->map(function ($req) {
            $names = $req->documents->pluck('name')->toArray();

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

    // ─── Payment Verification ────────────────────────────────────────────────

    // Mark a request as paid within a locked transaction, notify registrar and student, audit the action
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

            Notification::notifyRole('registrar', 'payment_verified', 'Payment Verified', "Payment verified for {$locked->tracking_number}", (string) $locked->id, "/admin/requests/{$locked->id}", auth()->id());

            if ($locked->student_id) {
                StudentNotification::create([
                    'student_id' => $locked->student_id,
                    'type' => 'payment_verified',
                    'title' => 'Payment Verified',
                    'message' => "Your payment for request {$locked->tracking_number} has been verified.",
                    'action_url' => "/student/requests/{$locked->tracking_number}",
                ]);
            }

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
        $studentRequest->load('documents');
        $documentNames = $studentRequest->documents->pluck('name')->toArray();

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
                'payment_proof' => $studentRequest->payment_proof ? url('/payment-proof/' . $studentRequest->tracking_number) : null,
                'created_at' => $studentRequest->created_at->format('Y-m-d'),
            ],
        ]);
    }

    // ─── Online Payment Toggle ───────────────────────────────────────────────

    // Check whether online payment is globally enabled
    public function getOnlinePaymentStatus(): JsonResponse
    {
        $setting = PaymentSetting::where('key', 'enable_online_payment')->first();
        $enabled = $setting ? filter_var($setting->value, FILTER_VALIDATE_BOOL) : true;

        return response()->json([
            'success' => true,
            'enabled' => $enabled,
        ]);
    }

    // Enable or disable the online payment option globally
    public function toggleOnlinePayment(Request $request): JsonResponse
    {
        $request->validate(['enabled' => 'required|boolean']);

        PaymentSetting::updateOrCreate(
            ['key' => 'enable_online_payment'],
            ['value' => $request->input('enabled') ? 'true' : 'false']
        );

        return response()->json([
            'success' => true,
            'message' => 'Online payment setting updated.',
            'enabled' => $request->input('enabled'),
        ]);
    }

    // ─── QR Code Management ──────────────────────────────────────────────────

    // Upload a QR code image for students to scan when paying online
    public function uploadQr(Request $request): JsonResponse
    {
        $request->validate([
            'qr_image' => 'required|file|image|max:2048',
        ]);

        $path = $request->file('qr_image')->store('payment-qr');

        PaymentSetting::updateOrCreate(
            ['key' => 'payment_qr'],
            ['value' => $path]
        );

        return response()->json([
            'success' => true,
            'message' => 'Payment QR code uploaded.',
            'qr_url' => url('/payment-qr-image?' . time()),
        ]);
    }

    // Return the QR image URL if one has been uploaded
    public function getQr(): JsonResponse
    {
        $setting = PaymentSetting::where('key', 'payment_qr')->first();

        if (!$setting || !$setting->value) {
            return response()->json(['success' => false, 'qr_url' => null]);
        }

        return response()->json([
            'success' => true,
            'qr_url' => url('/payment-qr-image?' . time()),
        ]);
    }

    // Serve the QR image file from local or public disk
    public function getQrImage()
    {
        $setting = PaymentSetting::where('key', 'payment_qr')->first();

        if (!$setting || !$setting->value) {
            abort(404);
        }

        $disk = Storage::disk('local');
        if ($disk->exists($setting->value)) {
            return response()->file($disk->path($setting->value));
        }

        $path = storage_path('app/public/' . $setting->value);
        if (!file_exists($path)) {
            abort(404);
        }

        return response()->file($path);
    }
}
