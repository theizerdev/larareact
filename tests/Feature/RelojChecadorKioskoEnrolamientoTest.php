<?php

namespace Tests\Feature;

use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class RelojChecadorKioskoEnrolamientoTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Empresa $empresa;

    private Empleado $empleado;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->empresa = Empresa::create([
            'razon_social' => 'Smurfit Westrock Planta Test',
            'documento' => 'RFC-SMURFIT-TEST',
            'status' => true,
        ]);

        $this->user = User::factory()->create(['empresa_id' => $this->empresa->id]);
        $this->user->givePermissionTo(Permission::firstOrCreate(['name' => 'asistencia.kiosko', 'guard_name' => 'web']));

        $sucursal = \App\Models\Sucursal::create([
            'nombre' => 'Planta Principal',
            'empresa_id' => $this->empresa->id,
        ]);

        $depto = Departamento::create([
            'nombre' => 'Producción y Empaque',
            'empresa_id' => $this->empresa->id,
            'sucursal_id' => $sucursal->id,
            'user_id' => $this->user->id,
        ]);

        $this->empleado = Empleado::withoutTenant()->create([
            'nombres' => 'Carlos',
            'apellidos' => 'Ramírez López',
            'documento_identidad' => '880011',
            'codigo_acceso' => '880011',
            'departamento_id' => $depto->id,
            'genero' => 'M',
            'fecha_nacimiento' => '1992-08-15',
            'empresa_id' => $this->empresa->id,
            'status' => true,
            'enrolado_en' => null,
        ]);
    }

    private function fotoDataUri(): string
    {
        $img = imagecreatetruecolor(4, 4);
        ob_start();
        imagejpeg($img);

        return 'data:image/jpeg;base64,'.base64_encode((string) ob_get_clean());
    }

    public function test_buscar_empleado_detecta_si_no_esta_enrolado(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/admin/api/reloj-checador/buscar', [
                'query' => '880011',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('empleado.enrolado', false)
            ->assertJsonPath('empleado.enrolado_en', null)
            ->assertJsonPath('empleado.nombres', 'Carlos')
            ->assertJsonPath('empleado.apellidos', 'Ramírez López')
            ->assertJsonPath('empleado.numero', '880011')
            ->assertJsonPath('empleado.area', 'Producción y Empaque')
            ->assertJsonPath('empleado.genero', 'M')
            ->assertJsonPath('empleado.fecha_nacimiento', '1992-08-15')
            ->assertJsonPath('empleado.empresa_nombre', 'Smurfit Westrock Planta Test');
    }

    public function test_buscar_empleado_detecta_si_esta_enrolado(): void
    {
        $this->empleado->update([
            'enrolado_en' => now(),
            'foto_empleado' => '/storage/empleados/carlos.jpg',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/admin/api/reloj-checador/buscar', [
                'query' => '880011',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('empleado.enrolado', true);
        $this->assertNotNull($response->json('empleado.enrolado_en'));
    }

    public function test_enrolar_empleado_desde_kiosko_guarda_fotos_y_actualiza_estado(): void
    {
        $payload = [
            'empleado_id' => $this->empleado->id,
            'aviso_privacidad' => true,
            'foto_empleado' => $this->fotoDataUri(),
            'foto_empleado_2' => $this->fotoDataUri(),
            'genero' => 'M',
            'fecha_nacimiento' => '1992-08-15',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/admin/api/reloj-checador/enrolar', $payload);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('empleado.enrolado', true);
        $this->assertNotNull($response->json('empleado.enrolado_en'));

        $fresh = $this->empleado->fresh();
        $this->assertNotNull($fresh->enrolado_en);
        $this->assertSame('M', $fresh->genero);
        $this->assertSame('1992-08-15', $fresh->fecha_nacimiento->format('Y-m-d'));
        $this->assertNotEmpty($fresh->foto_empleado);
        $this->assertNotEmpty($fresh->foto_empleado_2);

        Storage::disk('public')->assertExists(str_replace('/storage/', '', $fresh->foto_empleado));
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $fresh->foto_empleado_2));
    }

    public function test_enrolar_empleado_requiere_aceptar_aviso_y_fotos_validas(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/admin/api/reloj-checador/enrolar', [
                'empleado_id' => $this->empleado->id,
                'aviso_privacidad' => false,
                'foto_empleado' => '',
                'foto_empleado_2' => '',
                'genero' => 'M',
                'fecha_nacimiento' => '1992-08-15',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['aviso_privacidad', 'foto_empleado', 'foto_empleado_2']);

        $this->assertNull($this->empleado->fresh()->enrolado_en);
    }

    public function test_enrolar_empleado_muestra_error_y_no_enrola_si_biotime_falla(): void
    {
        $this->mock(\App\Services\BioTimeEmpleadoPusher::class, function ($mock) {
            $mock->shouldReceive('enviar')
                ->once()
                ->andReturn([
                    'ok' => false,
                    'accion' => 'error',
                    'mensaje' => 'BioTime rechazó el cambio (HTTP 406): {"message":"El empleado Juan con el número de móvil +52-3310049036 ya está registrado, por favor intenta con otro número"}',
                    'reintentar' => false,
                ]);
        });

        $payload = [
            'empleado_id' => $this->empleado->id,
            'aviso_privacidad' => true,
            'foto_empleado' => $this->fotoDataUri(),
            'foto_empleado_2' => $this->fotoDataUri(),
            'genero' => 'M',
            'fecha_nacimiento' => '1992-08-15',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/admin/api/reloj-checador/enrolar', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['biotime']);

        $mensaje = $response->json('message');
        $this->assertStringContainsString('El empleado Juan con el número de móvil +52-3310049036 ya está registrado', $mensaje);
        $this->assertStringNotContainsString('{"message":', $mensaje);

        // El empleado NO debe quedar marcado como enrolado
        $this->assertNull($this->empleado->fresh()->enrolado_en);
    }
}
