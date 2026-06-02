<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'code', 'name', 'description', 'price', 'is_per_semester', 'processing_days', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_per_semester' => 'boolean',
            'is_active' => 'boolean',
            'price' => 'decimal:2',
        ];
    }

    public function studentRequests()
    {
        return $this->hasMany(StudentRequest::class);
    }
}
