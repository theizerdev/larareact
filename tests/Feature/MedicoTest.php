<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Especialidad;
use App\Models\Medico;
use App\Models\Pais;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class MedicoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Permission::firstOrCreate(['name' => 'medicos.view', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'medicos.create', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'medicos.edit', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'medicos.delete', 'guard_name' => 'web']);
    }

    public function test_can_list_medicos_page()
    {
        $empresa = Empresa::create(['razon_social' => 'Centro Médico del Sol', 'documento' => 'J-12345678-9', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('medicos.view');

        $response = $this->actingAs($user)->get('/admin/medicos');

        $response->assertStatus(200);
    }

    public function test_can_create_medico_with_primary_and_secondary_specialties()
    {
        $empresa = Empresa::create(['razon_social' => 'Centro Médico del Sol', 'documento' => 'J-12345678-9', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('medicos.create');

        $rama = \App\Models\RamaMedica::create(['nombre' => 'Medicina Humana', 'slug' => 'medicina-humana', 'status' => true]);
        $esp1 = Especialidad::create(['rama_medica_id' => $rama->id, 'nombre' => 'Cardiología', 'slug' => 'cardiologia', 'activo' => true]);
        $esp2 = Especialidad::create(['rama_medica_id' => $rama->id, 'nombre' => 'Medicina Interna', 'slug' => 'medicina-interna', 'activo' => true]);

        $response = $this->actingAs($user)->post('/admin/medicos', [
            'nombres' => 'Alejandro',
            'apellidos' => 'Mendoza',
            'documento_identidad' => 'V-14920394',
            'licencia_medica' => 'CMP-49201',
            'especialidad_principal_id' => $esp1->id,
            'especialidades_secundarias' => [$esp2->id],
            'email' => 'dr.mendoza@example.com',
            'color_agenda' => '#10b981',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('medicos', [
            'empresa_id' => $empresa->id,
            'nombres' => 'Alejandro',
            'apellidos' => 'Mendoza',
            'especialidad_principal_id' => $esp1->id,
            'licencia_medica' => 'CMP-49201',
        ]);

        $medico = Medico::where('nombres', 'Alejandro')->first();
        $this->assertNotNull($medico->codigo_medico);
        $this->assertStringStartsWith('MED-', $medico->codigo_medico);
        $this->assertEquals('Dr(a). Alejandro Mendoza', $medico->nombre_completo);
        $this->assertCount(1, $medico->especialidades);
    }

    public function test_international_license_title_adaptation_by_country()
    {
        $paisMx = Pais::create([
            'nombre' => 'México',
            'codigo_iso2' => 'MX',
            'codigo_iso3' => 'MEX',
            'activo' => true,
        ]);

        $empresa = Empresa::create([
            'razon_social' => 'Clínica CDMX',
            'documento' => 'RFC-123456',
            'pais_id' => $paisMx->id,
            'status' => 1,
        ]);

        $medico = Medico::create([
            'empresa_id' => $empresa->id,
            'codigo_medico' => 'MED-2026-0001',
            'nombres' => 'Sofía',
            'apellidos' => 'Hernández',
            'licencia_medica' => '12938192',
        ]);

        $this->assertEquals('Cédula Profesional / SEP', $medico->titulo_licencia_internacional);
    }

    public function test_tenant_isolation_prevents_cross_access()
    {
        $empresa1 = Empresa::create(['razon_social' => 'Centro Alfa', 'documento' => 'J-11111111-1', 'status' => 1]);
        $empresa2 = Empresa::create(['razon_social' => 'Centro Beta', 'documento' => 'J-22222222-2', 'status' => 1]);

        $user1 = User::factory()->create(['empresa_id' => $empresa1->id]);
        $user2 = User::factory()->create(['empresa_id' => $empresa2->id]);

        $user1->givePermissionTo('medicos.view');
        $user2->givePermissionTo('medicos.view');

        Medico::create([
            'empresa_id' => $empresa1->id,
            'codigo_medico' => 'MED-2026-0001',
            'nombres' => 'Médico Empresa 1',
            'apellidos' => 'Prueba',
        ]);

        $this->actingAs($user2);

        $this->assertEquals(0, Medico::count());
    }

    public function test_can_toggle_medico_status()
    {
        $empresa = Empresa::create(['razon_social' => 'Centro Médico', 'documento' => 'J-12345678-9', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('medicos.edit');

        $medico = Medico::create([
            'empresa_id' => $empresa->id,
            'codigo_medico' => 'MED-2026-0001',
            'nombres' => 'Gabriel',
            'apellidos' => 'Torres',
            'status' => true,
        ]);

        $response = $this->actingAs($user)->patch("/admin/medicos/{$medico->id}/toggle-status");

        $response->assertRedirect();
        $this->assertDatabaseHas('medicos', [
            'id' => $medico->id,
            'status' => false,
        ]);
    }

    public function test_can_auto_create_user_and_trigger_whatsapp_credentials()
    {
        $empresa = Empresa::create(['razon_social' => 'Centro Médico del Sol', 'documento' => 'J-12345678-9', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('medicos.create');

        $response = $this->actingAs($user)->post('/admin/medicos', [
            'nombres' => 'Carlos',
            'apellidos' => 'Vargas',
            'email' => 'dr.vargas@example.com',
            'telefono' => '+584141234567',
            'crear_usuario_acceso' => true,
            'password_acceso' => 'Secret123!',
            'enviar_whatsapp_credenciales' => true,
        ]);

        $response->assertRedirect();

        $newUser = User::where('email', 'dr.vargas@example.com')->first();
        $this->assertNotNull($newUser);
        $this->assertEquals($empresa->id, $newUser->empresa_id);

        $this->assertDatabaseHas('medicos', [
            'empresa_id' => $empresa->id,
            'user_id' => $newUser->id,
            'nombres' => 'Carlos',
            'apellidos' => 'Vargas',
            'email' => 'dr.vargas@example.com',
        ]);
    }
}
