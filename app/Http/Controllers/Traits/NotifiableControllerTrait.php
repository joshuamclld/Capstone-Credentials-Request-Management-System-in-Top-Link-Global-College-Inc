<?php

namespace App\Http\Controllers\Traits;

use Illuminate\Database\Eloquent\Model;

trait NotifiableControllerTrait
{
    protected function getNotifications(Model $model, string $userKey, int $limit = 10): array
    {
        return [
            $model->where($userKey, auth()->id())
                ->latest()
                ->take($limit)
                ->get(),
            $model->where($userKey, auth()->id())
                ->where('is_read', false)
                ->count(),
        ];
    }

    protected function markAsRead(Model $model, string $userKey, int $id): bool
    {
        return $model->where($userKey, auth()->id())
            ->where('id', $id)
            ->firstOrFail()
            ->update(['is_read' => true]);
    }

    protected function markAllAsRead(Model $model, string $userKey): int
    {
        return $model->where($userKey, auth()->id())
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }

    protected function getAllNotifications(Model $model, string $userKey, int $perPage = 20): array
    {
        $perPage = min((int) request('per_page', $perPage), 100);

        $notifications = $model->where($userKey, auth()->id())
            ->latest()
            ->paginate($perPage);

        return [
            'items' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ];
    }
}
