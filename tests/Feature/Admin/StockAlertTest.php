<?php

namespace Tests\Feature\Admin;

use App\Http\Controllers\Admin\StockAlertController;
use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Marca;
use App\Models\Modelo;
use App\Models\Producto;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\StockAlertPdfService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use ReflectionProperty;
use Tests\TestCase;

class StockAlertTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'session.driver' => 'array',
            'activitylog.enabled' => false,
        ]);

        $this->setUpMinimalSchema();
    }

    private function setUpMinimalSchema(): void
    {
        Schema::create('pais', function (Blueprint $t) {
            $t->id();
            $t->string('nombre')->nullable();
            $t->string('codigo_iso2')->nullable();
            $t->string('moneda_principal')->nullable();
            $t->string('zona_horaria')->nullable();
            $t->boolean('activo')->default(true);
            $t->timestamps();
        });
        Schema::create('empresas', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('pais_id')->nullable();
            $t->string('razon_social')->nullable();
            $t->string('nombre_comercial')->nullable();
            $t->string('documento')->nullable();
            $t->string('direccion')->nullable();
            $t->string('telefono')->nullable();
            $t->string('email')->nullable();
            $t->string('logo')->nullable();
            $t->string('zona_horaria')->nullable();
            $t->boolean('status')->default(true);
            $t->timestamps();
        });
        Schema::create('sucursales', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('empresa_id')->nullable();
            $t->string('nombre')->nullable();
            $t->string('direccion')->nullable();
            $t->string('telefono')->nullable();
            $t->boolean('status')->default(true);
            $t->boolean('whatsapp_active')->default(false);
            $t->timestamps();
        });
        Schema::create('users', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('email')->unique();
            $t->string('password');
            $t->unsignedBigInteger('empresa_id')->nullable();
            $t->unsignedBigInteger('sucursal_id')->nullable();
            $t->timestamp('email_verified_at')->nullable();
            $t->timestamps();
        });
        Schema::create('roles', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('guard_name')->default('web');
            $t->timestamps();
        });
        Schema::create('model_has_roles', function (Blueprint $t) {
            $t->unsignedBigInteger('role_id');
            $t->string('model_type');
            $t->unsignedBigInteger('model_id');
        });
        Schema::create('categorias', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('empresa_id')->nullable();
            $t->unsignedBigInteger('sucursal_id')->nullable();
            $t->string('nombre');
            $t->string('slug')->nullable();
            $t->boolean('estado')->default(true);
            $t->timestamps();
        });
        Schema::create('marcas', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('empresa_id')->nullable();
            $t->unsignedBigInteger('sucursal_id')->nullable();
            $t->string('nombre');
            $t->string('slug')->nullable();
            $t->string('logo_url')->nullable();
            $t->boolean('estado')->default(true);
            $t->timestamps();
        });
        Schema::create('modelos', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('empresa_id')->nullable();
            $t->unsignedBigInteger('sucursal_id')->nullable();
            $t->unsignedBigInteger('marca_id')->nullable();
            $t->unsignedBigInteger('familia_id')->nullable();
            $t->unsignedBigInteger('categoria_id')->nullable();
            $t->string('nombre_comercial');
            $t->string('codigo_modelo')->nullable();
            $t->string('slug')->nullable();
            $t->json('specs_overrides')->nullable();
            $t->boolean('estado')->default(true);
            $t->timestamps();
        });
        Schema::create('productos', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('empresa_id')->nullable();
            $t->unsignedBigInteger('sucursal_id')->nullable();
            $t->unsignedBigInteger('categoria_id')->nullable();
            $t->unsignedBigInteger('marca_id')->nullable();
            $t->unsignedBigInteger('familia_id')->nullable();
            $t->unsignedBigInteger('modelo_id')->nullable();
            $t->string('sku')->nullable();
            $t->string('codigo_barras')->nullable();
            $t->string('nombre_variante')->nullable();
            $t->string('condicion')->default('nuevo');
            $t->string('tipo_producto')->default('venta');
            $t->string('tipo_venta')->default('unidad');
            $t->boolean('usa_inventario')->default(true);
            $t->decimal('precio_compra', 12, 2)->default(0);
            $t->decimal('precio_venta', 12, 2)->default(0);
            $t->decimal('precio_mayoreo', 12, 2)->default(0);
            $t->decimal('stock', 12, 2)->default(0);
            $t->decimal('stock_minimo', 12, 2)->default(0);
            $t->boolean('estado')->default(true);
            $t->timestamps();
        });
    }

    public function test_stock_alerts_groups_products_by_brand_and_exports_valid_pdf(): void
    {
        $empresa = Empresa::create([
            'razon_social' => 'Servitec Demo S.A. de C.V.',
            'nombre_comercial' => 'Servitec Demo',
            'documento' => 'SDE-010203-AB1',
            'status' => true,
        ]);

        $sucursal = Sucursal::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Sucursal Matriz',
            'status' => true,
        ]);

        $user = User::create([
            'name' => 'Admin Test',
            'email' => 'admin@servitec.test',
            'password' => bcrypt('secret'),
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'email_verified_at' => now(),
        ]);

        Auth::setUser($user);

        $catPantallas = Categoria::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'nombre' => 'Pantallas',
            'estado' => true,
        ]);

        $marcaApple = Marca::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'nombre' => 'Apple',
            'estado' => true,
        ]);

        $marcaSamsung = Marca::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => null,
            'nombre' => 'Samsung',
            'estado' => true,
        ]);

        $modeloS23 = Modelo::create([
            'empresa_id' => $empresa->id,
            'marca_id' => $marcaSamsung->id,
            'categoria_id' => $catPantallas->id,
            'nombre_comercial' => 'Galaxy S23 Ultra',
            'estado' => true,
        ]);

        Producto::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'categoria_id' => $catPantallas->id,
            'marca_id' => $marcaApple->id,
            'sku' => 'APL-001',
            'nombre_variante' => 'Pantalla iPhone 14 Pro',
            'usa_inventario' => true,
            'precio_compra' => 120.00,
            'precio_venta' => 220.00,
            'stock' => 0,
            'stock_minimo' => 5,
            'estado' => true,
        ]);

        Producto::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'modelo_id' => $modeloS23->id,
            'marca_id' => null,
            'sku' => 'SAM-001',
            'nombre_variante' => 'Display Galaxy S23 Ultra Original',
            'usa_inventario' => true,
            'precio_compra' => 150.00,
            'precio_venta' => 280.00,
            'stock' => 1,
            'stock_minimo' => 5,
            'estado' => true,
        ]);

        Producto::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'marca_id' => null,
            'sku' => 'GEN-001',
            'nombre_variante' => 'Alcohol Isopropílico 500ml',
            'usa_inventario' => true,
            'precio_compra' => 5.00,
            'precio_venta' => 12.00,
            'stock' => 2,
            'stock_minimo' => 5,
            'estado' => true,
        ]);

        $controller = app(StockAlertController::class);

        $request = Request::create('/admin/stock-alerts', 'GET');
        $request->setUserResolver(fn () => $user);

        $inertiaResp = $controller->index($request);
        $refProp = new ReflectionProperty($inertiaResp, 'props');
        $refProp->setAccessible(true);
        $props = $refProp->getValue($inertiaResp);

        $this->assertCount(3, $props['products']);
        $this->assertCount(3, $props['brandGroups']);
        $this->assertSame('Apple', $props['brandGroups'][0]['marca']);
        $this->assertSame('Samsung', $props['brandGroups'][1]['marca']);
        $this->assertSame('Sin Marca', $props['brandGroups'][2]['marca']);
        $this->assertEquals(12.0, $props['resumen']['unidades_faltantes']);

        $pdfRequest = Request::create('/admin/stock-alerts/export-pdf', 'GET');
        $pdfRequest->setUserResolver(fn () => $user);
        $pdfResponse = $controller->exportPdf($pdfRequest, app(StockAlertPdfService::class));

        $this->assertSame(200, $pdfResponse->getStatusCode());
        $this->assertSame('application/pdf', $pdfResponse->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF-1.4', (string) $pdfResponse->getContent());
        $this->assertStringContainsString('%%EOF', (string) $pdfResponse->getContent());
    }
}
