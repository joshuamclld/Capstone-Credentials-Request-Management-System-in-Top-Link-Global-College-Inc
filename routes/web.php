<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\Admin\RegistrarRequestController;
use App\Http\Controllers\Admin\CashierPaymentController;
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
    }
    return view('welcome');
});

Route::get('/admin-dashboard', function () {
    return view('welcome');
})->middleware('admin');

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
});

// Student Request Submission & Tracking
Route::post('/requests', [StudentRequestController::class, 'store']);
Route::get('/requests/{tracking_number}', [StudentRequestController::class, 'show']);
Route::get('/documents', [DocumentController::class, 'index']);


Route::fallback(function () {
    return view('welcome');
});


