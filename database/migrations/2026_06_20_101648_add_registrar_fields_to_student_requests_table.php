<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable()->after('contact_number');
            $table->string('gender')->nullable()->after('date_of_birth');
            $table->string('emergency_contact_person')->nullable()->after('gender');
            $table->text('complete_address')->nullable()->after('emergency_contact_person');
        });
    }

    public function down(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->dropColumn(['date_of_birth', 'gender', 'emergency_contact_person', 'complete_address']);
        });
    }
};
