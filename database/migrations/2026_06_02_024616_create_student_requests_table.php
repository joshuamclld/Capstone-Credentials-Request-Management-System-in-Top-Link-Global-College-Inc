<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_requests', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_number', 20)->unique();
            $table->string('student_number');
            $table->string('full_name');
            $table->string('contact_number');
            $table->string('email');
            $table->string('course');
            $table->string('requested_document')->nullable();
            $table->json('semesters')->nullable();
            $table->text('purpose');
            $table->decimal('total_fee', 10, 2);
            $table->string('status', 20)->default('Pending');
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('tracking_number');
            $table->index('student_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_requests');
    }
};
