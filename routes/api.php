<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'Online',
        'service' => config('app.name', 'CRMS'),
    ]);
});
