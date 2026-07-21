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
        Schema::create('pais', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('codigo_iso2', 2)->unique(); // Ej: US, VE, CO, AR
            $table->string('codigo_iso3', 3)->unique(); // Ej: USA, VEN, COL, ARG
            $table->string('codigo_telefonico', 10)->nullable(); // Ej: +1, +58, +57, +54
            $table->string('moneda_principal', 10)->nullable(); // USD, VES, COP, ARS
            $table->string('idioma_principal', 10)->nullable(); // es, en, pt
            $table->string('continente', 50)->nullable(); // América del Norte, América del Sur, etc.
            $table->string('zona_horaria', 50)->nullable(); // America/Caracas, America/Bogota
            $table->string('formato_fecha', 20)->default('dd/mm/yyyy'); // dd/mm/yyyy, mm/dd/yyyy
            $table->string('formato_moneda', 20)->default('1.234,56'); // 1.234,56 vs 1,234.56
            $table->decimal('impuesto_predeterminado', 5, 2)->default(0.00); // IVA, IGTF, etc.
            $table->string('separador_miles', 1)->default('.'); // . o ,
            $table->string('separador_decimales', 1)->default(','); // , o .
            $table->integer('decimales_moneda')->default(2); // 0, 2, 3
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pais');
    }
};
