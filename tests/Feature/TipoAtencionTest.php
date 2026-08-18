<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\TipoAtencion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class TipoAtencionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Permission::firstOrCreate(['name' => 'tipos_atencion.view', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'tipos_atencion.create', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'tipos_atencion.edit', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'tipos_atencion.delete', 'guard_name' => 'web']);
    }

    public function test_can_list_tipos_atencion_page()
    {
        $empresa = Empresa::create(['razon_social' => 'Clínica San Gabriel', 'documento' => 'J-12345678-9', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('tipos_atencion.view');

        $response = $this->actingAs($user)->get('/admin/tipos-atencion');

        $response->assertStatus(200);
    }

    public function test_can_create_tipo_atencion_with_primera_vez_and_subsecuente_flags()
    {
        $empresa = Empresa::create(['razon_social' => 'Clínica San Gabriel', 'documento' => 'J-12345678-9', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('tipos_atencion.create');

        $response = $this->actingAs($user)->post('/admin/tipos-atencion', [
            'nombre' => 'Consulta de Primera Vez - Presencial',
            'codigo' => 'PRESENCIAL_PRIMERA',
            'modalidad' => 'presencial',
            'tipo_consulta' => 'primera_vez',
            'es_primera_vez' => true,
            'es_subsecuente' => false,
            'descripcion' => 'Consulta clínica inicial para nuevos pacientes.',
            'icono' => 'UserPlus',
            'color' => '#3b82f6',
            'duracion_estimada_minutos' => 45,
            'requiere_link_virtual' => false,
            'requiere_direccion' => false,
            'costo_adicional_sugerido' => 50.00,
            'permite_reserva_online' => true,
            'status' => true,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('tipos_atencion', [
            'empresa_id' => $empresa->id,
            'nombre' => 'Consulta de Primera Vez - Presencial',
            'codigo' => 'PRESENCIAL_PRIMERA',
            'modalidad' => 'presencial',
            'tipo_consulta' => 'primera_vez',
            'es_primera_vez' => true,
            'es_subsecuente' => false,
            'duracion_estimada_minutos' => 45,
        ]);
    }

    public function test_can_update_tipo_atencion()
    {
        $empresa = Empresa::create(['razon_social' => 'Clínica San Gabriel', 'documento' => 'J-12345678-9', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('tipos_atencion.edit');

        $tipo = TipoAtencion::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Consulta General',
            'modalidad' => 'presencial',
            'tipo_consulta' => 'general',
            'icono' => 'Stethoscope',
            'color' => '#3b82f6',
            'duracion_estimada_minutos' => 30,
        ]);

        $response = $this->actingAs($user)->put("/admin/tipos-atencion/{$tipo->id}", [
            'nombre' => 'Consulta Subsecuente de Control',
            'codigo' => 'CONTROL_SUBSECUENTE',
            'modalidad' => 'presencial',
            'tipo_consulta' => 'subsecuente',
            'es_primera_vez' => false,
            'es_subsecuente' => true,
            'icono' => 'Repeat',
            'color' => '#10b981',
            'duracion_estimada_minutos' => 20,
            'requiere_link_virtual' => false,
            'requiere_direccion' => false,
            'status' => true,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('tipos_atencion', [
            'id' => $tipo->id,
            'nombre' => 'Consulta Subsecuente de Control',
            'es_subsecuente' => true,
            'duracion_estimada_minutos' => 20,
        ]);
    }

    public function test_tenant_isolation_prevents_cross_access()
    {
        $empresa1 = Empresa::create(['razon_social' => 'Centro Alfa', 'documento' => 'J-11111111-1', 'status' => 1]);
        $empresa2 = Empresa::create(['razon_social' => 'Centro Beta', 'documento' => 'J-22222222-2', 'status' => 1]);

        $user1 = User::factory()->create(['empresa_id' => $empresa1->id]);
        $user2 = User::factory()->create(['empresa_id' => $empresa2->id]);

        $user1->givePermissionTo('tipos_atencion.view');
        $user2->givePermissionTo('tipos_atencion.view');

        TipoAtencion::create([
            'empresa_id' => $empresa1->id,
            'nombre' => 'Tipo Atención Empresa 1',
            'modalidad' => 'presencial',
            'tipo_consulta' => 'general',
            'icono' => 'Stethoscope',
            'color' => '#3b82f6',
            'duracion_estimada_minutos' => 30,
        ]);

        $this->actingAs($user2);

        $this->assertEquals(0, TipoAtencion::count());
    }

    public function test_can_toggle_tipo_atencion_status()
    {
        $empresa = Empresa::create(['razon_social' => 'Clínica San Gabriel', 'documento' => 'J-12345678-9', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('tipos_atencion.edit');

        $tipo = TipoAtencion::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Telemedicina Virtual',
            'modalidad' => 'telemedicina',
            'tipo_consulta' => 'general',
            'icono' => 'Video',
            'color' => '#8b5cf6',
            'duracion_estimada_minutos' => 30,
            'status' => true,
        ]);

        $response = $this->actingAs($user)->patch("/admin/tipos-atencion/{$tipo->id}/toggle-status");

        $response->assertRedirect();

        $this->assertDatabaseHas('tipos_atencion', [
            'id' => $tipo->id,
            'status' => false,
        ]);
    }
}
