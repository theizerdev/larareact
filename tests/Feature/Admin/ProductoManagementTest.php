<?php

namespace Tests\Feature\Admin;

use App\Models\Empresa;
use App\Models\Producto;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductoManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_service_records_initial_stock_movement(): void
    {
        $empresa = Empresa::factory()->create();
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $this->actingAs($user);

        $producto = Producto::factory()->create([
            'empresa_id' => $empresa->id,
            'usa_inventario' => true,
            'stock' => 15,
            'precio_compra' => 10.0,
        ]);

        $service = app(InventoryService::class);
        $movement = $service->recordInitialStock($producto);

        $this->assertNotNull($movement);
        $this->assertEquals(15, $movement->cantidad);
        $this->assertEquals('entrada', $movement->tipo);
        $this->assertDatabaseHas('inventory_movements', [
            'producto_id' => $producto->id,
            'cantidad' => 15,
        ]);
    }
}
