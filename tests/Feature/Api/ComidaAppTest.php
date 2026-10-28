<?php

namespace Tests\Feature\Api;

use App\Models\AsistenciaMarcaje;
use App\Models\ConfiguracionAsistencia;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\OpcionComida;
use App\Models\Proveedor;
use App\Models\User;
use App\Services\RegistroMarcajeService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * INICIO COMIDA desde la app: mismas opciones y mismas reglas que el kiosko
 * web (costo, proveedor y subsidio salen del servidor), sin perder lo que se
 * eligió sin conexión aunque la opción cambie antes de que llegue.
 */
class ComidaAppTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Empleado $empleado;

    private OpcionComida $menu;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        $this->travelTo(Carbon::parse('2026-10-22 13:00:00', config('app.timezone')));

        $empresa = Empresa::create(['razon_social' => 'Smurfit Test', 'documento' => 'DOC-COMAPP', 'status' => true]);
        $this->user = User::factory()->create(['empresa_id' => $empresa->id, 'status' => 'activo']);
        $this->empleado = new Empleado;
        $this->empleado->forceFill([
            'nombres' => 'Ana', 'apellidos' => 'Comedor',
            'documento_identidad' => '800', 'codigo_acceso' => '00000800',
            'empresa_id' => $empresa->id, 'user_id' => $this->user->id,
            'status' => true, 'permite_app_movil' => true,
        ])->save();

        $proveedor = Proveedor::create([
            'empresa_id' => $empresa->id,
            'razon_social' => 'Comedores SA',
            'nombre_comercial' => 'Comedores',
            'documento_identidad' => 'COM010101AAA',
            'status' => 'activo',
        ]);
        $this->menu = OpcionComida::create([
            'empresa_id' => $empresa->id,
            'proveedor_id' => $proveedor->id,
            'nombre' => 'Menú del día',
            'tipo' => 'almuerzo',
            'costo_empleado' => 15,
            'costo_empresa' => 45,
            'hora_inicio' => '12:00',
            'hora_fin' => '15:00',
            'status' => true,
        ]);

        $this->actingAs($this->user, 'sanctum');
    }

    private function salirAComer(array $extra)
    {
        return $this->postJson('/api/reloj-checador/registrar', $extra + [
            'empleado_id' => $this->empleado->id,
            'tipo_marcaje' => 'salida_comida',
        ]);
    }

    public function test_la_configuracion_trae_las_opciones_del_kiosko(): void
    {
        $this->getJson('/api/reloj-checador/configuracion')
            ->assertOk()
            ->assertJsonPath('opciones_comida.0.id', $this->menu->id)
            ->assertJsonPath('opciones_comida.0.nombre', 'Menú del día')
            ->assertJsonPath('opciones_comida.0.costo', 15)
            ->assertJsonPath('opciones_comida.0.disponible_ahora', true);
    }

    public function test_guarda_costo_proveedor_y_subsidio_del_servidor(): void
    {
        $this->salirAComer(['opcion_comida_id' => $this->menu->id, 'comida_costo' => 0])
            ->assertOk()
            ->assertJsonPath('marcaje.comida_tipo', 'Menú del día');

        $marcaje = AsistenciaMarcaje::sole();
        $this->assertSame('Menú del día', $marcaje->comida_tipo);
        $this->assertSame('15.00', $marcaje->comida_costo);
        $this->assertSame($this->menu->id, $marcaje->opcion_comida_id);
        $this->assertSame($this->menu->proveedor_id, $marcaje->proveedor_id);
        $this->assertSame('45.00', $marcaje->comida_costo_empresa);
        $this->assertSame('30.00', $marcaje->comida_subsidio);
    }

    public function test_sin_consumo(): void
    {
        $this->salirAComer(['comida_opcion' => 'sin_consumo', 'no_adquirio_alimento' => true])->assertOk();

        $marcaje = AsistenciaMarcaje::sole();
        $this->assertSame(RegistroMarcajeService::COMIDA_SIN_CONSUMO, $marcaje->comida_tipo);
        $this->assertSame('0.00', $marcaje->comida_costo);
        $this->assertNull($marcaje->opcion_comida_id);
        $this->assertStringContainsString('no adquirió alimento', $marcaje->observaciones);
    }

    public function test_en_linea_rechaza_una_opcion_desactivada(): void
    {
        $this->menu->update(['status' => false]);

        $this->salirAComer(['opcion_comida_id' => $this->menu->id])->assertStatus(422);

        $this->assertSame(0, AsistenciaMarcaje::count());
    }

    public function test_desde_la_cola_respeta_la_opcion_desactivada_despues(): void
    {
        $this->menu->update(['status' => false]);

        $this->salirAComer(['opcion_comida_id' => $this->menu->id, 'enviado_desde_cola' => true])->assertOk();

        $marcaje = AsistenciaMarcaje::sole();
        $this->assertSame('Menú del día', $marcaje->comida_tipo);
        $this->assertSame($this->menu->id, $marcaje->opcion_comida_id);
    }

    public function test_desde_la_cola_no_pierde_el_marcaje_si_la_opcion_ya_no_existe(): void
    {
        $id = $this->menu->id;
        $this->menu->delete();

        $this->salirAComer([
            'opcion_comida_id' => $id,
            'comida_nombre' => 'Menú del día',
            'enviado_desde_cola' => true,
        ])->assertOk();

        $marcaje = AsistenciaMarcaje::sole();
        $this->assertNull($marcaje->comida_tipo);
        $this->assertStringContainsString('(Menú del día) ya no existe', $marcaje->observaciones);
    }

    public function test_sin_opciones_del_comedor_usa_el_indice_de_la_configuracion(): void
    {
        $this->menu->update(['status' => false]);
        ConfiguracionAsistencia::create([
            'empresa_id' => $this->empleado->empresa_id,
            'opciones_comida' => [['nombre' => 'Desayuno', 'costo' => 25], ['nombre' => 'Dieta', 'costo' => 50]],
        ]);

        $this->salirAComer(['comida_opcion' => 1])->assertOk();

        $marcaje = AsistenciaMarcaje::sole();
        $this->assertSame('Dieta', $marcaje->comida_tipo);
        $this->assertSame('50.00', $marcaje->comida_costo);
    }

    public function test_la_opcion_se_ignora_en_otros_marcajes(): void
    {
        $this->salirAComer(['tipo_marcaje' => 'entrada', 'opcion_comida_id' => $this->menu->id])->assertOk();

        $this->assertNull(AsistenciaMarcaje::sole()->comida_tipo);
    }
}
