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
        Schema::create('tipo_servicios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->constrained('sucursales')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->smallInteger('status')->default(1);
            $table->timestamps();
        });

        // Seed initial values for all existing companies and branches
        $sucursales = \DB::table('sucursales')->get();
        
        // Find a fallback user if available
        $user = \DB::table('users')->first();
        $userId = $user ? $user->id : null;

        $defaultServices = [
            'Entrega de Alimentos',
            'Entrega de Materiales',
            'Retirar materiales',
            'Otros'
        ];

        foreach ($sucursales as $sucursal) {
            foreach ($defaultServices as $service) {
                \DB::table('tipo_servicios')->insert([
                    'nombre' => $service,
                    'empresa_id' => $sucursal->empresa_id,
                    'sucursal_id' => $sucursal->id,
                    'user_id' => $userId,
                    'status' => 1,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipo_servicios');
    }
};
