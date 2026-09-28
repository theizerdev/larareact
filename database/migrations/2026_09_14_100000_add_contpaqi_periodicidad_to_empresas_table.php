<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * La periodicidad de la nómina deja de ser un valor global de config y
     * pasa a ser de cada empresa.
     *
     * El sistema es multiempresa y CONTPAQi permite que cada razón social
     * pague con un calendario distinto: una semanal de lunes a domingo, otra
     * quincenal. Con un solo valor en .env la segunda no cabía.
     */
    public function up(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->enum('contpaqi_periodicidad', ['semanal', 'quincenal'])
                ->default('semanal')
                ->after('biotime_last_transaction_id');

            // ISO-8601: 1 = lunes ... 7 = domingo. Manda el corte de la
            // semana de nómina y, con ella, el tope de horas extra dobles.
            $table->unsignedTinyInteger('contpaqi_dia_inicio_semana')
                ->default(1)
                ->after('contpaqi_periodicidad');
        });
    }

    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn(['contpaqi_periodicidad', 'contpaqi_dia_inicio_semana']);
        });
    }
};
