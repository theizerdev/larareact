<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\TipoServicio;
use App\Models\User;
use Illuminate\Database\Seeder;

class TipoServicioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $empresas = Empresa::all();

        if ($empresas->isEmpty()) {
            $this->command->warn('No se encontraron empresas. Se omite el seeder de TipoServicio.');
            return;
        }

        $user = User::where('email', 'superadmin@example.com')->first() ?: User::first();

        $tiposServicio = [
            [
                'nombre'     => 'Entrega de pedidos',
                'descripcion' => 'Visita para entrega de pedidos.',
            ],
            [
                'nombre'     => 'Visita de Servicio',
                'descripcion' => 'Visita para trabajos de mantenimiento preventivo o correctivo.',
            ],
            [
                'nombre'     => 'Visita de Instalación',
                'descripcion' => 'Visita para instalación, configuración o soporte técnico de equipos.',
            ],
            [
                'nombre'     => 'Reunión',
                'descripcion' => 'Visita para asistir a una reunión con personal interno.',
            ],
            [
                'nombre'     => 'Entrevista',
                'descripcion' => 'Visita para proceso de selección o entrevista laboral.',
            ],
            [
                'nombre'     => 'Entrega de Materiales',
                'descripcion' => 'Visita para entrega o recepción de materiales, equipos o documentos.',
            ],
            [
                'nombre'     => 'Auditoría',
                'descripcion' => 'Visita para realización de auditoría interna o externa.',
            ],
            [
                'nombre'     => 'Capacitación',
                'descripcion' => 'Visita para impartir o recibir capacitación o formación.',
            ],
            [
                'nombre'     => 'Visita Comercial',
                'descripcion' => 'Visita de representante comercial, proveedor o cliente.',
            ],
            [
                'nombre'     => 'Servicio Técnico',
                'descripcion' => 'Visita para instalación, configuración o soporte técnico de equipos.',
            ],
            [
                'nombre'     => 'Otros',
                'descripcion' => 'Tipo de visita no contemplada en las categorías anteriores.',
            ],
        ];

        foreach ($empresas as $empresa) {
            $sucursal = Sucursal::where('empresa_id', $empresa->id)->first();

            foreach ($tiposServicio as $tipo) {
                TipoServicio::updateOrCreate(
                    [
                        'nombre'     => $tipo['nombre'],
                        'empresa_id' => $empresa->id,
                    ],
                    [
                        'sucursal_id' => $sucursal?->id,
                        'user_id'     => $user?->id ?? 1,
                        'status'      => 1,
                    ]
                );
            }

            $this->command->info("✓ Tipos de servicio sembrados para: {$empresa->razon_social}");
        }
    }
}
