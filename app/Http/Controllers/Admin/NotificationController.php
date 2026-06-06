<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth()->user();

        $notifications = Notification::where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get();

        $unreadCount = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(int $id): JsonResponse
    {
        $notification = Notification::where('user_id', auth()->id())
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['is_read' => true]);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllAsRead(): JsonResponse
    {
        Notification::where('user_id', auth()->id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
