<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        // /dashboard exige el permiso dashboard.view (sin él responde 403).
        $user = User::factory()->create();
        $user->givePermissionTo(\Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'dashboard.view', 'guard_name' => 'web']));
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }
}
