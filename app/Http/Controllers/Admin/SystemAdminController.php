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
use App\Models\Student;
use App\Models\StudentRequest;
use App\Models\User;
use App\Mail\StudentWelcomeMail;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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
        $totalStudents = Student::count();
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
                'total_students' => $totalStudents,
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
        $user = auth()->user();
        if ($user->role === 'system_admin' && !$user->is_super_admin) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized.'], 403);
        }

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
        $authUser = auth()->user();
        if ($authUser->role === 'system_admin' && !$authUser->is_super_admin) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized.'], 403);
        }

        $user = User::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $user->only(['id', 'name', 'email', 'role', 'contact_number', 'is_active', 'is_super_admin', 'created_at', 'updated_at']),
            'request_count' => StudentRequest::where('verified_by_user_id', $user->id)->count(),
        ]);
    }

    public function storeUser(StoreUserRequest $request): JsonResponse
    {
        $authUser = auth()->user();
        if ($authUser->role === 'system_admin' && !$authUser->is_super_admin) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized.'], 403);
        }

        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);
        $data['email_verified_at'] = now();
        $data['is_super_admin'] = false;

        $user = User::create($data);

        $this->audit('create_user', 'User', $user->id, "Created user {$user->name} ({$user->email})");

        return response()->json([
            'status' => 'success',
            'message' => 'User created successfully.',
            'data' => $user->only(['id', 'name', 'email', 'role', 'contact_number', 'is_active', 'is_super_admin', 'created_at']),
        ], 201);
    }

    public function updateUser(UpdateUserRequest $request, int $id): JsonResponse
    {
        $authUser = auth()->user();
        if ($authUser->role === 'system_admin' && !$authUser->is_super_admin) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized.'], 403);
        }

        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            if ($request->has('is_active') && !$request->input('is_active')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You cannot deactivate your own account.',
                ], 422);
            }
            if ($request->has('is_super_admin') && !$request->input('is_super_admin')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You cannot remove your own super admin privileges.',
                ], 422);
            }
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
            'data' => $user->fresh()->only(['id', 'name', 'email', 'role', 'contact_number', 'is_active', 'is_super_admin', 'created_at', 'updated_at']),
        ]);
    }

    public function deleteUser(int $id): JsonResponse
    {
        $authUser = auth()->user();
        if ($authUser->role === 'system_admin' && !$authUser->is_super_admin) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized.'], 403);
        }

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

        $this->audit('delete_document', 'Document', $id, "Deleted document {$document->name} ({$document->code})");

        $document->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Document deleted successfully.',
        ]);
    }

    // ─── Reports ─────────────────────────────────────────────────────────────

    public function getReports(Request $request): JsonResponse
    {
        $month = $request->input('month', date('Y-m'));

        $totalRequests = StudentRequest::count();
        $totalPaid = StudentRequest::where('payment_status', 'paid')
            ->whereRaw("DATE_FORMAT(created_at, '%Y-%m') = ?", [$month])->count();
        $totalRevenue = StudentRequest::where('payment_status', 'paid')
            ->whereRaw("DATE_FORMAT(created_at, '%Y-%m') = ?", [$month])->sum('total_fee');
        $avgFee = StudentRequest::where('payment_status', 'paid')
            ->whereRaw("DATE_FORMAT(created_at, '%Y-%m') = ?", [$month])->avg('total_fee');

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

        $monthlyRequestsByType = StudentRequest::with('documents')
            ->lazy()
            ->groupBy(fn ($req) => $req->created_at->format('Y-m'))
            ->map(function ($requests, $month) {
                $typeCounts = [];
                foreach ($requests as $req) {
                    foreach ($req->documents as $doc) {
                        $typeCounts[$doc->name] = ($typeCounts[$doc->name] ?? 0) + 1;
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
                'server_month' => now()->format('Y-m'),
                'server_date' => now()->format('Y-m-d'),
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

        $query->with('documents')->latest()->chunk(100, function ($requests) use ($handle) {
            foreach ($requests as $req) {
                $names = $req->documents->pluck('name')->implode(', ');
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

        $requests = $query->with('documents')->latest()->get();

        $totalRevenue = $requests->where('payment_status', 'paid')->sum('total_fee');
        $totalPaid = $requests->where('payment_status', 'paid')->count();

        $pdf = Pdf::loadView('reports.pdf', [
            'requests' => $requests,
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

    // ─── Student Management ───────────────────────────────────────────────────

    public function getStudents(Request $request): JsonResponse
    {
        $query = Student::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('student_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $students = $query->latest()->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $students->items(),
            'pagination' => [
                'current_page' => $students->currentPage(),
                'last_page' => $students->lastPage(),
                'total' => $students->total(),
                'per_page' => $students->perPage(),
            ],
        ]);
    }

    public function storeStudent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_number' => 'required|string|max:50|unique:students,student_number',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:students,email',
        ]);

        $password = 'TLGC' . $validated['last_name'] . $validated['student_number'];

        $student = Student::create([
            'student_number' => $validated['student_number'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($password),
            'email_verified_at' => now(),
        ]);

        Mail::to($student->email)->queue(new StudentWelcomeMail(
            $student->first_name . ' ' . $student->last_name,
            $student->student_number,
            $password,
        ));

        $this->audit('create_student', 'Student', $student->id, "Created student {$student->first_name} {$student->last_name} ({$student->student_number})");

        return response()->json([
            'status' => 'success',
            'message' => 'Student created successfully. Login credentials sent via email.',
            'data' => $student,
        ], 201);
    }

    public function toggleStudentStatus(int $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $student->update(['is_active' => !$student->is_active]);

        $status = $student->is_active ? 'activated' : 'deactivated';
        $this->audit('toggle_student_status', 'Student', $student->id, "{$status} student {$student->first_name} {$student->last_name} ({$student->student_number})");

        return response()->json([
            'status' => 'success',
            'message' => "Student {$status} successfully.",
            'data' => $student->fresh(),
        ]);
    }

    public function deleteStudent(int $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $student->delete();

        $this->audit('delete_student', 'Student', $id, "Deleted student {$student->first_name} {$student->last_name} ({$student->student_number})");

        return response()->json([
            'status' => 'success',
            'message' => 'Student deleted successfully.',
        ]);
    }

    public function importStudents(Request $request): JsonResponse
    {
        $request->validate([
            'students' => 'required|array|min:1',
            'students.*.student_number' => 'required|string|max:50',
            'students.*.first_name' => 'required|string|max:255',
            'students.*.last_name' => 'required|string|max:255',
            'students.*.email' => 'required|email|max:255',
        ]);

        $created = 0;
        $skipped = 0;
        $errors = [];

        foreach ($request->input('students') as $index => $data) {
            $exists = Student::where('student_number', $data['student_number'])
                ->orWhere('email', $data['email'])
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            $password = 'TLGC' . $data['last_name'] . $data['student_number'];

            try {
                $student = Student::create([
                    'student_number' => $data['student_number'],
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'email' => $data['email'],
                    'password' => Hash::make($password),
                    'email_verified_at' => now(),
                ]);

                Mail::to($student->email)->queue(new StudentWelcomeMail(
                    $student->first_name . ' ' . $student->last_name,
                    $student->student_number,
                    $password,
                ));

                $created++;
            } catch (\Exception $e) {
                $errors[] = "Row " . ($index + 1) . " ({$data['student_number']}): " . $e->getMessage();
            }
        }

        $this->audit('import_students', 'Student', null, "Imported {$created} students ({$skipped} skipped)");

        return response()->json([
            'status' => 'success',
            'message' => "Import complete: {$created} created, {$skipped} skipped.",
            'data' => [
                'created' => $created,
                'skipped' => $skipped,
                'errors' => $errors,
            ],
        ]);
    }
}
