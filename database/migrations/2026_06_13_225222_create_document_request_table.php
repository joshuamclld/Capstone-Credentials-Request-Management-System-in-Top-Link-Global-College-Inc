<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_request', function (Blueprint $table) {
            $table->foreignId('student_request_id')->constrained('student_requests')->cascadeOnDelete();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['student_request_id', 'document_id']);
        });

        // Data migration from document_ids JSON is no longer needed
        // as document_ids column was removed in a prior cleanup.
    }

    public function down(): void
    {
        Schema::dropIfExists('document_request');
    }
};
