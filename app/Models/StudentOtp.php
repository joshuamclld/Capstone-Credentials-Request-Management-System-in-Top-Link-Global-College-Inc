<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentOtp extends Model
{
    protected $fillable = [
        'student_id',
        'otp',
        'expires_at',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
