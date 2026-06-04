<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->foreignId('verified_by_user_id')->nullable()->after('verified_by')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->dropForeign(['verified_by_user_id']);
            $table->dropColumn('verified_by_user_id');
        });
    }
};
