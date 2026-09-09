<?php

namespace Tests\Feature;

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
        // La ruta /dashboard está protegida por ->can('dashboard.view').
        Permission::findOrCreate('dashboard.view', 'web');
        $user = User::factory()->create();
        $user->givePermissionTo('dashboard.view');
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }
}
