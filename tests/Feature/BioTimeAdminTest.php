<?php

namespace Tests\Feature;

use App\Models\BiotimeEmpleado;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class BioTimeAdminTest extends TestCase
{
    use RefreshDatabase;

    private function empresa(): Empresa
    {
        return Empresa::create(['razon_social' => 'ACME', 'documento' => 'ACME-1', 'status' => true]);
    }

    private function userWith(array $permissions, Empresa $empresa): User
    {
        foreach ($permissions as $name) {
            Permission::findOrCreate($name, 'web');
        }

        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo($permissions);
        $user->refresh();

        return $user;
    }

    public function test_biotime_pages_require_permission(): void
    {
        $empresa = $this->empresa();
        $user = User::factory()->create(['empresa_id' => $empresa->id]);

        $this->actingAs($user)->get('/admin/biotime/dispositivos')->assertForbidden();
        $this->actingAs($user)->get('/admin/biotime/marcajes')->assertForbidden();
    }

    public function test_viewer_can_open_biotime_pages(): void
    {
        $empresa = $this->empresa();
        $user = $this->userWith(['biotime.view'], $empresa);

        $this->actingAs($user)->get('/admin/biotime/dispositivos')->assertOk();
        $this->actingAs($user)->get('/admin/biotime/empleados')->assertOk();
        $this->actingAs($user)->get('/admin/biotime/marcajes')->assertOk();
    }

    public function test_viewer_cannot_trigger_sync_or_link(): void
    {
        $empresa = $this->empresa();
        $user = $this->userWith(['biotime.view'], $empresa);

        $this->actingAs($user)->post('/admin/biotime/sync')->assertForbidden();
        $this->actingAs($user)->post('/admin/biotime/empleados/auto-vincular')->assertForbidden();
    }

    public function test_update_biotime_keeps_password_when_blank(): void
    {
        $empresa = $this->empresa();
        $empresa->update([
            'biotime_base_url' => 'http://old.test',
            'biotime_username' => 'old',
            'biotime_password' => 'original-secret',
            'biotime_active' => true,
        ]);

        Permission::findOrCreate('integrations.edit', 'web');
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('integrations.edit');

        $this->actingAs($user)->put('/admin/integrations/biotime', [
            'biotime_base_url' => 'http://new.test',
            'biotime_username' => 'new',
            'biotime_password' => '',
            'biotime_active' => true,
        ])->assertRedirect();

        $empresa->refresh();
        $this->assertSame('http://new.test', $empresa->biotime_base_url);
        $this->assertSame('new', $empresa->biotime_username);
        $this->assertSame('original-secret', $empresa->biotime_password);
    }

    public function test_update_biotime_changes_password_when_provided(): void
    {
        $empresa = $this->empresa();
        $empresa->update(['biotime_password' => 'original', 'biotime_active' => true]);

        Permission::findOrCreate('integrations.edit', 'web');
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('integrations.edit');

        $this->actingAs($user)->put('/admin/integrations/biotime', [
            'biotime_base_url' => 'http://new.test',
            'biotime_username' => 'new',
            'biotime_password' => 'brand-new',
            'biotime_active' => true,
        ])->assertRedirect();

        $this->assertSame('brand-new', $empresa->refresh()->biotime_password);
    }

    public function test_manual_link_updates_biotime_employee_and_its_punches(): void
    {
        $empresa = $this->empresa();
        $user = $this->userWith(['biotime.manage'], $empresa);

        $bio = BiotimeEmpleado::create([
            'empresa_id' => $empresa->id, 'biotime_id' => 7, 'emp_code' => '77', 'first_name' => 'C',
        ]);
        $empleado = Empleado::create([
            'nombres' => 'Carlos', 'apellidos' => 'Díaz', 'documento_identidad' => 'X1',
            'empresa_id' => $empresa->id, 'status' => true,
        ]);
        $bio->marcajes()->create([
            'empresa_id' => $empresa->id, 'biotime_id' => 900, 'emp_code' => '77', 'punch_time' => now(),
        ]);

        $this->actingAs($user)
            ->put("/admin/biotime/empleados/{$bio->id}/vincular", ['empleado_id' => $empleado->id])
            ->assertRedirect();

        $this->assertSame($empleado->id, $bio->refresh()->empleado_id);
        $this->assertSame('manual', $bio->link_status);
        $this->assertSame($empleado->id, (int) $bio->marcajes()->first()->empleado_id);
    }

    public function test_sync_now_dispatches_command_under_lock(): void
    {
        Http::fake([
            '*/jwt-api-token-auth/' => Http::response(['token' => 't'], 200),
            '*' => Http::response(['count' => 0, 'next' => null, 'data' => []], 200),
        ]);

        $empresa = $this->empresa();
        $empresa->update([
            'biotime_base_url' => 'http://b.test', 'biotime_username' => 'u',
            'biotime_password' => 'p', 'biotime_active' => true,
        ]);
        $user = $this->userWith(['biotime.manage'], $empresa);

        $this->actingAs($user)->post('/admin/biotime/sync', ['only' => 'terminals'])
            ->assertRedirect();

        Http::assertSent(fn ($r) => str_contains($r->url(), '/iclock/api/terminals/'));
    }
}
