<?php

namespace Tests\Feature\Api;

use App\Models\AsistenciaMarcaje;
use App\Models\ConfiguracionAsistencia;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Evidencia que manda la app con cada marcaje: no duplicar reenvíos, conservar
 * la hora real de lo capturado sin conexión (dentro de un plazo) y dejar
 * señalado lo que RH debe revisar (GPS falso, sin ubicación).
 */
class MarcajeEvidenciaAppTest extends TestCase
{
    use RefreshDatabase;

    private const UUID = '3f2b8c4e-9a1d-4c7e-8b2f-6d5a4e3c2b1a';

    private User $user;

    private Empleado $empleado;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        $this->travelTo(Carbon::parse('2026-10-19 10:00:00', config('app.timezone')));

        $empresa = Empresa::create(['razon_social' => 'Smurfit Test', 'documento' => 'DOC-EV', 'status' => true]);
        $this->user = User::factory()->create(['empresa_id' => $empresa->id, 'status' => 'activo']);
        $this->empleado = new Empleado();
        $this->empleado->forceFill([
            'nombres' => 'Ana', 'apellidos' => 'Piso',
            'documento_identidad' => '700', 'codigo_acceso' => '00000700',
            'empresa_id' => $empresa->id, 'user_id' => $this->user->id,
            'status' => true, 'permite_app_movil' => true,
        ])->save();

        $this->actingAs($this->user, 'sanctum');
    }

    private function registrar(array $extra = [])
    {
        return $this->postJson('/api/reloj-checador/registrar', $extra + [
            'empleado_id' => $this->empleado->id,
            'tipo_marcaje' => 'entrada',
        ]);
    }

    private function configurar(array $attrs): void
    {
        ConfiguracionAsistencia::create($attrs + ['empresa_id' => $this->empleado->empresa_id]);
    }

    public function test_reenvio_con_el_mismo_uuid_horas_despues_no_duplica(): void
    {
        $this->registrar(['uuid_cliente' => self::UUID])->assertOk();

        // Fuera de la ventana de doble toque: sólo el uuid lo reconoce.
        $this->travel(3)->hours();
        $this->registrar(['uuid_cliente' => self::UUID, 'enviado_desde_cola' => true])
            ->assertOk()
            ->assertJson(['success' => true, 'marcaje' => ['hora' => '10:00:00']]);

        $this->assertSame(1, AsistenciaMarcaje::count());
    }

    public function test_desde_la_cola_conserva_la_hora_en_que_se_marco(): void
    {
        $this->travel(2)->hours(); // llega a las 12:00

        $this->registrar([
            'uuid_cliente' => self::UUID,
            'enviado_desde_cola' => true,
            'fecha_hora_dispositivo' => Carbon::parse('2026-10-19 07:58:00', config('app.timezone'))->utc()->toIso8601String(),
        ])->assertOk()->assertJson(['marcaje' => ['hora' => '07:58:00']]);

        $m = AsistenciaMarcaje::first();
        $this->assertSame('2026-10-19 07:58:00', $m->fecha_hora->format('Y-m-d H:i:s'));
        $this->assertTrue($m->enviado_desde_cola);
        $this->assertNull($m->observaciones);
    }

    public function test_hora_de_cola_fuera_de_rango_usa_la_de_recepcion_y_lo_anota(): void
    {
        $this->registrar([
            'enviado_desde_cola' => true,
            'fecha_hora_dispositivo' => now()->subHours(30)->utc()->toIso8601String(),
        ])->assertOk();

        $m = AsistenciaMarcaje::first();
        $this->assertSame('10:00:00', $m->fecha_hora->format('H:i:s'));
        $this->assertStringContainsString('fuera de rango', $m->observaciones);
        $this->assertNotNull($m->fecha_hora_dispositivo);
    }

    public function test_en_linea_manda_la_hora_del_servidor(): void
    {
        $this->registrar([
            'fecha_hora_dispositivo' => now()->subHours(2)->utc()->toIso8601String(),
        ])->assertOk();

        $this->assertSame('10:00:00', AsistenciaMarcaje::first()->fecha_hora->format('H:i:s'));
    }

    public function test_guarda_la_calidad_de_la_ubicacion_y_senala_gps_falso(): void
    {
        $this->registrar([
            'latitud' => 25.6866142,
            'longitud' => -100.3161126,
            'precision_metros' => 8.5,
            'ubicacion_simulada' => true,
            'ubicacion_estado' => 'ok',
            'ubicacion_fecha_hora' => now()->utc()->toIso8601String(),
        ])->assertOk();

        $m = AsistenciaMarcaje::first();
        $this->assertSame('8.5', $m->precision_metros);
        $this->assertTrue($m->ubicacion_simulada);
        $this->assertSame('ok', $m->ubicacion_estado);
        $this->assertStringContainsString('GPS falso', $m->observaciones);
    }

    public function test_sin_ubicacion_queda_senalado_con_el_motivo(): void
    {
        $this->registrar(['ubicacion_estado' => 'gpsApagado', 'observaciones' => 'Llegué por la puerta 3'])
            ->assertOk();

        $this->assertSame(
            'Llegué por la puerta 3 - Sin ubicación: GPS apagado.',
            AsistenciaMarcaje::first()->observaciones,
        );
    }

    public function test_si_la_empresa_exige_ubicacion_rechaza_marcar_sin_ella(): void
    {
        $this->configurar(['requiere_ubicacion_marcaje' => true]);

        $this->registrar(['ubicacion_estado' => 'sinSenal'])
            ->assertStatus(422)
            ->assertJson(['success' => false]);
        $this->assertSame(0, AsistenciaMarcaje::count());

        $this->registrar(['latitud' => 25.68, 'longitud' => -100.31])->assertOk();
        $this->assertSame(1, AsistenciaMarcaje::count());
    }

    public function test_lo_capturado_sin_conexion_se_acepta_aunque_se_exija_ubicacion(): void
    {
        $this->configurar(['requiere_ubicacion_marcaje' => true]);

        $this->registrar(['enviado_desde_cola' => true, 'ubicacion_estado' => 'sinSenal'])->assertOk();

        $this->assertStringContainsString('sin señal de GPS', AsistenciaMarcaje::first()->observaciones);
    }

    public function test_la_configuracion_de_la_app_incluye_si_se_exige_ubicacion(): void
    {
        $this->user->forceFill(['empresa_id' => $this->empleado->empresa_id])->save();
        $this->configurar(['requiere_ubicacion_marcaje' => true]);

        $this->getJson('/api/reloj-checador/configuracion')
            ->assertOk()
            ->assertJson(['requiere_ubicacion_marcaje' => true]);
    }

    public function test_rechaza_valores_de_evidencia_invalidos(): void
    {
        $this->registrar(['uuid_cliente' => 'no-es-uuid'])->assertStatus(422);
        $this->registrar(['ubicacion_estado' => 'inventado'])->assertStatus(422);
        $this->assertSame(0, AsistenciaMarcaje::count());
    }
}
