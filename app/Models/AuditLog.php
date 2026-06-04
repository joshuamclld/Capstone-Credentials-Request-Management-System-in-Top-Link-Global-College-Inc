<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'action', 'performed_by', 'performed_by_id', 'target_type', 'target_id', 'description',
    ];

    protected function casts(): array
    {
        return [
            'target_id' => 'integer',
        ];
    }
}
