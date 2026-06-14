<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->string('payment_method', 20)->nullable()->after('pages');
            $table->string('payment_status', 30)->default('unpaid')->after('payment_method');
            $table->string('verified_by')->nullable()->after('payment_status');
            $table->timestamp('verified_at')->nullable()->after('verified_by');
        });
    }

    public function down(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'payment_status', 'verified_by', 'verified_at']);
        });
    }
};
