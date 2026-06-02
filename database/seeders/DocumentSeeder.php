<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Document;

class DocumentSeeder extends Seeder
{
    public function run(): void
    {
        Document::create([
            'code' => 'enrollment',
            'name' => 'Certificate of Enrollment',
            'description' => 'Official proof that the student is currently enrolled.',
            'price' => 50,
            'is_per_semester' => false,
            'processing_days' => 1,
        ]);

        Document::create([
            'code' => 'good-moral',
            'name' => 'Certificate of Good Moral',
            'description' => 'Official document certifying the student\'s good moral character.',
            'price' => 50,
            'is_per_semester' => false,
            'processing_days' => 1,
        ]);

        Document::create([
            'code' => 'registration',
            'name' => 'Certificate of Registration',
            'description' => 'Official copy of the student\'s registration information.',
            'price' => 50,
            'is_per_semester' => false,
            'processing_days' => 1,
        ]);

        Document::create([
            'code' => 'grades',
            'name' => 'Certificate of Grades',
            'description' => 'Official copy of grades for a selected semester.',
            'price' => 50,
            'is_per_semester' => true,
            'processing_days' => 5,
        ]);

        Document::create([
            'code' => 'tor',
            'name' => 'Transcript of Records',
            'description' => 'Official academic record of completed subjects and grades.',
            'price' => 150,
            'is_per_semester' => false,
            'processing_days' => 7,
        ]);
    }
}
