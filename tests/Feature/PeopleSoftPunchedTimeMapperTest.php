<?php

namespace Tests\Feature;

use App\Models\BiotimeMarcaje;
use App\Models\PeoplesoftEmpleadoMapeo;
use App\Services\PeopleSoft\PunchedTimeMapper;
use App\Services\PeopleSoft\PunchedTimeMessageBuilder;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * El mapeo ZKTeco -> TL_PUNCH_INTFC es la parte que más caro sale equivocarse
 * (un PUNCH_TYPE mal traducido es una jornada mal pagada), así que se prueba
 * en frío, sin PeopleSoft de por medio.
 */
class PeopleSoftPunchedTimeMapperTest extends TestCase
{
    use RefreshDatabase;

    private function mapper(array $overrides = []): PunchedTimeMapper
    {
        return new PunchedTimeMapper(
            punchTypeMap: $overrides['map'] ?? config('peoplesoft.punch_type_map'),
            tcdIdDefault: $overrides['tcd'] ?? 'SHIGOTO01',
            tcdIdPorDispositivo: $overrides['por_sn'] ?? [],
            timezoneCode: $overrides['tz'] ?? 'CST',
        );
    }

    private function marcaje(array $overrides = []): BiotimeMarcaje
    {
        return new BiotimeMarcaje(array_merge([
            'emp_code' => '1001',
            'punch_time' => CarbonImmutable::parse('2026-09-01 08:03:11'),
            'punch_state' => '0',
            'punch_state_label' => 'Entrada',
            'dispositivo_sn' => 'SF-0001',
            'dispositivo_alias' => 'Puerta principal',
            'verify_type_label' => 'Rostro',
        ], $overrides));
    }

    private function mapeo(array $overrides = []): PeoplesoftEmpleadoMapeo
    {
        return new PeoplesoftEmpleadoMapeo(array_merge([
            'emp_code' => '1001',
            'badge_id' => 'BADGE0001',
            'emplid' => 'KU0012',
            'empl_rcd' => 0,
            'activo' => true,
        ], $overrides));
    }

    public function test_mapea_una_entrada_al_layout_de_peoplesoft(): void
    {
        $resultado = $this->mapper()->map($this->marcaje(), $this->mapeo());

        $this->assertTrue($resultado['ok']);

        $fila = $resultado['fila'];
        $this->assertSame('BADGE0001', $fila['BADGE_ID']);
        $this->assertSame('KU0012', $fila['EMPLID']);
        $this->assertSame(0, $fila['EMPL_RCD']);
        $this->assertSame('1', $fila['PUNCH_TYPE']);   // Entrada -> In
        $this->assertSame('SHIGOTO01', $fila['TCD_ID']);
        $this->assertSame('A', $fila['ADD_DELETE_IND']);
        $this->assertSame('CST', $fila['TIMEZONE']);
        // AUDIT_ACTN del registro va en blanco: Oracle lo reserva para su
        // propio procesamiento.
        $this->assertSame('', $fila['AUDIT_ACTN']);
    }

