<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminAuthController extends Controller
{
    /**
     * Handle admin login.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember_me');

        if (Auth::attempt($credentials, $remember)) {
            $user = Auth::user();

            if (!in_array($user->role, ['admin', 'cashier', 'system_admin'])) {
                Auth::logout();
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid credentials or insufficient permissions.',
                ], 401);
            }

            $request->session()->regenerate();

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'user' => $user,
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Invalid credentials or insufficient permissions.',
        ], 401);
    }

    /**
     * Handle admin logout.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Check authentication status.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function checkAuth(Request $request): JsonResponse
    {
        if (Auth::check() && in_array(Auth::user()->role, ['admin', 'cashier', 'system_admin'])) {
            return response()->json([
                'status' => 'authenticated',
                'user' => Auth::user()
            ]);
        }

        return response()->json([
            'status' => 'unauthenticated'
        ]);
    }
}
