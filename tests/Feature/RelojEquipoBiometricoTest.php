<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\RelojEquipoBiometrico;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class RelojEquipoBiometricoTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Empresa $empresa;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->empresa = Empresa::create([
            'razon_social' => 'Smurfit Westrock Planta Test',
            'documento' => 'RFC-SMURFIT-TEST',
            'status' => true,
        ]);

        $this->user = User::factory()->create(['empresa_id' => $this->empresa->id]);
        $this->user->givePermissionTo(Permission::firstOrCreate(['name' => 'asistencia.configuracion', 'guard_name' => 'web']));
    }

    public function test_can_view_biometricos_setup_index(): void
    {
        $response = $this->actingAs($this->user)->get('/admin/asistencia/biometricos-setup');
        $response->assertStatus(200);
    }

    public function test_can_create_biometrico_with_inicial_final_and_instalacion_data(): void
    {
        // 1x1 transparent png in base64
        $fakeBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $payload = [
            'empresa_id' => $this->empresa->id,
            'localidad_nombre' => 'TIJUANA PLANTA 1',
            'numero_localidad' => 42,
            'legacy' => 'fSK NA',
            'ubicacion_fisica' => 'Caseta Principal Entrada',

            // Características de Instalación
            'dimensiones' => '150 x 80 x 30 mm',
            'instalacion_fisica' => 'Montaje en pared con soporte metálico',
            'instalacion_comentario' => 'Conexión PoE directa a switch de caseta',
            'instalacion_foto' => $fakeBase64,

            // Equipo Inicial
            'actual_marca' => 'ZKTeco',
            'actual_modelo' => 'iFace 800',
            'actual_no_serie' => 'SN-ACTUAL-1234',
            'actual_ip' => '192.168.1.50',
            'actual_mascara' => '255.255.255.0',
            'actual_gateway' => '192.168.1.1',
            'actual_mac_address' => '00:11:22:33:44:55',
            'actual_instalado' => true,
            'actual_comentario' => 'Equipo anterior en funcionamiento',
            'actual_foto' => $fakeBase64,

            // Equipo Final
            'nuevo_marca' => 'ZKTeco',
            'nuevo_modelo' => 'SpeedFace-V5L',
            'nuevo_no_serie' => 'SN-NUEVO-9876',
            'nuevo_ip' => '192.168.1.60',
            'nuevo_mascara' => '255.255.255.0',
            'nuevo_gateway' => '192.168.1.1',
            'nuevo_mac_address' => '66:77:88:99:AA:BB',
            'nuevo_instalado' => false,
            'nuevo_comentario' => 'Por montar en soporte nuevo',
            'nuevo_foto' => $fakeBase64,

            'activo' => true,
        ];

        $response = $this->actingAs($this->user)->post('/admin/asistencia/biometricos-setup', $payload);
        $response->assertRedirect();
        $response->assertSessionHas('notification.type', 'success');

        $this->assertDatabaseHas('reloj_equipos_biometricos', [
            'localidad_nombre' => 'TIJUANA PLANTA 1',
            'numero_localidad' => 42,
            'dimensiones' => '150 x 80 x 30 mm',
            'instalacion_fisica' => 'Montaje en pared con soporte metálico',
            'actual_marca' => 'ZKTeco',
            'actual_modelo' => 'iFace 800',
            'actual_mac_address' => '00:11:22:33:44:55',
            'nuevo_marca' => 'ZKTeco',
            'nuevo_modelo' => 'SpeedFace-V5L',
            'nuevo_mac_address' => '66:77:88:99:AA:BB',
        ]);

        $biometrico = RelojEquipoBiometrico::first();
        $this->assertNotNull($biometrico->actual_foto);
        $this->assertNotNull($biometrico->nuevo_foto);
        $this->assertNotNull($biometrico->instalacion_foto);

        Storage::disk('public')->assertExists(str_replace('/storage/', '', $biometrico->actual_foto));
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $biometrico->nuevo_foto));
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $biometrico->instalacion_foto));
    }

    public function test_can_update_biometrico_and_delete_with_files_cleaned(): void
    {
        $fakeBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $biometrico = RelojEquipoBiometrico::create([
            'empresa_id' => $this->empresa->id,
            'localidad_nombre' => 'MEXICALI',
            'numero_localidad' => 10,
            'ubicacion_fisica' => 'Comedor',
            'dimensiones' => '100x100mm',
            'instalacion_fisica' => 'Pared',
            'actual_marca' => 'Suprema',
            'actual_modelo' => 'BioStation 2',
            'actual_mac_address' => 'AA:BB:CC:DD:EE:FF',
            'activo' => true,
        ]);

        $updatePayload = [
            'empresa_id' => $this->empresa->id,
            'localidad_nombre' => 'MEXICALI CENTRAL',
            'numero_localidad' => 10,
            'ubicacion_fisica' => 'Comedor Principal',
            'dimensiones' => '120x120mm',
            'instalacion_fisica' => 'Pedestal de aluminio',
            'instalacion_comentario' => 'Actualizado a pedestal',
            'instalacion_foto' => $fakeBase64,
            'actual_marca' => 'Suprema Updated',
            'actual_modelo' => 'BioStation 3',
            'actual_mac_address' => '11:22:33:44:55:66',
            'actual_instalado' => true,
            'nuevo_marca' => 'ZKTeco',
            'nuevo_modelo' => 'ProFace X',
            'nuevo_mac_address' => '77:88:99:00:11:22',
            'nuevo_instalado' => true,
            'nuevo_foto' => $fakeBase64,
            'activo' => true,
        ];

        $response = $this->actingAs($this->user)->put("/admin/asistencia/biometricos-setup/{$biometrico->id}", $updatePayload);
        $response->assertRedirect();
        $response->assertSessionHas('notification.type', 'success');

        $biometrico->refresh();
        $this->assertSame('MEXICALI CENTRAL', $biometrico->localidad_nombre);
        $this->assertSame('120x120mm', $biometrico->dimensiones);
        $this->assertSame('Pedestal de aluminio', $biometrico->instalacion_fisica);
        $this->assertSame('Suprema Updated', $biometrico->actual_marca);
        $this->assertNotNull($biometrico->instalacion_foto);
        $this->assertNotNull($biometrico->nuevo_foto);

        $instalacionPath = str_replace('/storage/', '', $biometrico->instalacion_foto);
        $nuevoPath = str_replace('/storage/', '', $biometrico->nuevo_foto);
        Storage::disk('public')->assertExists($instalacionPath);
        Storage::disk('public')->assertExists($nuevoPath);

        // Delete test
        $delResponse = $this->actingAs($this->user)->delete("/admin/asistencia/biometricos-setup/{$biometrico->id}");
        $delResponse->assertRedirect();
        $this->assertDatabaseMissing('reloj_equipos_biometricos', ['id' => $biometrico->id]);
        Storage::disk('public')->assertMissing($instalacionPath);
        Storage::disk('public')->assertMissing($nuevoPath);
    }
}

