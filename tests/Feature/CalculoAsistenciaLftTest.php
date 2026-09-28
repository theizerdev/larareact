<?php

namespace Tests\Feature;

use App\Models\AsistenciaMarcaje;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\TurnoLaboral;
use App\Services\CalculoAsistenciaLftService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Las horas que salen de los marcajes, que es de donde se alimentan el
 * resumen diario de la prenómina y los semáforos LFT del panel.
 *
 * Carbon 3 devuelve diffInMinutes con signo, así que restar en el orden
 * equivocado da horas negativas sin que nada truene. Estas pruebas cuidan
 * justo eso.
 */
class CalculoAsistenciaLftTest extends TestCase
{
    use RefreshDatabase;

    private Empleado $empleado;

    protected function setUp(): void
    {
        parent::setUp();

        $empresa = Empresa::create(['razon_social' => 'Calculadora, S.A.', 'documento' => 'CALC-1']);

        $turno = TurnoLaboral::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Diurno',
            'hora_entrada' => '08:00:00',
            'hora_salida' => '17:00:00',
            'horas_diarias_ley' => 8.00,
            'dias_laborables' => [1, 2, 3, 4, 5],
        ]);

        $this->empleado = Empleado::create([
            'nombres' => 'Ana',
            'apellidos' => 'López',
            'documento_identidad' => 'DOC-CALC',
            'empresa_id' => $empresa->id,
            'turno_laboral_id' => $turno->id,
            'status' => true,
        ]);
    }

    public function test_el_resumen_diario_calcula_horas_retardo_y_comida_en_positivo(): void
    {
        // Lunes: llega 8:20 (retardo de 20 con tolerancia de 10), come una
        // hora y sale 18:20. Son 10h brutas, 9h netas: 8 ordinarias y 1 extra.
        $this->marcaje('entrada', '2026-04-06 08:20:00');
        $this->marcaje('salida_comida', '2026-04-06 13:00:00');
        $this->marcaje('entrada_comida', '2026-04-06 14:00:00');
        $this->marcaje('salida', '2026-04-06 18:20:00');

        $resumen = app(CalculoAsistenciaLftService::class)->calcularHorasDiarias($this->empleado, '2026-04-06');

        $this->assertEquals(8.00, (float) $resumen->horas_ordinarias);
        $this->assertEquals(1.00, (float) $resumen->horas_extra_diarias);
        $this->assertSame(20, (int) $resumen->minutos_retraso);
        $this->assertSame(60, (int) $resumen->minutos_descanso_reales);
    }

    public function test_los_semaforos_semanales_suman_horas_en_positivo_y_descuentan_la_comida(): void
    {
        // Lunes a viernes, 8:00 a 19:00 con una hora de comida: 10h netas por
        // día, 40 ordinarias y 10 extra en la semana.
        foreach (['06', '07', '08', '09', '10'] as $dia) {
            $this->marcaje('entrada', "2026-04-{$dia} 08:00:00");
            $this->marcaje('salida_comida', "2026-04-{$dia} 13:00:00");
            $this->marcaje('entrada_comida', "2026-04-{$dia} 14:00:00");
            $this->marcaje('salida', "2026-04-{$dia} 19:00:00");
        }

        $semana = app(CalculoAsistenciaLftService::class)->calcularSemaforosSemanales($this->empleado, '2026-04-08');

        $this->assertEquals(40.00, $semana['horas']['normales']);
        $this->assertEquals(10.00, $semana['horas']['extra_brutas']);
        $this->assertEquals(50.00, $semana['horas']['totales']);
    }

    private function marcaje(string $tipo, string $fechaHora): void
    {
        AsistenciaMarcaje::create([
            'empresa_id' => $this->empleado->empresa_id,
            'empleado_id' => $this->empleado->id,
            'tipo_marcaje' => $tipo,
            'fecha_hora' => $fechaHora,
            'origen' => 'kiosko',
        ]);
    }
}
