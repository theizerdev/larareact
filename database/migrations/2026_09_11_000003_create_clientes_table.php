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
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            
            // Datos personales
            $table->string('nombres');
            $table->string('apellidos');
            $table->string('tipo_documento', 10)->default('V'); // V, E, J, DNI, etc.
            $table->string('numero_documento', 30);
            $table->string('email')->nullable();
            $table->string('telefono_principal', 25); // Teléfono con WhatsApp para cobranza
            $table->string('telefono_secundario', 25)->nullable();

            // Ubicación / Domicilio
            $table->text('direccion')->nullable();
            $table->string('ciudad')->nullable();
            $table->decimal('latitud', 10, 8)->nullable();
            $table->decimal('longitud', 11, 8)->nullable();

            // Información laboral y crediticia
            $table->string('empresa_trabajo')->nullable();
            $table->string('cargo_trabajo')->nullable();
            $table->decimal('ingreso_mensual', 12, 2)->nullable();
            $table->enum('dia_pago', ['semanal', 'quincenal', 'mensual'])->nullable();
            $table->json('referencias_personales')->nullable();

            // Documentación KYC
            $table->string('foto_documento')->nullable();
            $table->string('foto_selfie_kyc')->nullable();

            // Perfil de riesgo
            $table->decimal('limite_credito', 12, 2)->default(500.00);
            $table->enum('estado_crediticio', [
                'activo',
                'en_evaluacion',
                'moroso',
                'bloqueado'
            ])->default('activo');

            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->unique(['empresa_id', 'numero_documento']);
            $table->index(['empresa_id', 'estado_crediticio']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};

