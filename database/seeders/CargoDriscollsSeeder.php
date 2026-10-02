<?php

namespace Database\Seeders;

use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Database\Seeder;

class CargoDriscollsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $empresa = Empresa::where('razon_social', "Driscoll's")->first() ?: Empresa::first();
        if (! $empresa) {
            return;
        }
        $empresaId = $empresa->id;

        $sucursal = Sucursal::where('empresa_id', $empresaId)->first() ?: Sucursal::first();
        if (! $sucursal) {
            return;
        }
        $sucursalId = $sucursal->id;

        $user = User::where('email', 'superadmin@example.com')->first() ?: User::first();
        $userId = $user ? $user->id : 1;

        // Cargos organizados por departamento para Driscoll's
        $cargosPorDepartamento = [
            'Empaque' => [
                ['nombre' => 'Supervisor de Empaque', 'descripcion' => 'Supervisión de líneas de empaque y embalaje de berries.'],
                ['nombre' => 'Operador de Maquinaria de Empaque', 'descripcion' => 'Manejo de etiquetadoras, selladoras y pesadoras automáticas.'],
                ['nombre' => 'Auxiliar de Empaque', 'descripcion' => 'Apoyo en selección, clasificación y empacado final.'],
            ],
            'Recepcion fruta' => [
                ['nombre' => 'Supervisor de Recepción de Fruta', 'descripcion' => 'Coordinación de la recepción de fruta fresca proveniente de campo.'],
                ['nombre' => 'Inspector de Recepción y Muestreo', 'descripcion' => 'Toma de muestras, control de temperatura y pesaje de fruta recibida.'],
            ],
            'Embarques' => [
                ['nombre' => 'Jefe de Embarques', 'descripcion' => 'Planificación y despacho de cargamentos para exportación y mercado nacional.'],
                ['nombre' => 'Auxiliar de Embarques y Carga', 'descripcion' => 'Carga de camiones y verificación de guías de despacho.'],
            ],
            'Logistica' => [
                ['nombre' => 'Coordinador de Logística y Cadena de Frío', 'descripcion' => 'Gestión de rutas terrestres y mantenimiento de la cadena de frío.'],
                ['nombre' => 'Analista de Rutas y Transporte', 'descripcion' => 'Seguimiento satelital y coordinación con transportistas.'],
            ],
            'Estimados' => [
                ['nombre' => 'Analista de Estimados de Cosecha', 'descripcion' => 'Proyección de rendimientos y volúmenes de producción agrícola.'],
                ['nombre' => 'Coordinador de Datos Agrícolas', 'descripcion' => 'Consolidación de reportes de campo y proyecciones semanales.'],
            ],
            'Supply' => [
                ['nombre' => 'Coordinador de Cadena de Suministro', 'descripcion' => 'Gestión de insumos agrícolas, empaques y materiales de producción.'],
                ['nombre' => 'Analista de Inventario y Compras', 'descripcion' => 'Control de stock en almacén e interacción con proveedores.'],
            ],
            'Produccion' => [
                ['nombre' => 'Gerente de Producción Agrícola', 'descripcion' => 'Dirección general de cultivos, cosecha y rendimiento de campos.'],
                ['nombre' => 'Supervisor de Campo', 'descripcion' => 'Supervisión directa de las cuadrillas de cosecha y cultivo.'],
            ],
            'Distribucion' => [
                ['nombre' => 'Supervisor de Distribución', 'descripcion' => 'Coordinación del reparto a centros de distribución y clientes.'],
                ['nombre' => 'Chofer de Distribución', 'descripcion' => 'Conducción de unidades refrigeradas de reparto.'],
            ],
            'Planeacion de cosecha' => [
                ['nombre' => 'Planificador de Cosecha', 'descripcion' => 'Programación de calendarios de corte de fruta según maduración y demanda.'],
                ['nombre' => 'Auxiliar de Planeación Agrícola', 'descripcion' => 'Registro de datos de floración, maduración y lotes de cultivo.'],
            ],
            'Inocuidad' => [
                ['nombre' => 'Coordinador de Inocuidad Alimentaria', 'descripcion' => 'Aseguramiento del cumplimiento de normas PrimusGFS y GlobalGAP.'],
                ['nombre' => 'Auditor de Inocuidad e Higiene', 'descripcion' => 'Inspecciones periódicas de sanitización e higiene en instalaciones.'],
            ],
            'MTTO' => [
                ['nombre' => 'Jefe de Mantenimiento Industrial', 'descripcion' => 'Planificación del mantenimiento preventivo y correctivo de planta.'],
                ['nombre' => 'Técnico de Refrigeración y Mantenimiento', 'descripcion' => 'Mantenimiento de cuartos fríos, coolers y maquinaria.'],
            ],
            'Seguridad' => [
                ['nombre' => 'Coordinador de Seguridad Industrial y EHS', 'descripcion' => 'Prevención de riesgos laborales, salud ocupacional y normativas EHS.'],
                ['nombre' => 'Inspector de Seguridad e Higiene', 'descripcion' => 'Verificación de equipo de protección personal y protocolos de seguridad.'],
            ],
            'Calidad' => [
                ['nombre' => 'Gerente de Aseguramiento de Calidad', 'descripcion' => 'Garantía de estándares de calidad de fruta de exportación.'],
                ['nombre' => 'Inspector de Calidad de Fruta', 'descripcion' => 'Evaluación de firmeza, brix, color y defectos en fruta.'],
            ],
            'RH' => [
                ['nombre' => 'Gerente de Recursos Humanos', 'descripcion' => 'Dirección estratégica de gestión humana, nómina y relaciones laborales.'],
                ['nombre' => 'Analista de Reclutamiento y Selección', 'descripcion' => 'Atracción de talento, contratación de personal eventual y permanente.'],
                ['nombre' => 'Generalista de RH', 'descripcion' => 'Atención a empleados, control de asistencia y beneficios.'],
            ],
            'Vigilancia' => [
                ['nombre' => 'Supervisor de Vigilancia y Control de Acceso', 'descripcion' => 'Supervisión de la garita principal y resguardo del perímetro.'],
                ['nombre' => 'Oficial de Seguridad Patrimonial', 'descripcion' => 'Registro de entradas/salidas de visitantes, empleados y vehículos.'],
            ],
            'Auxiliar de Limpieza' => [
                ['nombre' => 'Encargado de Sanitización de Planta', 'descripcion' => 'Limpieza y desinfección profunda de áreas operativas y empaque.'],
                ['nombre' => 'Auxiliar de Servicios Generales', 'descripcion' => 'Mantenimiento del orden y limpieza en oficinas y áreas comunes.'],
            ],
            'Sup Cooler' => [
                ['nombre' => 'Supervisor de Cooler', 'descripcion' => 'Control de pre-enfriado, túneles de frío y almacenamiento refrigerado.'],
                ['nombre' => 'Operador de Tunel de Frío', 'descripcion' => 'Manejo de temperatura y flujo de aire en túneles de congelación/enfriamiento.'],
            ],
        ];

        // Sembrar cargos en la base de datos
        foreach ($cargosPorDepartamento as $deptoNombre => $listaCargos) {
            $depto = Departamento::where('nombre', $deptoNombre)
                ->where('empresa_id', $empresaId)
                ->first();

            if (! $depto) {
                // Fallback si no encuentra por empresa_id estricto
                $depto = Departamento::where('nombre', $deptoNombre)->first();
            }

            if (! $depto) {
                continue;
            }

            foreach ($listaCargos as $cargoData) {
                Cargo::updateOrCreate(
                    [
                        'nombre' => $cargoData['nombre'],
                        'departamento_id' => $depto->id,
                        'empresa_id' => $empresaId,
                    ],
                    [
                        'descripcion' => $cargoData['descripcion'] ?? null,
                        'sucursal_id' => $sucursalId,
                        'user_id' => $userId,
                        'status' => 1,
                    ]
                );
            }
        }
    }
}
