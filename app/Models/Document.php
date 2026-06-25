<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    // Fields that can be mass-assigned for a document definition
    protected $fillable = [
        'code', 'name', 'description', 'price', 'is_per_semester', 'is_per_page', 'processing_days', 'is_active',
    ];

    // Cast booleans (per-semester, per-page, active flags) and price decimal to native types
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
