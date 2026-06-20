<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentNotification extends Model
{
    protected $fillable = [
        'student_id',
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

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
