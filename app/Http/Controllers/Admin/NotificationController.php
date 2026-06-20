<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\NotifiableControllerTrait;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    use NotifiableControllerTrait;

    public function index(): JsonResponse
    {
        [$notifications, $unreadCount] = $this->getNotifications(new Notification, 'user_id');

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(int $id): JsonResponse
    {
        $this->markAsRead(new Notification, 'user_id', $id);
        return response()->json(['success' => true, 'message' => 'Notification marked as read.']);
    }

    public function markAllAsRead(): JsonResponse
    {
        $this->markAllAsRead(new Notification, 'user_id');
        return response()->json(['success' => true, 'message' => 'All notifications marked as read.']);
    }

    public function getAll(): JsonResponse
    {
        $data = $this->getAllNotifications(new Notification, 'user_id');

        return response()->json([
            'success' => true,
            'notifications' => $data['items'],
            'pagination' => $data['pagination'],
        ]);
    }
}
