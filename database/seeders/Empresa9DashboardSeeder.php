<?php

namespace Database\Seeders;

use App\Models\CashRegister;
use App\Models\CashRegisterMovement;
use App\Models\Categoria;
use App\Models\Cliente;
use App\Models\Empresa;
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

        // 1. Crear / Actualizar Empresa ID 9
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
                'api_key' => Empresa::generateApiKey(),
                'whatsapp_active' => true,
                'whatsapp_instance' => 'fixsale_instance_9',
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

        // 4. Categorías
        $catLaptops = Categoria::firstOrCreate(['empresa_id' => 9, 'nombre' => 'Laptops & Computadoras']);
        $catPos = Categoria::firstOrCreate(['empresa_id' => 9, 'nombre' => 'Punto de Venta & Impresoras']);
        $catAcc = Categoria::firstOrCreate(['empresa_id' => 9, 'nombre' => 'Accesorios & Periféricos']);
        $catServ = Categoria::firstOrCreate(['empresa_id' => 9, 'nombre' => 'Servicios Técnicos']);

        // 5. Productos
        $productosData = [
            [
                'nombre' => 'Laptop Gamer Pro 15" i7 16GB',
                'codigo' => 'PROD-001',
                'precio_compra' => 650.00,
                'precio_venta' => 850.00,
                'stock' => 15,
                'categoria_id' => $catLaptops->id,
            ],
            [
                'nombre' => 'Servicio Mantenimiento Especializado',
                'codigo' => 'SERV-001',
                'precio_compra' => 10.00,
                'precio_venta' => 45.00,
                'stock' => 999,
                'categoria_id' => $catServ->id,
            ],
            [
                'nombre' => 'Impresora Térmica 80mm POS USB/Bluetooth',
                'codigo' => 'PROD-002',
                'precio_compra' => 75.00,
                'precio_venta' => 120.00,
                'stock' => 28,
                'categoria_id' => $catPos->id,
            ],
            [
                'nombre' => 'Teclado Mecánico RGB Gamer Pro',
                'codigo' => 'PROD-003',
                'precio_compra' => 35.00,
                'precio_venta' => 65.00,
                'stock' => 40,
                'categoria_id' => $catAcc->id,
            ],
            [
                'nombre' => 'Monitor LED 27" Full HD 144Hz',
                'codigo' => 'PROD-004',
                'precio_compra' => 140.00,
                'precio_venta' => 210.00,
                'stock' => 18,
                'categoria_id' => $catLaptops->id,
            ],
            [
                'nombre' => 'Disco Duro SSD NVMe 1TB PCIe 4.0',
                'codigo' => 'PROD-005',
                'precio_compra' => 60.00,
                'precio_venta' => 95.00,
                'stock' => 35,
                'categoria_id' => $catAcc->id,
            ],
            [
                'nombre' => 'Mouse Inalámbrico Ergonómico USB',
                'codigo' => 'PROD-006',
                'precio_compra' => 12.00,
                'precio_venta' => 25.00,
                'stock' => 50,
                'categoria_id' => $catAcc->id,
            ],
            [
                'nombre' => 'Cable de Red Cat6 (Bobina 100m)',
                'codigo' => 'PROD-007',
                'precio_compra' => 40.00,
                'precio_venta' => 75.00,
                'stock' => 22,
                'categoria_id' => $catAcc->id,
            ],
        ];

        $productos = [];
        foreach ($productosData as $pData) {
            $pData['empresa_id'] = 9;
            $productos[] = Producto::updateOrCreate(
                ['empresa_id' => 9, 'codigo' => $pData['codigo']],
                $pData
            );
        }

        // 6. Clientes
        $clientesData = [
            ['nombre' => 'Distribuidora Corporativa C.A.', 'cedula_rif' => 'J-30987654-1', 'telefono' => '04141112233', 'email' => 'compras@discorp.com'],
            ['nombre' => 'Consultoría & Soluciones Digitales', 'cedula_rif' => 'J-40123456-2', 'telefono' => '04122223344', 'email' => 'admin@csdigitales.com'],
            ['nombre' => 'María Alejandra Rodríguez', 'cedula_rif' => 'V-18765432', 'telefono' => '04243334455', 'email' => 'maria.rodriguez@gmail.com'],
            ['nombre' => 'Juan Carlos Gómez', 'cedula_rif' => 'V-15987654', 'telefono' => '04164445566', 'email' => 'jcgomez@hotmail.com'],
            ['nombre' => 'Tecnologías del Caribe S.A.', 'cedula_rif' => 'J-50987123-4', 'telefono' => '04145556677', 'email' => 'contacto@tecno-caribe.com'],
        ];

        $clientes = [];
        foreach ($clientesData as $cData) {
            $cData['empresa_id'] = 9;
            $clientes[] = Cliente::updateOrCreate(
                ['empresa_id' => 9, 'cedula_rif' => $cData['cedula_rif']],
                $cData
            );
        }

        // 7. Caja Registradora Abierta para el Usuario
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
            $salesCount = rand(4, 7); // Entre 4 y 7 ventas por día

            for ($i = 0; $i < $salesCount; $i++) {
                $saleDate = (clone $date)->setHour(rand(8, 18))->setMinute(rand(0, 59));
                $cliente = $clientes[array_rand($clientes)];
                $metodo = $metodosPago[array_rand($metodosPago)];

                // Seleccionar entre 1 y 3 productos al azar
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
                        'nombre' => $prod->nombre,
                        'cantidad' => $qty,
                        'precio_unitario' => $prod->precio_venta,
                        'subtotal' => $subtotal,
                    ];
                }

                // Crear Venta
                $sale = Sale::create([
                    'empresa_id' => 9,
                    'sucursal_id' => $sucursal->id,
                    'user_id' => $user->id,
                    'cliente_id' => $cliente->id,
                    'cash_register_id' => $activeRegister->id,
                    'folio' => 'VNT-' . Str::upper(Str::random(6)),
                    'subtotal' => $totalVenta,
                    'impuesto' => 0.00,
                    'descuento' => 0.00,
                    'total' => $totalVenta,
                    'estado' => 'completada',
                    'metodo_pago' => $metodo,
                    'created_at' => $saleDate,
                    'updated_at' => $saleDate,
                ]);

                // Crear SaleItems
                foreach ($itemsToCreate as $item) {
                    SaleItem::create(array_merge($item, [
                        'sale_id' => $sale->id,
                        'created_at' => $saleDate,
                        'updated_at' => $saleDate,
                    ]));
                }

                // Crear SalePayment
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
