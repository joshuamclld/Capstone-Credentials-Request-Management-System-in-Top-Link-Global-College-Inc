<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('student_otps');
    }

    public function down(): void
    {
        Schema::create('student_otps', function ($table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->string('otp', 6);
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }
};
