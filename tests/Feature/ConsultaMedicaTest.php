<?php

namespace Tests\Feature;

use App\Models\Cita;
use App\Models\ConsultaMedica;
use App\Models\Empresa;
use App\Models\Especialidad;
use App\Models\Medico;
use App\Models\Paciente;
use App\Models\RamaMedica;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ConsultaMedicaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->artisan('db:seed', ['--class' => 'PermissionSeeder']);
        $this->artisan('db:seed', ['--class' => 'RoleSeeder']);
        $this->artisan('db:seed', ['--class' => 'EmpresaSucursalSeeder']);
    }

    public function test_medico_puede_acceder_al_wizard_de_consulta(): void
    {
        $empresa = Empresa::first();
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo(Permission::all());

        $paciente = Paciente::create([
            'empresa_id' => $empresa->id,
            'codigo_paciente' => 'PAC-101',
            'nombres' => 'Pedro',
            'apellidos' => 'Martínez',
            'tipo_paciente' => 'humano',
        ]);

        $medico = Medico::create([
            'empresa_id' => $empresa->id,
            'codigo_medico' => 'MED-101',
            'nombres' => 'Laura',
            'apellidos' => 'Fernández',
            'color_agenda' => '#10b981',
        ]);

        $cita = Cita::create([
            'empresa_id' => $empresa->id,
            'paciente_id' => $paciente->id,
            'medico_id' => $medico->id,
            'fecha_hora_inicio' => now()->addHours(1)->toDateTimeString(),
            'fecha_hora_fin' => now()->addHours(1)->addMinutes(30)->toDateTimeString(),
            'duracion_minutos' => 30,
            'estado' => 'en_sala_espera',
            'monto_estimado' => 60.00,
        ]);

        $response = $this->actingAs($user)->get("/admin/citas/{$cita->id}/atencion");
        $response->assertStatus(200);

        $this->actingAs($user)->get('/admin/consultas/sala-de-espera')->assertStatus(200);
        $this->actingAs($user)->get('/admin/consultas/en-consultorio')->assertStatus(200);
        $this->actingAs($user)->get('/admin/consultas/finalizadas')->assertStatus(200);
    }


    public function test_medico_puede_completar_consulta_y_generar_receta(): void
    {
        $empresa = Empresa::first();
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo(Permission::all());

        $paciente = Paciente::create([
            'empresa_id' => $empresa->id,
            'codigo_paciente' => 'PAC-102',
            'nombres' => 'Lucía',
            'apellidos' => 'Vargas',
            'tipo_paciente' => 'humano',
        ]);

        $medico = Medico::create([
            'empresa_id' => $empresa->id,
            'codigo_medico' => 'MED-102',
            'nombres' => 'Roberto',
            'apellidos' => 'Silva',
            'color_agenda' => '#ef4444',
        ]);

        $cita = Cita::create([
            'empresa_id' => $empresa->id,
            'paciente_id' => $paciente->id,
            'medico_id' => $medico->id,
            'fecha_hora_inicio' => now()->addHours(1)->toDateTimeString(),
            'fecha_hora_fin' => now()->addHours(1)->addMinutes(30)->toDateTimeString(),
            'duracion_minutos' => 30,
            'estado' => 'en_sala_espera',
            'monto_estimado' => 60.00,
        ]);

        $payload = [
            'motivo_consulta' => 'Cefalea y fiebre leve',
            'enfermedad_actual' => 'Paciente refiere 2 días de evolución con dolor de cabeza.',
            'presion_arterial' => '120/80',
            'frecuencia_cardiaca' => 78,
            'temperatura' => 37.8,
            'peso_kg' => 70,
            'talla_cm' => 170,
            'diagnostico_cie10_codigo' => 'J00',
            'diagnostico_cie10_nombre' => 'Nasofaringitis aguda',
            'plan_tratamiento' => 'Reposo e hidratación',
            'indicaciones_generales' => 'Tomar alimentos livianos',
            'medicamentos' => [
                [
                    'medicamento_nombre' => 'Paracetamol 500mg',
                    'dosis' => '1 comprimido',
                    'via_administracion' => 'Oral',
                    'frecuencia' => 'Cada 8 horas',
                    'duracion_dias' => 5,
                    'instrucciones' => 'Con abundante agua',
                ],
            ],
        ];

        $response = $this->actingAs($user)->post("/admin/citas/{$cita->id}/atencion", $payload);
        $response->assertStatus(302);

        // Verificar que la consulta se guardó y calculó IMC (70 / (1.7^2) = 24.22)
        $this->assertDatabaseHas('consultas_medicas', [
            'cita_id' => $cita->id,
            'diagnostico_cie10_codigo' => 'J00',
            'imc' => 24.22,
        ]);

        // Verificar que la cita cambió a estado 'atendida'
        $this->assertDatabaseHas('citas', [
            'id' => $cita->id,
            'estado' => 'atendida',
        ]);
    }

    public function test_medico_puede_guardar_estudios_solicitados_y_multiples_diagnosticos(): void
    {
        $empresa = Empresa::first();
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo(Permission::all());

        $paciente = Paciente::create([
            'empresa_id' => $empresa->id,
            'codigo_paciente' => 'PAC-103',
            'nombres' => 'Carlos',
            'apellidos' => 'Mendoza',
            'tipo_paciente' => 'humano',
        ]);

        $medico = Medico::create([
            'empresa_id' => $empresa->id,
            'codigo_medico' => 'MED-103',
            'nombres' => 'Ana',
            'apellidos' => 'Gómez',
            'color_agenda' => '#3b82f6',
        ]);

        $cita = Cita::create([
            'empresa_id' => $empresa->id,
            'paciente_id' => $paciente->id,
            'medico_id' => $medico->id,
            'fecha_hora_inicio' => now()->addHours(2)->toDateTimeString(),
            'fecha_hora_fin' => now()->addHours(2)->addMinutes(30)->toDateTimeString(),
            'duracion_minutos' => 30,
            'estado' => 'en_sala_espera',
            'monto_estimado' => 80.00,
        ]);

        $payload = [
            'motivo_consulta' => 'Dolor abdominal agudo y mareos',
            'enfermedad_actual' => 'Paciente presenta dolor en fosa ilíaca derecha.',
            'presion_arterial' => '110/70',
            'frecuencia_cardiaca' => 85,
            'temperatura' => 38.2,
            'peso_kg' => 68,
            'talla_cm' => 165,
            'diagnosticos_cie10_lista' => [
                ['codigo' => 'K35.8', 'nombre' => 'Apendicitis aguda', 'tipo' => 'principal'],
                ['codigo' => 'R10.4', 'nombre' => 'Dolor abdominal no especificado', 'tipo' => 'secundario'],
            ],
            'estudios_solicitados' => [
                ['tipo_estudio' => 'Laboratorio', 'nombre_estudio' => 'Hemograma Completo', 'indicaciones' => 'Urgente'],
                ['tipo_estudio' => 'Imagenología', 'nombre_estudio' => 'Ecografía Abdominal', 'indicaciones' => 'Vejiga llena'],
                ['tipo_estudio' => 'Laboratorio', 'nombre_estudio' => 'Examen General de Orina', 'indicaciones' => 'Primera muestra'],
            ],
            'tiene_reposo' => true,
            'tipo_reposo' => 'relativo',
            'dias_reposo' => 3,
            'fecha_inicio_reposo' => now()->toDateString(),
            'fecha_fin_reposo' => now()->addDays(2)->toDateString(),
            'motivo_reposo' => 'Cuadro agudo de apendicitis en observación',
        ];

        $response = $this->actingAs($user)->post("/admin/citas/{$cita->id}/atencion", $payload);
        $response->assertStatus(302);

        $consulta = ConsultaMedica::where('cita_id', $cita->id)->first();
        $this->assertNotNull($consulta);

        // Verificar 2 diagnósticos guardados
        $this->assertDatabaseCount('consulta_diagnosticos_cie10', 2);
        $this->assertDatabaseHas('consulta_diagnosticos_cie10', [
            'consulta_id' => $consulta->id,
            'codigo' => 'K35.8',
            'tipo' => 'principal',
        ]);

        // Verificar 3 estudios guardados en la orden de estudios
        $this->assertDatabaseHas('ordenes_estudios', [
            'consulta_id' => $consulta->id,
            'paciente_id' => $paciente->id,
        ]);

        $this->assertDatabaseCount('orden_estudio_items', 3);
        $this->assertDatabaseHas('orden_estudio_items', ['nombre_estudio' => 'Hemograma Completo']);
        $this->assertDatabaseHas('orden_estudio_items', ['nombre_estudio' => 'Ecografía Abdominal']);
        $this->assertDatabaseHas('orden_estudio_items', ['nombre_estudio' => 'Examen General de Orina']);

        // Verificar Reposo Médico guardado
        $this->assertDatabaseHas('consulta_reposos', [
            'consulta_id' => $consulta->id,
            'dias_reposo' => 3,
            'tiene_reposo' => true,
        ]);

        // Probar endpoints de impresión en PDF nativo (DomPDF)
        $this->actingAs($user)->get("/admin/consultas/{$consulta->id}/imprimir/informe")
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/pdf');

        $this->actingAs($user)->get("/admin/consultas/{$consulta->id}/imprimir/receta")
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/pdf');

        $this->actingAs($user)->get("/admin/consultas/{$consulta->id}/imprimir/estudios")
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/pdf');

        $this->actingAs($user)->get("/admin/consultas/{$consulta->id}/imprimir/reposo")
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/pdf');

        $this->actingAs($user)->get("/admin/consultas/{$consulta->id}/imprimir/constancia?motivo=Evaluacion+Medica")
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/pdf');

        // Probar formato HTML mediante parámetro ?format=html
        $this->actingAs($user)->get("/admin/consultas/{$consulta->id}/imprimir/informe?format=html")
            ->assertStatus(200)
            ->assertSee('MOTIVO DE CONSULTA')
            ->assertSee('Apendicitis aguda');

        $this->actingAs($user)->get("/admin/consultas/{$consulta->id}/imprimir/reposo?format=html")
            ->assertStatus(200)
            ->assertSee('CERTIFICADO DE REPOSO MÉDICO');

        $this->actingAs($user)->get("/admin/consultas/{$consulta->id}/imprimir/constancia?format=html&motivo=Consulta+Control&incluir_acompanante=1&nombre_acompanante=Carlos+Perez&cedula_acompanante=12345678&relacion_acompanante=Padre")
            ->assertStatus(200)
            ->assertSee('CONSTANCIA DE ASISTENCIA MÉDICA')
            ->assertSee('Carlos Perez')
            ->assertSee('padre');
    }
}

