<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\CashierMiddleware;
use App\Http\Middleware\SystemAdminMiddleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust all proxies by default (supports Docker/nginx/reverse-proxy setups)
        $middleware->trustProxies(at: env('TRUSTED_PROXIES', '*'));

        // Short aliases used in routes/web.php middleware() calls
        $middleware->alias([
            'admin' => AdminMiddleware::class,         // role=registrar + is_active
            'cashier' => CashierMiddleware::class,     // role=cashier or registrar + is_active
            'system_admin' => SystemAdminMiddleware::class, // role=system_admin + is_active
        ]);

        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // All API responses are JSON so the SPA can handle them consistently
        $exceptions->render(function (ModelNotFoundException $e) {
            return response()->json(['message' => 'Resource not found.'], 404);
        });

        $exceptions->render(function (AuthenticationException $e) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });

        $exceptions->render(function (AuthorizationException $e) {
            return response()->json(['message' => 'Forbidden.'], 403);
        });

        $exceptions->render(function (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        });

        $exceptions->render(function (NotFoundHttpException $e) {
            return response()->json(['message' => 'Route not found.'], 404);
        });

        $exceptions->render(function (ThrottleRequestsException $e) {
            return response()->json(['message' => 'Too many requests. Please slow down.'], 429);
        });
    })->create();
