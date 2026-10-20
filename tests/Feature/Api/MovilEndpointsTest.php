<?php

namespace Tests\Feature\Api;

use App\Models\Empleado;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Cada pantalla de la app móvil responde sin error contra el esquema de esta
 * instancia. Detecta columnas o tablas que la API espera y aquí no existen.
 */
class MovilEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_las_pantallas_de_la_app_responden(): void
    {
        // Las pantallas de administración exigen el mismo permiso que en el web
        // (ver AuditoriaPermisosApiTest); aquí se prueba el esquema, no el acceso.
        $user = User::factory()->create();
        foreach (['dashboard.view', 'empleados.view', 'asistencia.view', 'visitas_temporales.view'] as $permiso) {
            $user->givePermissionTo(Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'web']));
        }
        $empleado = Empleado::create([
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'documento_identidad' => '000123',
            'codigo_acceso' => '00000123',
            'status' => true,
            'permite_app_movil' => true,
            'user_id' => $user->id,
        ]);

        $this->actingAs($user, 'sanctum');

        foreach ([
            '/api/user',
            '/api/reloj-checador/configuracion',
            '/api/reloj-checador/mi-empleado',
            '/api/reloj-checador/mi-historial',
            '/api/dashboard/resumen',
            '/api/empleados',
            "/api/empleados/{$empleado->id}",
            "/api/empleados/{$empleado->id}/marcajes",
            '/api/asistencia/bitacora',
            '/api/asistencia/nomina',
            '/api/accesos',
            '/api/notifications',
        ] as $ruta) {
            $this->getJson($ruta)->assertOk();
        }

        $this->postJson('/api/reloj-checador/buscar', ['query' => '123'])->assertOk();
    }

    public function test_sin_token_no_hay_acceso(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }
}
