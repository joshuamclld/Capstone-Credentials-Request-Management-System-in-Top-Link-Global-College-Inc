<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/api/health', function () {
    return response()->json([
        'status' => 'Online',
        'service' => config('app.name', 'CRMS'),
    ]);
});
