<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        Permission::firstOrCreate(['name' => 'dashboard.view', 'guard_name' => 'web']);
        $empresa = Empresa::create(['razon_social' => 'Clínica Dashboard', 'documento' => 'J-99999999-9', 'status' => 1]);

        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('dashboard.view');

        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }
}
