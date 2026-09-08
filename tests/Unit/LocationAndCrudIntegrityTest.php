<?php

namespace Tests\Unit;

use App\Http\Requests\EmpresaRequest;
use App\Http\Requests\ProductorRequest;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Productor;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LocationAndCrudIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear rol para evitar excepciones de permisos
        Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
    }

    /**
     * QA-MAP-01: Validación de coordenadas vacías o malformadas.
     * Cadenas vacías o "null" deben normalizarse a null para evitar fallos SQL.
     */
    public function test_prepare_for_validation_sanitizes_empty_coordinates_to_null()
    {
        $request = new EmpresaRequest();
        $request->merge([
            'latitud' => '',
            'longitud' => 'null',
        ]);

        // Invocar prepareForValidation mediante reflexión
        $reflection = new \ReflectionClass($request);
        $method = $reflection->getMethod('prepareForValidation');
        $method->setAccessible(true);
        $method->invoke($request);

        $this->assertNull($request->latitud);
        $this->assertNull($request->longitud);
    }

    /**
     * QA-MAP-02: Coordenadas fuera de rango deben ser rechazadas.
     */
    public function test_coordinates_out_of_bounds_fail_validation()
    {
        $rules = (new EmpresaRequest())->rules();

        // Latitud fuera de [-90, 90]
        $validator1 = Validator::make([
            'razon_social' => 'Empresa Test',
            'documento' => 'DOC12345',
            'latitud' => 120.5,
            'longitud' => -99.1332,
        ], $rules);

        $this->assertTrue($validator1->fails());
        $this->assertArrayHasKey('latitud', $validator1->errors()->toArray());

        // Longitud fuera de [-180, 180]
        $validator2 = Validator::make([
            'razon_social' => 'Empresa Test',
            'documento' => 'DOC12345',
            'latitud' => 19.4326,
            'longitud' => -250.0,
        ], $rules);

        $this->assertTrue($validator2->fails());
        $this->assertArrayHasKey('longitud', $validator2->errors()->toArray());

        // Coordenadas válidas
        $validator3 = Validator::make([
            'razon_social' => 'Empresa Test',
            'documento' => 'DOC12345',
            'latitud' => 19.4326,
            'longitud' => -99.1332,
        ], $rules);

        $this->assertFalse($validator3->fails());
    }

    /**
     * QA-CRUD-01: Atomicidad transaccional - Reversión total ante fallo.
     */
    public function test_atomic_transaction_rolls_back_on_failure()
    {
        $initialCount = Empresa::count();

        try {
            DB::transaction(function () {
                $empresa = new Empresa([
                    'razon_social' => 'Empresa Fallida',
                    'documento' => 'DOC_FAIL_1',
                    'latitud' => 19.4326,
                    'longitud' => -99.1332,
                ]);
                $empresa->save();

                // Simular fallo forzado inmediatamente después de guardar
                throw new \Exception('Simulated database write error');
            });
        } catch (\Exception $e) {
            // Error capturado
        }

        // El registro no debe existir en la base de datos
        $this->assertEquals($initialCount, Empresa::count());
        $this->assertDatabaseMissing('empresas', ['documento' => 'DOC_FAIL_1']);
    }

    /**
     * QA-CRUD-02: Erradicación del fallo silencioso - Respuestas con error deben poblar error bag.
     */
    public function test_controller_error_response_populates_error_bag_and_avoids_false_positives()
    {
        $user = User::factory()->create();
        $user->assignRole('super-admin');
        $this->actingAs($user);

        // Enviar payload inválido o forzar error
        $response = $this->post('/admin/empresas', [
            'razon_social' => '', // Inválido (requerido)
            'documento' => '',
        ]);

        // Debe haber errores en la sesión para que Inertia active onError y no onSuccess
        $response->assertSessionHasErrors(['razon_social', 'documento']);
    }

    /**
     * QA-CRUD-03: Sincronización bidireccional y preservación en ProductorRequest.
     */
    public function test_productor_request_sanitizes_coordinates_properly()
    {
        $request = new ProductorRequest();
        $request->merge([
            'latitud' => '   ',
            'longitud' => 'NULL',
        ]);

        $reflection = new \ReflectionClass($request);
        $method = $reflection->getMethod('prepareForValidation');
        $method->setAccessible(true);
        $method->invoke($request);

        $this->assertNull($request->latitud);
        $this->assertNull($request->longitud);
    }
}
