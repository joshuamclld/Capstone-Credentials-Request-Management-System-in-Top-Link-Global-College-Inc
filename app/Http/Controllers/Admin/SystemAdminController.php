<?php

namespace App\Http\Controllers\Admin;

use App\Exports\ReportsExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateDocumentRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\StudentRequest;
use App\Models\SystemSetting;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Facades\Excel;

class SystemAdminController extends Controller
{
    private function audit(string $action, ?string $targetType = null, ?int $targetId = null, ?string $description = null): void
    {
        $user = auth()->user();
        AuditLog::create([
            'action' => $action,
            'performed_by' => $user->name,
            'performed_by_id' => $user->id,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'description' => $description,
        ]);
    }

    // ─── Dashboard ───────────────────────────────────────────────────────────

    public function dashboard(): JsonResponse
    {
        $totalUsers = User::count();
        $totalRequests = StudentRequest::count();
        $pendingRequests = StudentRequest::where('status', 'Pending')->count();
        $totalDocuments = Document::where('is_active', true)->count();

        $requestsByMonth = StudentRequest::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $usersByRole = User::selectRaw('role, COUNT(*) as count')
            ->groupBy('role')
            ->get();

        $recentLogs = AuditLog::latest()->take(10)->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_users' => $totalUsers,
                'total_requests' => $totalRequests,
                'pending_requests' => $pendingRequests,
                'total_documents' => $totalDocuments,
                'requests_by_month' => $requestsByMonth,
                'users_by_role' => $usersByRole,
                'recent_logs' => $recentLogs,
            ],
        ]);
    }

    // ─── User Management ─────────────────────────────────────────────────────

    public function getUsers(Request $request): JsonResponse
    {
        $query = User::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
                'per_page' => $users->perPage(),
            ],
        ]);
    }

    public function showUser(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $requestCount = StudentRequest::where('student_number', $user->student_number ?? '')->count();

        return response()->json([
            'status' => 'success',
            'data' => $user,
            'request_count' => $requestCount,
        ]);
    }

    public function storeUser(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);
        $data['email_verified_at'] = now();

        $user = User::create($data);

        $this->audit('create_user', 'User', $user->id, "Created user {$user->name} ({$user->email})");

        return response()->json([
            'status' => 'success',
            'message' => 'User created successfully.',
            'data' => $user,
        ], 201);
    }

    public function updateUser(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id() && $request->has('is_active') && !$request->input('is_active')) {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot deactivate your own account.',
            ], 422);
        }

        $data = $request->validated();

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        $this->audit('update_user', 'User', $user->id, "Updated user {$user->name} ({$user->email})");

        return response()->json([
            'status' => 'success',
            'message' => 'User updated successfully.',
            'data' => $user->fresh(),
        ]);
    }

    public function deleteUser(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        $user->delete();

        $this->audit('delete_user', 'User', $id, "Deleted user {$user->name} ({$user->email})");

        return response()->json([
            'status' => 'success',
            'message' => 'User deleted successfully.',
        ]);
    }

    // ─── Document / Credential Type Management ───────────────────────────────

    public function getDocuments(Request $request): JsonResponse
    {
        $query = Document::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $documents = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $documents->items(),
            'pagination' => [
                'current_page' => $documents->currentPage(),
                'last_page' => $documents->lastPage(),
                'total' => $documents->total(),
                'per_page' => $documents->perPage(),
            ],
        ]);
    }

    public function showDocument(int $id): JsonResponse
    {
        $document = Document::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $document,
        ]);
    }

    public function storeDocument(StoreDocumentRequest $request): JsonResponse
    {
        $document = Document::create($request->validated());

        $this->audit('create_document', 'Document', $document->id, "Created document {$document->name} ({$document->code})");

        return response()->json([
            'status' => 'success',
            'message' => 'Document created successfully.',
            'data' => $document,
        ], 201);
    }

    public function updateDocument(UpdateDocumentRequest $request, int $id): JsonResponse
    {
        $document = Document::findOrFail($id);
        $document->update($request->validated());

        $this->audit('update_document', 'Document', $document->id, "Updated document {$document->name} ({$document->code})");

        return response()->json([
            'status' => 'success',
            'message' => 'Document updated successfully.',
            'data' => $document->fresh(),
        ]);
    }

    public function deleteDocument(int $id): JsonResponse
    {
        $document = Document::findOrFail($id);
        $document->update(['is_active' => false]);

        $this->audit('deactivate_document', 'Document', $id, "Deactivated document {$document->name} ({$document->code})");

        return response()->json([
            'status' => 'success',
            'message' => 'Document deactivated successfully.',
        ]);
    }

    // ─── Reports ─────────────────────────────────────────────────────────────

    public function getReports(Request $request): JsonResponse
    {
        $month = $request->input('month', date('Y-m'));

        $totalRequests = StudentRequest::count();
        $totalPaid = StudentRequest::where('payment_status', 'paid')->count();
        $totalRevenue = StudentRequest::where('payment_status', 'paid')->sum('total_fee');
        $avgFee = StudentRequest::where('payment_status', 'paid')->avg('total_fee');

        $monthlyRequests = StudentRequest::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $monthlyRevenue = StudentRequest::where('payment_status', 'paid')
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total_fee) as revenue")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $statusBreakdown = StudentRequest::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get();

        $thisMonth = StudentRequest::whereRaw("DATE_FORMAT(created_at, '%Y-%m') = ?", [$month])->count();
        $thisMonthRevenue = StudentRequest::where('payment_status', 'paid')
            ->whereRaw("DATE_FORMAT(created_at, '%Y-%m') = ?", [$month])
            ->sum('total_fee');

        $documents = Document::where('is_active', true)->get()->keyBy('code');

        $monthlyRequestsByType = StudentRequest::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, document_ids")
            ->get()
            ->groupBy('month')
            ->map(function ($requests, $month) use ($documents) {
                $typeCounts = [];
                foreach ($requests as $req) {
                    $ids = $req->document_ids ?? [];
                    foreach ($ids as $code) {
                        $name = $documents->get($code)?->name ?? $code;
                        $typeCounts[$name] = ($typeCounts[$name] ?? 0) + 1;
                    }
                }
                arsort($typeCounts);
                $topTypes = array_slice($typeCounts, 0, 6);
                return array_merge(['month' => $month], $topTypes);
            })->values();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_requests' => $totalRequests,
                'total_paid' => $totalPaid,
                'total_revenue' => $totalRevenue,
                'average_fee' => round($avgFee ?? 0, 2),
                'monthly_requests' => $monthlyRequests,
                'monthly_revenue' => $monthlyRevenue,
                'monthly_requests_by_type' => $monthlyRequestsByType,
                'status_breakdown' => $statusBreakdown,
                'this_month' => $thisMonth,
                'this_month_revenue' => $thisMonthRevenue,
            ],
        ]);
    }

    public function exportExcel(Request $request)
    {
        return Excel::download(
            new ReportsExport(
                $request->input('month', 'all'),
                $request->input('year', 'all'),
                $request->input('status'),
                $request->input('payment_status')
            ),
            'crms-report-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function exportCsv(Request $request)
    {
        $filename = 'crms-report-' . now()->format('Y-m-d') . '.csv';
        $handle = fopen('php://temp', 'w+');
        fputs($handle, "\xEF\xBB\xBF");

        $headers = [
            'Request ID', 'Tracking Number', 'Student Name', 'Student Number',
            'Course', 'Requested Documents', 'Payment Method', 'Payment Status',
            'Request Status', 'Total Fee', 'Verified By', 'Verified At', 'Created Date',
        ];
        fputcsv($handle, $headers);

        $query = StudentRequest::query();
        if (($m = $request->input('month')) && $m !== 'all') $query->whereMonth('created_at', $m);
        if (($y = $request->input('year')) && $y !== 'all') $query->whereYear('created_at', $y);
        if (($s = $request->input('status')) && $s !== 'all') $query->where('status', $s);
        if (($p = $request->input('payment_status')) && $p !== 'all') $query->where('payment_status', $p);

        $allDocs = Document::all()->keyBy('code');

        $query->latest()->chunk(100, function ($requests) use ($handle, $allDocs) {
            foreach ($requests as $req) {
                $names = collect($req->document_ids ?? [])
                    ->map(fn ($c) => $allDocs->get($c)?->name ?? $c)
                    ->implode(', ');
                fputcsv($handle, [
                    $req->id,
                    $req->tracking_number,
                    $req->full_name,
                    $req->student_number,
                    $req->course,
                    $names,
                    ucfirst(str_replace('_', ' ', $req->payment_method)),
                    ucfirst(str_replace('_', ' ', $req->payment_status)),
                    $req->status,
                    number_format((float) $req->total_fee, 2),
                    $req->verified_by ?? 'N/A',
                    $req->verified_at ? $req->verified_at->format('Y-m-d H:i:s') : 'N/A',
                    $req->created_at->format('Y-m-d'),
                ]);
            }
        });

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return response($content, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function exportPdf(Request $request)
    {
        $query = StudentRequest::query();
        if (($m = $request->input('month')) && $m !== 'all') $query->whereMonth('created_at', $m);
        if (($y = $request->input('year')) && $y !== 'all') $query->whereYear('created_at', $y);
        if (($s = $request->input('status')) && $s !== 'all') $query->where('status', $s);
        if (($p = $request->input('payment_status')) && $p !== 'all') $query->where('payment_status', $p);

        $requests = $query->latest()->get();
        $allDocs = Document::all()->keyBy('code');

        $totalRevenue = $requests->where('payment_status', 'paid')->sum('total_fee');
        $totalPaid = $requests->where('payment_status', 'paid')->count();

        $pdf = Pdf::loadView('reports.pdf', [
            'requests' => $requests,
            'allDocs' => $allDocs,
            'totalRequests' => $requests->count(),
            'totalPaid' => $totalPaid,
            'totalRevenue' => $totalRevenue,
            'generatedAt' => now()->format('F d, Y h:i A'),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('crms-report-' . now()->format('Y-m-d') . '.pdf');
    }

    // ─── Audit Logs ──────────────────────────────────────────────────────────

    public function getAuditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::query();

        if ($action = $request->input('action')) {
            $query->where('action', $action);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('performed_by', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $logs = $query->latest()->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
                'per_page' => $logs->perPage(),
            ],
        ]);
    }

    // ─── System Settings ─────────────────────────────────────────────────────

    public function getSettings(): JsonResponse
    {
        $settings = SystemSetting::all()->pluck('value', 'key');

        $defaults = [
            'school_name' => 'Tarlac Luminary Global College',
            'school_address' => 'Tarlac City, Philippines',
            'processing_time_days' => '3',
            'enable_online_payment' => 'true',
            'enable_student_registration' => 'true',
            'max_requests_per_student' => '5',
            'notification_email' => '',
        ];

        foreach ($defaults as $key => $default) {
            if (!isset($settings[$key])) {
                $settings[$key] = $default;
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $settings,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable|string',
        ]);

        foreach ($request->input('settings') as $key => $value) {
            SystemSetting::setValue($key, $value);
        }

        $this->audit('update_settings', 'SystemSetting', null, 'Updated system settings');

        return response()->json([
            'status' => 'success',
            'message' => 'Settings updated successfully.',
        ]);
    }
}
