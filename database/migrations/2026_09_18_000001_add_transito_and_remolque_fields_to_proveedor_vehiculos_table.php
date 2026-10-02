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
        Schema::table('proveedor_vehiculos', function (Blueprint $table) {
            // Clasificación Reglamentaria Federal (Art. 24)
            $table->string('categoria_vehiculo')->nullable()->after('tipo_vehiculo'); // carga, personas, excepcional
            $table->string('subtipo_carroceria')->nullable()->after('categoria_vehiculo'); // caja_seca, refrigerador, plataforma, etc.
            $table->string('numero_serie_vin', 50)->nullable()->after('placa'); // VIN unidad tractora
            $table->unsignedTinyInteger('numero_ejes')->nullable()->after('numero_serie_vin'); // Número de ejes del tractor/camión
            $table->string('tarjeta_circulacion', 50)->nullable()->after('numero_ejes');
            $table->string('aseguradora')->nullable()->after('tarjeta_circulacion');
            $table->string('poliza_seguro', 100)->nullable()->after('aseguradora');
            $table->date('vigencia_seguro')->nullable()->after('poliza_seguro');

            // Información de la Caja / Semirremolque (NOM-035-SCT-2-2010)
            $table->boolean('tiene_remolque')->default(false)->after('foto_trasera');
            $table->string('remolque_fabricante')->nullable()->after('tiene_remolque'); // Marca/Razón social del fabricante
            $table->string('remolque_serie_fabricante', 100)->nullable()->after('remolque_fabricante');
            $table->string('remolque_vin', 50)->nullable()->after('remolque_serie_fabricante'); // VIN/NIV del semirremolque
            $table->string('remolque_placa', 30)->nullable()->after('remolque_vin'); // Placa del semirremolque
            $table->string('remolque_tipo')->nullable()->after('remolque_placa'); // Caja Seca, Refrigerada, Plataforma, etc.
            $table->string('remolque_modelo')->nullable()->after('remolque_tipo');
            $table->integer('remolque_year')->nullable()->after('remolque_modelo');
            
            // Pesos y Dimensiones
            $table->string('remolque_peso_bruto_vehicular', 50)->nullable()->after('remolque_year'); // PBVO (kg/lbs)
            $table->string('remolque_peso_vehicular', 50)->nullable()->after('remolque_peso_bruto_vehicular'); // Tara (kg/lbs)
            $table->string('remolque_capacidad_carga', 50)->nullable()->after('remolque_peso_vehicular'); // Carga útil (kg/m3)
            $table->string('remolque_largo', 30)->nullable()->after('remolque_capacidad_carga'); // 53', 48', metros
            $table->string('remolque_ancho', 30)->nullable()->after('remolque_largo');
            $table->string('remolque_alto', 30)->nullable()->after('remolque_ancho');

            // Tren Rodante y Suspensión
            $table->unsignedTinyInteger('remolque_ejes')->nullable()->after('remolque_alto'); // Cantidad de ejes
            $table->string('remolque_capacidad_ejes', 50)->nullable()->after('remolque_ejes');
            $table->string('remolque_tipo_suspension', 50)->nullable()->after('remolque_capacidad_ejes'); // Neumática / Mecánica
            $table->string('remolque_capacidad_patines', 50)->nullable()->after('remolque_tipo_suspension');
            $table->unsignedTinyInteger('remolque_cantidad_llantas')->nullable()->after('remolque_capacidad_patines');
            $table->string('remolque_medida_llantas', 50)->nullable()->after('remolque_cantidad_llantas');
            $table->string('remolque_presion_llantas', 30)->nullable()->after('remolque_medida_llantas'); // PSI

            // Fotografías de la Caja / Placa Técnica
            $table->string('remolque_foto_placa')->nullable()->after('remolque_presion_llantas'); // Foto de la placa de especificaciones técnicas
            $table->string('remolque_foto_lateral')->nullable()->after('remolque_foto_placa'); // Foto lateral de la caja
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proveedor_vehiculos', function (Blueprint $table) {
            $table->dropColumn([
                'categoria_vehiculo',
                'subtipo_carroceria',
                'numero_serie_vin',
                'numero_ejes',
                'tarjeta_circulacion',
                'aseguradora',
                'poliza_seguro',
                'vigencia_seguro',
                'tiene_remolque',
                'remolque_fabricante',
                'remolque_serie_fabricante',
                'remolque_vin',
                'remolque_placa',
                'remolque_tipo',
                'remolque_modelo',
                'remolque_year',
                'remolque_peso_bruto_vehicular',
                'remolque_peso_vehicular',
                'remolque_capacidad_carga',
                'remolque_largo',
                'remolque_ancho',
                'remolque_alto',
                'remolque_ejes',
                'remolque_capacidad_ejes',
                'remolque_tipo_suspension',
                'remolque_capacidad_patines',
                'remolque_cantidad_llantas',
                'remolque_medida_llantas',
                'remolque_presion_llantas',
                'remolque_foto_placa',
                'remolque_foto_lateral',
            ]);
        });
    }
};
