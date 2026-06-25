<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (request()->isSecure()) {
            URL::forceScheme('https');
        }

        RateLimiter::for('login', function (Request $request) {
            $key = ($request->session()->getId() ?: $request->ip()) . '|' . $request->path();
            return Limit::perMinute(5)->by($key);
        });
    }
}
