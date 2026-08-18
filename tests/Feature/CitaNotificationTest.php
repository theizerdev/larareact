<?php

namespace Tests\Feature;

use App\Models\Cita;
use App\Models\Empresa;
use App\Models\Especialidad;
use App\Models\Medico;
use App\Models\Paciente;
use App\Models\Pais;
use App\Models\TipoAtencion;
use App\Models\User;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CitaNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_cita_sends_whatsapp_to_patient_and_doctor()
    {
        Http::fake([
            '*/api/message/send-text/*' => Http::response(['status' => 'success'], 200),
        ]);

        $pais = Pais::create([
            'nombre' => 'Venezuela',
            'codigo_iso2' => 'VE',
            'codigo_iso3' => 'VEN',
            'codigo_telefonico' => '58',
            'moneda_principal' => 'VES',
            'idioma_principal' => 'es',
        ]);

        $empresa = Empresa::create([
            'razon_social' => 'Clínica Test',
            'documento' => 'J-123456789',
            'pais_id' => $pais->id,
            'pais_telefono_id' => $pais->id,
            'whatsapp_instance' => 'test_instance',
            'whatsapp_api_key' => 'key123',
        ]);

        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        \Spatie\Permission\Models\Permission::create(['name' => 'citas.create']);
        $user->givePermissionTo('citas.create');
        $this->actingAs($user);

        $paciente = Paciente::create([
            'empresa_id' => $empresa->id,
            'codigo_paciente' => 'PAC-001',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'documento_identidad' => 'V-12345678',
            'telefono' => '4241234567',
        ]);

        $rama = \App\Models\RamaMedica::create(['nombre' => 'Medicina Humana', 'slug' => 'medicina-humana', 'codigo' => 'MH']);
        $especialidad = Especialidad::create(['nombre' => 'Cardiología', 'slug' => 'cardiologia', 'codigo' => 'CARD', 'rama_medica_id' => $rama->id]);

        $medico = Medico::create([
            'empresa_id' => $empresa->id,
            'codigo_medico' => 'MED-001',
            'nombres' => 'Carlos',
            'apellidos' => 'Gómez',
            'telefono' => '4149876543',
            'especialidad_principal_id' => $especialidad->id,
        ]);

        $tipoAtencion = TipoAtencion::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Consulta General',
            'slug' => 'consulta-general',
            'codigo' => 'CG',
            'duracion_estimada_minutos' => 30,
        ]);

        $fechaReserva = Carbon::tomorrow()->setHour(10)->setMinute(0)->toDateTimeString();

        $response = $this->post('/admin/citas', [
            'paciente_id' => $paciente->id,
            'medico_id' => $medico->id,
            'especialidad_id' => $especialidad->id,
            'tipo_atencion_id' => $tipoAtencion->id,
            'fecha_hora_inicio' => $fechaReserva,
            'duracion_minutos' => 30,
            'motivo_consulta' => 'Chequeo general',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('citas', [
            'paciente_id' => $paciente->id,
            'medico_id' => $medico->id,
        ]);

        // Verificar que se enviaron 2 peticiones a WhatsApp API (1 Paciente, 1 Doctor)
        Http::assertSentCount(2);

        Http::assertSent(function ($request) {
            return str_contains($request['to'], '584241234567') && str_contains($request['message'], 'CONFIRMACIÓN DE CITA MÉDICA');
        });

        Http::assertSent(function ($request) {
            return str_contains($request['to'], '584149876543') && str_contains($request['message'], 'NUEVA CITA AGENDADA EN SU AGENDA');
        });
    }
}
