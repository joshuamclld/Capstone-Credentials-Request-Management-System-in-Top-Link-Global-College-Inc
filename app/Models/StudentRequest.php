<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentRequest extends Model
{
    protected $fillable = [
        'tracking_number',
        'student_number',
        'full_name',
        'contact_number',
        'email',
        'course',
        'document_ids',
        'semesters',
        'pages',
        'payment_method',
        'payment_status',
        'purpose',
        'total_fee',
        'status',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'document_ids' => 'array',
            'semesters' => 'array',
            'total_fee' => 'decimal:2',
        ];
    }
}
