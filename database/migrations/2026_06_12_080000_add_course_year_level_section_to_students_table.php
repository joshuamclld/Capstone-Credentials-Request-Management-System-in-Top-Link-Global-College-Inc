<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('course', 255)->nullable()->after('email');
            $table->string('year_level', 255)->nullable()->after('course');
            $table->string('section', 255)->nullable()->after('year_level');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['course', 'year_level', 'section']);
        });
    }
};
