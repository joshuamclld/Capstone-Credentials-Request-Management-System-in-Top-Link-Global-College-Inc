<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class StudentRequest extends Model
{
    protected $fillable = [
        'tracking_number', 'student_id', 'student_number', 'full_name', 'contact_number',
        'email', 'course', 'semesters', 'pages',
        'payment_method', 'payment_status', 'purpose', 'total_fee',
        'status', 'remarks', 'verified_by', 'verified_by_user_id', 'verified_at',
        'payment_proof', 'year_level', 'section',
        'digital_document_path', 'is_digitally_sent', 'digitally_sent_at', 'digitally_sent_by', 'delivery_type',
    ];

    // Each request belongs to a single student record
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    // A request can include many document types through the document_request pivot table
    public function documents(): BelongsToMany
    {
        return $this->belongsToMany(Document::class, 'document_request')
            ->withTimestamps();
    }

    // Cast JSON semesters, decimal total_fee, booleans, and timestamps to native PHP types
    protected function casts(): array
    {
        return [
            'semesters' => 'array',
            'total_fee' => 'decimal:2',
            'verified_at' => 'datetime',
            'is_digitally_sent' => 'boolean',
            'digitally_sent_at' => 'datetime',
            'pages' => 'integer',
        ];
    }
}
