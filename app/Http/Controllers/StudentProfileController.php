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
            'success' => true,
            'student' => collect($student->toArray())->only([
                'id', 'student_number', 'first_name', 'last_name',
                'email',
                'date_of_birth', 'gender',
                'emergency_contact_person', 'emergency_contact_number',
                'complete_address',
            ])->all(),
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
            'student_number' => 'required|string|max:50|unique:students,student_number,' . $student->id,
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|in:Male,Female',
            'emergency_contact_person' => 'nullable|string|max:255',
            'emergency_contact_number' => 'nullable|string|max:20',
            'complete_address' => 'nullable|string|max:1000',
        ]);

        $student->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'student' => collect($student->fresh()->toArray())->only([
                'id', 'student_number', 'first_name', 'last_name',
                'email',
                'date_of_birth', 'gender',
                'emergency_contact_person', 'emergency_contact_number',
                'complete_address',
            ])->all(),
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
            'success' => true,
            'message' => 'Password updated successfully.',
        ]);
    }
}
