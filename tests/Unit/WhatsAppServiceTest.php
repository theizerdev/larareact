<?php

namespace Tests\Unit;

use App\Models\Empresa;
use App\Models\Pais;
use App\Services\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WhatsAppServiceTest extends TestCase
{
    use RefreshDatabase;
    public function test_format_phone_number_uses_empresa_country_code()
    {
        $paisVenezuela = Pais::where('codigo_iso2', 'VE')->first() ?? Pais::create([
            'nombre' => 'Venezuela',
            'codigo_iso2' => 'VE',
            'codigo_iso3' => 'VEN',
            'codigo_telefonico' => '58',
            'moneda_principal' => 'VES',
            'idioma_principal' => 'es',
        ]);

        $empresaVE = new Empresa();
        $empresaVE->setRelation('pais', $paisVenezuela);

        // 10 dígitos venezolanos (ej: 4241703465) debe ser +58 (584241703465) y NO 521
        $formattedVE = WhatsAppService::formatPhoneNumber('4241703465', $empresaVE);
        $this->assertEquals('584241703465', $formattedVE);

        // Prueba para México (+52) -> debe usar 521
        $paisMexico = new Pais(['codigo_telefonico' => '52']);
        $empresaMX = new Empresa();
        $empresaMX->setRelation('pais', $paisMexico);

        $formattedMX = WhatsAppService::formatPhoneNumber('5512345678', $empresaMX);
        $this->assertEquals('5215512345678', $formattedMX);
    }
}
