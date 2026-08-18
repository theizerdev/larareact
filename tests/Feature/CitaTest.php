<?php

namespace Tests\Feature;

use App\Models\Cita;
use App\Models\Empresa;
use App\Models\Especialidad;
use App\Models\Medico;
use App\Models\MedicoHorario;
use App\Models\Paciente;
use App\Models\TipoAtencion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class CitaTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Empresa $empresa;
    protected Medico $medico;
    protected Paciente $paciente;
    protected TipoAtencion $tipoAtencion;
    protected Especialidad $especialidad;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create(['razon_social' => 'Clínica San Gabriel', 'documento' => 'J-12345678-9', 'status' => 1]);

        $this->user = User::factory()->create([
            'empresa_id' => $this->empresa->id,
        ]);


        Permission::firstOrCreate(['name' => 'citas.view', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'citas.create', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'citas.edit', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'citas.delete', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'citas.cambiar_estado', 'guard_name' => 'web']);

        $this->user->givePermissionTo(['citas.view', 'citas.create', 'citas.edit', 'citas.delete', 'citas.cambiar_estado']);

        $rama = \App\Models\RamaMedica::create([
            'nombre' => 'Medicina Humana',
            'slug' => 'medicina-humana',
            'status' => true,
        ]);

        $this->especialidad = Especialidad::create([
            'rama_medica_id' => $rama->id,
            'nombre' => 'Medicina General',
            'slug' => 'medicina-general',
            'status' => true,
        ]);



        $this->medico = Medico::create([
            'empresa_id' => $this->empresa->id,
            'codigo_medico' => 'MED-TEST-01',
            'nombres' => 'Carlos',
            'apellidos' => 'González',
            'especialidad_principal_id' => $this->especialidad->id,
            'status' => true,
        ]);

        $this->paciente = Paciente::create([
            'empresa_id' => $this->empresa->id,
            'codigo_paciente' => 'PAC-TEST-01',
            'tipo_paciente' => 'humano',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'telefono' => '+584121112233',
            'status' => true,
        ]);

        $this->tipoAtencion = TipoAtencion::create([
            'empresa_id' => $this->empresa->id,
            'nombre' => 'Consulta Estándar',
            'duracion_estimada_minutos' => 30,
            'status' => true,
        ]);

        // Crear horario activo de Lunes a Viernes para el médico
        for ($dia = 1; $dia <= 5; $dia++) {
            MedicoHorario::create([
                'empresa_id' => $this->empresa->id,
                'medico_id' => $this->medico->id,
                'dia_semana' => $dia,
                'hora_inicio' => '08:00:00',
                'hora_fin' => '17:00:00',
                'hora_inicio_almuerzo' => '13:00:00',
                'hora_fin_almuerzo' => '14:00:00',
                'buffer_minutos' => 10,
                'activo' => true,
            ]);
        }
    }

    public function test_authenticated_user_can_view_citas_index(): void
    {
        $response = $this->actingAs($this->user)->get(route('admin.citas.index'));
        $response->assertStatus(200);
    }

    public function test_can_create_a_cita_successfully(): void
    {
        $fechaFutura = Carbon::now()->addDays(2)->setHour(10)->setMinute(0)->second(0);

        $response = $this->actingAs($this->user)->post(route('admin.citas.store'), [
            'paciente_id' => $this->paciente->id,
            'medico_id' => $this->medico->id,
            'especialidad_id' => $this->especialidad->id,
            'tipo_atencion_id' => $this->tipoAtencion->id,
            'fecha_hora_inicio' => $fechaFutura->toIso8601String(),
            'duracion_minutos' => 30,
            'motivo_consulta' => 'Chequeo de rutina',
            'monto_estimado' => 50.00,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('citas', [
            'empresa_id' => $this->empresa->id,
            'medico_id' => $this->medico->id,
            'paciente_id' => $this->paciente->id,
            'estado' => 'pendiente',
        ]);
    }

    public function test_prevents_overbooking_for_same_doctor_and_time(): void
    {
        $fechaFutura = Carbon::now()->addDays(3)->setHour(11)->setMinute(0);

        // Cita inicial
        Cita::create([
            'empresa_id' => $this->empresa->id,
            'paciente_id' => $this->paciente->id,
            'medico_id' => $this->medico->id,
            'fecha_hora_inicio' => $fechaFutura,
            'fecha_hora_fin' => $fechaFutura->copy()->addMinutes(30),
            'duracion_minutos' => 30,
            'estado' => 'pendiente',
        ]);

        // Intento de segunda cita en el mismo solapamiento
        $response = $this->actingAs($this->user)->post(route('admin.citas.store'), [
            'paciente_id' => $this->paciente->id,
            'medico_id' => $this->medico->id,
            'tipo_atencion_id' => $this->tipoAtencion->id,
            'fecha_hora_inicio' => $fechaFutura->copy()->addMinutes(10)->toIso8601String(),
            'duracion_minutos' => 30,
        ]);

        $response->assertSessionHasErrors(['fecha_hora_inicio']);
    }

    public function test_enforces_2_hour_lead_time_rule_for_today(): void
    {
        // Intento de agendar cita dentro de 30 minutos (menos de 2 horas)
        $fechaInvalida = Carbon::now()->addMinutes(30);

        $response = $this->actingAs($this->user)->post(route('admin.citas.store'), [
            'paciente_id' => $this->paciente->id,
            'medico_id' => $this->medico->id,
            'tipo_atencion_id' => $this->tipoAtencion->id,
            'fecha_hora_inicio' => $fechaInvalida->toIso8601String(),
            'duracion_minutos' => 30,
        ]);

        $response->assertSessionHasErrors(['fecha_hora_inicio']);
    }

    public function test_enforces_24_hour_cancellation_limit_rule(): void
    {
        // Cita programada para dentro de 5 horas (menos de 24 horas)
        $citaProxima = Cita::create([
            'empresa_id' => $this->empresa->id,
            'paciente_id' => $this->paciente->id,
            'medico_id' => $this->medico->id,
            'fecha_hora_inicio' => Carbon::now()->addHours(5),
            'fecha_hora_fin' => Carbon::now()->addHours(5)->addMinutes(30),
            'duracion_minutos' => 30,
            'estado' => 'pendiente',
        ]);

        $response = $this->actingAs($this->user)->patch(route('admin.citas.update-estado', $citaProxima->id), [
            'estado' => 'cancelada',
            'motivo_cancelacion' => 'Motivo tarde',
        ]);

        $response->assertSessionHasErrors(['estado']);
    }

    public function test_can_update_cita_status_and_timestamps(): void
    {
        $cita = Cita::create([
            'empresa_id' => $this->empresa->id,
            'paciente_id' => $this->paciente->id,
            'medico_id' => $this->medico->id,
            'fecha_hora_inicio' => Carbon::now()->addDays(2)->setHour(10),
            'fecha_hora_fin' => Carbon::now()->addDays(2)->setHour(10)->addMinutes(30),
            'duracion_minutos' => 30,
            'estado' => 'pendiente',
        ]);

        $response = $this->actingAs($this->user)->patch(route('admin.citas.update-estado', $cita->id), [
            'estado' => 'en_sala_espera',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('citas', [
            'id' => $cita->id,
            'estado' => 'en_sala_espera',
        ]);
    }

    public function test_can_fetch_real_time_available_slots(): void
    {
        $fechaStr = Carbon::now()->addDays(2)->format('Y-m-d');

        $response = $this->actingAs($this->user)->getJson(route('admin.citas.slots', [
            'medico_id' => $this->medico->id,
            'fecha' => $fechaStr,
            'duracion_minutos' => 30,
        ]));

        $response->assertStatus(200);
        $response->assertJsonStructure(['slots']);
    }
}
