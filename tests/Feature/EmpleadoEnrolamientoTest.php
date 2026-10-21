<?php

namespace Tests\Feature;

use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Enrolamiento desde Colaboradores: aviso de privacidad aceptado, dos fotos
 * frontales, sexo y fecha de nacimiento.
 */
class EmpleadoEnrolamientoTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Empleado $empleado;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $empresa = Empresa::create(['razon_social' => 'Smurfit Test', 'documento' => 'DOC-EN', 'status' => true]);
        $this->user = User::factory()->create(['empresa_id' => $empresa->id]);
        $this->user->givePermissionTo(Permission::firstOrCreate(['name' => 'empleados.edit', 'guard_name' => 'web']));

        $this->empleado = Empleado::withoutTenant()->create([
            'nombres' => 'Ana', 'apellidos' => 'Piso', 'documento_identidad' => '700',
            'empresa_id' => $empresa->id, 'status' => true,
        ]);
    }

    private function foto(): string
    {
        $img = imagecreatetruecolor(4, 4);
        ob_start();
        imagejpeg($img);

        return 'data:image/jpeg;base64,'.base64_encode((string) ob_get_clean());
    }

    private function datos(array $extra = []): array
    {
        return $extra + [
            'aviso_privacidad' => true,
            'foto_empleado' => $this->foto(),
            'foto_empleado_2' => $this->foto(),
            'genero' => 'F',
            'fecha_nacimiento' => '1990-05-17',
        ];
    }

    public function test_muestra_los_datos_del_colaborador(): void
    {
        $this->actingAs($this->user)
            ->get("/admin/empleados/{$this->empleado->id}/enrolamiento")
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('admin/Empleados/Enrolamiento')
                ->where('empleado.numero', '700')
                ->where('empleado.nombres', 'Ana')
                ->where('empleado.enrolado_en', null));
    }

    public function test_guarda_fotos_sexo_y_fecha_de_nacimiento(): void
    {
        $this->empleado->update(['foto_empleado' => '/storage/empleados/vieja.jpg']);
        Storage::disk('public')->put('empleados/vieja.jpg', 'x');

        $this->actingAs($this->user)
            ->post("/admin/empleados/{$this->empleado->id}/enrolamiento", $this->datos())
            ->assertSessionHasNoErrors();

        $e = $this->empleado->fresh();
        $this->assertSame('F', $e->genero);
        $this->assertSame('1990-05-17', $e->fecha_nacimiento->format('Y-m-d'));
        $this->assertNotNull($e->enrolado_en);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $e->foto_empleado));
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $e->foto_empleado_2));
        Storage::disk('public')->assertMissing('empleados/vieja.jpg');
    }

    public function test_sin_aceptar_el_aviso_no_guarda(): void
    {
        $this->actingAs($this->user)
            ->post("/admin/empleados/{$this->empleado->id}/enrolamiento", $this->datos(['aviso_privacidad' => false]))
            ->assertSessionHasErrors('aviso_privacidad');

        $this->assertNull($this->empleado->fresh()->enrolado_en);
    }

    public function test_una_foto_que_no_es_imagen_se_rechaza_sin_dejar_archivos(): void
    {
        $this->actingAs($this->user)
            ->post("/admin/empleados/{$this->empleado->id}/enrolamiento", $this->datos(['foto_empleado_2' => 'data:image/jpeg;base64,'.base64_encode('no soy imagen')]))
            ->assertSessionHasErrors('foto_empleado_2');

        $this->assertNull($this->empleado->fresh()->enrolado_en);
        $this->assertSame([], Storage::disk('public')->allFiles('empleados'));
    }

    public function test_sin_permiso_de_edicion_no_entra(): void
    {
        $this->actingAs(User::factory()->create(['empresa_id' => $this->empleado->empresa_id]))
            ->get("/admin/empleados/{$this->empleado->id}/enrolamiento")
            ->assertForbidden();
    }
}
