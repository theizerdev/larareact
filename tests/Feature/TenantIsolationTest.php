<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureTenantContext;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_can_only_see_resources_belonging_to_their_empresa()
    {
        $empresaA = Empresa::create(['razon_social' => 'Hospital Alfa', 'documento' => 'J-11111111-1', 'status' => 1]);
        $empresaB = Empresa::create(['razon_social' => 'Clínica Beta', 'documento' => 'J-22222222-2', 'status' => 1]);

        $sucursalA = Sucursal::create(['empresa_id' => $empresaA->id, 'nombre' => 'Sede Alfa Centro', 'status' => 1]);
        $sucursalB = Sucursal::create(['empresa_id' => $empresaB->id, 'nombre' => 'Sede Beta Norte', 'status' => 1]);

        $userA = User::factory()->create(['empresa_id' => $empresaA->id]);

        $this->actingAs($userA);

        $sucursalesVisibles = Sucursal::all();

        $this->assertTrue($sucursalesVisibles->contains('id', $sucursalA->id));
        $this->assertFalse($sucursalesVisibles->contains('id', $sucursalB->id));
    }

    public function test_creating_a_resource_auto_assigns_user_empresa_id()
    {
        $empresa = Empresa::create(['razon_social' => 'Centro Médico San José', 'documento' => 'J-33333333-3', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);

        $this->actingAs($user);

        $nuevaSucursal = Sucursal::create(['nombre' => 'Nueva Sede Este', 'status' => 1]);

        $this->assertEquals($empresa->id, $nuevaSucursal->empresa_id);
    }

    public function test_super_admin_can_see_resources_across_all_tenants()
    {
        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);

        $empresaA = Empresa::create(['razon_social' => 'Hospital Uno', 'documento' => 'J-44444444-4', 'status' => 1]);
        $empresaB = Empresa::create(['razon_social' => 'Hospital Dos', 'documento' => 'J-55555555-5', 'status' => 1]);

        $sucursalA = Sucursal::create(['empresa_id' => $empresaA->id, 'nombre' => 'Sucursal 1', 'status' => 1]);
        $sucursalB = Sucursal::create(['empresa_id' => $empresaB->id, 'nombre' => 'Sucursal 2', 'status' => 1]);

        $superUser = User::factory()->create();
        $superUser->assignRole($superAdminRole);

        $this->actingAs($superUser);

        $todasLasSucursales = Sucursal::all();

        $this->assertTrue($todasLasSucursales->contains('id', $sucursalA->id));
        $this->assertTrue($todasLasSucursales->contains('id', $sucursalB->id));
    }

    public function test_middleware_blocks_user_without_active_empresa()
    {
        $userSinEmpresa = User::factory()->create(['empresa_id' => null]);

        $middleware = new EnsureTenantContext();
        $request = Request::create('/admin/dashboard', 'GET');
        $request->setUserResolver(fn () => $userSinEmpresa);

        try {
            $middleware->handle($request, fn () => response('OK'));
            $this->fail('Se esperaba una excepción HttpException 403');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $this->assertEquals(403, $e->getStatusCode());
        }
    }

    public function test_middleware_allows_user_with_active_empresa()
    {
        $empresa = Empresa::create(['razon_social' => 'Clínica Salud Total', 'documento' => 'J-66666666-6', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);

        $middleware = new EnsureTenantContext();
        $request = Request::create('/admin/dashboard', 'GET');
        $request->setUserResolver(fn () => $user);

        $response = $middleware->handle($request, fn () => response('OK'));

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals($empresa->id, $request->attributes->get('tenant')->id);
    }
}
