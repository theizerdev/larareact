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
        // Fixtures con FK válidas (empresa 1 / sucursal 1).
        \Illuminate\Support\Facades\DB::table('empresas')->insert([
            'id' => 1, 'razon_social' => 'Smurfit Westrock', 'nombre_comercial' => 'Smurfit Westrock',
            'documento' => 'SMU-0001', 'created_at' => now(), 'updated_at' => now(),
        ]);
        \Illuminate\Support\Facades\DB::table('sucursales')->insert([
            'id' => 1, 'empresa_id' => 1, 'nombre' => 'Planta', 'created_at' => now(), 'updated_at' => now(),
        ]);

        User::factory()->create(); // el servicio asigna user_id = 1 a los catálogos que crea

        $service = new EmpleadoImportService();

        $records = [
            [
                'documento_identidad' => '999111',
                'nombres' => 'Juan Carlos',
                'apellidos' => 'Perez Garcia',
                'correo' => 'juan.perez@example.com',
                'telefono' => '3300000000',
                'departamento' => 'Empaque',
                'empresa' => 'Smurfit Westrock',
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
            'telefono' => '3300000000',
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
        // La ruta exige empleados.import o empleados.create.
        $user->givePermissionTo(\Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'empleados.create', 'guard_name' => 'web']));

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
