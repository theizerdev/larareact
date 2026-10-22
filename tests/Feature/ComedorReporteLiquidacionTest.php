<?php

namespace Tests\Feature;

use App\Models\AsistenciaMarcaje;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\OpcionComida;
use App\Models\Proveedor;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\ComedorLiquidacionExportService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ComedorReporteLiquidacionTest extends TestCase
{
    use RefreshDatabase;

    private function escenario(): array
    {
        $empresa = Empresa::create([
            'razon_social' => 'Smurfit Westrock México S.A. de C.V.',
            'documento' => 'SMU-MEX-001',
        ]);

        $sucursal = Sucursal::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Planta Querétaro',
            'status' => true,
        ]);

        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
        ]);

        $user->givePermissionTo(
            Permission::firstOrCreate(['name' => 'asistencia.configuracion', 'guard_name' => 'web']),
            Permission::firstOrCreate(['name' => 'asistencia.view', 'guard_name' => 'web']),
            Permission::firstOrCreate(['name' => 'asistencia.kiosko', 'guard_name' => 'web'])
        );

        $proveedor = Proveedor::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'razon_social' => 'Sodexo México S.A. de C.V.',
            'nombre_comercial' => 'Sodexo Servicios de Comedor',
            'documento_identidad' => 'SOD9203158R2',
            'status' => 'activo',
        ]);

        $opcionComida = OpcionComida::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'proveedor_id' => $proveedor->id,
            'nombre' => 'Comida Corrida Mexicana',
            'tipo' => 'almuerzo',
            'costo_empleado' => 15.00,
            'costo_empresa' => 45.00,
            'status' => true,
        ]);

        $empleado = Empleado::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'nombres' => 'Juan',
            'apellidos' => 'Pérez Gómez',
            'documento_identidad' => 'EMP-1001',
            'codigo_acceso' => '1001',
            'status' => 'activo',
        ]);

        return [$empresa, $sucursal, $user, $proveedor, $opcionComida, $empleado];
    }

    public function test_kiosko_registra_marcaje_de_comida_con_proveedor_y_costos_de_liquidacion(): void
    {
        [$empresa, $sucursal, $user, $proveedor, $opcionComida, $empleado] = $this->escenario();

        $response = $this->actingAs($user)->postJson('/admin/api/reloj-checador/registrar', [
            'empleado_id' => $empleado->id,
            'codigo_empleado' => $empleado->codigo_acceso,
            'tipo_marcaje' => 'salida_comida',
            'comida_opcion' => $opcionComida->id,
            'origen' => 'kiosko',
        ]);

        $response->assertOk()->assertJson(['success' => true]);

        $this->assertDatabaseHas('asistencia_marcajes', [
            'empleado_id' => $empleado->id,
            'tipo_marcaje' => 'salida_comida',
            'opcion_comida_id' => $opcionComida->id,
            'proveedor_id' => $proveedor->id,
            'comida_tipo' => 'Comida Corrida Mexicana',
            'comida_costo' => 15.00,
            'comida_costo_empresa' => 45.00,
            'comida_subsidio' => 30.00,
        ]);
    }

    public function test_puede_exportar_reporte_liquidacion_en_excel_para_todos_los_proveedores(): void
    {
        [$empresa, $sucursal, $user, $proveedor, $opcionComida, $empleado] = $this->escenario();

        AsistenciaMarcaje::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'empleado_id' => $empleado->id,
            'tipo_marcaje' => 'salida_comida',
            'fecha_hora' => Carbon::now(),
            'origen' => 'kiosko',
            'comida_tipo' => $opcionComida->nombre,
            'comida_costo' => 15.00,
            'opcion_comida_id' => $opcionComida->id,
            'proveedor_id' => $proveedor->id,
            'comida_costo_empresa' => 45.00,
            'comida_subsidio' => 30.00,
        ]);

        $response = $this->actingAs($user)->get('/admin/asistencia/comedor/reporte/liquidacion');

        $response->assertOk();
        $this->assertTrue(
            str_contains(
                (string) $response->headers->get('content-type'),
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        );
        $this->assertTrue(
            str_contains(
                (string) $response->headers->get('content-disposition'),
                'attachment; filename=liquidacion_comedor_'
            )
        );
    }

    public function test_puede_exportar_reporte_liquidacion_filtrando_por_proveedor_especifico(): void
    {
        [$empresa, $sucursal, $user, $proveedor, $opcionComida, $empleado] = $this->escenario();

        $response = $this->actingAs($user)->get("/admin/asistencia/comedor/reporte/liquidacion?proveedor_id={$proveedor->id}");

        $response->assertOk();
        $this->assertTrue(
            str_contains(
                (string) $response->headers->get('content-disposition'),
                "liquidacion_comedor_prov_{$proveedor->id}_"
            )
        );
    }

    public function test_soporta_parametros_completos_de_corte_fecha_proveedor_y_sucursal(): void
    {
        [$empresa, $sucursal, $user, $proveedor, $opcionComida, $empleado] = $this->escenario();

        $response = $this->actingAs($user)->get("/admin/asistencia/comedor/reporte/liquidacion?fecha_fin=2026-10-22&fecha_inicio=2026-10-01&proveedor_id={$proveedor->id}&sucursal_id={$sucursal->id}");

        $response->assertOk();
    }

    public function test_servicio_liquidacion_calcula_kpis_y_genera_dos_hojas(): void
    {
        [$empresa, $sucursal, , $proveedor, $opcionComida, $empleado] = $this->escenario();

        AsistenciaMarcaje::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'empleado_id' => $empleado->id,
            'tipo_marcaje' => 'salida_comida',
            'fecha_hora' => Carbon::now(),
            'origen' => 'kiosko',
            'comida_tipo' => $opcionComida->nombre,
            'comida_costo' => 15.00,
            'opcion_comida_id' => $opcionComida->id,
            'proveedor_id' => $proveedor->id,
            'comida_costo_empresa' => 45.00,
            'comida_subsidio' => 30.00,
        ]);

        $service = app(ComedorLiquidacionExportService::class);
        $spreadsheet = $service->generarSpreadsheet([], $empresa, $sucursal);

        $this->assertCount(2, $spreadsheet->getAllSheets());
        $this->assertEquals('Resumen y Liquidación', $spreadsheet->getSheet(0)->getTitle());
        $this->assertEquals('Detalle de Consumos', $spreadsheet->getSheet(1)->getTitle());

        // Verificar que en el resumen se incluyeron los datos
        $sheetResumen = $spreadsheet->getSheet(0);
        $this->assertEquals('SMURFIT WESTROCK MÉXICO - CONCILIACIÓN DE COMEDOR', $sheetResumen->getCell('A1')->getValue());
        $this->assertEquals(1, $sheetResumen->getCell('D5')->getValue()); // Total Raciones
        $this->assertEquals(45.00, $sheetResumen->getCell('E5')->getValue()); // Factura Proveedor
        $this->assertEquals(15.00, $sheetResumen->getCell('F5')->getValue()); // Descuento Empleado
        $this->assertEquals(30.00, $sheetResumen->getCell('G5')->getValue()); // Subsidio Empresa
    }
}
