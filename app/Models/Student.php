<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Student extends Authenticatable
{
    use HasFactory, Notifiable;

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

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'date_of_birth' => 'date:Y-m-d',
        ];
    }

    public function requests(): HasMany
    {
        return $this->hasMany(StudentRequest::class);
    }
}
