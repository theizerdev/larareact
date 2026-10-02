<?php

namespace Database\Seeders;

use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Responsable;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Database\Seeder;

class ResponsableDriscollsSeeder extends Seeder
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

        $pais = Pais::where('codigo_iso2', 'MX')->first() ?: Pais::first();
        $paisId = $pais ? $pais->id : null;

        // Lista de responsables por departamento con datos realistas para Driscoll's
        $responsablesDefinicion = [
            'Empaque' => [
                ['nombres' => 'Carlos Alberto', 'apellidos' => 'Mendoza Ríos', 'cedula' => '24158963', 'telefono' => '3312457890', 'correo' => 'carlos.mendoza@driscolls.com', 'cargo' => 'Supervisor de Empaque'],
                ['nombres' => 'María Fernanda', 'apellidos' => 'Gómez López', 'cedula' => '25874136', 'telefono' => '3398745612', 'correo' => 'maria.gomez@driscolls.com', 'cargo' => 'Operador de Maquinaria de Empaque'],
            ],
            'Recepcion fruta' => [
                ['nombres' => 'José Luis', 'apellidos' => 'Hernández Silva', 'cedula' => '23654789', 'telefono' => '3315975346', 'correo' => 'jose.hernandez@driscolls.com', 'cargo' => 'Supervisor de Recepción de Fruta'],
            ],
            'Embarques' => [
                ['nombres' => 'Ricardo', 'apellidos' => 'Torres Morales', 'cedula' => '21458796', 'telefono' => '3324568713', 'correo' => 'ricardo.torres@driscolls.com', 'cargo' => 'Jefe de Embarques'],
            ],
            'Logistica' => [
                ['nombres' => 'Ana Patricia', 'apellidos' => 'Vargas Cruz', 'cedula' => '26987412', 'telefono' => '3336985214', 'correo' => 'ana.vargas@driscolls.com', 'cargo' => 'Coordinador de Logística y Cadena de Frío'],
            ],
            'Estimados' => [
                ['nombres' => 'Gabriel', 'apellidos' => 'Ramírez Peña', 'cedula' => '27412589', 'telefono' => '3314785236', 'correo' => 'gabriel.ramirez@driscolls.com', 'cargo' => 'Analista de Estimados de Cosecha'],
            ],
            'Supply' => [
                ['nombres' => 'Laura Elena', 'apellidos' => 'Castillo Marín', 'cedula' => '22369854', 'telefono' => '3325896314', 'correo' => 'laura.castillo@driscolls.com', 'cargo' => 'Coordinador de Cadena de Suministro'],
            ],
            'Produccion' => [
                ['nombres' => 'Fernando Javier', 'apellidos' => 'Aguilar Ortiz', 'cedula' => '20147852', 'telefono' => '3311223344', 'correo' => 'fernando.aguilar@driscolls.com', 'cargo' => 'Gerente de Producción Agrícola'],
                ['nombres' => 'Javier', 'apellidos' => 'Ríos Santos', 'cedula' => '28965412', 'telefono' => '3355667788', 'correo' => 'javier.rios@driscolls.com', 'cargo' => 'Supervisor de Campo'],
            ],
            'Distribucion' => [
                ['nombres' => 'Roberto', 'apellidos' => 'Navarro Gutiérrez', 'cedula' => '24569871', 'telefono' => '3399887766', 'correo' => 'roberto.navarro@driscolls.com', 'cargo' => 'Supervisor de Distribución'],
            ],
            'Planeacion de cosecha' => [
                ['nombres' => 'Sofía Guadalupe', 'apellidos' => 'Campos Reyes', 'cedula' => '29632581', 'telefono' => '3344556677', 'correo' => 'sofia.campos@driscolls.com', 'cargo' => 'Planificador de Cosecha'],
            ],
            'Inocuidad' => [
                ['nombres' => 'Beatriz Adriana', 'apellidos' => 'Soto Peralta', 'cedula' => '25413698', 'telefono' => '3377889900', 'correo' => 'beatriz.soto@driscolls.com', 'cargo' => 'Coordinador de Inocuidad Alimentaria'],
            ],
            'MTTO' => [
                ['nombres' => 'Ing. Miguel Ángel', 'apellidos' => 'Estrada Delgado', 'cedula' => '21789654', 'telefono' => '3312345678', 'correo' => 'miguel.estrada@driscolls.com', 'cargo' => 'Jefe de Mantenimiento Industrial'],
            ],
            'Seguridad' => [
                ['nombres' => 'Héctor Manuel', 'apellidos' => 'Valenzuela Castro', 'cedula' => '23987124', 'telefono' => '3387654321', 'correo' => 'hector.valenzuela@driscolls.com', 'cargo' => 'Coordinador de Seguridad Industrial y EHS'],
            ],
            'Calidad' => [
                ['nombres' => 'Dra. Claudia', 'apellidos' => 'Molina Paredes', 'cedula' => '26123456', 'telefono' => '3354321678', 'correo' => 'claudia.molina@driscolls.com', 'cargo' => 'Gerente de Aseguramiento de Calidad'],
            ],
            'RH' => [
                ['nombres' => 'Lic. Eduardo', 'apellidos' => 'Salazar Jiménez', 'cedula' => '20987654', 'telefono' => '3367891234', 'correo' => 'eduardo.salazar@driscolls.com', 'cargo' => 'Gerente de Recursos Humanos'],
                ['nombres' => 'Karen Paola', 'apellidos' => 'Meza Benítez', 'cedula' => '27654321', 'telefono' => '3378912345', 'correo' => 'karen.meza@driscolls.com', 'cargo' => 'Analista de Reclutamiento y Selección'],
            ],
            'Vigilancia' => [
                ['nombres' => 'Comandante Raúl', 'apellidos' => 'Pérez Domínguez', 'cedula' => '19876543', 'telefono' => '3389123456', 'correo' => 'raul.perez@driscolls.com', 'cargo' => 'Supervisor de Vigilancia y Control de Acceso'],
            ],
            'Auxiliar de Limpieza' => [
                ['nombres' => 'Martha Alicia', 'apellidos' => 'Cordero Rivas', 'cedula' => '22541236', 'telefono' => '3391234567', 'correo' => 'martha.cordero@driscolls.com', 'cargo' => 'Encargado de Sanitización de Planta'],
            ],
            'Sup Cooler' => [
                ['nombres' => 'Jorge Alberto', 'apellidos' => 'Fuentes Lara', 'cedula' => '24879632', 'telefono' => '3310987654', 'correo' => 'jorge.fuentes@driscolls.com', 'cargo' => 'Supervisor de Cooler'],
            ],
        ];

        foreach ($responsablesDefinicion as $deptoNombre => $listaResp) {
            $depto = Departamento::where('nombre', $deptoNombre)
                ->where('empresa_id', $empresaId)
                ->first() ?: Departamento::where('nombre', $deptoNombre)->first();

            if (! $depto) {
                continue;
            }

            foreach ($listaResp as $respData) {
                $cargo = Cargo::where('nombre', $respData['cargo'])
                    ->where('departamento_id', $depto->id)
                    ->first() ?: Cargo::where('departamento_id', $depto->id)->first();

                Responsable::updateOrCreate(
                    [
                        'correo' => $respData['correo'],
                        'empresa_id' => $empresaId,
                    ],
                    [
                        'nombres' => $respData['nombres'],
                        'apellidos' => $respData['apellidos'],
                        'documento_identidad' => $respData['cedula'],
                        'pais_telefono_id' => $paisId,
                        'telefono' => $respData['telefono'],
                        'departamento_id' => $depto->id,
                        'cargo_id' => $cargo?->id,
                        'sucursal_id' => $sucursalId,
                        'user_id' => $userId,
                        'status' => 1,
                    ]
                );
            }
        }
    }
}
