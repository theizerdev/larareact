<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('reparacion_preservicio_items')) {
            Schema::create('reparacion_preservicio_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
                $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('set null');

                $table->string('seccion')->default('fisica'); // fisica, funcional, seguridad, etc.
                $table->string('nombre');
                $table->string('descripcion')->nullable();
                $table->string('icono')->nullable();
                $table->string('tipo_campo')->default('estado_obs'); // estado_obs (bueno/malo/na + obs), boolean (switch)
                $table->integer('orden')->default(0);
                $table->boolean('activo')->default(true);
                $table->boolean('is_default')->default(false);

                $table->timestamps();

                $table->index(['empresa_id', 'sucursal_id', 'seccion', 'activo'], 'pre_items_emp_suc_sec_act_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('reparacion_preservicio_items');
    }
};
