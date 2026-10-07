<?php

namespace Tests\Feature;

use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\EmpleadoImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class EmpleadoImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_service_executes_successfully()
    {
        $service = new EmpleadoImportService();

        // El servicio registra los departamentos nuevos a nombre del usuario 1.
        User::factory()->create();

        $empresa = Empresa::create(['razon_social' => 'Driscolls', 'documento' => 'DRI-000001', 'status' => true]);
        $sucursal = Sucursal::create(['empresa_id' => $empresa->id, 'nombre' => 'Principal', 'status' => true]);

        $records = [
            [
                'documento_identidad' => '999111',
                'nombres' => 'Juan Carlos',
                'apellidos' => 'Perez Garcia',
                'correo' => 'juan.perez@example.com',
                'telefono' => '4361174564',
                'departamento' => 'Empaque',
                'empresa' => 'Driscolls',
                'vehiculos' => [
                    [
                        'tipo_vehiculo' => 'Automovil',
                        'marca' => 'Nissan',
                        'placa' => 'ABC1234',
                    ]
                ]
            ]
        ];

        $result = $service->executeImport($records, $empresa->id, $sucursal->id, 'update');

        $this->assertTrue($result['success']);
        $this->assertEquals(1, $result['created']);

        $this->assertDatabaseHas('empleados', [
            'documento_identidad' => '999111',
            'nombres' => 'Juan Carlos',
            'apellidos' => 'Perez Garcia',
            'telefono' => '4361174564',
        ]);

        $empleado = Empleado::where('documento_identidad', '999111')->first();
        $this->assertNotNull($empleado);
        $this->assertCount(1, $empleado->vehiculos);
        $this->assertEquals('ABC1234', $empleado->vehiculos[0]->placa);
        $this->assertEquals(2026, $empleado->vehiculos[0]->year);
        $this->assertEquals('N/A', $empleado->vehiculos[0]->modelo);
    }

    public function test_an_access_code_already_used_by_another_company_gets_a_fresh_one_instead_of_failing(): void
    {
        User::factory()->create();   // el servicio registra lo nuevo a nombre del usuario 1
        $a = Empresa::create(['razon_social' => 'A', 'documento' => 'A-1', 'status' => true]);
        $sa = Sucursal::create(['empresa_id' => $a->id, 'nombre' => 'A', 'status' => true]);
        $b = Empresa::create(['razon_social' => 'B', 'documento' => 'B-1', 'status' => true]);
        $sb = Sucursal::create(['empresa_id' => $b->id, 'nombre' => 'B', 'status' => true]);
        $registro = fn (string $doc) => [[
            'documento_identidad' => $doc, 'codigo_acceso' => '10100001', 'nombres' => 'Ana', 'apellidos' => 'Pérez',
            'departamento' => 'Empaque', 'empresa' => '', 'curp' => '', 'correo' => '', 'telefono' => '',
            'tarjeta_acceso_1' => '0', 'tarjeta_acceso_2' => '0', 'tarjeta_acceso_3' => '0', 'vehiculos' => [],
        ]];
        $service = new EmpleadoImportService();
        $this->assertTrue($service->executeImport($registro('DOC-A'), $a->id, $sa->id, 'update')['success']);

        // Como en producción: quien importa es un usuario de la empresa B, y el scope sólo le deja ver lo suyo.
        $this->actingAs(User::factory()->create(['empresa_id' => $b->id, 'sucursal_id' => $sb->id]));
        $resultado = $service->executeImport($registro('DOC-B'), $b->id, $sb->id, 'update');

        $this->assertTrue($resultado['success'], $resultado['message'] ?? '');
        $b1 = Empleado::withoutTenant()->where('documento_identidad', 'DOC-B')->first();
        $this->assertNotNull($b1);
        $this->assertNotSame('10100001', $b1->codigo_acceso, 'el código ya era de otra empresa: se le asignó uno nuevo');
        $this->assertSame('10100001', Empleado::withoutTenant()->where('documento_identidad', 'DOC-A')->value('codigo_acceso'));
    }

    public function test_an_employee_number_already_registered_elsewhere_fails_without_showing_sql(): void
    {
        User::factory()->create();
        $a = Empresa::create(['razon_social' => 'A', 'documento' => 'A-1', 'status' => true]);
        $sa = Sucursal::create(['empresa_id' => $a->id, 'nombre' => 'A', 'status' => true]);
        $b = Empresa::create(['razon_social' => 'B', 'documento' => 'B-1', 'status' => true]);
        $sb = Sucursal::create(['empresa_id' => $b->id, 'nombre' => 'B', 'status' => true]);
        $registro = [[
            'documento_identidad' => 'MISMO-1', 'codigo_acceso' => '', 'nombres' => 'Ana', 'apellidos' => 'Pérez',
            'departamento' => 'Empaque', 'empresa' => '', 'curp' => '', 'correo' => '', 'telefono' => '',
            'tarjeta_acceso_1' => '0', 'tarjeta_acceso_2' => '0', 'tarjeta_acceso_3' => '0', 'vehiculos' => [],
        ]];
        $service = new EmpleadoImportService();
        $this->assertTrue($service->executeImport($registro, $a->id, $sa->id, 'update')['success']);

        $this->actingAs(User::factory()->create(['empresa_id' => $b->id, 'sucursal_id' => $sb->id]));
        $resultado = $service->executeImport($registro, $b->id, $sb->id, 'update');

        $this->assertFalse($resultado['success']);
        $this->assertStringNotContainsString('SQLSTATE', $resultado['message']);
        $this->assertSame(1, Empleado::withoutTenant()->where('documento_identidad', 'MISMO-1')->count());
    }

    public function test_verify_password_endpoint_requires_valid_credentials()
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123')
        ]);
        $user->givePermissionTo(Permission::findOrCreate('empleados.import', 'web'));

        $responseInvalid = $this->actingAs($user)->postJson('/admin/empleados/import-verify-password', [
            'password' => 'wrongpass'
        ]);

        $responseInvalid->assertStatus(422);

        $responseValid = $this->actingAs($user)->postJson('/admin/empleados/import-verify-password', [
            'password' => 'secret123'
        ]);

        $responseValid->assertStatus(200);
        $responseValid->assertJson(['success' => true]);
    }
}
