<?php

namespace App\Http\Controllers;

use App\Mail\StudentWelcomeMail;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class StudentAuthController extends Controller
{
    public function check(): JsonResponse
    {
        $student = auth('student')->user();

        if (!$student) {
            return response()->json(['authenticated' => false]);
        }

        return response()->json([
            'authenticated' => true,
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'email' => $student->email,
                'date_of_birth' => $student->date_of_birth?->format('Y-m-d'),
                'gender' => $student->gender,
                'emergency_contact_person' => $student->emergency_contact_person,
                'emergency_contact_number' => $student->emergency_contact_number,
                'complete_address' => $student->complete_address,
            ],
        ]);
    }


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
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'email' => $student->email,
                'date_of_birth' => $student->date_of_birth?->format('Y-m-d'),
                'gender' => $student->gender,
                'emergency_contact_person' => $student->emergency_contact_person,
                'emergency_contact_number' => $student->emergency_contact_number,
                'complete_address' => $student->complete_address,
            ],
        ]);
    }

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

        if (!$student->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Account is deactivated.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Account found. Set your new password.',
            'student_id' => $student->id,
            'student_name' => "{$student->first_name} {$student->last_name}",
        ]);
    }

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
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'email' => $student->email,
                'date_of_birth' => $student->date_of_birth?->format('Y-m-d'),
                'gender' => $student->gender,
                'emergency_contact_person' => $student->emergency_contact_person,
                'emergency_contact_number' => $student->emergency_contact_number,
                'complete_address' => $student->complete_address,
            ],
        ]);
    }

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
