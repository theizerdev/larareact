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
        // Fixtures: el servicio necesita empresa + sucursal reales y un usuario
        // autenticado (para el user_id de los departamentos que crea al vuelo).
        $empresa = Empresa::create([
            'razon_social' => "Driscoll's, Inc.",
            'documento' => 'IMPORT-TEST-1',
            'status' => true,
        ]);
        $sucursal = Sucursal::create([
            'nombre' => 'Cooler Purépero',
            'empresa_id' => $empresa->id,
            'status' => true,
        ]);
        $this->actingAs(User::factory()->create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
        ]));

        $service = new EmpleadoImportService();

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

    public function test_verify_password_endpoint_requires_valid_credentials()
    {
        // La ruta exige permission:empleados.import|empleados.create.
        Permission::findOrCreate('empleados.import', 'web');
        $user = User::factory()->create([
            'password' => Hash::make('secret123')
        ]);
        $user->givePermissionTo('empleados.import');

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
