<?php

namespace Tests\Feature;

use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\EmpleadoEnrolamientoCedula;
use App\Models\EmpleadoEnrolamientoLog;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class CedulaEnrolamientoTest extends TestCase
{
    use RefreshDatabase;

    private function crearFotoBase64(): string
    {
        $img = imagecreatetruecolor(60, 60);
        $color = imagecolorallocate($img, 79, 70, 229);
        imagefill($img, 0, 0, $color);
        ob_start();
        imagejpeg($img, null, 85);
        $bin = ob_get_clean();
        imagedestroy($img);

        return 'data:image/jpeg;base64,' . base64_encode($bin);
    }

    private function crearContexto(): array
    {
        Storage::fake('public');

        $empresa = Empresa::create([
            'razon_social' => 'Smurfit Westrock',
            'nombre_comercial' => 'Smurfit Westrock',
            'documento' => 'SWE010101AAA',
            'status' => true,
            'biotime_active' => false,
        ]);

        $sucursal = Sucursal::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Planta Guadalajara',
            'codigo' => 'GDL-01',
            'zona_horaria' => 'America/Mexico_City',
            'status' => true,
        ]);

        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
        ]);

        foreach (['asistencia.kiosko', 'empleados.view', 'empleados.edit'] as $perm) {
            Permission::findOrCreate($perm, 'web');
            $user->givePermissionTo($perm);
        }

        $departamento = Departamento::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'user_id' => $user->id,
            'nombre' => 'Operaciones y Logística',
            'status' => true,
        ]);

        $empleado = Empleado::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'departamento_id' => $departamento->id,
            'nombres' => 'Juan Carlos',
            'apellidos' => 'Morales López',
            'codigo_nuevo' => 'SW-MX-1001',
            'documento_identidad' => 'SW-MX-1001',
            'codigo_anterior' => 'ANT-9001',
            'legacy' => 'LEG-9001',
            'correo' => 'jmorales@smurfitwestrock.com',
            'status' => true,
        ]);

        return [$user, $empleado];
    }

    public function test_registra_accion_aviso_privacidad_y_genera_cedula_enrolamiento_con_sello_y_pdf(): void
    {
        [$user, $empleado] = $this->crearContexto();

        // 1. Clic en casilla de Aviso de Privacidad
        $resAviso = $this->actingAs($user)
            ->postJson(route('api.reloj-checador.enrolamiento.accion'), [
                'empleado_id' => $empleado->id,
                'accion' => 'aviso_privacidad',
                'latitud' => 20.577012,
                'longitud' => -103.426716,
            ]);

        $resAviso->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('log.accion', 'aviso_privacidad')
            ->assertJsonPath('log.etiqueta', 'Aviso de Privacidad');

        $cedulaUuid = $resAviso->json('cedula_uuid');
        $this->assertNotEmpty($cedulaUuid);

        $this->assertDatabaseHas('empleado_enrolamiento_logs', [
            'empleado_id' => $empleado->id,
            'accion' => 'aviso_privacidad',
            'etiqueta' => 'Aviso de Privacidad',
        ]);

        // 2. Clic en FINALIZAR Y ENROLAR
        $foto = $this->crearFotoBase64();
        $resEnrol = $this->actingAs($user)
            ->postJson(route('api.reloj-checador.enrolar'), [
                'empleado_id' => $empleado->id,
                'aviso_privacidad' => true,
                'foto_empleado' => $foto,
                'foto_empleado_2' => $foto,
                'genero' => 'M',
                'fecha_nacimiento' => '1990-05-15',
                'cedula_uuid' => $cedulaUuid,
                'latitud' => 20.577012,
                'longitud' => -103.426716,
            ]);

        $resEnrol->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('cedula.uuid', $cedulaUuid)
            ->assertJsonPath('cedula.estado', 'completado');

        $cedula = EmpleadoEnrolamientoCedula::where('uuid', $cedulaUuid)->firstOrFail();
        $this->assertTrue($cedula->verificarIntegridad());
        $this->assertNotEmpty($cedula->sello_digital);
        $this->assertNotEmpty($cedula->foto_1_hash);
        $this->assertNotEmpty($cedula->foto_2_hash);
        $this->assertSame('SW-MX-1001', $cedula->no_empleado);
        $this->assertSame('LEG-9001', $cedula->codigo_legacy);

        // Verificar que existen ambas acciones en logs
        $acciones = $cedula->logs()->pluck('accion')->all();
        $this->assertContains(EmpleadoEnrolamientoLog::ACCION_AVISO_PRIVACIDAD, $acciones);
        $this->assertContains(EmpleadoEnrolamientoLog::ACCION_ENROLAMIENTO, $acciones);

        // Verificar que el PDF existe en el expediente del colaborador
        $relPdf = preg_replace('#^/?(storage/)+#', '', ltrim((string) $cedula->pdf_path, '/'));
        Storage::disk('public')->assertExists($relPdf);
        $this->assertStringStartsWith('%PDF-', Storage::disk('public')->get($relPdf));

        // 3. Consultar expediente del colaborador y descargar PDF
        $resExp = $this->actingAs($user)
            ->getJson(route('admin.empleados.cedulas-enrolamiento', $empleado->id));

        $resExp->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('cedulas.0.uuid', $cedulaUuid)
            ->assertJsonPath('cedulas.0.integridad_valida', true);

        Storage::disk('public')->put($relPdf, '%PDF-stale-archive');

        $resPdf = $this->actingAs($user)
            ->get(route('admin.empleados.cedulas-enrolamiento.pdf', [$empleado->id, $cedula->id]));

        $resPdf->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('Cache-Control', 'no-store, private');
        $this->assertNotSame('%PDF-stale-archive', $resPdf->getContent());
        $this->assertSame($resPdf->getContent(), Storage::disk('public')->get($relPdf));
    }
}
