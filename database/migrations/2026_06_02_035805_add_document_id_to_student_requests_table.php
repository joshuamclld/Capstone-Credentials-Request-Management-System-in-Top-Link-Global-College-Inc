<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->dropColumn('requested_document');
            $table->foreignId('document_id')->constrained('documents')->after('course');
        });
    }

    public function down(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('document_id');
            $table->string('requested_document')->after('course');
        });
    }
};
