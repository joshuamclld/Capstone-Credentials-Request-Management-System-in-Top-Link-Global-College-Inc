<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentRequest extends Model
{
    protected $fillable = [
        'tracking_number', 'student_id', 'student_number', 'full_name', 'contact_number',
        'email', 'course', 'document_ids', 'semesters', 'pages',
        'payment_method', 'payment_status', 'purpose', 'total_fee',
        'status', 'remarks', 'verified_by', 'verified_by_user_id', 'verified_at',
        'paymongo_checkout_id', 'year_level', 'section',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    protected function casts(): array
    {
        return [
            'document_ids' => 'array',
            'semesters' => 'array',
            'total_fee' => 'decimal:2',
            'verified_at' => 'datetime',
        ];
    }
}
