<?php

namespace Database\Seeders;

use App\Models\CashRegister;
use App\Models\CashRegisterMovement;
use App\Models\Categoria;
use App\Models\Cliente;
use App\Models\Empresa;
use App\Models\Familia;
use App\Models\Marca;
use App\Models\Modelo;
use App\Models\Pais;
use App\Models\Producto;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Sucursal;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class Empresa9DashboardSeeder extends Seeder
{
    /**
     * Run the database seeds for Empresa ID 9.
     */
    public function run(): void
    {
        $pais = Pais::where('codigo_iso2', 'VE')->first()
            ?? Pais::where('codigo_iso2', 'MX')->first()
            ?? Pais::first();

        // 1. Empresa ID 9
        $empresa = Empresa::updateOrCreate(
            ['id' => 9],
            [
                'pais_id' => $pais?->id,
                'pais_telefono_id' => $pais?->id,
                'razon_social' => 'FixSale Tech & Retail S.A.',
                'documento' => 'J-99887766-5',
                'direccion' => 'Av. Bolívar, Centro Comercial Financiero #102',
                'latitud' => 10.4806,
                'longitud' => -66.9036,
                'representante_legal' => 'Carlos Mendoza',
                'telefono' => '4149876543',
                'email' => 'contacto@fixsale.app',
                'valor_dolar' => 36.50,
                'status' => true,
                //'api_key' => Empresa::generateApiKey(),
                //'whatsapp_active' => true,
                //'whatsapp_instance' => 'fixsale_instance_9',
            ]
        );

        // 2. Sucursal para Empresa 9
        $sucursal = Sucursal::updateOrCreate(
            ['empresa_id' => 9, 'nombre' => 'Sucursal Principal FixSale'],
            [
                'direccion' => 'Av. Bolívar, Centro Comercial Financiero #102',
                'telefono' => '4149876543',
                'status' => true,
            ]
        );

        // 3. Usuario Admin para Empresa 9
        $user = User::where('empresa_id', 9)->first();
        if (!$user) {
            $user = User::updateOrCreate(
                ['email' => 'carlos@fixsale.app'],
                [
                    'name' => 'Carlos Mendoza',
                    'username' => 'carlos.mendoza',
                    'password' => bcrypt('password'),
                    'empresa_id' => 9,
                    'sucursal_id' => $sucursal->id,
                    'status' => 'activo',
                    'telefono' => '584149876543',
                ]
            );
        } else {
            $user->update([
                'sucursal_id' => $user->sucursal_id ?? $sucursal->id,
                'status' => 'activo',
            ]);
        }

        // 4. Categorías con SLUG explícito
        $catLaptops = Categoria::firstOrCreate(
            ['empresa_id' => 9, 'slug' => 'laptops-computadoras'],
            ['nombre' => 'Laptops & Computadoras', 'sucursal_id' => $sucursal->id, 'estado' => true]
        );
        $catPos = Categoria::firstOrCreate(
            ['empresa_id' => 9, 'slug' => 'punto-de-venta-impresoras'],
            ['nombre' => 'Punto de Venta & Impresoras', 'sucursal_id' => $sucursal->id, 'estado' => true]
        );
        $catAcc = Categoria::firstOrCreate(
            ['empresa_id' => 9, 'slug' => 'accesorios-perifericos'],
            ['nombre' => 'Accesorios & Periféricos', 'sucursal_id' => $sucursal->id, 'estado' => true]
        );
        $catServ = Categoria::firstOrCreate(
            ['empresa_id' => 9, 'slug' => 'servicios-tecnicos'],
            ['nombre' => 'Servicios Técnicos', 'sucursal_id' => $sucursal->id, 'estado' => true]
        );

        // Marca, Familia y Modelo
        $marca = Marca::firstOrCreate(
            ['empresa_id' => 9, 'slug' => 'fixsale-brand'],
            ['nombre' => 'FixSale Brand', 'sucursal_id' => $sucursal->id, 'estado' => true]
        );

        $familia = Familia::firstOrCreate(
            ['empresa_id' => 9, 'nombre' => 'Equipos Principales'],
            [
                'marca_id' => $marca->id,
                'categoria_id' => $catLaptops->id,
                'sucursal_id' => $sucursal->id,
                'estado' => true,
            ]
        );

        $modelo = Modelo::firstOrCreate(
            ['empresa_id' => 9, 'codigo_modelo' => 'MOD-FIXSALE-01'],
            [
                'nombre_comercial' => 'Modelo Estándar POS',
                'marca_id' => $marca->id,
                'categoria_id' => $catLaptops->id,
                'familia_id' => $familia->id,
                'sucursal_id' => $sucursal->id,
                'estado' => true
            ]
        );

        // 5. Productos con SKU y nombre_variante
        $productosData = [
            [
                'nombre_variante' => 'Laptop Gamer Pro 15" i7 16GB',
                'sku' => 'PROD-001',
                'codigo_barras' => '750100000001',
                'precio_compra' => 650.00,
                'precio_venta' => 850.00,
                'stock' => 15,
                'categoria_id' => $catLaptops->id,
            ],
            [
                'nombre_variante' => 'Servicio Mantenimiento Especializado',
                'sku' => 'SERV-001',
                'codigo_barras' => '750100000002',
                'precio_compra' => 10.00,
                'precio_venta' => 45.00,
                'stock' => 999,
                'categoria_id' => $catServ->id,
            ],
            [
                'nombre_variante' => 'Impresora Térmica 80mm POS USB/Bluetooth',
                'sku' => 'PROD-002',
                'codigo_barras' => '750100000003',
                'precio_compra' => 75.00,
                'precio_venta' => 120.00,
                'stock' => 28,
                'categoria_id' => $catPos->id,
            ],
            [
                'nombre_variante' => 'Teclado Mecánico RGB Gamer Pro',
                'sku' => 'PROD-003',
                'codigo_barras' => '750100000004',
                'precio_compra' => 35.00,
                'precio_venta' => 65.00,
                'stock' => 40,
                'categoria_id' => $catAcc->id,
            ],
            [
                'nombre_variante' => 'Monitor LED 27" Full HD 144Hz',
                'sku' => 'PROD-004',
                'codigo_barras' => '750100000005',
                'precio_compra' => 140.00,
                'precio_venta' => 210.00,
                'stock' => 18,
                'categoria_id' => $catLaptops->id,
            ],
            [
                'nombre_variante' => 'Disco Duro SSD NVMe 1TB PCIe 4.0',
                'sku' => 'PROD-005',
                'codigo_barras' => '750100000006',
                'precio_compra' => 60.00,
                'precio_venta' => 95.00,
                'stock' => 35,
                'categoria_id' => $catAcc->id,
            ],
            [
                'nombre_variante' => 'Mouse Inalámbrico Ergonómico USB',
                'sku' => 'PROD-006',
                'codigo_barras' => '750100000007',
                'precio_compra' => 12.00,
                'precio_venta' => 25.00,
                'stock' => 50,
                'categoria_id' => $catAcc->id,
            ],
            [
                'nombre_variante' => 'Cable de Red Cat6 (Bobina 100m)',
                'sku' => 'PROD-007',
                'codigo_barras' => '750100000008',
                'precio_compra' => 40.00,
                'precio_venta' => 75.00,
                'stock' => 22,
                'categoria_id' => $catAcc->id,
            ],
        ];

        $productos = [];
        foreach ($productosData as $pData) {
            $pData['empresa_id'] = 9;
            $pData['sucursal_id'] = $sucursal->id;
            $pData['marca_id'] = $marca->id;
            $pData['familia_id'] = $familia->id;
            $pData['modelo_id'] = $modelo->id;
            $pData['estado'] = true;

            $productos[] = Producto::updateOrCreate(
                ['empresa_id' => 9, 'sku' => $pData['sku']],
                $pData
            );
        }

        // 6. Clientes
        $clientesData = [
            ['nombre' => 'Distribuidora Corporativa C.A.', 'telefono' => '04141112233', 'email' => 'compras@discorp.com'],
            ['nombre' => 'Consultoría & Soluciones Digitales', 'telefono' => '04122223344', 'email' => 'admin@csdigitales.com'],
            ['nombre' => 'María Alejandra Rodríguez', 'telefono' => '04243334455', 'email' => 'maria.rodriguez@gmail.com'],
            ['nombre' => 'Juan Carlos Gómez', 'telefono' => '04164445566', 'email' => 'jcgomez@hotmail.com'],
            ['nombre' => 'Tecnologías del Caribe S.A.', 'telefono' => '04145556677', 'email' => 'contacto@tecno-caribe.com'],
        ];

        $clientes = [];
        foreach ($clientesData as $cData) {
            $cData['empresa_id'] = 9;
            $cData['sucursal_id'] = $sucursal->id;
            $cData['direccion'] = 'Av. Principal #123';
            $cData['limite_credito'] = 1000.00;
            $cData['saldo_pendiente'] = 0.00;
            $cData['estado'] = true;

            $clientes[] = Cliente::updateOrCreate(
                ['empresa_id' => 9, 'email' => $cData['email']],
                $cData
            );
        }

        // 7. Caja Registradora Abierta
        $activeRegister = CashRegister::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (!$activeRegister) {
            $activeRegister = CashRegister::create([
                'user_id' => $user->id,
                'empresa_id' => 9,
                'sucursal_id' => $sucursal->id,
                'opened_at' => Carbon::now()->subHours(6),
                'opening_amount' => 150.00,
                'status' => 'open',
            ]);

            CashRegisterMovement::create([
                'cash_register_id' => $activeRegister->id,
                'user_id' => $user->id,
                'type' => 'inflow',
                'amount' => 50.00,
                'reason' => 'Fondo inicial para cambio en caja',
            ]);

            CashRegisterMovement::create([
                'cash_register_id' => $activeRegister->id,
                'user_id' => $user->id,
                'type' => 'outflow',
                'amount' => 15.00,
                'reason' => 'Compra de insumos de papelería',
            ]);
        }

        // 8. Ventas de los últimos 7 días
        $metodosPago = ['efectivo', 'dolar', 'transferencia', 'tarjeta', 'credito'];

        for ($daysAgo = 6; $daysAgo >= 0; $daysAgo--) {
            $date = Carbon::now()->subDays($daysAgo);
            $salesCount = rand(4, 7);

            for ($i = 0; $i < $salesCount; $i++) {
                $saleDate = (clone $date)->setHour(rand(8, 18))->setMinute(rand(0, 59));
                $cliente = $clientes[array_rand($clientes)];
                $metodo = $metodosPago[array_rand($metodosPago)];

                $selectedProducts = array_rand($productos, rand(1, 3));
                if (!is_array($selectedProducts)) {
                    $selectedProducts = [$selectedProducts];
                }

                $totalVenta = 0;
                $itemsToCreate = [];

                foreach ($selectedProducts as $pIdx) {
                    $prod = $productos[$pIdx];
                    $qty = rand(1, 3);
                    $subtotal = $prod->precio_venta * $qty;
                    $totalVenta += $subtotal;

                    $itemsToCreate[] = [
                        'producto_id' => $prod->id,
                        'nombre' => $prod->nombre_variante,
                        'cantidad' => $qty,
                        'precio_unitario' => $prod->precio_venta,
                        'subtotal' => $subtotal,
                    ];
                }

                $sale = Sale::create([
                    'empresa_id' => 9,
                    'sucursal_id' => $sucursal->id,
                    'user_id' => $user->id,
                    'cliente_id' => $cliente->id,
                    'cliente_nombre' => $cliente->nombre,
                    'cash_register_id' => $activeRegister->id,
                    'codigo_ticket' => 'VNT-' . Str::upper(Str::random(6)),
                    'subtotal' => $totalVenta,
                    'impuesto' => 0.00,
                    'descuento' => 0.00,
                    'total' => $totalVenta,
                    'monto_recibido' => $totalVenta,
                    'cambio' => 0.00,
                    'estado' => 'completada',
                    'metodo_pago' => $metodo,
                    'created_at' => $saleDate,
                    'updated_at' => $saleDate,
                ]);

                foreach ($itemsToCreate as $item) {
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'itemable_type' => Producto::class,
                        'itemable_id' => $item['producto_id'],
                        'concepto_tipo' => 'producto',
                        'nombre' => $item['nombre'],
                        'cantidad' => $item['cantidad'],
                        'precio_unitario' => $item['precio_unitario'],
                        'subtotal' => $item['subtotal'],
                        'created_at' => $saleDate,
                        'updated_at' => $saleDate,
                    ]);
                }

                SalePayment::create([
                    'sale_id' => $sale->id,
                    'metodo_pago' => $metodo,
                    'monto' => $totalVenta,
                    'referencia' => $metodo === 'transferencia' ? 'REF-' . rand(100000, 999999) : null,
                    'created_at' => $saleDate,
                    'updated_at' => $saleDate,
                ]);
            }
        }
    }
}
