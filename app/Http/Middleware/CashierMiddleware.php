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
        // Redirect unauthenticated users to the admin login page
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

        // Block access if the account has been deactivated
        if (!$user->is_active) {
            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Account is deactivated.',
                ], 403);
            }
            abort(403);
        }

        // Allow both cashier and registrar roles — registrar needs oversight access to payment records
        $hasOversightAccess = $user->role === 'registrar';
        $hasCashierAccess = $user->role === 'cashier';

        // Deny access if the user holds neither cashier nor registrar role
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
