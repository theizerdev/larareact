<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Proveedor;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;

class ProveedorSeeder extends Seeder
{
    /**
     * Seeder con proveedores de servicios de comedor, catering e insumos
     * industriales para las sedes y plantas de Smurfit Westrock.
     */
    public function run(): void
    {
        $empresa = Empresa::first();
        if (! $empresa) {
            $empresa = Empresa::create([
                'razon_social' => 'Smurfit Westrock México S.A. de C.V.',
                'documento' => 'SMU-MEX-01',
            ]);
        }

        $sucursal = Sucursal::where('empresa_id', $empresa->id)->first() ?? Sucursal::first();
        $pais = Pais::where('codigo_iso2', 'MX')->first() ?? Pais::first();
        $paisId = $pais?->id;
        $paisTelefonoId = $pais?->id;

        $proveedores = [
            [
                'documento_identidad' => 'PROV-0001',
                'razon_social' => 'Sodexo México S.A. de C.V.',
                'nombre_comercial' => 'Sodexo Servicios de Comedor Industrial',
                'rfc' => 'SOD9203158R2',
                'curp' => 'MEMC800512HDFRRL01',
                'responsable' => 'Lic. Carlos Mendoza Morales',
                'telefono' => '5551234567',
                'direccion' => 'Av. Insurgentes Sur 1602, Crédito Constructor, Benito Juárez, CDMX',
                'status' => 'activo',
            ],
            [
                'documento_identidad' => 'PROV-0002',
                'razon_social' => 'Compass Group México S.A. de C.V.',
                'nombre_comercial' => 'Eurest Comedores Corporativos y Catering',
                'rfc' => 'CGM980512KL4',
                'curp' => 'VARM850720MDFNZA02',
                'responsable' => 'Ing. Mariana Valenzuela Ruiz',
                'telefono' => '5558901234',
                'direccion' => 'Paseo de la Reforma 222, Torre Corporativa, Cuauhtémoc, CDMX',
                'status' => 'activo',
            ],
            [
                'documento_identidad' => 'PROV-0003',
                'razon_social' => 'Alsea Alimentos y Comedores Industriales S.A. de C.V.',
                'nombre_comercial' => 'Alsea Foodservice Industrial',
                'rfc' => 'AAI041120HJ9',
                'curp' => 'GASR780315HNLRS09',
                'responsable' => 'Lic. Roberto Garza Sada',
                'telefono' => '8183456789',
                'direccion' => 'Av. Lázaro Cárdenas 2400, Valle Oriente, San Pedro Garza García, N.L.',
                'status' => 'activo',
            ],
            [
                'documento_identidad' => 'PROV-0004',
                'razon_social' => 'Operadora Gastronómica de Comedores del Bajío S.A. de C.V.',
                'nombre_comercial' => 'Gourmet Industrial Bajío',
                'rfc' => 'OGC110805TR1',
                'curp' => 'HEPS820914MQRNL03',
                'responsable' => 'Mtra. Sofía Hernández Peña',
                'telefono' => '4422345678',
                'direccion' => 'Parque Industrial Querétaro, Av. de la Montaña 112, Santa Rosa Jáuregui, QRO',
                'status' => 'activo',
            ],
            [
                'documento_identidad' => 'PROV-0005',
                'razon_social' => 'Alimentos Institucionales y Banquetes ALISSA S.A. de C.V.',
                'nombre_comercial' => 'ALISSA Comedores Empresariales',
                'rfc' => 'AIB150218NM3',
                'curp' => 'TOBA831102HDFRL05',
                'responsable' => 'Chef Alejandro Torres Bello',
                'telefono' => '5554321987',
                'direccion' => 'Calzada Vallejo 1030, Industrial Vallejo, Azcapotzalco, CDMX',
                'status' => 'activo',
            ],
            [
                'documento_identidad' => 'PROV-0006',
                'razon_social' => 'Servicios Integrales de Alimentación Smurfit S.A. de C.V.',
                'nombre_comercial' => 'Comedor Central Planta Smurfit',
                'rfc' => 'SIA190625PW5',
                'curp' => 'AGGP880410MDFRL08',
                'responsable' => 'Lic. Patricia Aguilar Gómez',
                'telefono' => '5557890123',
                'direccion' => 'Carretera México-Querétaro Km 43.5, Parque Industrial La Luz, Cuautitlán Izcalli, MEX',
                'status' => 'activo',
            ],
        ];

        foreach ($proveedores as $data) {
            Proveedor::updateOrCreate(
                ['documento_identidad' => $data['documento_identidad']],
                array_merge($data, [
                    'empresa_id' => $empresa->id,
                    'sucursal_id' => $sucursal?->id,
                    'pais_id' => $paisId,
                    'pais_telefono_id' => $paisTelefonoId,
                ])
            );
        }

        $this->command?->info('Seeder de Proveedores completado con éxito (' . count($proveedores) . ' proveedores activos registrados).');
    }
}
