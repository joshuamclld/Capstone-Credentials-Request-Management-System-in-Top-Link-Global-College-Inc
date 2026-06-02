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
        'document_id',
        'semesters',
        'purpose',
        'total_fee',
        'status',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'semesters' => 'array',
            'total_fee' => 'decimal:2',
        ];
    }

    public function document()
    {
        return $this->belongsTo(Document::class);
    }
}
