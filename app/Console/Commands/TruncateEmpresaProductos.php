<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TruncateEmpresaProductos extends Command
{
    /**
     * El nombre y la firma del comando en consola.
     *
     * @var string
     */
    protected $signature = 'empresa:clean-products 
                            {empresa_id? : ID de la empresa a limpiar (por defecto toma la empresa del usuario en sesión)} 
                            {--force : Ejecutar sin pedir confirmación}
                            {--catalog : Borrar también categorías, marcas, familias y modelos de la empresa}';

    /**
     * La descripción del comando.
     *
     * @var string
     */
    protected $description = 'Elimina (vacía) todos los productos e historial de inventario de una empresa específica por su ID';

    /**
     * Ejecuta el comando.
     */
    public function handle()
    {
        $empresaId = $this->argument('empresa_id');
        $force = $this->option('force');
        $includeCatalog = $this->option('catalog');

        // Si no se pasó empresa_id, tomar el de la empresa del usuario autenticado
        if (!$empresaId || $empresaId === '0' || $empresaId === 'current') {
            if (auth()->check() && auth()->user()->empresa_id) {
                $empresaId = auth()->user()->empresa_id;
            }
        }

        if (!$empresaId) {
            $this->error("Error: Debe especificar un ID de empresa válido o iniciar sesión con un usuario asociado a una empresa.");
            return Command::FAILURE;
        }

        // 1. Verificar si la empresa existe
        $empresa = Empresa::find($empresaId);
        if (!$empresa) {
            $this->error("Error: No se encontró ninguna empresa con ID: {$empresaId}");
            return Command::FAILURE;
        }

        $nombreEmpresa = $empresa->razon_social ?? "Empresa #{$empresa->id}";

        $this->warn("¡ATENCIÓN! Estás a punto de eliminar TODOS los productos e inventario de la empresa:");
        $this->line(" - ID: {$empresa->id}");
        $this->line(" - Razón Social: {$nombreEmpresa}");

        // 2. Pedir confirmación si no se pasó --force
        if (!$force && !$this->confirm('¿Estás seguro de que deseas continuar? Esta acción NO se puede deshacer.')) {
            $this->info('Operación cancelada por el usuario.');
            return Command::SUCCESS;
        }

        try {
            DB::beginTransaction();

            // 3. Eliminar movimientos de inventario de la empresa (Uso DB::table para omitir Scopes de Multitenancy)
            $deletedMovements = DB::table('inventory_movements')->where('empresa_id', $empresaId)->delete();

            // 4. Eliminar productos de la empresa
            $deletedProducts = DB::table('productos')->where('empresa_id', $empresaId)->delete();

            $deletedCategories = 0;
            $deletedBrands = 0;
            $deletedFamilies = 0;
            $deletedModels = 0;

            if ($includeCatalog) {
                $deletedCategories = DB::table('categorias')->where('empresa_id', $empresaId)->delete();
                $deletedBrands = DB::table('marcas')->where('empresa_id', $empresaId)->delete();
                $deletedFamilies = DB::table('familias')->where('empresa_id', $empresaId)->delete();
                $deletedModels = DB::table('modelos')->where('empresa_id', $empresaId)->delete();
            }

            DB::commit();

            $this->info("✅ Limpieza completada con éxito para la empresa [{$nombreEmpresa}]:");
            $this->table(
                ['Elemento', 'Registros Eliminados'],
                [
                    ['Movimientos de Inventario', $deletedMovements],
                    ['Productos', $deletedProducts],
                    ['Categorías', $includeCatalog ? $deletedCategories : 'N/A'],
                    ['Marcas', $includeCatalog ? $deletedBrands : 'N/A'],
                    ['Familias', $includeCatalog ? $deletedFamilies : 'N/A'],
                    ['Modelos', $includeCatalog ? $deletedModels : 'N/A'],
                ]
            );

            return Command::SUCCESS;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Error al realizar la limpieza: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}

