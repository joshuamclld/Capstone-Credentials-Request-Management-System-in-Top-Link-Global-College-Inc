<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\StudentRequestController;
use App\Http\Controllers\DocumentController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/admin-login', function () {
    if (Auth::check() && Auth::user()->role === 'admin') {
        return redirect('/admin-dashboard');
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
        ->middleware('admin');

    Route::get('/check-auth', [AdminAuthController::class, 'checkAuth']);
});

// Student Request Submission & Tracking
Route::post('/requests', [StudentRequestController::class, 'store']);
Route::get('/requests/{tracking_number}', [StudentRequestController::class, 'show']);
Route::get('/documents', [DocumentController::class, 'index']);


Route::fallback(function () {
    return view('welcome');
});


