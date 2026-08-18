<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Paciente;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class PacienteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Permission::firstOrCreate(['name' => 'pacientes.view', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'pacientes.create', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'pacientes.edit', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'pacientes.delete', 'guard_name' => 'web']);
    }

    public function test_can_list_pacientes_page()
    {
        $empresa = Empresa::create(['razon_social' => 'Clínica San Gabriel', 'documento' => 'J-12345678-9', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('pacientes.view');

        $response = $this->actingAs($user)->get('/admin/pacientes');

        $response->assertStatus(200);
    }

    public function test_can_create_human_paciente_with_tenant_isolation()
    {
        $empresa = Empresa::create(['razon_social' => 'Clínica San Gabriel', 'documento' => 'J-12345678-9', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('pacientes.create');

        $response = $this->actingAs($user)->post('/admin/pacientes', [
            'tipo_paciente' => 'humano',
            'nombres' => 'Carlos',
            'apellidos' => 'Gómez',
            'documento_identidad' => 'V-18293049',
            'fecha_nacimiento' => '1992-05-15',
            'genero' => 'masculino',
            'telefono' => '+584141234567',
            'email' => 'carlos@example.com',
            'tipo_sangre' => 'O+',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('pacientes', [
            'empresa_id' => $empresa->id,
            'tipo_paciente' => 'humano',
            'nombres' => 'Carlos',
            'apellidos' => 'Gómez',
            'tipo_sangre' => 'O+',
        ]);

        $paciente = Paciente::where('nombres', 'Carlos')->first();
        $this->assertNotNull($paciente->codigo_paciente);
        $this->assertStringStartsWith('PAC-', $paciente->codigo_paciente);
        $this->assertNotNull($paciente->edad);
    }

    public function test_can_create_veterinary_animal_paciente()
    {
        $empresa = Empresa::create(['razon_social' => 'Clínica San Gabriel', 'documento' => 'J-12345678-9', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('pacientes.create');

        $response = $this->actingAs($user)->post('/admin/pacientes', [
            'tipo_paciente' => 'animal',
            'nombre_mascota' => 'Bobby',
            'especie' => 'Canino',
            'raza' => 'Golden Retriever',
            'color_marcas' => 'Dorado',
            'microchip' => 'CHIP-981203',
            'esterilizado' => true,
            'tutor_nombre' => 'María López',
            'tutor_telefono' => '+584129876543',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('pacientes', [
            'empresa_id' => $empresa->id,
            'tipo_paciente' => 'animal',
            'nombre_mascota' => 'Bobby',
            'especie' => 'Canino',
            'tutor_nombre' => 'María López',
            'esterilizado' => true,
        ]);

        $paciente = Paciente::where('nombre_mascota', 'Bobby')->first();
        $this->assertStringStartsWith('VET-', $paciente->codigo_paciente);
        $this->assertEquals('Bobby (Canino)', $paciente->nombre_completo);
    }

    public function test_tenant_isolation_prevents_cross_access()
    {
        $empresa1 = Empresa::create(['razon_social' => 'Clínica Norte', 'documento' => 'J-11111111-1', 'status' => 1]);
        $empresa2 = Empresa::create(['razon_social' => 'Clínica Sur', 'documento' => 'J-22222222-2', 'status' => 1]);

        $user1 = User::factory()->create(['empresa_id' => $empresa1->id]);
        $user2 = User::factory()->create(['empresa_id' => $empresa2->id]);

        $user1->givePermissionTo('pacientes.view');
        $user2->givePermissionTo('pacientes.view');

        // Crear paciente para empresa 1
        Paciente::create([
            'empresa_id' => $empresa1->id,
            'codigo_paciente' => 'PAC-2026-0001',
            'tipo_paciente' => 'humano',
            'nombres' => 'Paciente Empresa 1',
            'apellidos' => 'Prueba',
        ]);

        // Autenticar como user 2 de empresa 2
        $this->actingAs($user2);

        $this->assertEquals(0, Paciente::count());
    }

    public function test_can_create_paciente_with_country_phone_and_whatsapp_accessor()
    {
        $empresa = Empresa::create(['razon_social' => 'Clínica San Gabriel', 'documento' => 'J-12345678-9', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('pacientes.create');

        $pais = \App\Models\Pais::create([
            'nombre' => 'Venezuela',
            'codigo_iso2' => 'VE',
            'codigo_iso3' => 'VEN',
            'codigo_telefonico' => '+58',
            'moneda_principal' => 'VES',
            'activo' => true,
        ]);

        $response = $this->actingAs($user)->post('/admin/pacientes', [
            'tipo_paciente' => 'humano',
            'nombres' => 'Ana',
            'apellidos' => 'Martínez',
            'pais_telefono_id' => $pais->id,
            'telefono' => '4141234567',
        ]);

        $response->assertRedirect();

        $paciente = Paciente::where('nombres', 'Ana')->first();
        $this->assertEquals($pais->id, $paciente->pais_telefono_id);
        $this->assertEquals('584141234567', $paciente->telefono_whatsapp);
    }

    public function test_can_send_whatsapp_welcome_message_via_integration_endpoint()
    {
        $empresa = Empresa::create(['razon_social' => 'Clínica San Gabriel', 'documento' => 'J-12345678-9', 'status' => 1]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('pacientes.view');

        $paciente = Paciente::create([
            'empresa_id' => $empresa->id,
            'codigo_paciente' => 'PAC-2026-0001',
            'tipo_paciente' => 'humano',
            'nombres' => 'Laura',
            'apellidos' => 'Rojas',
            'telefono' => '+584149998877',
        ]);

        $response = $this->actingAs($user)->post("/admin/pacientes/{$paciente->id}/send-whatsapp-welcome");

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
    }
}
