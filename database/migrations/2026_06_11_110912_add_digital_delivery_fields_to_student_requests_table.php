<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->string('digital_document_path')->nullable()->after('remarks');
            $table->boolean('is_digitally_sent')->default(false)->after('digital_document_path');
            $table->timestamp('digitally_sent_at')->nullable()->after('is_digitally_sent');
            $table->foreignId('digitally_sent_by')->nullable()->constrained('users')->nullOnDelete()->after('digitally_sent_at');
            $table->string('delivery_type')->nullable()->after('digitally_sent_by');
        });
    }

    public function down(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->dropForeign(['digitally_sent_by']);
            $table->dropColumn([
                'digital_document_path',
                'is_digitally_sent',
                'digitally_sent_at',
                'digitally_sent_by',
                'delivery_type',
            ]);
        });
    }
};
