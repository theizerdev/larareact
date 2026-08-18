<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Especialidad;
use App\Models\PlantillaConsulta;
use App\Models\User;
use Database\Seeders\EspecialidadesSeeder;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EspecialidadesAdaptativasTest extends TestCase
{
    use RefreshDatabase;

    public function test_especialidades_seeder_populates_all_branches_and_templates()
    {
        $this->seed(EspecialidadesSeeder::class);

        $this->assertDatabaseHas('ramas_medicas', ['slug' => 'medicina-humana']);
        $this->assertDatabaseHas('ramas_medicas', ['slug' => 'oftalmologia-optometria']);
        $this->assertDatabaseHas('ramas_medicas', ['slug' => 'odontologia']);
        $this->assertDatabaseHas('ramas_medicas', ['slug' => 'veterinaria']);

        $this->assertDatabaseHas('especialidades', ['codigo' => 'MED-GEN']);
        $this->assertDatabaseHas('especialidades', ['codigo' => 'OFT-GEN']);
        $this->assertDatabaseHas('especialidades', ['codigo' => 'ODONT-GEN']);
        $this->assertDatabaseHas('especialidades', ['codigo' => 'VET-PEQ']);
        $this->assertDatabaseHas('especialidades', ['codigo' => 'CIR-GEN']);
        $this->assertDatabaseHas('especialidades', ['codigo' => 'CIR-PED']);
        $this->assertDatabaseHas('especialidades', ['codigo' => 'GASTRO']);
        $this->assertDatabaseHas('especialidades', ['codigo' => 'MASTO']);
        $this->assertDatabaseHas('especialidades', ['codigo' => 'MED-INT']);
        $this->assertDatabaseHas('especialidades', ['codigo' => 'NEFRO']);
        $this->assertDatabaseHas('especialidades', ['codigo' => 'ORL']);
        $this->assertDatabaseHas('especialidades', ['codigo' => 'NEURO']);
        $this->assertDatabaseHas('especialidades', ['codigo' => 'NEUROCI']);

        $oftalmologia = Especialidad::where('codigo', 'OFT-GEN')->first();
        $this->assertNotNull($oftalmologia);

        $plantillaOftalmo = PlantillaConsulta::where('especialidad_id', $oftalmologia->id)->first();
        $this->assertNotNull($plantillaOftalmo);
        $this->assertIsArray($plantillaOftalmo->estructura_json);
    }

    public function test_empresa_can_assign_specialties_and_set_primary()
    {
        $this->seed(PermissionSeeder::class);
        $this->seed(RoleSeeder::class);
        $this->seed(EspecialidadesSeeder::class);

        $empresa = Empresa::create([
            'razon_social' => 'Centro Oftalmológico San Lucía',
            'documento' => 'J-77777777-7',
            'status' => 1,
        ]);

        $superAdminRole = Role::findByName('super-admin', 'web');
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->assignRole($superAdminRole);

        $this->actingAs($user);

        $oftalmo = Especialidad::where('codigo', 'OFT-GEN')->first();
        $optometria = Especialidad::where('codigo', 'OPT')->first();

        $response = $this->put(route('admin.empresas.especialidades.update', $empresa->id), [
            'especialidades' => [$oftalmo->id, $optometria->id],
            'especialidad_principal_id' => $oftalmo->id,
        ]);

        $response->assertRedirect();

        $this->assertTrue($empresa->especialidades->contains('id', $oftalmo->id));
        $this->assertTrue($empresa->especialidades->contains('id', $optometria->id));
    }
}
