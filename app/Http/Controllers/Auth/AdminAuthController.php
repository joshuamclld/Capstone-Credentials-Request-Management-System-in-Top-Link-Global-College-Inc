<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminAuthController extends Controller
{
    // Authenticate admin users and guard against deactivated or non-admin accounts
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember_me');

        $user = User::where('email', $credentials['email'])->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Account not registered.',
            ], 404);
        }

        if (Auth::attempt($credentials, $remember)) {
            $user = Auth::user();

            // Block login if the account has been deactivated
            if (isset($user->is_active) && !$user->is_active) {
                Auth::logout();
                $request->session()->invalidate();
                return response()->json([
                    'success' => false,
                    'message' => 'Your account has been deactivated.',
                ], 403);
            }

            // Restrict login to registrar, cashier, or system_admin roles
            if (!in_array($user->role, ['registrar', 'cashier', 'system_admin'])) {
                Auth::logout();
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials or insufficient permissions.',
                ], 401);
            }

            $request->session()->regenerate();

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'user' => $user->only(['id', 'name', 'email', 'role', 'contact_number', 'is_active', 'is_super_admin']),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid credentials.',
        ], 401);
    }

    // Log out the admin, invalidate the session, and regenerate CSRF token
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    // Verify whether the current session belongs to an active admin user
    public function checkAuth(Request $request): JsonResponse
    {
        if (Auth::check() && (Auth::user()->is_active ?? true) && in_array(Auth::user()->role, ['registrar', 'cashier', 'system_admin'])) {
            return response()->json([
                'status' => 'authenticated',
                'user' => Auth::user()->only(['id', 'name', 'email', 'role', 'contact_number', 'is_active', 'is_super_admin']),
            ]);
        }

        return response()->json([
            'status' => 'unauthenticated'
        ]);
    }
}
