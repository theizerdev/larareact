<?php

namespace Tests\Feature;

use App\Models\BiotimeMarcaje;
use App\Models\Empresa;
use App\Models\PeoplesoftEmpleadoMapeo;
use App\Models\PeoplesoftExportacion;
use App\Services\PeopleSoft\PeopleSoftClient;
use App\Services\PeopleSoft\PeopleSoftExportService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PeopleSoftExportTest extends TestCase
{
    use RefreshDatabase;

    private function empresa(): Empresa
    {
        return Empresa::create([
            'razon_social' => 'ACME',
            'documento' => 'ACME-1',
            'biotime_active' => true,
        ]);
    }

    private function marcaje(Empresa $empresa, array $overrides = []): BiotimeMarcaje
    {
        static $seq = 0;
        $seq++;

        return BiotimeMarcaje::create(array_merge([
            'empresa_id' => $empresa->id,
            'biotime_id' => $seq,
            'emp_code' => '1001',
            'punch_time' => CarbonImmutable::parse('2026-09-01 08:00:00'),
            'punch_state' => '0',
            'punch_state_label' => 'Entrada',
            'dispositivo_sn' => 'SF-0001',
        ], $overrides));
    }

    private function mapeo(Empresa $empresa, array $overrides = []): PeoplesoftEmpleadoMapeo
    {
        return PeoplesoftEmpleadoMapeo::create(array_merge([
            'empresa_id' => $empresa->id,
            'emp_code' => '1001',
            'badge_id' => 'BADGE0001',
            'emplid' => 'KU0012',
            'empl_rcd' => 0,
            'activo' => true,
        ], $overrides));
    }

    private function ventana(): array
    {
        return [CarbonImmutable::parse('2026-09-01 00:00:00'), CarbonImmutable::parse('2026-09-02 00:00:00')];
    }

    /* ------------------------------------------------------------------ */
    /*  Seguridad: lo más importante de todo el módulo */
    /* ------------------------------------------------------------------ */

    public function test_el_cliente_se_niega_a_enviar_si_la_integracion_esta_desactivada(): void
    {
        config(['peoplesoft.enabled' => false]);
        Http::fake();

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/desactivada/');

        PeopleSoftClient::fromConfig()->send('PUNCHED_TIME_ADD.VERSION_1', '<PUNCHED_TIME_ADD/>');
    }

    public function test_no_sale_ni_una_peticion_en_modo_simulacion(): void
    {
        config(['peoplesoft.enabled' => false, 'peoplesoft.dry_run' => true]);
        Http::fake();

        $empresa = $this->empresa();
        $this->mapeo($empresa);
        $this->marcaje($empresa);

        [$desde, $hasta] = $this->ventana();
        $resumen = PeopleSoftExportService::make()->exportar($empresa, $desde, $hasta, enviar: true);

        Http::assertNothingSent();
        $this->assertSame(1, $resumen['simulados']);
        $this->assertSame(0, $resumen['enviados']);
        $this->assertNotEmpty($resumen['mensajes']);
    }

    public function test_faltantes_explica_por_que_no_se_puede_enviar(): void
    {
        config([
            'peoplesoft.enabled' => false,
            'peoplesoft.gateway_url' => null,
            'peoplesoft.node_to' => null,
        ]);

        $faltantes = PeopleSoftClient::fromConfig()->faltantes();

        $this->assertCount(3, $faltantes);
    }

    /* ------------------------------------------------------------------ */
    /*  Comportamiento del exportador */
    /* ------------------------------------------------------------------ */

    public function test_registra_el_payload_generado_en_la_bitacora(): void
    {
        $empresa = $this->empresa();
        $this->mapeo($empresa);
        $marcaje = $this->marcaje($empresa);

        [$desde, $hasta] = $this->ventana();
        PeopleSoftExportService::make()->exportar($empresa, $desde, $hasta);

        $exportacion = PeoplesoftExportacion::first();

        $this->assertNotNull($exportacion);
        $this->assertSame(PeoplesoftExportacion::ESTADO_SIMULADO, $exportacion->estado);
        $this->assertSame($marcaje->id, $exportacion->biotime_marcaje_id);
        $this->assertSame('BADGE0001', $exportacion->badge_id);
        $this->assertSame('1', $exportacion->punch_type);
        $this->assertSame('BADGE0001', $exportacion->payload['BADGE_ID']);
        $this->assertNotNull($exportacion->lote_uuid);
    }

    public function test_los_marcajes_sin_equivalencia_quedan_como_omitidos_con_su_motivo(): void
    {
        $empresa = $this->empresa();
        $this->marcaje($empresa, ['emp_code' => '9999']); // sin mapeo

        [$desde, $hasta] = $this->ventana();
        $resumen = PeopleSoftExportService::make()->exportar($empresa, $desde, $hasta);

        $this->assertSame(1, $resumen['omitidos']);
        $this->assertSame(0, $resumen['mapeados']);

        $exportacion = PeoplesoftExportacion::first();
        $this->assertSame(PeoplesoftExportacion::ESTADO_OMITIDO, $exportacion->estado);
        $this->assertStringContainsString('9999', $exportacion->motivo);
        $this->assertNull($exportacion->payload);
    }

    public function test_reejecutar_la_corrida_no_duplica_filas(): void
    {
        $empresa = $this->empresa();
        $this->mapeo($empresa);
        $this->marcaje($empresa);

        [$desde, $hasta] = $this->ventana();
        $service = PeopleSoftExportService::make();
        $service->exportar($empresa, $desde, $hasta);
        $service->exportar($empresa, $desde, $hasta);

        $this->assertSame(1, PeoplesoftExportacion::count());
    }

    public function test_no_reenvia_un_marcaje_ya_enviado(): void
    {
        $empresa = $this->empresa();
        $this->mapeo($empresa);
        $marcaje = $this->marcaje($empresa);

        PeoplesoftExportacion::create([
            'empresa_id' => $empresa->id,
            'biotime_marcaje_id' => $marcaje->id,
            'estado' => PeoplesoftExportacion::ESTADO_ENVIADO,
            'enviado_at' => now(),
        ]);

        [$desde, $hasta] = $this->ventana();
        $resumen = PeopleSoftExportService::make()->exportar($empresa, $desde, $hasta);

        $this->assertSame(1, $resumen['ya_enviados']);
        $this->assertSame(0, $resumen['mapeados']);
        $this->assertSame(0, $resumen['simulados']);
    }

    public function test_solo_considera_los_marcajes_de_la_ventana(): void
    {
        $empresa = $this->empresa();
        $this->mapeo($empresa);
        $this->marcaje($empresa, ['punch_time' => CarbonImmutable::parse('2026-08-20 08:00:00')]);
        $this->marcaje($empresa, ['punch_time' => CarbonImmutable::parse('2026-09-01 09:00:00')]);

        [$desde, $hasta] = $this->ventana();
        $resumen = PeopleSoftExportService::make()->exportar($empresa, $desde, $hasta);

        $this->assertSame(1, $resumen['revisados']);
    }

    public function test_parte_los_envios_en_lotes(): void
    {
        config(['peoplesoft.batch_size' => 2]);

        $empresa = $this->empresa();
        $this->mapeo($empresa);
        for ($i = 0; $i < 5; $i++) {
            $this->marcaje($empresa, ['punch_time' => CarbonImmutable::parse('2026-09-01 08:00:00')->addMinutes($i)]);
        }

        [$desde, $hasta] = $this->ventana();
        $resumen = PeopleSoftExportService::make()->exportar($empresa, $desde, $hasta);

        $this->assertCount(3, $resumen['lotes']); // 2 + 2 + 1
        $this->assertSame(5, $resumen['simulados']);
    }

    /* ------------------------------------------------------------------ */
    /*  Envío real (simulado con Http::fake) */
    /* ------------------------------------------------------------------ */

    private function configurarEnvioReal(): void
    {
        config([
            'peoplesoft.enabled' => true,
            'peoplesoft.dry_run' => false,
            'peoplesoft.gateway_url' => 'https://peoplesoft.test',
            'peoplesoft.node_to' => 'PSFT_HR',
            'peoplesoft.node_from' => 'SHIGOTO_TCD',
        ]);
    }

    public function test_envia_el_sobre_ibrequest_al_listening_connector(): void
    {
        $this->configurarEnvioReal();
        Http::fake(['*' => Http::response('<IBResponse type="success"/>', 200)]);

        $empresa = $this->empresa();
        $this->mapeo($empresa);
        $this->marcaje($empresa);

        [$desde, $hasta] = $this->ventana();
        $resumen = PeopleSoftExportService::make()->exportar($empresa, $desde, $hasta, enviar: true);

        $this->assertSame(1, $resumen['enviados']);
        $this->assertTrue($resumen['ok']);

        Http::assertSent(function ($request) {
            $cuerpo = $request->body();

            return str_contains($request->url(), '/PSIGW/HttpListeningConnector')
                && str_contains($cuerpo, '<IBRequest>')
                && str_contains($cuerpo, '<ExternalOperationName>PUNCHED_TIME_ADD.VERSION_1</ExternalOperationName>')
                && str_contains($cuerpo, '<OperationType>async</OperationType>')
                && str_contains($cuerpo, '<RequestingNode>SHIGOTO_TCD</RequestingNode>')
                && str_contains($cuerpo, '<DestinationNode>PSFT_HR</DestinationNode>')
                && str_contains($cuerpo, 'CDATA')
                && str_contains($cuerpo, 'TL_PUNCH_INTFC');
        });

        $exportacion = PeoplesoftExportacion::first();
        $this->assertSame(PeoplesoftExportacion::ESTADO_ENVIADO, $exportacion->estado);
        $this->assertNotNull($exportacion->enviado_at);
    }

    public function test_un_acuse_de_error_del_broker_no_se_da_por_enviado(): void
    {
        $this->configurarEnvioReal();
        // El gateway puede contestar 200 y aun así rechazar el mensaje.
        Http::fake(['*' => Http::response('<IBResponse type="error"><DefaultTitle>Integration Broker</DefaultTitle></IBResponse>', 200)]);

        $empresa = $this->empresa();
        $this->mapeo($empresa);
        $this->marcaje($empresa);

        [$desde, $hasta] = $this->ventana();
        $resumen = PeopleSoftExportService::make()->exportar($empresa, $desde, $hasta, enviar: true);

        $this->assertSame(0, $resumen['enviados']);
        $this->assertSame(1, $resumen['errores']);
        $this->assertFalse($resumen['ok']);
        $this->assertSame(PeoplesoftExportacion::ESTADO_ERROR, PeoplesoftExportacion::first()->estado);
    }

    public function test_un_error_http_deja_el_lote_reintentable(): void
    {
        $this->configurarEnvioReal();

        // Primero falla, en el reintento pasa. (Un segundo Http::fake() no
        // reemplaza al primero: Laravel los acumula y gana el más antiguo.)
        Http::fake(['*' => Http::sequence()
            ->push('boom', 500)
            ->push('<IBResponse type="success"/>', 200)]);

        $empresa = $this->empresa();
        $this->mapeo($empresa);
        $this->marcaje($empresa);

        [$desde, $hasta] = $this->ventana();
        $service = PeopleSoftExportService::make();
        $resumen = $service->exportar($empresa, $desde, $hasta, enviar: true);

        $this->assertSame(1, $resumen['errores']);
        $this->assertSame(PeoplesoftExportacion::ESTADO_ERROR, PeoplesoftExportacion::first()->estado);

        // Y en la siguiente corrida se vuelve a intentar, no se da por perdido.
        $reintento = $service->exportar($empresa, $desde, $hasta, enviar: true);

        $this->assertSame(1, $reintento['enviados']);
        $this->assertSame(1, PeoplesoftExportacion::count());
    }

    public function test_el_comando_corre_en_simulacion_por_defecto(): void
    {
        config(['peoplesoft.enabled' => false]);
        Http::fake();

        $empresa = $this->empresa();
        $this->mapeo($empresa);
        $this->marcaje($empresa);

        $this->artisan('peoplesoft:exportar-marcajes', [
            '--empresa' => $empresa->id,
            '--desde' => '2026-09-01 00:00:00',
            '--hasta' => '2026-09-02 00:00:00',
        ])->assertSuccessful();

        Http::assertNothingSent();
        $this->assertSame(PeoplesoftExportacion::ESTADO_SIMULADO, PeoplesoftExportacion::first()->estado);
    }
}
