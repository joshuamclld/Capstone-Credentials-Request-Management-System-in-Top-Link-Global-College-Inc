<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\StudentNotification;
use Illuminate\Http\JsonResponse;

class StudentNotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $student = auth('student')->user();

        $notifications = StudentNotification::where('student_id', $student->id)
            ->latest()
            ->take(10)
            ->get();

        $unreadCount = StudentNotification::where('student_id', $student->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(int $id): JsonResponse
    {
        $notification = StudentNotification::where('student_id', auth('student')->id())
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['is_read' => true]);

        return response()->json(['success' => true, 'message' => 'Notification marked as read.']);
    }

    public function markAllAsRead(): JsonResponse
    {
        StudentNotification::where('student_id', auth('student')->id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['success' => true, 'message' => 'All notifications marked as read.']);
    }

    public function getAll(): JsonResponse
    {
        $perPage = min((int) request('per_page', 20), 100);

        $notifications = StudentNotification::where('student_id', auth('student')->id())
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'notifications' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }
}
