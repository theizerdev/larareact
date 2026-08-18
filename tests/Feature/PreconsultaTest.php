<?php

namespace Tests\Feature;

use App\Models\Cita;
use App\Models\CitaPreconsulta;
use App\Models\Empresa;
use App\Models\Especialidad;
use App\Models\Medico;
use App\Models\Paciente;
use App\Models\PlantillaPreconsulta;
use App\Models\RamaMedica;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class PreconsultaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->artisan('db:seed', ['--class' => 'PermissionSeeder']);
        $this->artisan('db:seed', ['--class' => 'RoleSeeder']);
        $this->artisan('db:seed', ['--class' => 'EmpresaSucursalSeeder']);
    }

    public function test_puede_generar_link_de_preconsulta_para_una_cita(): void
    {
        $empresa = Empresa::first();

        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
        ]);
        $user->givePermissionTo(Permission::all());

        $paciente = Paciente::create([
            'empresa_id' => $empresa->id,
            'codigo_paciente' => 'PAC-001',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'tipo_paciente' => 'humano',
        ]);

        $medico = Medico::create([
            'empresa_id' => $empresa->id,
            'codigo_medico' => 'MED-001',
            'nombres' => 'Carlos',
            'apellidos' => 'Gómez',
            'color_agenda' => '#3b82f6',
        ]);

        $rama = RamaMedica::create([
            'nombre' => 'Medicina Humana',
            'slug' => 'medicina-humana-test',
        ]);

        $especialidad = Especialidad::create([
            'empresa_id' => $empresa->id,
            'rama_medica_id' => $rama->id,
            'nombre' => 'Cardiología',
            'slug' => 'cardiologia-test',
        ]);

        $cita = Cita::create([
            'empresa_id' => $empresa->id,
            'paciente_id' => $paciente->id,
            'medico_id' => $medico->id,
            'especialidad_id' => $especialidad->id,
            'fecha_hora_inicio' => now()->addHours(3)->toDateTimeString(),
            'fecha_hora_fin' => now()->addHours(3)->addMinutes(30)->toDateTimeString(),
            'duracion_minutos' => 30,
            'estado' => 'pendiente',
            'monto_estimado' => 50.00,
        ]);

        $response = $this->actingAs($user)->postJson("/admin/citas/{$cita->id}/generar-preconsulta");

        $response->assertStatus(200);
        $response->assertJsonStructure(['token', 'url']);

        $this->assertDatabaseHas('cita_preconsultas', [
            'cita_id' => $cita->id,
        ]);
    }

    public function test_paciente_puede_responder_cuestionario_de_forma_publica(): void
    {
        $empresa = Empresa::first();
        $paciente = Paciente::create([
            'empresa_id' => $empresa->id,
            'codigo_paciente' => 'PAC-002',
            'nombres' => 'Ana',
            'apellidos' => 'López',
            'tipo_paciente' => 'humano',
        ]);

        $medico = Medico::create([
            'empresa_id' => $empresa->id,
            'codigo_medico' => 'MED-002',
            'nombres' => 'María',
            'apellidos' => 'Rodríguez',
            'color_agenda' => '#10b981',
        ]);

        $cita = Cita::create([
            'empresa_id' => $empresa->id,
            'paciente_id' => $paciente->id,
            'medico_id' => $medico->id,
            'fecha_hora_inicio' => now()->addHours(3)->toDateTimeString(),
            'fecha_hora_fin' => now()->addHours(3)->addMinutes(30)->toDateTimeString(),
            'duracion_minutos' => 30,
            'estado' => 'en_sala_espera',
            'monto_estimado' => 50.00,
        ]);

        $preconsulta = CitaPreconsulta::create([
            'cita_id' => $cita->id,
            'token' => 'token_de_prueba_12345',
            'completado' => false,
        ]);

        // Access public page
        $responseGet = $this->get("/preconsulta/{$preconsulta->token}");
        $responseGet->assertStatus(200);

        // Submit answers
        $responsePost = $this->post("/preconsulta/{$preconsulta->token}", [
            'respuestas' => [
                'p1' => 'Dolor de cabeza leve',
                'p2' => 'Si',
            ],
        ]);

        $responsePost->assertStatus(302); // Redirect back with success flash

        $this->assertDatabaseHas('cita_preconsultas', [
            'id' => $preconsulta->id,
            'completado' => true,
        ]);
    }
}
