<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ordenes_reparacion', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->string('numero_orden')->index();
            
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->nullOnDelete();
            $table->string('cliente_nombre')->nullable();
            $table->string('cliente_telefono')->nullable();

            $table->string('tipo_dispositivo')->default('Smartphone');
            $table->foreignId('marca_id')->nullable()->constrained('marcas')->nullOnDelete();
            $table->string('marca_nombre')->nullable();
            $table->foreignId('modelo_id')->nullable()->constrained('modelos')->nullOnDelete();
            $table->string('modelo_nombre')->nullable();
            $table->string('color')->nullable();
            $table->string('imei_serie')->nullable()->index();
            $table->text('descripcion_falla');
            $table->text('observaciones_fisicas')->nullable();

            $table->string('contrasena_patron')->nullable();
            $table->json('inspeccion_json')->nullable();
            $table->json('post_servicio_json')->nullable();

            $table->unsignedBigInteger('tecnico_id')->nullable()->index();
            $table->decimal('comision_tecnico_pct', 5, 2)->default(0.00);

            $table->enum('estado_orden', [
                'recibido',
                'en_diagnostico',
                'presupuestado',
                'en_reparacion',
                'esperando_repuesto',
                'reparado',
                'entregado',
                'cancelado'
            ])->default('recibido')->index();

            $table->decimal('costo_mano_obra', 12, 2)->default(0.00);
            $table->decimal('costo_repuestos', 12, 2)->default(0.00);
            $table->decimal('costo_estimado', 12, 2)->default(0.00);
            $table->decimal('anticipo', 12, 2)->default(0.00);
            $table->decimal('saldo_restante', 12, 2)->default(0.00);

            $table->integer('garantia_dias')->default(30);
            $table->dateTime('fecha_recepcion');
            $table->dateTime('fecha_prometida')->nullable();
            $table->dateTime('fecha_entrega')->nullable();

            $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete();

            $table->timestamps();
        });

        Schema::create('orden_reparacion_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_id')->constrained('ordenes_reparacion')->cascadeOnDelete();
            $table->foreignId('producto_id')->nullable()->constrained('productos')->nullOnDelete();
            $table->foreignId('servicio_id')->nullable()->constrained('servicios')->nullOnDelete();
            $table->string('descripcion');
            $table->integer('cantidad')->default(1);
            $table->decimal('precio_costo', 12, 2)->default(0.00);
            $table->decimal('precio_venta', 12, 2)->default(0.00);
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->timestamps();
        });

        Schema::create('orden_reparacion_historial', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_id')->constrained('ordenes_reparacion')->cascadeOnDelete();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('estado_anterior')->nullable();
            $table->string('estado_nuevo');
            $table->text('comentario')->nullable();
            $table->timestamps();
        });

        Schema::create('orden_reparacion_fotos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_id')->constrained('ordenes_reparacion')->cascadeOnDelete();
            $table->string('angulo')->default('frente');
            $table->longText('url');
            $table->string('descripcion')->nullable();
            $table->timestamps();
        });

        Schema::create('reparacion_checklist_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->string('nombre');
            $table->string('categoria')->default('general');
            $table->boolean('activo')->default(true);
            $table->integer('orden')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reparacion_checklist_items');
        Schema::dropIfExists('orden_reparacion_fotos');
        Schema::dropIfExists('orden_reparacion_historial');
        Schema::dropIfExists('orden_reparacion_items');
        Schema::dropIfExists('ordenes_reparacion');
    }
};
