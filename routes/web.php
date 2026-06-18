<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\CashierPaymentController;
use App\Http\Controllers\Admin\RegistrarRequestController;
use App\Http\Controllers\Admin\SystemAdminController;
use App\Http\Controllers\StudentAuthController;
use App\Http\Controllers\StudentRequestController;
use App\Http\Controllers\StudentProfileController;
use App\Http\Controllers\DocumentController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/admin-login', function () {
    if (Auth::check()) {
        $role = Auth::user()->role;
        if ($role === 'registrar') return redirect('/admin-dashboard');
        if ($role === 'cashier') return redirect('/cashier-dashboard');
        if ($role === 'system_admin') return redirect('/system-admin-dashboard');
    }
    return view('welcome');
});

Route::get('/admin-dashboard', function () {
    return view('welcome');
})->middleware('admin');

Route::get('/system-admin-dashboard', function () {
    return view('welcome');
})->middleware('system_admin');

// Admin Authentication Routes
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login'])
        ->middleware('throttle:5,1');

    Route::post('/logout', [AdminAuthController::class, 'logout'])
        ->middleware('auth');

    Route::get('/check-auth', [AdminAuthController::class, 'checkAuth'])->middleware('throttle:60,1');

    // Notification routes
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->middleware('auth')->whereNumber('id');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->middleware('auth');

    Route::get('/requests-data', [RegistrarRequestController::class, 'getRequestsData'])
        ->middleware('admin');

    // Cashier / Payment Routes
    Route::get('/payments-data', [CashierPaymentController::class, 'getPaymentsData'])
        ->middleware('cashier');

    Route::patch('/payments/{id}/verify', [CashierPaymentController::class, 'verify'])
        ->middleware(['cashier', 'throttle:20,1'])
        ->whereNumber('id');

    Route::get('/cashier/online-payment-status', [CashierPaymentController::class, 'getOnlinePaymentStatus'])
        ->middleware('cashier');

    Route::post('/cashier/online-payment-status', [CashierPaymentController::class, 'toggleOnlinePayment'])
        ->middleware('cashier');

    Route::post('/payment-qr', [CashierPaymentController::class, 'uploadQr'])
        ->middleware('cashier');

    Route::get('/payment-qr', [CashierPaymentController::class, 'getQr']);

    // System Administrator Routes
    Route::middleware('system_admin')->group(function () {
        Route::get('/system-dashboard-data', [SystemAdminController::class, 'dashboard']);

        // User management
        Route::get('/system/users', [SystemAdminController::class, 'getUsers']);
        Route::get('/system/users/{id}', [SystemAdminController::class, 'showUser'])->whereNumber('id');
        Route::post('/system/users', [SystemAdminController::class, 'storeUser'])->middleware('throttle:10,10');
        Route::put('/system/users/{id}', [SystemAdminController::class, 'updateUser'])->whereNumber('id');
        Route::delete('/system/users/{id}', [SystemAdminController::class, 'deleteUser'])->whereNumber('id');

        // Document / Credential Type management
        Route::get('/system/documents', [SystemAdminController::class, 'getDocuments']);
        Route::get('/system/documents/{id}', [SystemAdminController::class, 'showDocument'])->whereNumber('id');
        Route::post('/system/documents', [SystemAdminController::class, 'storeDocument']);
        Route::put('/system/documents/{id}', [SystemAdminController::class, 'updateDocument'])->whereNumber('id');
        Route::delete('/system/documents/{id}', [SystemAdminController::class, 'deleteDocument'])->whereNumber('id');

        // Reports
        Route::get('/system/reports', [SystemAdminController::class, 'getReports']);
        Route::get('/system/reports/export/excel', [SystemAdminController::class, 'exportExcel']);
        Route::get('/system/reports/export/csv', [SystemAdminController::class, 'exportCsv']);
        Route::get('/system/reports/export/pdf', [SystemAdminController::class, 'exportPdf']);

        // Audit logs
        Route::get('/system/audit-logs', [SystemAdminController::class, 'getAuditLogs']);

        // Student management
        Route::get('/system/students', [SystemAdminController::class, 'getStudents']);
        Route::post('/system/students', [SystemAdminController::class, 'storeStudent'])->middleware('throttle:10,10');
        Route::post('/system/students/import', [SystemAdminController::class, 'importStudents'])->middleware('throttle:3,10');
        Route::patch('/system/students/{id}/toggle-status', [SystemAdminController::class, 'toggleStudentStatus']);
        Route::delete('/system/students/{id}', [SystemAdminController::class, 'deleteStudent']);
    });

    // API routes — moved out of SPA page path to avoid hard-refresh conflict
    Route::prefix('api')->group(function () {
        Route::get('/notifications', [NotificationController::class, 'index'])->middleware('auth');
        Route::get('/notifications/all', [NotificationController::class, 'getAll'])->middleware('auth');

        Route::get('/requests/{id}', [RegistrarRequestController::class, 'show'])
            ->middleware('auth')
            ->whereNumber('id');

        Route::patch('/requests/{id}', [RegistrarRequestController::class, 'update'])
            ->middleware('admin')
            ->whereNumber('id');

        Route::post('/requests/{id}/send-document', [RegistrarRequestController::class, 'sendDigitalDocument'])
            ->middleware(['admin', 'throttle:10,1'])
            ->whereNumber('id');
    });
});

