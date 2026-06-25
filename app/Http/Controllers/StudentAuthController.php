<?php

namespace App\Http\Controllers;

use App\Http\Resources\StudentResource;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StudentAuthController extends Controller
{
    // ─── Session Check ───────────────────────────────────────────────────────

    // Return the authenticated student or false if not logged in
    public function check(): JsonResponse
    {
        $student = auth('student')->user();

        if (!$student) {
            return response()->json(['authenticated' => false]);
        }

        return response()->json([
            'authenticated' => true,
            'student' => new StudentResource($student),
        ]);
    }

    // ─── Login ───────────────────────────────────────────────────────────────

    // Authenticate a student by email or student number, with active-account guard
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $fieldType = filter_var($credentials['login'], FILTER_VALIDATE_EMAIL) ? 'email' : 'student_number';

        $student = Student::where($fieldType, $credentials['login'])->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Account not found. Please visit the registrar office to have your account created.',
            ], 404);
        }

        if (!Hash::check($credentials['password'], $student->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if (!$student->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Account is deactivated.',
            ], 403);
        }

        auth('student')->login($student, $request->boolean('remember'));

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'student' => new StudentResource($student),
        ]);
    }

    // ─── Forgot Password ─────────────────────────────────────────────────────

    // Look up a student by email or student number to confirm they exist before reset
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => 'required|string',
        ]);

        $fieldType = filter_var($validated['login'], FILTER_VALIDATE_EMAIL) ? 'email' : 'student_number';

        $student = Student::where($fieldType, $validated['login'])->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Account not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Account found.',
            'student_id' => $student->id,
            'student_name' => $student->first_name,
        ]);
    }

    // Update the student's password and log them in automatically
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $student = Student::findOrFail($validated['student_id']);

        $student->password = Hash::make($validated['password']);
        $student->save();

        auth('student')->login($student);

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully.',
            'student' => new StudentResource($student),
        ]);
    }

    // ─── Logout ─────────────────────────────────────────────────────────────

    // Log out the student and clear their session data
    public function logout(): JsonResponse
    {
        auth('student')->logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }
}
