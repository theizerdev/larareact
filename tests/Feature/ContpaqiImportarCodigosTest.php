<?php

namespace Tests\Feature;

use App\Models\ContpaqiEmpleadoMapeo;
use App\Models\Empleado;
use App\Models\Empresa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * El comando que carga el padrón de códigos de CONTPAQi.
 *
 * Lo que más importa aquí es lo que NO hace: no escribe sin que se lo pidan, no
 * resuelve ambigüedades por su cuenta y no le cambia el código a quien ya lo
 * tiene.
 */
class ContpaqiImportarCodigosTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private string $csv;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create([
            'razon_social' => 'Frigorífico de Prueba, S.A. de C.V.',
            'documento' => 'FDP-CODIGOS',
        ]);

        $this->csv = tempnam(sys_get_temp_dir(), 'padron_').'.csv';
    }

    protected function tearDown(): void
    {
        if (is_file($this->csv)) {
            @unlink($this->csv);
        }

        parent::tearDown();
    }

    public function test_el_ensayo_no_escribe_nada(): void
    {
        $this->empleado('Juan Carlos', 'Perez Nila');
        $this->padron("326,PEREZ NILA JUAN CARLOS\n");

        $this->artisan('contpaqi:importar-codigos', [
            '--empresa' => $this->empresa->id,
            '--csv' => $this->csv,
        ])->assertSuccessful();

        $this->assertSame(0, ContpaqiEmpleadoMapeo::count(), 'Sin --aplicar no debe guardar nada.');
    }

    public function test_con_aplicar_guarda_el_mapeo(): void
    {
        $empleado = $this->empleado('Juan Carlos', 'Perez Nila');
        $this->padron("codigo,nombre\n326,PEREZ NILA JUAN CARLOS\n");

        $this->artisan('contpaqi:importar-codigos', [
            '--empresa' => $this->empresa->id,
            '--csv' => $this->csv,
            '--aplicar' => true,
        ])->assertSuccessful();

        $this->assertDatabaseHas('contpaqi_empleado_mapeos', [
            'empresa_id' => $this->empresa->id,
            'empleado_id' => $empleado->id,
            'codigo_empleado' => '326',
            'activo' => true,
        ]);
    }

    public function test_no_asigna_codigo_cuando_el_nombre_encaja_con_dos_personas(): void
    {
        $this->empleado('Alan', 'Camarena Velazquez');
        $this->empleado('Alan Kevin', 'Camarena Velazquez');

        // El CSV se lee como nombres completos, así que "CAMARENA VELAZQUEZ
        // ALAN" es exacto para el primero y prefijo del segundo. Como el
        // prefijo no aplica a nombres completos, gana la coincidencia exacta.
        // Lo que se prueba es el caso verdaderamente ambiguo: el nombre que
        // ambos comparten entero.
        $this->padron("341,CAMARENA VELAZQUEZ\n");

        $this->artisan('contpaqi:importar-codigos', [
            '--empresa' => $this->empresa->id,
            '--csv' => $this->csv,
            '--aplicar' => true,
        ])->assertSuccessful();

        $this->assertSame(0, ContpaqiEmpleadoMapeo::count(), 'Ante dos candidatos no debe elegir.');
    }

    public function test_no_le_cambia_el_codigo_a_quien_ya_lo_tiene(): void
    {
        $empleado = $this->empleado('Juan Carlos', 'Perez Nila');

        ContpaqiEmpleadoMapeo::create([
            'empresa_id' => $this->empresa->id,
            'empleado_id' => $empleado->id,
            'codigo_empleado' => '111',
            'activo' => true,
        ]);

        $this->padron("326,PEREZ NILA JUAN CARLOS\n");

        $this->artisan('contpaqi:importar-codigos', [
            '--empresa' => $this->empresa->id,
            '--csv' => $this->csv,
            '--aplicar' => true,
        ])->assertSuccessful();

        // Cambiar un código en una corrida masiva es la forma más silenciosa
        // de romper una nómina: el empleado conserva el que ya tenía.
        $this->assertSame(1, ContpaqiEmpleadoMapeo::count());
        $this->assertSame('111', ContpaqiEmpleadoMapeo::first()->codigo_empleado);
    }

    public function test_el_padron_transcrito_de_la_captura_trae_los_19_codigos(): void
    {
        $padron = require database_path('data/contpaqi-codigos-frigorifico.php');

        $this->assertCount(19, $padron);
        $this->assertSame('180', $padron[0]['codigo']);
        $this->assertSame('999', $padron[18]['codigo']);

        // Los nombres cortados vienen marcados: sin esa bandera el
        // emparejamiento por prefijo no se activaría y no cazaría ninguno.
        $truncados = collect($padron)->where('truncado', true);
        $this->assertGreaterThan(10, $truncados->count());
    }

    /* ------------------------------------------------------------------ */

    private function padron(string $contenido): void
    {
        file_put_contents($this->csv, $contenido);
    }

    private function empleado(string $nombres, string $apellidos): Empleado
    {
        static $seq = 0;
        $seq++;

        return Empleado::create([
            'nombres' => $nombres,
            'apellidos' => $apellidos,
            'documento_identidad' => "DOC-COD-{$seq}",
            'empresa_id' => $this->empresa->id,
            'status' => true,
        ]);
    }
}
