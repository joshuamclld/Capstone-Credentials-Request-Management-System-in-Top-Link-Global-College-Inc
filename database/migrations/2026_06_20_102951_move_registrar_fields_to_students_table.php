<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('students', 'date_of_birth')) {
            Schema::table('students', function (Blueprint $table) {
                $table->date('date_of_birth')->nullable()->after('section');
                $table->string('gender')->nullable()->after('date_of_birth');
                $table->string('emergency_contact_person')->nullable()->after('gender');
                $table->string('emergency_contact_number')->nullable()->after('emergency_contact_person');
                $table->text('complete_address')->nullable()->after('emergency_contact_number');
            });
        }

        $studentIds = DB::table('student_requests')
            ->select('student_id')
            ->whereNotNull('student_id')
            ->distinct()
            ->pluck('student_id');

        foreach ($studentIds as $studentId) {
            $data = DB::table('student_requests')
                ->where('student_id', $studentId)
                ->selectRaw('MAX(date_of_birth) as date_of_birth')
                ->selectRaw('MAX(gender) as gender')
                ->selectRaw('MAX(emergency_contact_person) as emergency_contact_person')
                ->selectRaw('MAX(emergency_contact_number) as emergency_contact_number')
                ->selectRaw('MAX(complete_address) as complete_address')
                ->first();

            if ($data && ($data->date_of_birth || $data->gender || $data->emergency_contact_person || $data->emergency_contact_number || $data->complete_address)) {
                DB::table('students')->where('id', $studentId)->update([
                    'date_of_birth' => $data->date_of_birth,
                    'gender' => $data->gender,
                    'emergency_contact_person' => $data->emergency_contact_person,
                    'emergency_contact_number' => $data->emergency_contact_number,
                    'complete_address' => $data->complete_address,
                ]);
            }
        }

        if (Schema::hasColumn('student_requests', 'date_of_birth')) {
            Schema::table('student_requests', function (Blueprint $table) {
                $table->dropColumn([
                    'date_of_birth',
                    'gender',
                    'emergency_contact_person',
                    'emergency_contact_number',
                    'complete_address',
                ]);
            });
        }
    }

    public function down(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable()->after('contact_number');
            $table->string('gender')->nullable()->after('date_of_birth');
            $table->string('emergency_contact_person')->nullable()->after('gender');
            $table->string('emergency_contact_number')->nullable()->after('emergency_contact_person');
            $table->text('complete_address')->nullable()->after('emergency_contact_number');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'date_of_birth',
                'gender',
                'emergency_contact_person',
                'emergency_contact_number',
                'complete_address',
            ]);
        });
    }
};
