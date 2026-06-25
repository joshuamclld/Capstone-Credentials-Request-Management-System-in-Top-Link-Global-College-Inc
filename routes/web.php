<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\CashierPaymentController;
use App\Http\Controllers\Admin\RegistrarRequestController;
use App\Http\Controllers\Admin\SystemAdminController;
use App\Http\Controllers\StudentAuthController;
use App\Http\Controllers\Student\StudentNotificationController;
use App\Http\Controllers\StudentRequestController;
use App\Http\Controllers\StudentProfileController;
use App\Http\Controllers\DocumentController;

// Public landing page — serves the SPA (React app)
Route::get('/', function () {
    return view('welcome');
});

// Admin login page — also serves the SPA but redirects already-authenticated users to their dashboard
Route::get('/admin-login', function () {
    if (Auth::check()) {
        $role = Auth::user()->role;
        if ($role === 'registrar') return redirect('/admin-dashboard');
        if ($role === 'cashier') return redirect('/cashier-dashboard');
        if ($role === 'system_admin') return redirect('/system-admin-dashboard');
    }
    return view('welcome');
});

// Dashboard entry points — middleware checks the role and ensures account is active
Route::get('/admin-dashboard', function () {
    return view('welcome');
})->middleware('admin');

Route::get('/system-admin-dashboard', function () {
    return view('welcome');
})->middleware('system_admin');

// ─── Admin (Registrar/Cashier/System Admin) Authentication & API Routes ───
Route::prefix('admin')->group(function () {
    // Session-based throttle uses session_id + path as key so shared IPs don't interfere
    Route::post('/login', [AdminAuthController::class, 'login'])
        ->middleware('throttle:login');

    Route::post('/logout', [AdminAuthController::class, 'logout'])
        ->middleware('auth');

    // High limit for frequent auth checks (SPA polls this every 5 min)
    Route::get('/check-auth', [AdminAuthController::class, 'checkAuth'])->middleware('throttle:60,1');

    // Notification routes — mark individual or all as read
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->middleware('auth')->whereNumber('id');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->middleware('auth');

    // Registrar — paginated list of all requests with filters
    Route::get('/requests-data', [RegistrarRequestController::class, 'getRequestsData'])
        ->middleware('admin');

    // Cashier / Payment Routes — also accessible by registrar for oversight
    Route::get('/payments-data', [CashierPaymentController::class, 'getPaymentsData'])
        ->middleware('cashier');

    // Verify payment with row locking to prevent double-verification race conditions
    Route::patch('/payments/{id}/verify', [CashierPaymentController::class, 'verify'])
        ->middleware(['cashier', 'throttle:20,1'])
        ->whereNumber('id');

    // Toggle whether students can pay online (GCash/Maya) via QR code
    Route::get('/cashier/online-payment-status', [CashierPaymentController::class, 'getOnlinePaymentStatus'])
        ->middleware('cashier');

    Route::post('/cashier/online-payment-status', [CashierPaymentController::class, 'toggleOnlinePayment'])
        ->middleware('cashier');

    Route::post('/payment-qr', [CashierPaymentController::class, 'uploadQr'])
        ->middleware('cashier');

    Route::get('/payment-qr', [CashierPaymentController::class, 'getQr']);

    // System Administrator Routes — full control panel
    Route::middleware('system_admin')->group(function () {
        Route::get('/system-dashboard-data', [SystemAdminController::class, 'dashboard']);

        // User management — only super_admin can create/edit/delete admin users
        Route::get('/system/users', [SystemAdminController::class, 'getUsers']);
        Route::get('/system/users/{id}', [SystemAdminController::class, 'showUser'])->whereNumber('id');
        Route::post('/system/users', [SystemAdminController::class, 'storeUser'])->middleware('throttle:10,10');
        Route::put('/system/users/{id}', [SystemAdminController::class, 'updateUser'])->whereNumber('id');
        Route::delete('/system/users/{id}', [SystemAdminController::class, 'deleteUser'])->whereNumber('id');

        // Document / Credential Type management — pricing is configured here (flat/per-semester/per-page)
        Route::get('/system/documents', [SystemAdminController::class, 'getDocuments']);
        Route::get('/system/documents/{id}', [SystemAdminController::class, 'showDocument'])->whereNumber('id');
        Route::post('/system/documents', [SystemAdminController::class, 'storeDocument']);
        Route::put('/system/documents/{id}', [SystemAdminController::class, 'updateDocument'])->whereNumber('id');
        Route::delete('/system/documents/{id}', [SystemAdminController::class, 'deleteDocument'])->whereNumber('id');

        // Reports — exportable in three formats
        Route::get('/system/reports', [SystemAdminController::class, 'getReports']);
        Route::get('/system/reports/export/excel', [SystemAdminController::class, 'exportExcel']);
        Route::get('/system/reports/export/csv', [SystemAdminController::class, 'exportCsv']);
        Route::get('/system/reports/export/pdf', [SystemAdminController::class, 'exportPdf']);

        // Audit logs — full trail of all admin actions
        Route::get('/system/audit-logs', [SystemAdminController::class, 'getAuditLogs']);

        // Student management — manual create, bulk CSV import, toggle active, delete
        Route::get('/system/students', [SystemAdminController::class, 'getStudents']);
        Route::post('/system/students', [SystemAdminController::class, 'storeStudent'])->middleware('throttle:10,10');
        Route::post('/system/students/import', [SystemAdminController::class, 'importStudents'])->middleware('throttle:3,10');
        Route::patch('/system/students/{id}/toggle-status', [SystemAdminController::class, 'toggleStudentStatus']);
        Route::delete('/system/students/{id}', [SystemAdminController::class, 'deleteStudent']);

        // Course / Program management — dropdown options on the student request form
        Route::get('/system/courses', [SystemAdminController::class, 'getCourses']);
        Route::post('/system/courses', [SystemAdminController::class, 'storeCourse']);
        Route::put('/system/courses/{course}', [SystemAdminController::class, 'updateCourse']);
        Route::patch('/system/courses/{course}/toggle-status', [SystemAdminController::class, 'toggleCourseStatus']);
        Route::delete('/system/courses/{course}', [SystemAdminController::class, 'deleteCourse']);
    });

    // API routes prefix avoids SPA catch-all conflict (e.g. /admin/requests/{id} vs /admin/{any})
    Route::prefix('api')->group(function () {
        Route::get('/notifications', [NotificationController::class, 'index'])->middleware('auth');
        Route::get('/notifications/all', [NotificationController::class, 'getAll'])->middleware('auth');

        Route::get('/requests/{id}', [RegistrarRequestController::class, 'show'])
            ->middleware('auth')
            ->whereNumber('id');

        // Status update with transition validation (Pending→Processing→Release→Claimed)
        Route::patch('/requests/{id}', [RegistrarRequestController::class, 'update'])
            ->middleware('admin')
            ->whereNumber('id');
    });
});

