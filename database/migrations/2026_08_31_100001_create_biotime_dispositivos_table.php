<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Espejo local de los relojes checadores registrados en BioTime
     * (GET /iclock/api/terminals/). Solo lectura: se refresca en cada sync.
     */
    public function up(): void
    {
        Schema::create('biotime_dispositivos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();

            $table->unsignedBigInteger('biotime_id'); // id del terminal en BioTime
            $table->string('sn')->nullable();
            $table->string('alias')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('area_name')->nullable();
            $table->integer('state')->nullable(); // 1 = en línea
            $table->dateTime('last_activity')->nullable();
            $table->string('fw_ver')->nullable();
            $table->unsignedInteger('user_count')->nullable();
            $table->unsignedInteger('fp_count')->nullable();
            $table->unsignedInteger('face_count')->nullable();
            $table->unsignedInteger('palm_count')->nullable();
            $table->unsignedInteger('transaction_count')->nullable();

            $table->json('raw')->nullable(); // payload completo tal cual lo devolvió BioTime
            $table->timestamps();

            $table->unique(['empresa_id', 'biotime_id']);
            $table->index('sn');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('biotime_dispositivos');
    }
};
