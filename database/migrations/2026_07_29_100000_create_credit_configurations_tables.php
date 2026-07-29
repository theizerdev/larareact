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
        Schema::create('credit_policies', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->default('General');
            $table->boolean('activo')->default(true);
            $table->integer('plazo_defecto_dias')->default(30);
            $table->decimal('limite_defecto', 12, 2)->default(500.00);
            $table->boolean('permite_modificar_limite')->default(true);
            $table->integer('dias_gracia')->default(0);
            $table->string('moneda', 10)->default('USD');

            // Intereses
            $table->boolean('interes_activado')->default(false);
            $table->string('interes_tipo', 20)->default('mensual'); // diario, mensual
            $table->string('interes_calculo', 20)->default('porcentual'); // fijo, porcentual, sin_interes
            $table->decimal('interes_valor', 8, 2)->default(0.00);
            $table->integer('interes_aplicar_despues_dias')->default(0);
            $table->boolean('interes_capitalizable')->default(false);

            // Límites
            $table->string('limite_accion_excedido', 20)->default('bloquear'); // bloquear, advertir, autorizacion
            $table->boolean('permite_exceder_limite')->default(false);
            $table->boolean('solicitar_autorizacion')->default(false);
            $table->boolean('mostrar_credito_disponible')->default(true);

            // Formas de pago
            $table->string('forma_pago_tipo', 30)->default('pago_unico'); // pago_unico, cuotas_semanales, quincenales, mensuales, personalizadas
            $table->integer('max_cuotas')->default(1);
            $table->decimal('pago_minimo_porcentaje', 5, 2)->default(0.00);
            $table->decimal('abono_minimo', 12, 2)->default(0.00);

            // Vencimientos
            $table->string('vencimiento_tipo', 30)->default('dias_despues'); // dias_despues, fecha_fija, dia_especifico_mes
            $table->integer('vencimiento_dias_despues')->default(30);
            $table->integer('vencimiento_dia_mes')->nullable();
            $table->boolean('saltar_domingos')->default(true);
            $table->boolean('saltar_festivos')->default(true);

            // Recordatorios
            $table->integer('recordatorio_dias_antes')->default(3);
            $table->boolean('recordatorio_en_vencimiento')->default(true);
            $table->integer('recordatorio_dias_despues')->default(3);
            $table->boolean('canal_whatsapp')->default(true);
            $table->boolean('canal_email')->default(true);
            $table->boolean('canal_sms')->default(false);

            // Penalizaciones
            $table->string('penalizacion_tipo', 20)->default('ninguna'); // ninguna, fija, porcentual
            $table->decimal('penalizacion_valor', 12, 2)->default(0.00);
            $table->boolean('penalizacion_suspender_credito')->default(false);
            $table->boolean('penalizacion_bloquear_compras')->default(false);

            // Reglas del cliente
            $table->string('tipo_cliente_categoria', 30)->default('credito'); // contado, credito, vip, distribuidor, mayorista

            // Aprobaciones
            $table->decimal('monto_requiere_autorizacion', 12, 2)->default(1000.00);
            $table->string('rol_autorizador', 50)->default('admin'); // admin, supervisor, gerente

            // Documentos
            $table->boolean('requiere_contrato')->default(false);
            $table->boolean('requiere_pagare')->default(false);
            $table->boolean('requiere_firma_digital')->default(false);
            $table->boolean('requiere_identificacion')->default(false);
            $table->boolean('requiere_comprobantes')->default(false);

            // Seguridad & Permisos
            $table->boolean('permiso_crear_credito')->default(true);
            $table->boolean('permiso_modificar_plazo')->default(true);
            $table->boolean('permiso_cambiar_interes')->default(false);
            $table->boolean('permiso_cambiar_limite')->default(false);
            $table->boolean('permiso_eliminar_pagos')->default(false);
            $table->boolean('permiso_revertir_pagos')->default(false);
            $table->boolean('permiso_condonar_intereses')->default(false);

            $table->timestamps();
        });

        Schema::create('credit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->unsignedBigInteger('cliente_id')->nullable();
            $table->string('accion');
            $table->json('detalles')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_logs');
        Schema::dropIfExists('credit_policies');
    }
};
