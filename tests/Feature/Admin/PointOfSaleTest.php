<?php

namespace Tests\Feature\Admin;

use App\Models\CashRegister;
use App\Models\Cliente;
use App\Models\Empresa;
use App\Models\OrdenReparacion;
use App\Models\Producto;
use App\Models\User;
use App\Services\CashRegisterService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PointOfSaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_cash_register_can_be_opened_and_closed(): void
    {
        $empresa = Empresa::create(['razon_social' => 'Empresa Test', 'documento' => 'J12345678', 'status' => true]);
        $user = User::create([
            'name' => 'Usuario Test',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'empresa_id' => $empresa->id,
        ]);
        $this->actingAs($user);

        $service = app(CashRegisterService::class);
        $register = $service->openRegister($user->id, 100.00);

        $this->assertEquals('open', $register->status);
        $this->assertEquals(100.00, $register->opening_amount);

        $service->closeRegister($register, 100.00);
        $this->assertEquals('closed', $register->status);
    }

    public function test_sale_processing_creates_sale_record_and_decrements_stock(): void
    {
        $empresa = Empresa::create(['razon_social' => 'Empresa Test', 'documento' => 'J12345678', 'status' => true]);
        $user = User::create([
            'name' => 'Usuario Test',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'empresa_id' => $empresa->id,
        ]);
        $this->actingAs($user);

        $producto = Producto::create([
            'empresa_id' => $empresa->id,
            'codigo_barras' => 'TEST-001',
            'sku' => 'TEST-001',
            'nombre' => 'Producto Test',
            'nombre_variante' => 'Producto Test',
            'estado' => true,
            'usa_inventario' => true,
            'stock' => 20,
            'precio_venta' => 25.00,
        ]);

        $saleData = [
            'cliente_nombre' => 'Cliente Mostrador',
            'metodo_pago' => 'efectivo',
            'impuesto' => 0,
            'descuento' => 0,
            'monto_recibido' => 25.00,
            'es_credito' => false,
            'items' => [
                [
                    'itemable_id' => $producto->id,
                    'concepto_tipo' => 'producto',
                    'nombre' => 'Producto Test',
                    'cantidad' => 2,
                    'precio_unitario' => 25.00,
                ],
            ],
        ];

        $service = app(SaleService::class);
        $sale = $service->processSale($saleData, $user->id);

        $this->assertNotNull($sale);
        $this->assertEquals(50.00, $sale->total);
        $this->assertDatabaseHas('sales', [
            'id' => $sale->id,
            'total' => 50.00,
        ]);

        $producto->refresh();
        $this->assertEquals(18, $producto->stock);
    }

    public function test_sale_processing_links_repaired_order_to_sale_and_clears_balance(): void
    {
        $empresa = Empresa::create(['razon_social' => 'Empresa Test', 'documento' => 'J12345678', 'status' => true]);
        $user = User::create([
            'name' => 'Usuario Test',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'empresa_id' => $empresa->id,
        ]);
        $this->actingAs($user);

        $reparacion = OrdenReparacion::create([
            'empresa_id' => $empresa->id,
            'numero_orden' => 'REP-1001',
            'cliente_nombre' => 'Cliente Reparación',
            'descripcion_falla' => 'Falla de prueba',
            'estado_orden' => 'reparado',
            'costo_estimado' => 120.00,
            'saldo_restante' => 120.00,
            'sale_id' => null,
        ]);

        $saleData = [
            'cliente_nombre' => 'Cliente Reparación',
            'metodo_pago' => 'efectivo',
            'impuesto' => 0,
            'descuento' => 0,
            'monto_recibido' => 120.00,
            'es_credito' => false,
            'items' => [
                [
                    'itemable_id' => $reparacion->id,
                    'concepto_tipo' => 'reparacion',
                    'nombre' => 'Pago reparación',
                    'cantidad' => 1,
                    'precio_unitario' => 120.00,
                ],
            ],
        ];

        $service = app(SaleService::class);
        $sale = $service->processSale($saleData, $user->id);

        $reparacion->refresh();

        $this->assertNotNull($sale);
        $this->assertEquals($sale->id, $reparacion->sale_id);
        $this->assertEquals(0.00, (float) $reparacion->saldo_restante);
    }
}
