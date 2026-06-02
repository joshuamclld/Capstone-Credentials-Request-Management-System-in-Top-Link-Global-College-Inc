<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            if (DB::getDriverName() === 'sqlite') {
                $table->dropConstrainedForeignId('document_id');
            } else {
                $table->dropForeign(['document_id']);
                $table->dropColumn('document_id');
            }
            $table->json('document_ids')->nullable()->after('course');
        });
    }

    public function down(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->dropColumn('document_ids');
            $table->foreignId('document_id')->constrained('documents')->after('course');
        });
    }
};
