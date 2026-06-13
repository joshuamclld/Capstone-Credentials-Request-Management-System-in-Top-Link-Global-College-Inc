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

        if (!$user->is_active) {
            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Account is deactivated.',
                ], 403);
            }
            abort(403);
        }

        $hasOversightAccess = $user->role === 'registrar';
        $hasCashierAccess = $user->role === 'cashier';

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
