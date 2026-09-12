<?php

namespace Tests\Feature;

use App\Models\Empleado;
use App\Models\Empresa;
use App\Services\Contpaqi\EmparejadorDeNombres;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Tests\TestCase;

/**
 * El emparejamiento por nombre es la parte más peligrosa de la carga de
 * códigos: acertar de más es peor que no acertar. Estas pruebas fijan que ante
 * la duda no elija.
 */
class ContpaqiEmparejadorDeNombresTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private EmparejadorDeNombres $emparejador;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create([
            'razon_social' => 'Frigorífico de Prueba, S.A. de C.V.',
            'documento' => 'FDP-NOMBRES',
        ]);

        $this->emparejador = new EmparejadorDeNombres;
    }

    public function test_empareja_aunque_contpaqi_ponga_los_apellidos_primero(): void
    {
        $this->empleado('Ma Beatriz', 'Luque Casillas');

        $r = $this->emparejar('LUQUE CASILLAS MA BEATRIZ');

        $this->assertSame(EmparejadorDeNombres::EXACTA, $r['estado']);
        $this->assertSame('Ma Beatriz Luque Casillas', $r['empleado']->nombre_completo);
    }

    public function test_empareja_tambien_en_el_orden_contrario(): void
    {
        $this->empleado('Juan Carlos', 'Perez Nila');

        $r = $this->emparejar('JUAN CARLOS PEREZ NILA');

        $this->assertSame(EmparejadorDeNombres::EXACTA, $r['estado']);
    }

    public function test_ignora_acentos_y_puntos_de_abreviatura(): void
    {
        $this->empleado('Ma. Guadalupe', 'Arce Martínez');

        $r = $this->emparejar('ARCE MARTINEZ MA GUADALUPE');

        $this->assertSame(EmparejadorDeNombres::EXACTA, $r['estado']);
    }

    public function test_conserva_la_enie_porque_distingue_apellidos(): void
    {
        $this->empleado('Adriana Guadalupe', 'Regin Nuño');
        $this->empleado('Adriana Guadalupe', 'Regin Nuno');

        // Si la eñe se normalizara a n, estos dos apellidos colisionarían y el
        // emparejamiento saldría ambiguo. Son familias distintas.
        $r = $this->emparejar('REGIN NUÑO ADRIANA GUADALUPE');

        $this->assertSame(EmparejadorDeNombres::EXACTA, $r['estado']);
        $this->assertSame('Adriana Guadalupe Regin Nuño', $r['empleado']->nombre_completo);
    }

    /* ------------------------------------------------------------------ */
    /*  Nombres cortados */
    /* ------------------------------------------------------------------ */

    public function test_un_nombre_cortado_empareja_por_prefijo(): void
    {
        $this->empleado('Brian Alejandro', 'Flores Rojas');

        // Así viene en la captura del cliente: "...BRIAN ALEJA".
        $r = $this->emparejar('FLORES ROJAS BRIAN ALEJA', truncado: true);

        $this->assertSame(EmparejadorDeNombres::PREFIJO, $r['estado']);
        $this->assertSame('Brian Alejandro Flores Rojas', $r['empleado']->nombre_completo);
    }

    public function test_un_nombre_completo_no_empareja_por_prefijo(): void
    {
        $this->empleado('Juan Carlos', 'Perez Nila');

        // Sin la bandera de truncado, un prefijo suelto no debe cazar: si no,
        // "PEREZ" encajaría con cualquier Pérez de la empresa.
        $r = $this->emparejar('PEREZ NILA JUAN', truncado: false);

        $this->assertSame(EmparejadorDeNombres::SIN_COINCIDENCIA, $r['estado']);
        $this->assertNull($r['empleado']);
    }

    public function test_ante_dos_candidatos_no_elige_ninguno(): void
    {
        // El caso real del padrón: dos Camarena Velázquez, y el nombre viene
        // cortado justo antes de distinguirlos.
        $this->empleado('Alan', 'Camarena Velazquez');
        $this->empleado('Alan Kevin', 'Camarena Velazquez');

        $r = $this->emparejar('CAMARENA VELAZQUEZ ALA', truncado: true);

        $this->assertSame(EmparejadorDeNombres::AMBIGUA, $r['estado']);
        $this->assertNull($r['empleado'], 'Ante la duda no se elige: el código iría a la persona equivocada.');
        $this->assertCount(2, $r['candidatos']);
    }

    public function test_sin_candidatos_lo_reporta_en_vez_de_forzar(): void
    {
        $this->empleado('Juan Carlos', 'Perez Nila');

        $r = $this->emparejar('PONCE GARCIA ALEXIS FERNANDO');

        $this->assertSame(EmparejadorDeNombres::SIN_COINCIDENCIA, $r['estado']);
        $this->assertNull($r['empleado']);
    }

    /* ------------------------------------------------------------------ */

    /** @return array{estado: string, empleado: Empleado|null, candidatos: list<string>} */
    private function emparejar(string $nombre, bool $truncado = false): array
    {
        return $this->emparejador->emparejar($nombre, $truncado, $this->empleados());
    }

    /** @return Collection<int, Empleado> */
    private function empleados(): Collection
    {
        return Empleado::withoutTenant()->where('empresa_id', $this->empresa->id)->get();
    }

    private function empleado(string $nombres, string $apellidos): Empleado
    {
        static $seq = 0;
        $seq++;

        return Empleado::create([
            'nombres' => $nombres,
            'apellidos' => $apellidos,
            'documento_identidad' => "DOC-NOM-{$seq}",
            'empresa_id' => $this->empresa->id,
            'status' => true,
        ]);
    }
}
