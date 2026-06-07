<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'reference_id',
        'action_url',
        'is_read',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function notifyRole(string $role, string $type, string $title, string $message, ?string $referenceId = null, ?string $actionUrl = null, ?int $excludeUserId = null): void
    {
        $query = User::where('role', $role);
        if ($excludeUserId !== null) {
            $query->where('id', '!=', $excludeUserId);
        }
        $users = $query->get();
        foreach ($users as $user) {
            self::create([
                'user_id' => $user->id,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'reference_id' => $referenceId,
                'action_url' => $actionUrl,
            ]);
        }
    }
}
