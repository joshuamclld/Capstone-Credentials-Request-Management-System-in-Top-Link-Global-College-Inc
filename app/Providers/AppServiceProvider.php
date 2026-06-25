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
        // Force HTTPS URLs when the request is secure (important for production behind load balancers)
        if (request()->isSecure()) {
            URL::forceScheme('https');
        }

        // Named rate limiter used by admin and student login routes.
        // Key combines session_id + path so each browser session gets its own 5-attempt counter,
        // preventing users behind the same IP (e.g. NAT, localhost dev) from blocking each other.
        RateLimiter::for('login', function (Request $request) {
            $key = ($request->session()->getId() ?: $request->ip()) . '|' . $request->path();
            return Limit::perMinute(5)->by($key);
        });
    }
}
