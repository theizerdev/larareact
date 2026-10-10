<?php

namespace Tests\Feature;

use App\Console\Commands\SmurfitAdmin;
use App\Console\Commands\SmurfitDemo;
use App\Models\AsistenciaMarcaje;
use App\Models\BiotimeEmpleado;
use App\Models\BiotimeMarcaje;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\TurnoLaboral;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class SmurfitInstanciaTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create(['razon_social' => 'Smurfit Westrock', 'documento' => 'SW-1', 'status' => true]);
        Sucursal::create(['empresa_id' => $this->empresa->id, 'nombre' => 'Planta Guadalajara', 'status' => true]);
    }

    private function userWith(array $permissions): User
    {
        foreach ($permissions as $name) {
            Permission::findOrCreate($name, 'web');
        }

        $user = User::factory()->create(['empresa_id' => $this->empresa->id]);
        $user->givePermissionTo($permissions);

        return $user->refresh();
    }

    public function test_modulos_apagados_responden_404_aunque_haya_permiso(): void
    {
        $user = $this->userWith(['productores.view', 'control_acceso.view', 'validaciones.view', 'jaak.view', 'integrations.view']);

        $this->actingAs($user)->get('/admin/productores')->assertNotFound();
        $this->actingAs($user)->get('/admin/control-acceso/empleados')->assertNotFound();
        $this->actingAs($user)->get('/admin/validaciones')->assertNotFound();
        $this->actingAs($user)->get('/admin/integrations/validaciones')->assertNotFound();
        $this->actingAs($user)->get('/admin/integrations/control-acceso')->assertNotFound();
        $this->get('/preregistro-productor/cualquier-token')->assertNotFound();
    }

    public function test_un_modulo_encendido_por_config_vuelve_a_responder(): void
    {
        config(['modulos.productores' => true]);
        $user = $this->userWith(['productores.view']);

        $this->actingAs($user)->get('/admin/productores')->assertOk();
    }

    public function test_reloj_checador_sigue_disponible(): void
    {
        $user = $this->userWith(['integrations.view']);

        $this->actingAs($user)->get('/admin/integrations/reloj-checador')->assertOk();
    }

    public function test_la_raiz_lleva_al_login_y_no_al_landing_comercial(): void
    {
        $this->get('/')->assertRedirect(route('login'));
        $this->post('/contacto', [])->assertNotFound();
    }

    public function test_idiomas_disponibles_son_es_en_e_hindi(): void
    {
        $this->post('/locale', ['locale' => 'hi'])->assertSessionHasNoErrors();
        $this->post('/locale', ['locale' => 'ar'])->assertSessionHasErrors('locale');
        $this->assertFileExists(base_path('lang/hi.json'));
        $this->assertFileDoesNotExist(base_path('lang/ar.json'));
    }

    public function test_smurfit_admin_crea_rol_recortado_y_usuario(): void
    {
        $this->seed(PermissionSeeder::class);

        $this->artisan('smurfit:admin', ['--email' => 'TI@Smurfit.example'])->assertSuccessful();

        $user = User::where('username', SmurfitAdmin::USERNAME)->firstOrFail();
        $this->assertSame('ti@smurfit.example', $user->email);
        $this->assertSame($this->empresa->id, $user->empresa_id);
        $this->assertFalse($user->isSuperAdmin());
        $this->assertNull($user->password_changed_at, 'Debe cambiar la contraseña temporal al entrar.');
        $this->assertEqualsCanonicalizing(SmurfitAdmin::PERMISOS, $user->getAllPermissions()->pluck('name')->all());

        foreach (['roles.view', 'empresas.view', 'paises.view', 'monitoreo.view', 'productores.view', 'control_acceso.view', 'validaciones.view'] as $fuera) {
            $this->assertFalse($user->hasPermissionTo($fuera), "No debería tener {$fuera}");
        }

        // Re-ejecutarlo no duplica ni cambia la contraseña.
        $hash = $user->password;
        $this->artisan('smurfit:admin')->assertSuccessful();
        $this->assertSame(1, User::where('username', SmurfitAdmin::USERNAME)->count());
        $this->assertSame($hash, $user->fresh()->password);
    }

    public function test_password_temporal_cumple_politica_sox(): void
    {
        $password = SmurfitAdmin::passwordTemporal();

        $this->assertGreaterThanOrEqual(15, strlen($password));
        $this->assertMatchesRegularExpression('/[a-z]/', $password);
        $this->assertMatchesRegularExpression('/[A-Z]/', $password);
        $this->assertMatchesRegularExpression('/\d/', $password);
        $this->assertMatchesRegularExpression('/[^A-Za-z0-9]/', $password);
    }

    public function test_smurfit_demo_carga_y_limpia_datos(): void
    {
        $this->seed(PermissionSeeder::class);
        $this->artisan('smurfit:admin', ['--email' => 'ti@smurfit.example'])->assertSuccessful();

        $this->artisan('smurfit:demo')->assertSuccessful();

        $this->assertSame(2, TurnoLaboral::withoutGlobalScopes()->where('empresa_id', $this->empresa->id)->count());
        $demo = Empleado::withoutGlobalScopes()->where('motivo_registro', SmurfitDemo::MARCA)->get();
        $this->assertCount(12, $demo);
        $this->assertTrue($demo->every(fn ($e) => $e->turno_laboral_id !== null));

        // El padrón de BioTime es el mismo que Organización / Colaboradores.
        $this->assertSame(12, BiotimeEmpleado::whereIn('empleado_id', $demo->pluck('id'))->count());
        foreach ($demo as $empleado) {
            $this->assertSame($empleado->documento_identidad, BiotimeEmpleado::where('empleado_id', $empleado->id)->value('emp_code'));
        }

        $this->assertSame(50, BiotimeMarcaje::where('dispositivo_sn', SmurfitDemo::DISPOSITIVO_SN)->count());
        $this->assertSame(50, AsistenciaMarcaje::withoutGlobalScopes()->where('observaciones', SmurfitDemo::MARCA)->count());
        $this->assertSame(0, BiotimeMarcaje::whereNull('empleado_id')->count());
        $this->assertFalse(BiotimeMarcaje::where('punch_time', '>', now())->exists());

        // Idempotente.
        $this->artisan('smurfit:demo')->assertSuccessful();
        $this->assertSame(50, BiotimeMarcaje::count());
        $this->assertSame(12, Empleado::withoutGlobalScopes()->count());

        $this->artisan('smurfit:demo', ['--limpiar' => true])->assertSuccessful();
        $this->assertSame(0, Empleado::withoutGlobalScopes()->count());
        $this->assertSame(0, BiotimeEmpleado::count());
        $this->assertSame(0, BiotimeMarcaje::count());
        $this->assertSame(0, AsistenciaMarcaje::withoutGlobalScopes()->count());
    }

    public function test_smurfit_demo_no_sobrescribe_un_colaborador_real(): void
    {
        $this->seed(PermissionSeeder::class);
        $this->artisan('smurfit:admin', ['--email' => 'ti@smurfit.example'])->assertSuccessful();

        Empleado::withoutGlobalScopes()->create([
            'nombres' => 'Real', 'apellidos' => 'Persona', 'documento_identidad' => '900001',
            'empresa_id' => $this->empresa->id, 'sucursal_id' => Sucursal::first()->id,
        ]);

        $this->expectException(\RuntimeException::class);
        $this->artisan('smurfit:demo');
    }
}
