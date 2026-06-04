<?php

namespace App\Http\Controllers\Admin;

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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_requests' => $totalRequests,
                'total_paid' => $totalPaid,
                'total_revenue' => $totalRevenue,
                'average_fee' => round($avgFee ?? 0, 2),
                'monthly_requests' => $monthlyRequests,
                'monthly_revenue' => $monthlyRevenue,
                'status_breakdown' => $statusBreakdown,
                'this_month' => $thisMonth,
                'this_month_revenue' => $thisMonthRevenue,
            ],
        ]);
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