// SPA catch-all — these GET routes let React handle all client-side routing
Route::get('/login', function () { return view('welcome'); })->name('login');
Route::get('/admin/{any?}', function () { return view('welcome'); })->where('any', '.*');
Route::get('/cashier/{any?}', function () { return view('welcome'); })->where('any', '.*');
Route::get('/system-admin/{any?}', function () { return view('welcome'); })->where('any', '.*');

// ─── Student Request Submission & Public Tracking ───
// Rate-limited to prevent abuse (10req/min submit, 30req/min tracking view)
Route::post('/requests', [StudentRequestController::class, 'store'])
    ->middleware(['auth:student', 'throttle:10,1']);
Route::get('/requests/{tracking_number}', [StudentRequestController::class, 'show'])
    ->middleware('throttle:30,1');
Route::patch('/requests/{tracking_number}/cancel', [StudentRequestController::class, 'cancel'])
    ->middleware(['auth:student', 'throttle:5,1']);
// Public endpoints — no auth required
Route::get('/documents', [DocumentController::class, 'index']);
Route::get('/online-payment-status', [CashierPaymentController::class, 'getOnlinePaymentStatus']);
Route::get('/payment-qr-image', [CashierPaymentController::class, 'getQrImage'])->middleware('throttle:60,1');
Route::get('/payment-proof/{tracking_number}', [StudentRequestController::class, 'getPaymentProof'])->middleware('throttle:60,1');
Route::get('/courses', function () {
    return response()->json(['courses' => \App\Models\Course::active()->orderBy('name')->get()]);
});

// ─── Student Authentication Routes ───
Route::prefix('student')->group(function () {
    // Session-based throttle — each browser session gets its own 5-attempt counter
    Route::post('/login', [StudentAuthController::class, 'login'])
        ->middleware('throttle:login');
    Route::post('/forgot-password', [StudentAuthController::class, 'forgotPassword'])
        ->middleware('throttle:login');
    Route::post('/reset-password', [StudentAuthController::class, 'resetPassword'])
        ->middleware('throttle:login');
    Route::post('/logout', [StudentAuthController::class, 'logout'])->middleware('auth:student');
    Route::get('/check', [StudentAuthController::class, 'check'])->middleware('throttle:60,1');

    // Authenticated student routes
    Route::middleware('auth:student')->group(function () {
        Route::get('/api/requests', [StudentRequestController::class, 'myRequests']);
        Route::get('/api/requests/{tracking_number}', [StudentRequestController::class, 'myRequestDetail']);
        Route::post('/api/requests/{tracking_number}/upload-proof', [StudentRequestController::class, 'uploadPaymentProof']);

        // Student notifications
        Route::get('/api/notifications', [StudentNotificationController::class, 'index']);
        Route::get('/api/notifications/all', [StudentNotificationController::class, 'getAll']);
        Route::patch('/notifications/{id}/read', [StudentNotificationController::class, 'markAsRead'])->whereNumber('id');
        Route::patch('/notifications/read-all', [StudentNotificationController::class, 'markAllAsRead']);

        // Student profile — /api/ prefix avoids SPA refresh conflict
        Route::get('/api/profile', [StudentProfileController::class, 'show']);
        Route::patch('/profile', [StudentProfileController::class, 'update'])
            ->middleware('throttle:20,1');
        Route::patch('/profile/password', [StudentProfileController::class, 'updatePassword'])
            ->middleware('throttle:20,1');
    });
});

// Refresh CSRF token without reloading the page (SPA calls this periodically)
Route::get('/csrf-token', function () {
    return response()->json(['token' => csrf_token()]);
});

// SPA catch-all for student routes
Route::get('/student/{any?}', function () { return view('welcome'); })->where('any', '.*');

// Ultimate fallback — all unmatched routes serve the SPA
Route::fallback(function () {
    return view('welcome');
});
