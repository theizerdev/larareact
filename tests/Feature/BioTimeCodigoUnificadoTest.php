<?php

namespace Tests\Feature;

use App\Models\BiotimeCargo;
use App\Models\BiotimeDepartamento;
use App\Models\BiotimeEmpleado;
use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Responsable;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\BioTimeSyncService;
use App\Services\EmpleadoEnrolamientoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class BioTimeCodigoUnificadoTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private Sucursal $sucursal;

    private User $admin;

    private Departamento $departamento;

    private Responsable $responsable;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->empresa = Empresa::create([
            'razon_social' => 'Planta BioTime Test',
            'documento' => 'RFC-BT-UNIF-01',
            'biotime_base_url' => 'http://biotime.test:8081',
            'biotime_username' => 'admin',
            'biotime_password' => 'secret',
            'biotime_active' => true,
            'biotime_auto_alta' => true,
            'biotime_push' => true,
            'status' => true,
        ]);

        $this->sucursal = Sucursal::create([
            'nombre' => 'Planta Norte',
            'empresa_id' => $this->empresa->id,
            'status' => true,
        ]);

        $this->admin = User::factory()->create([
            'empresa_id' => $this->empresa->id,
            'sucursal_id' => $this->sucursal->id,
            'status' => 'activo',
        ]);

        foreach (['empleados.view', 'empleados.create', 'empleados.edit', 'biotime.view', 'biotime.manage', 'asistencia.kiosko'] as $permiso) {
            $this->admin->givePermissionTo(Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'web']));
        }
        $this->admin->refresh();

        $this->departamento = Departamento::withoutTenant()->create([
            'nombre' => 'Producción',
            'empresa_id' => $this->empresa->id,
            'sucursal_id' => $this->sucursal->id,
            'user_id' => $this->admin->id,
            'status' => 1,
        ]);

        $this->responsable = Responsable::withoutTenant()->create([
            'nombres' => 'Supervisor',
            'apellidos' => 'Turno',
            'empresa_id' => $this->empresa->id,
            'sucursal_id' => $this->sucursal->id,
            'user_id' => $this->admin->id,
            'status' => 1,
        ]);
    }

    private function fotoBase64(): string
    {
        $img = imagecreatetruecolor(4, 4);
        ob_start();
        imagejpeg($img);

        return 'data:image/jpeg;base64,'.base64_encode((string) ob_get_clean());
    }

    private function fakeBioTimeSync(array $empleados): void
    {
        $env = fn (array $rows) => [
            'count' => count($rows),
            'next' => null,
            'previous' => null,
            'msg' => '',
            'code' => 0,
            'data' => array_values($rows),
        ];

        Http::swap(new \Illuminate\Http\Client\Factory);
        Http::preventStrayRequests();

        Http::fake([
            '*/jwt-api-token-auth/' => Http::response(['token' => 'test-token']),
            '*/iclock/api/terminals/*' => Http::response($env([])),
            '*/personnel/api/departments/*' => Http::response($env([
                ['id' => 1, 'dept_code' => 'D1', 'dept_name' => 'Producción'],
            ])),
            '*/personnel/api/areas/*' => Http::response($env([])),
            '*/personnel/api/positions/*' => Http::response($env([
                ['id' => 1, 'position_code' => 'P1', 'position_name' => 'Operador'],
            ])),
            '*/personnel/api/employees/*' => Http::response($env($empleados)),
            '*/iclock/api/transactions/*' => Http::response($env([])),
            '*/att/api/*' => Http::response($env([])),
        ]);
    }

    public function test_sync_desde_biotime_usa_solo_emp_code_como_codigo_acceso_y_documento(): void
    {
        $this->fakeBioTimeSync([
            [
                'id' => '99f206c2-be94-11f1-991f-0a58a9feac02',
                'emp_code' => '543210',
                'first_name' => 'Carlos',
                'last_name' => 'Mendoza',
                'gender' => 'M',
                'department' => ['dept_code' => 'D1'],
                'position' => ['position_code' => 'P1'],
                'hire_date' => '2024-02-10',
                'card_no' => '900123',
            ],
        ]);

        $res = BioTimeSyncService::for($this->empresa)->sync($this->empresa);
        $this->assertTrue($res['ok'], json_encode($res['errors']));

        $empleado = Empleado::withoutTenant()->where('documento_identidad', '543210')->firstOrFail();

        $this->assertSame('543210', $empleado->documento_identidad);
        $this->assertSame('543210', $empleado->codigo_acceso);
        $this->assertNotSame('10100001', $empleado->codigo_acceso);

        $bio = BiotimeEmpleado::where('empresa_id', $this->empresa->id)->where('emp_code', '543210')->firstOrFail();
        $this->assertSame($empleado->id, (int) $bio->empleado_id);
    }

    public function test_resync_desde_biotime_reemplaza_codigo_acceso_legacy_por_emp_code(): void
    {
        $empleado = Empleado::withoutTenant()->create([
            'nombres' => 'Lucia',
            'apellidos' => 'Fernandez',
            'documento_identidad' => '998877',
            'codigo_acceso' => '10100001',
            'empresa_id' => $this->empresa->id,
            'sucursal_id' => $this->sucursal->id,
            'status' => true,
        ]);

        BiotimeEmpleado::create([
            'empresa_id' => $this->empresa->id,
            'empleado_id' => $empleado->id,
            'biotime_id' => '11223344-be94-11f1-991f-0a58a9feac02',
            'emp_code' => '543210',
            'first_name' => 'Lucia',
            'last_name' => 'Fernandez',
            'link_status' => 'manual',
        ]);

        $this->fakeBioTimeSync([
            [
                'id' => '11223344-be94-11f1-991f-0a58a9feac02',
                'emp_code' => '543210',
                'first_name' => 'Lucia',
                'last_name' => 'Fernandez',
            ],
        ]);

        $res = BioTimeSyncService::for($this->empresa)->sync($this->empresa);
        $this->assertTrue($res['ok'], json_encode($res['errors']));

        $empleado->refresh();
        $this->assertSame('543210', $empleado->documento_identidad);
        $this->assertSame('543210', $empleado->codigo_acceso);
    }

    public function test_modelo_y_crud_de_empleados_mantienen_un_solo_codigo(): void
    {
        $directo = Empleado::withoutTenant()->create([
            'nombres' => 'Luis',
            'apellidos' => 'Vega',
            'documento_identidad' => '456789',
            'empresa_id' => $this->empresa->id,
            'sucursal_id' => $this->sucursal->id,
            'status' => true,
        ]);

        $this->assertSame('456789', $directo->documento_identidad);
        $this->assertSame('456789', $directo->codigo_acceso);

        $this->actingAs($this->admin)
            ->post('/admin/empleados', [
                'nombres' => 'Sofia',
                'apellidos' => 'Gomez',
                'documento_identidad' => '654321',
                'codigo_acceso' => '',
                'departamento_id' => $this->departamento->id,
                'responsable_id' => $this->responsable->id,
                'empresa_id' => $this->empresa->id,
                'sucursal_id' => $this->sucursal->id,
                'user_id' => $this->admin->id,
                'status' => 1,
            ])
            ->assertSessionHasNoErrors();

        $sofia = Empleado::withoutTenant()->where('documento_identidad', '654321')->firstOrFail();
        $this->assertSame('654321', $sofia->codigo_acceso);

        $this->actingAs($this->admin)
            ->put("/admin/empleados/{$sofia->id}", [
                'nombres' => 'Sofia',
                'apellidos' => 'Gomez',
                'documento_identidad' => '654321',
                'codigo_acceso' => '777888',
                'departamento_id' => $this->departamento->id,
                'responsable_id' => $this->responsable->id,
                'empresa_id' => $this->empresa->id,
                'sucursal_id' => $this->sucursal->id,
                'user_id' => $this->admin->id,
                'status' => 1,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('777888', $sofia->fresh()->codigo_acceso);

        // Si en edición limpian codigo_acceso, no queda nulo ni genera uno distinto al N° de empleado
        $this->actingAs($this->admin)
            ->put("/admin/empleados/{$sofia->id}", [
                'nombres' => 'Sofia',
                'apellidos' => 'Gomez',
                'documento_identidad' => '654321',
                'codigo_acceso' => '',
                'departamento_id' => $this->departamento->id,
                'responsable_id' => $this->responsable->id,
                'empresa_id' => $this->empresa->id,
                'sucursal_id' => $this->sucursal->id,
                'user_id' => $this->admin->id,
                'status' => 1,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('654321', $sofia->fresh()->codigo_acceso);
    }

    public function test_enrolamiento_alinea_codigo_con_biotime_por_curp_sin_duplicar_y_con_push_apagado(): void
    {
        BiotimeDepartamento::create([
            'empresa_id' => $this->empresa->id,
            'biotime_id' => 1,
            'dept_code' => '1',
            'dept_name' => 'Department',
        ]);
        BiotimeCargo::create([
            'empresa_id' => $this->empresa->id,
            'biotime_id' => 1,
            'position_code' => '1',
            'position_name' => 'General',
        ]);

        // Caso A: biotime_push activo, empleado temporal coincide por CURP con espejo existente de BioTime
        $empleadoCurp = Empleado::withoutTenant()->create([
            'nombres' => 'Maria',
            'apellidos' => 'Lopez',
            'documento_identidad' => 'TEMP01',
            'codigo_acceso' => '10100001',
            'curp' => 'LOLM900517MDFRZN01',
            'empresa_id' => $this->empresa->id,
            'sucursal_id' => $this->sucursal->id,
            'status' => true,
        ]);

        $espejoCurp = BiotimeEmpleado::create([
            'empresa_id' => $this->empresa->id,
            'biotime_id' => '77',
            'emp_code' => '888111',
            'first_name' => 'Maria',
            'last_name' => 'Lopez',
            'national' => 'LOLM900517MDFRZN01',
            'link_status' => 'unmatched',
        ]);

        $postRealizados = [];
        Http::swap(new \Illuminate\Http\Client\Factory);
        Http::preventStrayRequests();
        Http::fake(function (Request $r) use (&$postRealizados) {
            $path = parse_url($r->url(), PHP_URL_PATH);

            if (str_ends_with($path, '/jwt-api-token-auth/')) {
                return Http::response(['token' => 't']);
            }
            if ($path === '/personnel/api/employees/' && $r->method() === 'POST') {
                $postRealizados[] = $r->data();

                return Http::response(['id' => '999', 'emp_code' => '999'], 201);
            }
            if (str_contains($path, '/personnel/api/employees/77') && $r->method() === 'PATCH') {
                return Http::response([
                    'id' => '77',
                    'emp_code' => '888111',
                    'first_name' => 'Maria',
                    'last_name' => 'Lopez',
                    'gender' => 'F',
                    'birthday' => '1990-05-17',
                ]);
            }
            if (str_contains($path, '/iclock/api/bio_photo/')) {
                return Http::response(['detail' => 'Forbidden'], 403);
            }

            return Http::response(['count' => 0, 'next' => null, 'previous' => null, 'data' => []]);
        });

        app(EmpleadoEnrolamientoService::class)->guardar($empleadoCurp, [
            'aviso_privacidad' => true,
            'foto_empleado' => $this->fotoBase64(),
            'foto_empleado_2' => $this->fotoBase64(),
            'genero' => 'F',
            'fecha_nacimiento' => '1990-05-17',
        ]);

        $this->assertCount(0, $postRealizados, 'No debe crear duplicado en BioTime cuando coincide por CURP.');
        $this->assertSame($empleadoCurp->id, (int) $espejoCurp->fresh()->empleado_id);
        $empleadoCurp->refresh();
        $this->assertSame('888111', $empleadoCurp->documento_identidad);
        $this->assertSame('888111', $empleadoCurp->codigo_acceso);

        // Caso B: biotime_push apagado pero colaborador ya vinculado a BiotimeEmpleado
        $this->empresa->update(['biotime_push' => false]);

        $empleadoPushOff = Empleado::withoutTenant()->create([
            'nombres' => 'Pedro',
            'apellidos' => 'Ruiz',
            'documento_identidad' => 'LEGACY02',
            'codigo_acceso' => '10100002',
            'empresa_id' => $this->empresa->id,
            'sucursal_id' => $this->sucursal->id,
            'status' => true,
        ]);

        BiotimeEmpleado::create([
            'empresa_id' => $this->empresa->id,
            'empleado_id' => $empleadoPushOff->id,
            'biotime_id' => '88',
            'emp_code' => '333444',
            'first_name' => 'Pedro',
            'last_name' => 'Ruiz',
            'link_status' => 'manual',
        ]);

        app(EmpleadoEnrolamientoService::class)->guardar($empleadoPushOff, [
            'aviso_privacidad' => true,
            'foto_empleado' => $this->fotoBase64(),
            'foto_empleado_2' => $this->fotoBase64(),
            'genero' => 'M',
            'fecha_nacimiento' => '1988-03-10',
        ]);

        $empleadoPushOff->refresh();
        $this->assertSame('333444', $empleadoPushOff->documento_identidad);
        $this->assertSame('333444', $empleadoPushOff->codigo_acceso);
    }

    public function test_invitar_vincular_alta_app_y_busquedas_usan_el_mismo_id_con_aislamiento_tenant(): void
    {
        $otraEmpresa = Empresa::create([
            'razon_social' => 'Otra Planta',
            'documento' => 'RFC-OTRA-99',
            'status' => true,
        ]);
        $empleadoAjeno = Empleado::withoutTenant()->create([
            'nombres' => 'Ajeno',
            'apellidos' => 'Externo',
            'documento_identidad' => '990011',
            'empresa_id' => $otraEmpresa->id,
            'status' => true,
        ]);

        // 1. Invitar creando nuevo empleado en enrolamiento genera un solo código
        $this->actingAs($this->admin)
            ->postJson('/admin/empleados/enrolamiento/invitar', [
                'nombres' => 'Elena',
                'apellidos' => 'Torres',
                'documento_identidad' => '112233',
                'departamento_id' => $this->departamento->id,
                'canal' => 'correo',
                'correo' => 'elena@example.com',
            ])
            ->assertOk()
            ->assertJsonPath('empleado.documento_identidad', '112233')
            ->assertJsonPath('empleado.codigo_acceso', '112233');

        // Aislamiento tenant al invitar con empleado_id de otra empresa
        $this->actingAs($this->admin)
            ->postJson('/admin/empleados/enrolamiento/invitar', [
                'empleado_id' => $empleadoAjeno->id,
                'canal' => 'correo',
                'correo' => 'ajeno@example.com',
            ])
            ->assertNotFound();

        // 2. Vincular manualmente en BioTime alinea documento_identidad y codigo_acceso al emp_code de BioTime
        $userEmpleado = User::factory()->create([
            'empresa_id' => $this->empresa->id,
            'status' => 'activo',
        ]);
        $empleadoLocal = Empleado::withoutTenant()->create([
            'nombres' => 'Marco',
            'apellidos' => 'Diaz',
            'documento_identidad' => 'TEMP99',
            'codigo_acceso' => '10100009',
            'empresa_id' => $this->empresa->id,
            'sucursal_id' => $this->sucursal->id,
            'user_id' => $userEmpleado->id,
            'permite_app_movil' => true,
            'status' => true,
        ]);

        $bio = BiotimeEmpleado::create([
            'empresa_id' => $this->empresa->id,
            'biotime_id' => '55',
            'emp_code' => '224466',
            'first_name' => 'Marco',
            'last_name' => 'Diaz',
            'link_status' => 'unmatched',
        ]);

        $this->actingAs($this->admin)
            ->putJson("/admin/biotime/empleados/{$bio->id}/vincular", [
                'empleado_id' => $empleadoAjeno->id,
            ])
            ->assertNotFound();

        $this->actingAs($this->admin)
            ->put("/admin/biotime/empleados/{$bio->id}/vincular", [
                'empleado_id' => $empleadoLocal->id,
            ])
            ->assertSessionHasNoErrors();

        $empleadoLocal->refresh();
        $this->assertSame('224466', $empleadoLocal->documento_identidad);
        $this->assertSame('224466', $empleadoLocal->codigo_acceso);

        // 3. Alta rápida desde la app móvil de kiosko usa el mismo código
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/reloj-checador/empleados', [
                'numero' => '335577',
                'nombres' => 'Rosa',
                'apellidos' => 'Silva',
                'departamento_id' => $this->departamento->id,
            ])
            ->assertStatus(201);

        $rosa = Empleado::withoutTenant()->where('documento_identidad', '335577')->firstOrFail();
        $this->assertSame('335577', $rosa->codigo_acceso);

        // 4. Búsquedas en kiosko y login móvil encuentran al empleado usando el ID único de BioTime
        $this->actingAs($this->admin)
            ->postJson('/admin/api/reloj-checador/buscar', ['query' => '224466'])
            ->assertOk()
            ->assertJsonPath('empleado.numero', '224466')
            ->assertJsonPath('empleado.codigo_acceso', '224466');

        $this->actingAs($this->admin)
            ->postJson('/admin/api/reloj-checador/buscar-enrolamiento', ['numero' => '224466'])
            ->assertOk()
            ->assertJsonPath('empleados.0.numero', '224466')
            ->assertJsonPath('empleados.0.codigo_acceso', '224466');

        $this->postJson('/api/login-empleado', ['codigo_acceso' => '224466'])
            ->assertOk()
            ->assertJson(['success' => true]);
    }

    public function test_enrolamiento_busca_por_codigo_nuevo_y_codigo_anterior_y_biotime_recibe_solo_codigo_nuevo(): void
    {
        BiotimeDepartamento::create([
            'empresa_id' => $this->empresa->id,
            'biotime_id' => 1,
            'dept_code' => '1',
            'dept_name' => 'General',
        ]);

        $postRealizados = [];
        $idCounter = 770;
        Http::swap(new \Illuminate\Http\Client\Factory);
        Http::preventStrayRequests();
        Http::fake(function (Request $r) use (&$postRealizados, &$idCounter) {
            $path = parse_url($r->url(), PHP_URL_PATH);

            if (str_ends_with($path, '/jwt-api-token-auth/')) {
                return Http::response(['token' => 't']);
            }
            if ($path === '/personnel/api/employees/' && $r->method() === 'GET') {
                return Http::response(['count' => 0, 'data' => []]);
            }
            if ($path === '/personnel/api/employees/' && $r->method() === 'POST') {
                $postRealizados[] = $r->data();
                $idCounter++;

                return Http::response([
                    'id' => $idCounter,
                    'emp_code' => $r->data()['emp_code'] ?? '990001',
                    'first_name' => $r->data()['first_name'] ?? 'Juan',
                    'last_name' => $r->data()['last_name'] ?? 'Perez',
                ], 201);
            }

            return Http::response([], 200);
        });

        // 1. Crear colaborador con código nuevo y código anterior
        $this->actingAs($this->admin)
            ->post('/admin/empleados', [
                'nombres' => 'Juan',
                'apellidos' => 'Perez',
                'codigo_nuevo' => '990001',
                'codigo_anterior' => 'OLD-1234',
                'departamento_id' => $this->departamento->id,
                'responsable_id' => $this->responsable->id,
                'empresa_id' => $this->empresa->id,
                'sucursal_id' => $this->sucursal->id,
                'user_id' => $this->admin->id,
                'status' => 1,
            ])
            ->assertSessionHasNoErrors();

        $empleado = Empleado::withoutTenant()->where('codigo_nuevo', '990001')->firstOrFail();
        $this->assertSame('990001', $empleado->documento_identidad);
        $this->assertSame('OLD-1234', $empleado->codigo_anterior);

        // 2. Comprobar que BioTime recibió el código nuevo (990001) y NUNCA el código anterior (OLD-1234)
        $this->assertNotEmpty($postRealizados);
        $this->assertSame('990001', $postRealizados[0]['emp_code']);
        $this->assertNotSame('OLD-1234', $postRealizados[0]['emp_code']);

        // 3. Búsqueda de enrolamiento en el Kiosko por CÓDIGO ANTERIOR
        $resBusquedaAnt = $this->actingAs($this->admin)
            ->postJson('/admin/api/reloj-checador/buscar-enrolamiento', ['numero' => 'OLD-1234']);
        $resBusquedaAnt->assertOk()
            ->assertJsonPath('empleados.0.id', $empleado->id)
            ->assertJsonPath('empleados.0.codigo_nuevo', '990001')
            ->assertJsonPath('empleados.0.codigo_anterior', 'OLD-1234');

        // 4. Búsqueda de enrolamiento en el Kiosko por CÓDIGO NUEVO
        $resBusquedaNuevo = $this->actingAs($this->admin)
            ->postJson('/admin/api/reloj-checador/buscar-enrolamiento', ['numero' => '990001']);
        $resBusquedaNuevo->assertOk()
            ->assertJsonPath('empleados.0.id', $empleado->id)
            ->assertJsonPath('empleados.0.codigo_nuevo', '990001')
            ->assertJsonPath('empleados.0.codigo_anterior', 'OLD-1234');

        // 5. Búsqueda general en RegistroMarcajeService por ambos códigos
        $service = app(\App\Services\RegistroMarcajeService::class);
        $encontradoPorAnt = $service->buscarEmpleado('OLD-1234', $this->empresa->id);
        $this->assertNotNull($encontradoPorAnt);
        $this->assertSame($empleado->id, $encontradoPorAnt->id);

        $encontradoPorNuevo = $service->buscarEmpleado('990001', $this->empresa->id);
        $this->assertNotNull($encontradoPorNuevo);
        $this->assertSame($empleado->id, $encontradoPorNuevo->id);

        // 6. Invitación de enrolamiento para empleado existente
        $resInvitar = $this->actingAs($this->admin)
            ->postJson('/admin/empleados/enrolamiento/invitar', [
                'empleado_id' => $empleado->id,
                'canal' => 'correo',
                'correo' => 'juan.perez@example.com',
            ]);
        $resInvitar->assertOk()
            ->assertJsonPath('empleado.id', $empleado->id);

        // 7. Invitación de enrolamiento con nuevo colaborador registrando ambos códigos
        $resInvitarNuevo = $this->actingAs($this->admin)
            ->postJson('/admin/empleados/enrolamiento/invitar', [
                'nombres' => 'Carlos',
                'apellidos' => 'Lopez',
                'codigo_nuevo' => '990002',
                'codigo_anterior' => 'OLD-5678',
                'canal' => 'correo',
                'correo' => 'carlos.lopez@example.com',
            ]);
        $resInvitarNuevo->assertOk();

        $carlos = Empleado::withoutTenant()->where('codigo_nuevo', '990002')->first();
        $this->assertNotNull($carlos);
        $this->assertSame('990002', $carlos->documento_identidad);
        $this->assertSame('OLD-5678', $carlos->codigo_anterior);
    }
}
