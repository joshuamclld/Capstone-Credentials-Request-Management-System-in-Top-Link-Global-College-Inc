<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'code', 'name', 'description', 'price', 'is_per_semester', 'is_per_page', 'processing_days', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_per_semester' => 'boolean',
            'is_per_page' => 'boolean',
            'is_active' => 'boolean',
            'price' => 'decimal:2',
        ];
    }

}
