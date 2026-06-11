<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class StudentProfileController extends Controller
{
    public function show(): JsonResponse
    {
        $student = auth('student')->user();

        if (!$student) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'student' => $student->only([
                'id', 'student_number', 'first_name', 'last_name',
                'email', 'contact_number', 'address', 'course',
                'year_level', 'section',
            ]),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $student = auth('student')->user();

        if (!$student) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:students,email,' . $student->id,
            'contact_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        $student->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'student' => $student->fresh()->only([
                'id', 'student_number', 'first_name', 'last_name',
                'email', 'contact_number', 'address', 'course',
                'year_level', 'section',
            ]),
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $student = auth('student')->user();

        if (!$student) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $student->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $student->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }
}
