<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_request', function (Blueprint $table) {
            $table->foreignId('student_request_id')->constrained('student_requests')->cascadeOnDelete();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['student_request_id', 'document_id']);
        });

        $requests = DB::table('student_requests')->whereNotNull('document_ids')->get(['id', 'document_ids']);
        $documents = DB::table('documents')->pluck('id', 'code');

        $pivot = [];
        foreach ($requests as $req) {
            $codes = json_decode($req->document_ids, true);
            if (!is_array($codes)) continue;
            foreach ($codes as $code) {
                $docId = $documents->get($code);
                if (!$docId) continue;
                $pivot[] = [
                    'student_request_id' => $req->id,
                    'document_id' => $docId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        if (!empty($pivot)) {
            DB::table('document_request')->insert($pivot);
        }

        Schema::table('student_requests', function (Blueprint $table) {
            $table->dropColumn('document_ids');
        });
    }

    public function down(): void
    {
        Schema::table('student_requests', function (Blueprint $table) {
            $table->json('document_ids')->nullable()->after('course');
        });

        $pivotRows = DB::table('document_request')->get();
        $documents = DB::table('documents')->pluck('code', 'id');

        $grouped = $pivotRows->groupBy('student_request_id');
        foreach ($grouped as $requestId => $rows) {
            $codes = $rows->map(fn($r) => $documents->get($r->document_id))->filter()->values()->toArray();
            DB::table('student_requests')->where('id', $requestId)->update(['document_ids' => json_encode($codes)]);
        }

        Schema::dropIfExists('document_request');
    }
};
