<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Visibilidad del menú en dos niveles (ambos guardan SOLO lo oculto):
     *  1. Por empresa: lo que contrató el cliente (techo para todos sus usuarios).
     *  2. Por rol: segmentación dentro de lo que la empresa tiene.
     * El Super Administrador no se ve afectado por ninguno.
     *
     * Lo que estaba oculto de forma global se copia a cada empresa existente
     * para que nadie vea cambiar su menú al desplegar. La tabla global
     * `menu_visibility_settings` se deja intacta (ya no se lee).
     */
    public function up(): void
    {
        Schema::create('empresa_menu_visibility', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id');
            $table->string('menu_key');
            $table->timestamps();

            $table->unique(['empresa_id', 'menu_key']);
            $table->foreign('empresa_id')->references('id')->on('empresas')->cascadeOnDelete();
        });

        Schema::create('role_menu_visibility', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('role_id');
            $table->string('menu_key');
            $table->timestamps();

            $table->unique(['role_id', 'menu_key']);
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
        });

        if (Schema::hasTable('menu_visibility_settings')) {
            $ocultas = DB::table('menu_visibility_settings')->where('visible', false)->pluck('menu_key');
            $now = now();

            foreach (DB::table('empresas')->pluck('id') as $empresaId) {
                foreach ($ocultas as $key) {
                    DB::table('empresa_menu_visibility')->insert([
                        'empresa_id' => $empresaId,
                        'menu_key' => $key,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('role_menu_visibility');
        Schema::dropIfExists('empresa_menu_visibility');
    }
};
