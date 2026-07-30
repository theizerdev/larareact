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
        // 1. Agregar campos de suscripción a la tabla empresas
        if (!Schema::hasColumn('empresas', 'subscription_status')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->string('subscription_status')->default('trial')->after('status'); // trial, active, expired, cancelled
                $table->timestamp('trial_ends_at')->nullable()->after('subscription_status');
                $table->timestamp('subscription_expires_at')->nullable()->after('trial_ends_at');
                $table->string('billing_cycle')->nullable()->after('subscription_expires_at'); // trial, 3_months, 6_months, 12_months
                $table->integer('max_sucursales')->default(1)->after('billing_cycle');
            });
        }

        // Drop if partially created in previous failed run
        Schema::dropIfExists('subscription_payments');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('subscription_plans');

        // 2. Tabla de Planes de Suscripción
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->decimal('precio_3_meses', 10, 2)->default(0.00);
            $table->decimal('precio_6_meses', 10, 2)->default(0.00);
            $table->decimal('precio_12_meses', 10, 2)->default(0.00);
            $table->decimal('precio_sucursal_extra_mensual', 10, 2)->default(10.00);
            $table->integer('sucursales_incluidas')->default(1);
            $table->json('modulos_incluidos')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // 3. Tabla de Suscripciones Activas y Registro Histórico
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->string('nombre_plan')->default('Plan Full');
            $table->integer('ciclo_meses')->default(0); // 0 para trial, 3, 6, 12
            $table->integer('max_sucursales')->default(1);
            $table->decimal('monto_total', 10, 2)->default(0.00);
            $table->timestamp('fecha_inicio')->nullable();
            $table->timestamp('fecha_vencimiento')->nullable();
            $table->string('estado')->default('trial'); // trial, active, expired, cancelled
            $table->timestamps();
        });

        // 4. Tabla de Solicitudes y Registro de Pagos de Renovación
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('monto', 10, 2);
            $table->integer('ciclo_meses');
            $table->integer('sucursales_contratadas')->default(1);
            $table->string('metodo_pago')->default('transferencia'); // transferencia, pago_movil, zelle, efectivo, gratis_admin
            $table->string('referencia_pago')->nullable();
            $table->string('comprobante_path')->nullable();
            $table->text('notas')->nullable();
            $table->string('estado')->default('pending'); // pending, approved, rejected
            $table->foreignId('aprobado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('aprobado_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('subscription_plans');

        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn([
                'subscription_status',
                'trial_ends_at',
                'subscription_expires_at',
                'billing_cycle',
                'max_sucursales',
            ]);
        });
    }
};
