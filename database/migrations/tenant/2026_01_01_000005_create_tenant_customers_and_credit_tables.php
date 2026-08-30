<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('credit_policies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->string('nombre')->default('General');
            $table->boolean('activo')->default(true);
            $table->integer('plazo_defecto_dias')->default(30);
            $table->decimal('limite_defecto', 12, 2)->default(500.00);
            $table->boolean('permite_modificar_limite')->default(true);
            $table->integer('dias_gracia')->default(0);
            $table->string('moneda', 10)->default('USD');

            $table->boolean('interes_activado')->default(false);
            $table->string('interes_tipo', 20)->default('mensual');
            $table->string('interes_calculo', 20)->default('porcentual');
            $table->decimal('interes_valor', 8, 2)->default(0.00);
            $table->integer('interes_aplicar_despues_dias')->default(0);
            $table->boolean('interes_capitalizable')->default(false);

            $table->string('limite_accion_excedido', 20)->default('bloquear');
            $table->boolean('permite_exceder_limite')->default(false);
            $table->boolean('solicitar_autorizacion')->default(false);
            $table->boolean('mostrar_credito_disponible')->default(true);

            $table->string('forma_pago_tipo', 30)->default('pago_unico');
            $table->integer('max_cuotas')->default(1);
            $table->decimal('pago_minimo_porcentaje', 5, 2)->default(0.00);
            $table->decimal('abono_minimo', 12, 2)->default(0.00);

            $table->string('vencimiento_tipo', 30)->default('dias_despues');
            $table->integer('vencimiento_dias_despues')->default(30);
            $table->integer('vencimiento_dia_mes')->nullable();
            $table->boolean('saltar_domingos')->default(true);
            $table->boolean('saltar_festivos')->default(true);

            $table->integer('recordatorio_dias_antes')->default(3);
            $table->boolean('recordatorio_en_vencimiento')->default(true);
            $table->integer('recordatorio_dias_despues')->default(3);
            $table->boolean('canal_whatsapp')->default(true);
            $table->boolean('canal_email')->default(true);
            $table->boolean('canal_sms')->default(false);

            $table->string('penalizacion_tipo', 20)->default('ninguna');
            $table->decimal('penalizacion_valor', 12, 2)->default(0.00);
            $table->boolean('penalizacion_suspender_credito')->default(false);
            $table->boolean('penalizacion_bloquear_compras')->default(false);

            $table->string('tipo_cliente_categoria', 30)->default('credito');
            $table->decimal('monto_requiere_autorizacion', 12, 2)->default(1000.00);
            $table->string('rol_autorizador', 50)->default('admin');

            $table->boolean('requiere_contrato')->default(false);
            $table->boolean('requiere_pagare')->default(false);
            $table->boolean('requiere_firma_digital')->default(false);
            $table->boolean('requiere_identificacion')->default(false);
            $table->boolean('requiere_comprobantes')->default(false);

            $table->boolean('permiso_crear_credito')->default(true);
            $table->boolean('permiso_modificar_plazo')->default(true);
            $table->boolean('permiso_cambiar_interes')->default(false);
            $table->boolean('permiso_cambiar_limite')->default(false);
            $table->boolean('permiso_eliminar_pagos')->default(false);
            $table->boolean('permiso_revertir_pagos')->default(false);
            $table->boolean('permiso_condonar_intereses')->default(false);

            $table->timestamps();
        });

        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->string('nombre');
            $table->string('documento')->nullable();
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->string('direccion')->nullable();
            $table->decimal('limite_credito', 15, 2)->default(0.00);
            $table->decimal('saldo_pendiente', 15, 2)->default(0.00);
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        Schema::create('credit_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('cliente_id')->constrained('clientes')->cascadeOnDelete();
            $table->string('metodo_pago')->default('efectivo');
            $table->decimal('monto', 15, 2);
            $table->text('nota')->nullable();
            $table->unsignedBigInteger('received_by')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('credit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->nullOnDelete();
            $table->string('accion');
            $table->json('detalles')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('credit_logs');
        Schema::dropIfExists('credit_payments');
        Schema::dropIfExists('clientes');
        Schema::dropIfExists('credit_policies');
    }
};
