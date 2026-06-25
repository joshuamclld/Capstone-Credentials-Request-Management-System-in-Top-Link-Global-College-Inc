<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Student extends Authenticatable
{
    use HasFactory, Notifiable;

    // Fields that can be mass-assigned when creating or updating a student
    protected $fillable = [
        'student_number',
        'first_name',
        'last_name',
        'email',
        'date_of_birth',
        'gender',
        'emergency_contact_person',
        'emergency_contact_number',
        'complete_address',
        'password',
        'is_active',
        'email_verified_at',
    ];

    // Hide sensitive fields like password and remember_token from JSON/array output
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Cast password as hashed, booleans/dates to native PHP types for consistency
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'date_of_birth' => 'date:Y-m-d',
        ];
    }

    // A student can submit many credential requests
    public function requests(): HasMany
    {
        return $this->hasMany(StudentRequest::class);
    }
}
