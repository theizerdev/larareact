<?php

namespace Tests\Unit;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\StockAlertPdfService;
use Tests\TestCase;

class StockAlertPdfServiceTest extends TestCase
{
    public function test_it_generates_valid_pdf_grouped_by_brands(): void
    {
        $service = new StockAlertPdfService();

        $empresa = new Empresa([
            'nombre_comercial' => 'FixSale Test Store',
            'razon_social' => 'FixSale Soluciones S.A. de C.V.',
            'documento' => 'XAXX010101000',
            'direccion' => 'Av. Reforma 100',
            'telefono' => '5551234567',
            'email' => 'inventario@fixsale.test',
        ]);

        $sucursal = new Sucursal([
            'nombre' => 'Sucursal Central',
            'direccion' => 'Av. Reforma 100',
        ]);

        $user = new User([
            'name' => 'Administrador Inventario',
        ]);

        $brandGroups = [
            [
                'key' => 'apple',
                'marca' => 'Apple',
                'marca_id' => 1,
                'sin_marca' => false,
                'total_productos' => 2,
                'agotados' => 1,
                'criticos' => 1,
                'bajos' => 0,
                'alertas' => 0,
                'unidades_faltantes' => 9,
                'costo_reposicion' => 4500.00,
                'products' => [
                    [
                        'id' => 101,
                        'nombre' => 'Pantalla OLED iPhone 15 Pro',
                        'sku' => 'APL-15P-OLED',
                        'codigo_barras' => '750000101',
                        'categoria' => 'Pantallas',
                        'stock' => 0,
                        'stock_minimo' => 5,
                        'faltante' => 5,
                        'severidad' => 'agotado',
                        'ratio' => 0,
                    ],
                    [
                        'id' => 102,
                        'nombre' => 'Batería iPhone 14 Original',
                        'sku' => 'APL-14-BAT',
                        'codigo_barras' => null,
                        'categoria' => 'Baterías',
                        'stock' => 1,
                        'stock_minimo' => 5,
                        'faltante' => 4,
                        'severidad' => 'critico',
                        'ratio' => 20,
                    ],
                ],
            ],
            [
                'key' => '__sin_marca__',
                'marca' => 'Sin Marca',
                'marca_id' => null,
                'sin_marca' => true,
                'total_productos' => 1,
                'agotados' => 0,
                'criticos' => 0,
                'bajos' => 1,
                'alertas' => 0,
                'unidades_faltantes' => 3,
                'costo_reposicion' => 150.00,
                'products' => [
                    [
                        'id' => 103,
                        'nombre' => 'Alcohol Isopropílico 500ml',
                        'sku' => 'INS-ALC-500',
                        'codigo_barras' => null,
                        'categoria' => 'Insumos',
                        'stock' => 2,
                        'stock_minimo' => 5,
                        'faltante' => 3,
                        'severidad' => 'bajo',
                        'ratio' => 40,
                    ],
                ],
            ],
        ];

        $resumen = [
            'agotado' => 1,
            'critico' => 1,
            'bajo' => 1,
            'alerta' => 0,
            'total' => 3,
            'total_marcas' => 2,
            'unidades_faltantes' => 12,
            'costo_estimado_reposicion' => 4650.00,
        ];

        $binary = $service->generate($brandGroups, $resumen, $empresa, $sucursal, $user, [
            'currencySymbol' => '$',
            'generatedAt' => '26/10/2026 19:20',
            'folio' => 'ALT-20261026-1920',
            'filterLabel' => 'Catálogo Completo en Alerta',
        ]);

        $this->assertStringStartsWith('%PDF-1.4', $binary);
        $this->assertStringContainsString('%%EOF', $binary);
        $this->assertStringContainsString('/Type /Catalog', $binary);
        $this->assertStringContainsString('/Type /Pages', $binary);
        $this->assertGreaterThan(2000, strlen($binary));
    }

    public function test_it_generates_valid_pdf_when_no_products_are_in_alert(): void
    {
        $service = new StockAlertPdfService();

        $binary = $service->generate([], [
            'agotado' => 0,
            'critico' => 0,
            'bajo' => 0,
            'alerta' => 0,
            'total' => 0,
            'total_marcas' => 0,
            'unidades_faltantes' => 0,
            'costo_estimado_reposicion' => 0,
        ]);

        $this->assertStringStartsWith('%PDF-1.4', $binary);
        $this->assertStringContainsString('%%EOF', $binary);
    }
}
