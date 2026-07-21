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
        Schema::table('users', function (Blueprint $table) {
            $table->string('telefono')->nullable()->after('email');
            $table->string('username')->nullable()->after('telefono');
            $table->enum('status', ['activo', 'inactivo', 'suspendido'])->nullable()->after('username')->default('activo');
            $table->foreignId('empresa_id')->nullable()->after('status')->constrained('empresas')->nullOnDelete();
            $table->foreignId('sucursal_id')->nullable()->after('empresa_id')->constrained('sucursales')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['empresa_id']);
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn(['telefono', 'empresa_id', 'sucursal_id', 'username', 'status']);
        });
    }
};
