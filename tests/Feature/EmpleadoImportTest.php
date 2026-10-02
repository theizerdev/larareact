<?php

namespace Tests\Feature;

use App\Models\Empleado;
use App\Models\User;
use App\Services\EmpleadoImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EmpleadoImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_service_executes_successfully()
    {
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

        $result = $service->executeImport($records, 1, 1, 'update');

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
        $user = User::factory()->create([
            'password' => Hash::make('secret123')
        ]);

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
