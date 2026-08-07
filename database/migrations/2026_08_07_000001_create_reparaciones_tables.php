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
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('set null');
            $table->string('numero_orden')->index(); // ej: REP-001042
            
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->onDelete('set null');
            $table->string('cliente_nombre')->nullable();
            $table->string('cliente_telefono')->nullable();

            $table->string('tipo_dispositivo')->default('Smartphone');
            $table->foreignId('marca_id')->nullable()->constrained('marcas')->onDelete('set null');
            $table->string('marca_nombre')->nullable();
            $table->foreignId('modelo_id')->nullable()->constrained('modelos')->onDelete('set null');
            $table->string('modelo_nombre')->nullable();
            $table->string('color')->nullable();
            $table->string('imei_serie')->nullable()->index();
            $table->string('contrasena_patron')->nullable();

            $table->text('descripcion_falla');
            $table->text('observaciones_fisicas')->nullable();

            // Checklist de Inspección Física (12 puntos) & Estado del Equipo (5 preguntas)
            $table->json('inspeccion_fisica')->nullable();
            $table->json('estado_equipo')->nullable();
            $table->json('accesorios')->nullable();
            $table->json('evidencias_fotos')->nullable();

            $table->foreignId('tecnico_id')->nullable()->constrained('users')->onDelete('set null');

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

            $table->decimal('costo_mano_obra', 12, 2)->default(0);
            $table->decimal('costo_repuestos', 12, 2)->default(0);
            $table->decimal('costo_estimado', 12, 2)->default(0);
            $table->decimal('anticipo', 12, 2)->default(0);
            $table->decimal('saldo_restante', 12, 2)->default(0);

            $table->integer('garantia_dias')->default(30);
            $table->dateTime('fecha_recepcion');
            $table->date('fecha_prometida')->nullable();
            $table->dateTime('fecha_entrega')->nullable();

            $table->foreignId('sale_id')->nullable()->constrained('sales')->onDelete('set null'); // Factura POS si se cobró

            $table->timestamps();
        });

        Schema::create('orden_reparacion_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_id')->constrained('ordenes_reparacion')->onDelete('cascade');
            $table->foreignId('producto_id')->nullable()->constrained('productos')->onDelete('set null');
            $table->foreignId('servicio_id')->nullable()->constrained('servicios')->onDelete('set null');
            $table->string('descripcion');
            $table->integer('cantidad')->default(1);
            $table->decimal('precio_costo', 12, 2)->default(0);
            $table->decimal('precio_venta', 12, 2)->default(0);
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('orden_reparacion_historial', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_id')->constrained('ordenes_reparacion')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('estado_anterior')->nullable();
            $table->string('estado_nuevo');
            $table->text('comentario')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orden_reparacion_historial');
        Schema::dropIfExists('orden_reparacion_items');
        Schema::dropIfExists('ordenes_reparacion');
    }
};
