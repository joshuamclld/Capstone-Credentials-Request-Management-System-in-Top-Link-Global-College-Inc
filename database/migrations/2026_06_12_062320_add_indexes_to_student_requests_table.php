<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->index('student_id');
            $table->index('payment_status');
            $table->index('created_at');
            $table->index('email');
            $table->index('paymongo_checkout_id');
        });
    }

    public function down(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->dropIndex(['student_id']);
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['email']);
            $table->dropIndex(['paymongo_checkout_id']);
        });
    }
};
