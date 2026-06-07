<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CashierMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated.',
                ], 401);
            }
            return redirect('/admin-login');
        }

        $user = Auth::user();

        // Admin (registrar) has intentional oversight access to cashier routes.
        // Cashier requires both the role column and matching Spatie role.
        $hasOversightAccess = $user->role === 'admin';
        $hasCashierAccess = $user->role === 'cashier' && $user->hasRole('cashier');

        if (!$hasOversightAccess && !$hasCashierAccess) {
            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Forbidden.',
                ], 403);
            }
            abort(403);
        }

        return $next($request);
    }
}
