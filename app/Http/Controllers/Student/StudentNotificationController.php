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
        [$notifications, $unreadCount] = $this->_getNotifications(new StudentNotification, 'student_id');

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(int $id): JsonResponse
    {
        $this->_markAsRead(new StudentNotification, 'student_id', $id);
        return response()->json(['success' => true, 'message' => 'Notification marked as read.']);
    }

    public function markAllAsRead(): JsonResponse
    {
        $this->_markAllAsRead(new StudentNotification, 'student_id');
        return response()->json(['success' => true, 'message' => 'All notifications marked as read.']);
    }

    public function getAll(): JsonResponse
    {
        $data = $this->_getAllNotifications(new StudentNotification, 'student_id');

        return response()->json([
            'success' => true,
            'notifications' => $data['items'],
            'pagination' => $data['pagination'],
        ]);
    }
}