// SPA catch-all — serve React app for all admin/cashier/system-admin sub-paths
Route::get('/login', function () { return view('welcome'); })->name('login');
Route::get('/admin/{any?}', function () { return view('welcome'); })->where('any', '.*');
Route::get('/cashier/{any?}', function () { return view('welcome'); })->where('any', '.*');
Route::get('/system-admin/{any?}', function () { return view('welcome'); })->where('any', '.*');

// Student Request Submission & Tracking
Route::post('/requests', [StudentRequestController::class, 'store'])
    ->middleware(['auth:student', 'throttle:10,1']);
Route::get('/requests/{tracking_number}', [StudentRequestController::class, 'show'])
    ->middleware('throttle:30,1');
Route::patch('/requests/{tracking_number}/cancel', [StudentRequestController::class, 'cancel'])
    ->middleware(['auth:student', 'throttle:5,1']);
Route::patch('/requests/{tracking_number}/claim', [StudentRequestController::class, 'claim'])
    ->middleware(['auth:student', 'throttle:5,1']);
Route::get('/documents', [DocumentController::class, 'index']);
Route::get('/online-payment-status', [CashierPaymentController::class, 'getOnlinePaymentStatus']);
Route::get('/payment-qr-image', [CashierPaymentController::class, 'getQrImage'])->middleware('throttle:60,1');
Route::get('/payment-proof/{tracking_number}', [StudentRequestController::class, 'getPaymentProof'])->middleware('throttle:60,1');

// Student Authentication Routes
Route::prefix('student')->group(function () {
    Route::post('/login', [StudentAuthController::class, 'login'])
        ->middleware('throttle:5,1');
    Route::post('/forgot-password', [StudentAuthController::class, 'forgotPassword'])
        ->middleware('throttle:3,1');
    Route::post('/verify-reset-otp', [StudentAuthController::class, 'verifyResetOtp'])
        ->middleware('throttle:5,1');
    Route::post('/reset-password', [StudentAuthController::class, 'resetPassword'])
        ->middleware('throttle:5,1');
    Route::post('/logout', [StudentAuthController::class, 'logout'])->middleware('auth:student');
    Route::get('/check', [StudentAuthController::class, 'check'])->middleware('throttle:60,1');

    // Student Request Management (authenticated)
    Route::middleware('auth:student')->group(function () {
        Route::get('/api/requests', [StudentRequestController::class, 'myRequests']);
        Route::get('/api/requests/{tracking_number}', [StudentRequestController::class, 'myRequestDetail']);
        Route::post('/api/requests/{tracking_number}/upload-proof', [StudentRequestController::class, 'uploadPaymentProof']);

        // Student Profile (GET moved to /api/ to avoid SPA refresh conflict)
        Route::get('/api/profile', [StudentProfileController::class, 'show']);
        Route::patch('/profile', [StudentProfileController::class, 'update'])
            ->middleware('throttle:20,1');
        Route::patch('/profile/password', [StudentProfileController::class, 'updatePassword'])
            ->middleware('throttle:20,1');
    });
});

Route::get('/student/{any?}', function () { return view('welcome'); })->where('any', '.*');

Route::fallback(function () {
    return view('welcome');
});


