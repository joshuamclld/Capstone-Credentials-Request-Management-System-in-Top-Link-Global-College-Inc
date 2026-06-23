<?php

namespace App\Http\Controllers\Traits;

use Illuminate\Database\Eloquent\Model;

trait NotifiableControllerTrait
{
    private function getUserId(): ?int
    {
        return auth('student')->id() ?? auth()->id();
    }

    protected function _getNotifications(Model $model, string $userKey, int $limit = 10): array
    {
        return [
            $model->where($userKey, $this->getUserId())
                ->latest()
                ->take($limit)
                ->get(),
            $model->where($userKey, $this->getUserId())
                ->where('is_read', false)
                ->count(),
        ];
    }

    protected function _markAsRead(Model $model, string $userKey, int $id): bool
    {
        return $model->where($userKey, $this->getUserId())
            ->where('id', $id)
            ->firstOrFail()
            ->update(['is_read' => true]);
    }

    protected function _markAllAsRead(Model $model, string $userKey): int
    {
        return $model->where($userKey, $this->getUserId())
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }

    protected function _getAllNotifications(Model $model, string $userKey, int $perPage = 20): array
    {
        $perPage = min((int) request('per_page', $perPage), 100);

        $notifications = $model->where($userKey, $this->getUserId())
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
