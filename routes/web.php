<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\Admin\RegistrarRequestController;
use App\Http\Controllers\Admin\CashierPaymentController;
use App\Http\Controllers\Admin\SystemAdminController;
use App\Http\Controllers\StudentRequestController;
use App\Http\Controllers\DocumentController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/admin-login', function () {
    if (Auth::check()) {
        $role = Auth::user()->role;
        if ($role === 'admin') return redirect('/admin-dashboard');
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

    Route::get('/check-auth', [AdminAuthController::class, 'checkAuth']);

    Route::get('/requests-data', [RegistrarRequestController::class, 'getRequestsData'])
        ->middleware('admin');

    Route::get('/requests/{id}', [RegistrarRequestController::class, 'show'])
        ->middleware('auth')
        ->whereNumber('id');

    Route::patch('/requests/{id}', [RegistrarRequestController::class, 'update'])
        ->middleware('admin')
        ->whereNumber('id');

    // Cashier / Payment Routes
    Route::get('/payments-data', [CashierPaymentController::class, 'getPaymentsData'])
        ->middleware('cashier');

    Route::patch('/payments/{id}/verify', [CashierPaymentController::class, 'verify'])
        ->middleware('cashier')
        ->whereNumber('id');

    // System Administrator Routes
    Route::middleware('system_admin')->group(function () {
        Route::get('/system-dashboard-data', [SystemAdminController::class, 'dashboard']);

        // User management
        Route::get('/system/users', [SystemAdminController::class, 'getUsers']);
        Route::get('/system/users/{id}', [SystemAdminController::class, 'showUser'])->whereNumber('id');
        Route::post('/system/users', [SystemAdminController::class, 'storeUser']);
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

        // Audit logs
        Route::get('/system/audit-logs', [SystemAdminController::class, 'getAuditLogs']);

        // System settings
        Route::get('/system/settings', [SystemAdminController::class, 'getSettings']);
        Route::post('/system/settings', [SystemAdminController::class, 'updateSettings']);
    });
});

// Student Request Submission & Tracking
Route::post('/requests', [StudentRequestController::class, 'store'])
    ->middleware('throttle:10,1');
Route::get('/requests/{tracking_number}', [StudentRequestController::class, 'show']);
Route::patch('/requests/{tracking_number}/cancel', [StudentRequestController::class, 'cancel']);
Route::get('/documents', [DocumentController::class, 'index']);


Route::fallback(function () {
    return view('welcome');
});


