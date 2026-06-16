<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->dropColumn(['paymongo_checkout_id', 'requested_document']);
        });
    }

    public function down(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->string('paymongo_checkout_id')->nullable()->after('payment_status');
            $table->string('requested_document')->nullable()->after('payment_status');
        });
    }
};