    public function test_la_fecha_usa_el_formato_de_las_interfaces_tcd(): void
    {
        $fila = $this->mapper()->map($this->marcaje(), $this->mapeo())['fila'];

        // CCYY-MM-DDTHH:MM:SS.ssssss±hhmm
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}[+-]\d{4}$/',
            $fila['PUNCH_DTTM'],
        );
        $this->assertStringStartsWith('2026-09-01T08:03:11', $fila['PUNCH_DTTM']);
    }

    /**
     * El modelo de ZKTeco y el de PeopleSoft no son equivalentes: en
     * PeopleSoft el regreso de comida es un "In", no un tipo propio.
     */
    public function test_traduce_cada_tipo_de_marcaje_de_zkteco(): void
    {
        $esperado = [
            '0' => '1', // Entrada             -> In
            '1' => '2', // Salida              -> Out
            '2' => '3', // Salida a descanso   -> Meal
            '3' => '1', // Regreso de descanso -> In
            '4' => '1', // Entrada horas extra -> In
            '5' => '2', // Salida horas extra  -> Out
        ];

        foreach ($esperado as $zkteco => $peoplesoft) {
            $fila = $this->mapper()->map($this->marcaje(['punch_state' => $zkteco]), $this->mapeo())['fila'];
            $this->assertSame($peoplesoft, $fila['PUNCH_TYPE'], "punch_state {$zkteco}");
        }
    }

    public function test_el_descanso_puede_configurarse_como_break_en_vez_de_meal(): void
    {
        $mapper = $this->mapper(['map' => ['2' => '4'] + config('peoplesoft.punch_type_map')]);

        $fila = $mapper->map($this->marcaje(['punch_state' => '2']), $this->mapeo())['fila'];

        $this->assertSame('4', $fila['PUNCH_TYPE']); // Break
    }

    public function test_omite_el_marcaje_si_no_hay_equivalencia_de_empleado(): void
    {
        $resultado = $this->mapper()->map($this->marcaje(), null);

        $this->assertFalse($resultado['ok']);
        $this->assertNull($resultado['fila']);
        $this->assertStringContainsString('Sin equivalencia', $resultado['motivo']);
    }

    public function test_omite_el_marcaje_si_la_equivalencia_no_trae_badge_ni_emplid(): void
    {
        $resultado = $this->mapper()->map($this->marcaje(), $this->mapeo(['badge_id' => null, 'emplid' => null]));

        $this->assertFalse($resultado['ok']);
        $this->assertStringContainsString('BADGE_ID ni EMPLID', $resultado['motivo']);
    }

    public function test_omite_el_marcaje_si_la_equivalencia_esta_desactivada(): void
    {
        $resultado = $this->mapper()->map($this->marcaje(), $this->mapeo(['activo' => false]));

        $this->assertFalse($resultado['ok']);
        $this->assertStringContainsString('desactivada', $resultado['motivo']);
    }

    public function test_omite_el_marcaje_si_el_tipo_no_tiene_equivalencia(): void
    {
        $mapper = $this->mapper(['map' => ['0' => '1']]);

        $resultado = $mapper->map($this->marcaje(['punch_state' => '9', 'punch_state_label' => 'Estado 9']), $this->mapeo());

        $this->assertFalse($resultado['ok']);
        $this->assertStringContainsString('sin equivalencia', $resultado['motivo']);
    }

    public function test_un_mapa_mal_configurado_no_produce_un_punch_type_invalido(): void
    {
        $mapper = $this->mapper(['map' => ['0' => '9']]); // 9 no existe en PeopleSoft

        $this->assertNull($mapper->punchType('0'));
    }

    public function test_cada_reloj_puede_tener_su_propio_tcd_id(): void
    {
        $mapper = $this->mapper(['por_sn' => ['SF-0002' => 'TCDPLANTA2']]);

        $this->assertSame('TCDPLANTA2', $mapper->tcdId('SF-0002'));
        $this->assertSame('SHIGOTO01', $mapper->tcdId('SF-0001'));
        $this->assertSame('SHIGOTO01', $mapper->tcdId(null));
    }

    public function test_recorta_los_campos_a_la_longitud_del_layout(): void
    {
        $fila = $this->mapper()->map(
            $this->marcaje(),
            $this->mapeo(['badge_id' => str_repeat('X', 40), 'emplid' => str_repeat('Y', 20)]),
        )['fila'];

        $this->assertSame(20, mb_strlen($fila['BADGE_ID']));
        $this->assertSame(11, mb_strlen($fila['EMPLID']));
        $this->assertLessThanOrEqual(254, mb_strlen($fila['TL_COMMENTS']));
    }

    public function test_el_mensaje_generado_es_xml_valido_con_la_forma_de_peoplesoft(): void
    {
        $fila = $this->mapper()->map($this->marcaje(), $this->mapeo())['fila'];

        $xml = (new PunchedTimeMessageBuilder)->build([$fila]);

        $doc = new \DOMDocument;
        $this->assertTrue($doc->loadXML($xml), 'El mensaje no es XML válido');

        $this->assertSame('PUNCHED_TIME_ADD', $doc->documentElement->nodeName);
        $this->assertSame(1, $doc->getElementsByTagName('FieldTypes')->length);
        $this->assertSame(1, $doc->getElementsByTagName('MsgData')->length);
        $this->assertSame(1, $doc->getElementsByTagName('Transaction')->length);

        // Cada registro lleva class="R" y cada transacción cierra con PSCAMA.
        $registro = $doc->getElementsByTagName('MsgData')->item(0)
            ->getElementsByTagName('TL_PUNCH_INTFC')->item(0);
        $this->assertSame('R', $registro->getAttribute('class'));

        $xpath = new \DOMXPath($doc);
        $this->assertSame('A', $xpath->query('//MsgData/Transaction/PSCAMA/AUDIT_ACTN')->item(0)->textContent);
        $this->assertSame('BADGE0001', $xpath->query('//MsgData/Transaction/TL_PUNCH_INTFC/BADGE_ID')->item(0)->textContent);
    }

    public function test_el_mensaje_lleva_una_transaccion_por_marcaje(): void
    {
        $filas = [
            $this->mapper()->map($this->marcaje(), $this->mapeo())['fila'],
            $this->mapper()->map($this->marcaje(['punch_state' => '1']), $this->mapeo())['fila'],
        ];

        $doc = new \DOMDocument;
        $doc->loadXML((new PunchedTimeMessageBuilder)->build($filas));

        $this->assertSame(2, $doc->getElementsByTagName('Transaction')->length);
    }
}
