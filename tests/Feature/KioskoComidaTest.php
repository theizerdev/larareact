<?php

namespace Tests\Feature;

use App\Models\AsistenciaMarcaje;
use App\Models\ConfiguracionAsistencia;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * INICIO COMIDA en el kiosko: el colaborador elige uno de los tipos de comida
 * configurados y el marcaje guarda el nombre y el costo de la configuración.
 */
class KioskoComidaTest extends TestCase
{
    use RefreshDatabase;

    private function escenario(): array
    {
        $empresa = Empresa::create(['razon_social' => 'Emp Comida', 'documento' => 'DOC-COM']);
        $empleado = new Empleado();
        $empleado->forceFill(['nombres' => 'N', 'apellidos' => 'A', 'documento_identidad' => 'DC1', 'empresa_id' => $empresa->id, 'status' => true])->save();
        // Registrar en el kiosko exige asistencia.kiosko (auditoría 2026-10-14).
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo(Permission::firstOrCreate(['name' => 'asistencia.kiosko', 'guard_name' => 'web']));

        return [$empresa, $empleado, $user];
    }

    public function test_guarda_el_tipo_y_costo_configurados(): void
    {
        [$empresa, $empleado, $user] = $this->escenario();
        ConfiguracionAsistencia::create([
            'empresa_id' => $empresa->id,
            'opciones_comida' => [
                ['nombre' => 'Desayuno', 'costo' => 25],
                ['nombre' => 'Menú del día', 'costo' => 45.5],
                ['nombre' => 'Dieta', 'costo' => 50],
            ],
        ]);

        $this->actingAs($user)->postJson('/admin/api/reloj-checador/registrar', [
            'empleado_id' => $empleado->id,
            'tipo_marcaje' => 'salida_comida',
            'comida_opcion' => 1,
            // Un costo enviado desde el navegador no se toma en cuenta.
            'comida_costo' => 0,
        ])->assertOk()->assertJson(['success' => true]);

        $marcaje = AsistenciaMarcaje::withoutGlobalScopes()->where('empleado_id', $empleado->id)->sole();
        $this->assertSame('Menú del día', $marcaje->comida_tipo);
        $this->assertSame('45.50', $marcaje->comida_costo);
    }

    public function test_sin_configuracion_usa_las_opciones_por_defecto(): void
    {
        [, $empleado, $user] = $this->escenario();

        $this->actingAs($user)->postJson('/admin/api/reloj-checador/registrar', [
            'empleado_id' => $empleado->id,
            'tipo_marcaje' => 'salida_comida',
            'comida_opcion' => 2,
        ])->assertOk();

        $marcaje = AsistenciaMarcaje::withoutGlobalScopes()->where('empleado_id', $empleado->id)->sole();
        $this->assertSame('Cena', $marcaje->comida_tipo);
        $this->assertSame('0.00', $marcaje->comida_costo);
    }

    public function test_rechaza_una_opcion_que_no_existe(): void
    {
        [, $empleado, $user] = $this->escenario();

        $this->actingAs($user)->postJson('/admin/api/reloj-checador/registrar', [
            'empleado_id' => $empleado->id,
            'tipo_marcaje' => 'salida_comida',
            'comida_opcion' => 7,
        ])->assertStatus(422);

        $this->assertSame(0, AsistenciaMarcaje::withoutGlobalScopes()->count());
    }

    public function test_la_opcion_se_ignora_en_otros_marcajes(): void
    {
        [, $empleado, $user] = $this->escenario();

        $this->actingAs($user)->postJson('/admin/api/reloj-checador/registrar', [
            'empleado_id' => $empleado->id,
            'tipo_marcaje' => 'entrada',
            'comida_opcion' => 0,
        ])->assertOk();

        $this->assertNull(AsistenciaMarcaje::withoutGlobalScopes()->sole()->comida_tipo);
    }
}
