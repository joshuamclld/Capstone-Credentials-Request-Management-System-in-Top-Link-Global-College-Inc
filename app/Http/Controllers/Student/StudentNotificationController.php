<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\NotifiableControllerTrait;
use App\Models\StudentNotification;
use Illuminate\Http\JsonResponse;

class StudentNotificationController extends Controller
{
    use NotifiableControllerTrait;

    public function index(): JsonResponse
    {
        [$notifications, $unreadCount] = $this->getNotifications(new StudentNotification, 'student_id');

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(int $id): JsonResponse
    {
        $this->markAsRead(new StudentNotification, 'student_id', $id);
        return response()->json(['success' => true, 'message' => 'Notification marked as read.']);
    }

    public function markAllAsRead(): JsonResponse
    {
        $this->markAllAsRead(new StudentNotification, 'student_id');
        return response()->json(['success' => true, 'message' => 'All notifications marked as read.']);
    }

    public function getAll(): JsonResponse
    {
        $data = $this->getAllNotifications(new StudentNotification, 'student_id');

        return response()->json([
            'success' => true,
            'notifications' => $data['items'],
            'pagination' => $data['pagination'],
        ]);
    }
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
