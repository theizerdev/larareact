<?php

namespace Tests\Feature\Auth;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Fortify convierte el correo a minúsculas al iniciar sesión y la base distingue
 * mayúsculas: un usuario dado de alta como "Nombre.Apellido@empresa.com" nunca
 * podía entrar. Los correos se guardan siempre en minúsculas.
 */
class EmailCaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_emails_are_always_stored_in_lowercase(): void
    {
        $u = User::factory()->create(['email' => '  Nombre.Apellido@Empresa.COM ']);

        $this->assertSame('nombre.apellido@empresa.com', DB::table('users')->where('id', $u->id)->value('email'));
    }

    public function test_a_user_created_with_uppercase_letters_can_log_in_however_they_type_it(): void
    {
        User::factory()->create(['email' => 'Hugo.Cendejas@Driscolls.com', 'password' => Hash::make('secreto-123')]);

        foreach (['Hugo.Cendejas@Driscolls.com', 'hugo.cendejas@driscolls.com', 'HUGO.CENDEJAS@DRISCOLLS.COM'] as $escrito) {
            Auth::forgetGuards();
            $this->flushSession();
            $this->post('/login', ['email' => $escrito, 'password' => 'secreto-123']);

            $this->assertTrue(Auth::check(), "no entró escribiendo {$escrito}");
        }
    }

    public function test_the_users_screen_stores_lowercase_and_rejects_duplicates_that_only_differ_by_case(): void
    {
        $this->seed(PermissionSeeder::class);
        Role::findOrCreate('admin', 'web')->syncPermissions(Permission::pluck('name')->all());
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $empresa = Empresa::create(['razon_social' => 'E', 'documento' => 'E-1', 'status' => true]);
        $sucursal = Sucursal::create(['empresa_id' => $empresa->id, 'nombre' => 'S', 'status' => true]);
        $admin = User::factory()->create(['empresa_id' => $empresa->id, 'sucursal_id' => $sucursal->id]);
        $admin->assignRole('admin');

        $alta = fn (string $correo) => ['name' => 'Nuevo', 'email' => $correo, 'password' => 'Password-123', 'status' => 'activo', 'roles' => []];

        $this->actingAs($admin)->post('/admin/usuarios', $alta('Nuevo.Usuario@Empresa.com'))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', ['email' => 'nuevo.usuario@empresa.com']);

        $this->actingAs($admin)->post('/admin/usuarios', $alta('NUEVO.USUARIO@empresa.com'))->assertSessionHasErrors('email');
        $this->assertSame(1, User::withoutTenant()->where('email', 'nuevo.usuario@empresa.com')->count());
    }

    public function test_the_data_migration_lowercases_existing_emails_and_skips_conflicts(): void
    {
        $id = fn (string $correo) => DB::table('users')->insertGetId(['name' => 'U', 'email' => $correo, 'password' => 'x', 'created_at' => now(), 'updated_at' => now()]);
        $mixto = $id('Hugo.Cendejas@Driscolls.com');
        $ya = $id('ya.minusculas@x.com');
        $a = $id('Choque@X.com');
        $b = $id('choque@x.com');   // al pasar $a a minúsculas chocaría con éste

        (require database_path('migrations/2026_10_07_000003_lowercase_user_emails.php'))->up();

        $this->assertSame('hugo.cendejas@driscolls.com', DB::table('users')->where('id', $mixto)->value('email'));
        $this->assertSame('ya.minusculas@x.com', DB::table('users')->where('id', $ya)->value('email'));
        $this->assertSame('Choque@X.com', DB::table('users')->where('id', $a)->value('email'), 'con conflicto se deja como estaba');
        $this->assertSame('choque@x.com', DB::table('users')->where('id', $b)->value('email'));
    }
}
