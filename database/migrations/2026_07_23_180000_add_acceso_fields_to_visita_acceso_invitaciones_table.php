<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visita_acceso_invitaciones', function (Blueprint $table) {
            // Fotos del documento de identidad del visitante
            $table->text('doc_foto_frontal')->nullable()->after('visitante_documento');
            $table->text('doc_foto_trasera')->nullable()->after('doc_foto_frontal');

            // Datos adicionales del vehículo
            $table->string('vehiculo_anio', 10)->nullable()->after('vehiculo_modelo');
            $table->text('vehiculo_foto_frontal')->nullable()->after('vehiculo_anio');
            $table->text('vehiculo_foto_trasera')->nullable()->after('vehiculo_foto_frontal');

            // Acompañantes en formato JSON (nombre, documento)
            $table->json('acompanantes')->nullable()->after('vehiculo_foto_trasera');

            // Indicador de si el visitante ya completó sus datos de acceso
            $table->boolean('datos_acceso_completados')->default(false)->after('acompanantes');
        });
    }

    public function down(): void
    {
        Schema::table('visita_acceso_invitaciones', function (Blueprint $table) {
            $table->dropColumn([
                'doc_foto_frontal',
                'doc_foto_trasera',
                'vehiculo_anio',
                'vehiculo_foto_frontal',
                'vehiculo_foto_trasera',
                'acompanantes',
                'datos_acceso_completados',
            ]);
        });
    }
};
