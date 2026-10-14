<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\OpcionComida;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class OpcionComidaCrudTest extends TestCase
{
    use RefreshDatabase;

    private function escenario(): array
    {
        $empresa = Empresa::create(['razon_social' => 'Emp Comedor', 'documento' => 'DOC-CMD']);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo(Permission::firstOrCreate(['name' => 'asistencia.configuracion', 'guard_name' => 'web']));

        return [$empresa, $user];
    }

    public function test_puede_listar_opciones_de_comida(): void
    {
        [$empresa, $user] = $this->escenario();

        OpcionComida::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Desayuno Buffet',
            'tipo' => 'desayuno',
            'costo_empleado' => 15.00,
            'costo_empresa' => 35.00,
            'status' => true,
        ]);

        $this->actingAs($user)
            ->get('/admin/asistencia/comedor')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/asistencia/comedor/Index')
                ->has('opciones.data', 1)
                ->where('opciones.data.0.nombre', 'Desayuno Buffet')
                ->where('opciones.data.0.tipo', 'desayuno')
            );
    }

    public function test_puede_crear_opcion_con_tipo_valido(): void
    {
        [$empresa, $user] = $this->escenario();

        $response = $this->actingAs($user)->post('/admin/asistencia/comedor', [
            'nombre' => 'Refrigerio Vespertino',
            'tipo' => 'refrigerio',
            'descripcion' => 'Fruta y barra de cereal',
            'costo_empleado' => 0,
            'costo_empresa' => 20,
            'hora_inicio' => '16:00',
            'hora_fin' => '17:30',
            'icono' => 'apple',
            'color' => 'purple',
            'status' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('opciones_comida', [
            'empresa_id' => $empresa->id,
            'nombre' => 'Refrigerio Vespertino',
            'tipo' => 'refrigerio',
            'icono' => 'apple',
        ]);
    }

    public function test_rechaza_tipo_invalido(): void
    {
        [, $user] = $this->escenario();

        $this->actingAs($user)->post('/admin/asistencia/comedor', [
            'nombre' => 'Comida Especial',
            'tipo' => 'tipo_inexistente',
            'costo_empleado' => 10,
        ])->assertSessionHasErrors(['tipo']);
    }

    public function test_puede_actualizar_opcion_de_comida(): void
    {
        [$empresa, $user] = $this->escenario();

        $opcion = OpcionComida::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Cena Ligera',
            'tipo' => 'cena',
            'costo_empleado' => 10.00,
            'costo_empresa' => 30.00,
            'status' => true,
        ]);

        $response = $this->actingAs($user)->put("/admin/asistencia/comedor/{$opcion->id}", [
            'nombre' => 'Cena Completa',
            'tipo' => 'cena',
            'costo_empleado' => 12.50,
            'costo_empresa' => 35.00,
            'status' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('opciones_comida', [
            'id' => $opcion->id,
            'nombre' => 'Cena Completa',
            'costo_empleado' => 12.50,
        ]);
    }

    public function test_puede_alternar_estado_activo_inactivo(): void
    {
        [$empresa, $user] = $this->escenario();

        $opcion = OpcionComida::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Almuerzo Ejecutivo',
            'tipo' => 'almuerzo',
            'costo_empleado' => 25.00,
            'status' => true,
        ]);

        $this->actingAs($user)->patch("/admin/asistencia/comedor/{$opcion->id}/toggle")->assertRedirect();
        $this->assertFalse($opcion->fresh()->status);

        $this->actingAs($user)->patch("/admin/asistencia/comedor/{$opcion->id}/toggle")->assertRedirect();
        $this->assertTrue($opcion->fresh()->status);
    }

    public function test_puede_eliminar_suavemente_opcion(): void
    {
        [$empresa, $user] = $this->escenario();

        $opcion = OpcionComida::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Menú Temporal',
            'tipo' => 'almuerzo',
            'costo_empleado' => 0,
            'status' => true,
        ]);

        $this->actingAs($user)->delete("/admin/asistencia/comedor/{$opcion->id}")->assertRedirect();
        $this->assertSoftDeleted('opciones_comida', ['id' => $opcion->id]);
    }
}
