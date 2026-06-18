<?php

namespace App\Http\Controllers;

use App\Mail\StudentResetOtpMail;
use App\Models\Student;
use App\Models\StudentOtp;
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

        $lastOtp = StudentOtp::where('student_id', $student->id)->latest()->first();
        if ($lastOtp && $lastOtp->created_at->diffInSeconds(now()) < 60) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait at least 60 seconds before requesting a new OTP.',
            ], 429);
        }

        StudentOtp::where('student_id', $student->id)->delete();

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        StudentOtp::create([
            'student_id' => $student->id,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($student->email)->queue(new StudentResetOtpMail($student, $otp));

        return response()->json([
            'success' => true,
            'message' => 'A verification code has been sent to your email.',
            'student_id' => $student->id,
        ]);
    }

    public function verifyResetOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'otp' => 'required|string|size:6',
        ]);

        $otpRecord = StudentOtp::where('student_id', $validated['student_id'])
            ->where('otp', $validated['otp'])
            ->where('expires_at', '>', now())
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (!$otpRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP.',
            ], 422);
        }

        StudentOtp::where('student_id', $validated['student_id'])
            ->whereNotNull('verified_at')
            ->delete();

        $otpRecord->verified_at = now();
        $otpRecord->save();

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $student = Student::findOrFail($validated['student_id']);

        $otpRecord = StudentOtp::where('student_id', $student->id)
            ->where('expires_at', '>', now())
            ->whereNotNull('verified_at')
            ->latest()
            ->first();

        if (!$otpRecord) {
            return response()->json([
                'success' => false,
                'message' => 'No valid verification found. Please restart the password reset process.',
            ], 422);
        }

        $student->password = Hash::make($validated['password']);
        $student->save();

        $otpRecord->delete();

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
