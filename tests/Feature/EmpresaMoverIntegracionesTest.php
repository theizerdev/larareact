<?php

namespace Tests\Feature;

use App\Models\Empresa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmpresaMoverIntegracionesTest extends TestCase
{
    use RefreshDatabase;

    private function origen(): Empresa
    {
        return Empresa::create([
            'razon_social' => 'Origen', 'documento' => 'ORI-1',
            'whatsapp_api_url' => 'http://wa.test:3000', 'whatsapp_instance' => 'shigoto',
            'whatsapp_phone' => '5215500000000', 'whatsapp_api_key' => 'clave-origen', 'whatsapp_active' => true,
            'control_acceso_base_url' => 'https://acceso.test', 'control_acceso_app_token' => 'app', 'control_acceso_user_token' => 'usr', 'control_acceso_active' => true,
            'biotime_base_url' => 'http://bio.test:8081', 'biotime_username' => 'Sistemas', 'biotime_password' => 'pwd', 'biotime_active' => true,
            'mapbox_active' => true,
        ]);
    }

    private function destino(array $extra = []): Empresa
    {
        return Empresa::create(['razon_social' => 'Destino', 'documento' => 'DES-1', ...$extra]);
    }

    public function test_simulacro_no_escribe_nada(): void
    {
        $origen = $this->origen();
        $destino = $this->destino();

        $this->artisan('empresa:mover-integraciones', ['--desde' => $origen->id, '--hacia' => $destino->id])
            ->assertExitCode(0);

        $this->assertTrue($origen->fresh()->biotime_active);
        $this->assertFalse((bool) $destino->fresh()->biotime_active);
        $this->assertNull($destino->fresh()->biotime_base_url);
    }

    public function test_mueve_las_integraciones_activas_y_apaga_el_origen(): void
    {
        $origen = $this->origen();
        $destino = $this->destino();

        $this->artisan('empresa:mover-integraciones', ['--desde' => $origen->id, '--hacia' => $destino->id, '--aplicar' => true])
            ->assertExitCode(0);

        $destino->refresh();
        $origen->refresh();

        $this->assertTrue($destino->biotime_active);
        $this->assertSame('http://bio.test:8081', $destino->biotime_base_url);
        $this->assertSame('pwd', $destino->biotime_password);
        $this->assertTrue($destino->whatsapp_active);
        $this->assertSame('http://wa.test:3000', $destino->whatsapp_api_url);
        $this->assertSame('clave-origen', $destino->whatsapp_api_key);
        $this->assertTrue($destino->control_acceso_active);
        $this->assertSame('https://acceso.test', $destino->control_acceso_base_url);

        $this->assertFalse($origen->biotime_active);
        $this->assertNull($origen->biotime_base_url);
        $this->assertNull($origen->biotime_password);
        $this->assertFalse($origen->whatsapp_active);
        $this->assertNull($origen->whatsapp_api_url);
        $this->assertNotSame('clave-origen', $origen->whatsapp_api_key, 'la llave vieja no debe seguir en el origen');
        $this->assertFalse($origen->control_acceso_active);
        $this->assertNull($origen->control_acceso_app_token);
    }

    public function test_mapbox_activo_sin_llave_no_se_mueve(): void
    {
        $origen = $this->origen();
        $destino = $this->destino();

        $this->artisan('empresa:mover-integraciones', ['--desde' => $origen->id, '--hacia' => $destino->id, '--aplicar' => true]);

        $this->assertFalse((bool) $destino->fresh()->mapbox_active);
        $this->assertTrue((bool) $origen->fresh()->mapbox_active);
    }

    public function test_misma_conexion_en_ambas_solo_apaga_el_origen(): void
    {
        $origen = $this->origen();
        $destino = $this->destino([
            'biotime_base_url' => 'http://bio.test:8081', 'biotime_username' => 'Sistemas',
            'biotime_password' => 'pwd', 'biotime_active' => true,
        ]);

        $this->artisan('empresa:mover-integraciones', ['--desde' => $origen->id, '--hacia' => $destino->id, '--solo' => 'biotime', '--aplicar' => true])
            ->assertExitCode(0);

        $this->assertTrue($destino->fresh()->biotime_active);
        $this->assertFalse($origen->fresh()->biotime_active);
    }

    public function test_conflicto_con_otra_configuracion_no_pisa_sin_forzar(): void
    {
        $origen = $this->origen();
        $destino = $this->destino([
            'biotime_base_url' => 'http://otro-servidor:8081', 'biotime_username' => 'Otro',
            'biotime_password' => 'otra', 'biotime_active' => true,
        ]);

        $this->artisan('empresa:mover-integraciones', ['--desde' => $origen->id, '--hacia' => $destino->id, '--solo' => 'biotime', '--aplicar' => true])
            ->assertExitCode(1);

        $this->assertSame('http://otro-servidor:8081', $destino->fresh()->biotime_base_url);
        $this->assertTrue($origen->fresh()->biotime_active);

        $this->artisan('empresa:mover-integraciones', ['--desde' => $origen->id, '--hacia' => $destino->id, '--solo' => 'biotime', '--forzar' => true, '--aplicar' => true])
            ->assertExitCode(0);

        $this->assertSame('http://bio.test:8081', $destino->fresh()->biotime_base_url);
    }

    public function test_rechaza_mismo_origen_y_destino(): void
    {
        $origen = $this->origen();

        $this->artisan('empresa:mover-integraciones', ['--desde' => $origen->id, '--hacia' => $origen->id, '--aplicar' => true])
            ->assertExitCode(1);
    }
}
