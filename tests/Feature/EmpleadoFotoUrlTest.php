<?php

namespace Tests\Feature;

use App\Models\Empleado;
use Tests\TestCase;

/**
 * La foto del colaborador se guarda en varios formatos; la URL pública nunca
 * debe repetir el prefijo /storage/ (rompía la foto en el kiosko y la app).
 */
class EmpleadoFotoUrlTest extends TestCase
{
    public function test_normaliza_las_rutas_guardadas(): void
    {
        $base = rtrim(asset('storage'), '/');

        $this->assertSame("{$base}/empleados/a.jpg", Empleado::urlFoto('/storage/empleados/a.jpg'));
        $this->assertSame("{$base}/empleados/a.jpg", Empleado::urlFoto('storage/empleados/a.jpg'));
        $this->assertSame("{$base}/empleados/a.jpg", Empleado::urlFoto('empleados/a.jpg'));
        $this->assertSame("{$base}/empleados/a.jpg", Empleado::urlFoto('/storage/storage/empleados/a.jpg'));
    }

    public function test_respeta_urls_completas_y_vacios(): void
    {
        $this->assertSame('https://cdn.test/f.jpg', Empleado::urlFoto('https://cdn.test/f.jpg'));
        $this->assertSame('data:image/png;base64,AAA', Empleado::urlFoto('data:image/png;base64,AAA'));
        $this->assertNull(Empleado::urlFoto(null));
        $this->assertNull(Empleado::urlFoto(''));
    }
}
