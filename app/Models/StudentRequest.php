<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentRequest extends Model
{
    protected $fillable = [
        'tracking_number', 'student_id', 'student_number', 'full_name', 'contact_number',
        'email', 'course', 'semesters', 'pages',
        'payment_method', 'payment_status', 'purpose', 'total_fee',
        'status', 'remarks', 'verified_by', 'verified_by_user_id', 'verified_at',
        'paymongo_checkout_id', 'year_level', 'section',
        'digital_document_path', 'is_digitally_sent', 'digitally_sent_at', 'digitally_sent_by', 'delivery_type',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function documents()
    {
        return $this->belongsToMany(Document::class, 'document_request')
            ->withTimestamps();
    }

    protected function casts(): array
    {
        return [
            'semesters' => 'array',
            'total_fee' => 'decimal:2',
            'verified_at' => 'datetime',
            'is_digitally_sent' => 'boolean',
            'digitally_sent_at' => 'datetime',
        ];
    }
}
