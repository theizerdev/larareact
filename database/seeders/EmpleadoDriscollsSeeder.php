<?php

namespace Database\Seeders;

use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Responsable;
use App\Models\Sucursal;
use App\Models\TurnoLaboral;
use App\Models\User;
use Illuminate\Database\Seeder;

class EmpleadoDriscollsSeeder extends Seeder
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

        // Asegurar que exista al menos un Turno Laboral por defecto
        $turnoMatutino = TurnoLaboral::firstOrCreate(
            [
                'nombre' => 'Turno Matutino (08:00 - 17:00)',
                'empresa_id' => $empresaId,
            ],
            [
                'sucursal_id' => $sucursalId,
                'tipo_jornada' => 'Diurna',
                'hora_entrada' => '08:00:00',
                'hora_salida' => '17:00:00',
                'horas_diarias_ley' => 8.00,
                'minutos_descanso' => 60,
                'descanso_pagado' => true,
                'dias_laborables' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                'status' => true,
            ]
        );

        $turnoVespertino = TurnoLaboral::firstOrCreate(
            [
                'nombre' => 'Turno Vespertino (14:00 - 22:00)',
                'empresa_id' => $empresaId,
            ],
            [
                'sucursal_id' => $sucursalId,
                'tipo_jornada' => 'Mixta',
                'hora_entrada' => '14:00:00',
                'hora_salida' => '22:00:00',
                'horas_diarias_ley' => 8.00,
                'minutos_descanso' => 45,
                'descanso_pagado' => true,
                'dias_laborables' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                'status' => true,
            ]
        );

        $turnos = [$turnoMatutino->id, $turnoVespertino->id];

        // 40 Empleados con datos detallados y realistas
        $empleadosData = [
            // Empaque
            ['nombres' => 'Alejandro', 'apellidos' => 'Morales Vega', 'genero' => 'M', 'depto' => 'Empaque', 'salario' => 380.00],
            ['nombres' => 'Lidia Elizabeth', 'apellidos' => 'Suárez Cano', 'genero' => 'F', 'depto' => 'Empaque', 'salario' => 360.00],
            ['nombres' => 'Martín', 'apellidos' => 'Paredes Franco', 'genero' => 'M', 'depto' => 'Empaque', 'salario' => 350.00],
            // Recepcion fruta
            ['nombres' => 'Gonzalo', 'apellidos' => 'Ibarra Luna', 'genero' => 'M', 'depto' => 'Recepcion fruta', 'salario' => 410.00],
            ['nombres' => 'Diana Marcela', 'apellidos' => 'Orozco Espinoza', 'genero' => 'F', 'depto' => 'Recepcion fruta', 'salario' => 390.00],
            // Embarques
            ['nombres' => 'Héctor Mario', 'apellidos' => 'Gutiérrez Naranjo', 'genero' => 'M', 'depto' => 'Embarques', 'salario' => 420.00],
            ['nombres' => 'Jesús Adrián', 'apellidos' => 'Zamora Vaca', 'genero' => 'M', 'depto' => 'Embarques', 'salario' => 370.00],
            // Logistica
            ['nombres' => 'Valeria', 'apellidos' => 'Villanueva Roldán', 'genero' => 'F', 'depto' => 'Logistica', 'salario' => 520.00],
            ['nombres' => 'Ernesto', 'apellidos' => 'Santillán Bravo', 'genero' => 'M', 'depto' => 'Logistica', 'salario' => 480.00],
            // Estimados
            ['nombres' => 'Patricia', 'apellidos' => 'Garrido Ponce', 'genero' => 'F', 'depto' => 'Estimados', 'salario' => 550.00],
            ['nombres' => 'Rodrigo', 'apellidos' => 'Cabrera Solís', 'genero' => 'M', 'depto' => 'Estimados', 'salario' => 510.00],
            // Supply
            ['nombres' => 'Miriam Guadalupe', 'apellidos' => 'Vázquez Rangel', 'genero' => 'F', 'depto' => 'Supply', 'salario' => 530.00],
            ['nombres' => 'Sergio Ramón', 'apellidos' => 'Delgado Fierro', 'genero' => 'M', 'depto' => 'Supply', 'salario' => 490.00],
            // Produccion
            ['nombres' => 'Juan Carlos', 'apellidos' => 'Camacho Gallegos', 'genero' => 'M', 'depto' => 'Produccion', 'salario' => 450.00],
            ['nombres' => 'Rosa Elena', 'apellidos' => 'Ríos Mandujano', 'genero' => 'F', 'depto' => 'Produccion', 'salario' => 340.00],
            ['nombres' => 'Esteban', 'apellidos' => 'Salinas Montiel', 'genero' => 'M', 'depto' => 'Produccion', 'salario' => 350.00],
            // Distribucion
            ['nombres' => 'Óscar Iván', 'apellidos' => 'Arias Tamayo', 'genero' => 'M', 'depto' => 'Distribucion', 'salario' => 460.00],
            ['nombres' => 'Verónica', 'apellidos' => 'Lozano Quintero', 'genero' => 'F', 'depto' => 'Distribucion', 'salario' => 430.00],
            // Planeacion de cosecha
            ['nombres' => 'Guillermo', 'apellidos' => 'Ceballos Leyva', 'genero' => 'M', 'depto' => 'Planeacion de cosecha', 'salario' => 560.00],
            ['nombres' => 'Adriana', 'apellidos' => 'Fierro Palacios', 'genero' => 'F', 'depto' => 'Planeacion de cosecha', 'salario' => 480.00],
            // Inocuidad
            ['nombres' => 'César Augusto', 'apellidos' => 'Alvarado Godoy', 'genero' => 'M', 'depto' => 'Inocuidad', 'salario' => 580.00],
            ['nombres' => 'Teresa de Jesús', 'apellidos' => 'Bañuelos Barajas', 'genero' => 'F', 'depto' => 'Inocuidad', 'salario' => 520.00],
            // MTTO
            ['nombres' => 'Raúl Ignacio', 'apellidos' => 'Castañeda Olvera', 'genero' => 'M', 'depto' => 'MTTO', 'salario' => 500.00],
            ['nombres' => 'Felipe de Jesús', 'apellidos' => 'Nava Becerra', 'genero' => 'M', 'depto' => 'MTTO', 'salario' => 470.00],
            // Seguridad
            ['nombres' => 'Víctor Manuel', 'apellidos' => 'Solares Macías', 'genero' => 'M', 'depto' => 'Seguridad', 'salario' => 440.00],
            ['nombres' => 'Mónica Yareli', 'apellidos' => 'Uribe Escalante', 'genero' => 'F', 'depto' => 'Seguridad', 'salario' => 420.00],
            // Calidad
            ['nombres' => 'Griselda', 'apellidos' => 'Maldonado Trejo', 'genero' => 'F', 'depto' => 'Calidad', 'salario' => 540.00],
            ['nombres' => 'Armando', 'apellidos' => 'Linares Rendón', 'genero' => 'M', 'depto' => 'Calidad', 'salario' => 490.00],
            // RH
            ['nombres' => 'Daniela', 'apellidos' => 'Guerra Figueroa', 'genero' => 'F', 'depto' => 'RH', 'salario' => 600.00],
            ['nombres' => 'Mauricio', 'apellidos' => 'Bautista Villalobos', 'genero' => 'M', 'depto' => 'RH', 'salario' => 510.00],
            ['nombres' => 'Lorena Paola', 'apellidos' => 'Chávez Terán', 'genero' => 'F', 'depto' => 'RH', 'salario' => 470.00],
            // Vigilancia
            ['nombres' => 'Benjamín', 'apellidos' => 'Coronado Saucedo', 'genero' => 'M', 'depto' => 'Vigilancia', 'salario' => 380.00],
            ['nombres' => 'Ramón', 'apellidos' => 'Estrada Zúñiga', 'genero' => 'M', 'depto' => 'Vigilancia', 'salario' => 370.00],
            // Auxiliar de Limpieza
            ['nombres' => 'Silvia', 'apellidos' => 'Hinojosa Tejeda', 'genero' => 'F', 'depto' => 'Auxiliar de Limpieza', 'salario' => 330.00],
            ['nombres' => 'Guadalupe', 'apellidos' => 'Meza Hurtado', 'genero' => 'F', 'depto' => 'Auxiliar de Limpieza', 'salario' => 330.00],
            // Sup Cooler
            ['nombres' => 'Arturo', 'apellidos' => 'Galindo Reséndiz', 'genero' => 'M', 'depto' => 'Sup Cooler', 'salario' => 490.00],
            ['nombres' => 'Joel', 'apellidos' => 'Castañón Vivanco', 'genero' => 'M', 'depto' => 'Sup Cooler', 'salario' => 460.00],
            // Empleados adicionales para completar 40
            ['nombres' => 'Hugo Enrique', 'apellidos' => 'Valdés Arredondo', 'genero' => 'M', 'depto' => 'Empaque', 'salario' => 375.00],
            ['nombres' => 'Alma Rosa', 'apellidos' => 'Peralta Jaimes', 'genero' => 'F', 'depto' => 'Produccion', 'salario' => 365.00],
            ['nombres' => 'Ignacio', 'apellidos' => 'Granados Becerril', 'genero' => 'M', 'depto' => 'Calidad', 'salario' => 515.00],
        ];

        $codigoBase = 100101;

        foreach ($empleadosData as $index => $emp) {
            $codigoEmpleado = (string) ($codigoBase + $index);

            $depto = Departamento::where('nombre', $emp['depto'])
                ->where('empresa_id', $empresaId)
                ->first() ?: Departamento::where('nombre', $emp['depto'])->first();

            $deptoId = $depto?->id;

            // Buscar un cargo del departamento
            $cargo = $deptoId ? Cargo::where('departamento_id', $deptoId)->first() : null;

            // Buscar el responsable asignado a este departamento
            $responsable = $deptoId ? Responsable::where('departamento_id', $deptoId)->first() : null;

            // Formar un CURP simulado válido (18 caracteres)
            $primerLetraNom = mb_substr($emp['nombres'], 0, 1);
            $primerLetraApe = mb_substr($emp['apellidos'], 0, 2);
            $anio = rand(85, 99);
            $mes = sprintf('%02d', rand(1, 12));
            $dia = sprintf('%02d', rand(1, 28));
            $curpSimulado = strtoupper("{$primerLetraApe}{$primerLetraNom}{$anio}{$mes}{$dia}HJCMRN0" . rand(1, 9));

            // Formar correo institucional único
            $cleanNombre = strtolower(preg_replace('/[^a-zA-Z]/', '', iconv('UTF-8', 'ASCII//TRANSLIT', explode(' ', $emp['nombres'])[0])));
            $cleanApellido = strtolower(preg_replace('/[^a-zA-Z]/', '', iconv('UTF-8', 'ASCII//TRANSLIT', explode(' ', $emp['apellidos'])[0])));
            $correo = "{$cleanNombre}.{$cleanApellido}{$index}@driscolls.com";

            // Construir jornada laboral en el formato estructurado esperado por el frontend
            $jornadaLaboral = [
                ['dia' => 'Lunes',     'activo' => true,  'hora_ingreso' => '08:00', 'hora_salida' => '17:00'],
                ['dia' => 'Martes',    'activo' => true,  'hora_ingreso' => '08:00', 'hora_salida' => '17:00'],
                ['dia' => 'Miércoles', 'activo' => true,  'hora_ingreso' => '08:00', 'hora_salida' => '17:00'],
                ['dia' => 'Jueves',    'activo' => true,  'hora_ingreso' => '08:00', 'hora_salida' => '17:00'],
                ['dia' => 'Viernes',   'activo' => true,  'hora_ingreso' => '08:00', 'hora_salida' => '17:00'],
                ['dia' => 'Sábado',    'activo' => true,  'hora_ingreso' => '08:00', 'hora_salida' => '13:00'],
                ['dia' => 'Domingo',   'activo' => false, 'hora_ingreso' => '08:00', 'hora_salida' => '17:00'],
            ];

            Empleado::updateOrCreate(
                [
                    'documento_identidad' => $codigoEmpleado,
                    'empresa_id' => $empresaId,
                ],
                [
                    'nombres' => $emp['nombres'],
                    'apellidos' => $emp['apellidos'],
                    'curp' => $curpSimulado,
                    'pais_telefono_id' => $paisId,
                    'telefono' => '33' . sprintf('%08d', rand(10000000, 99999999)),
                    'correo' => $correo,
                    'genero' => $emp['genero'],
                    'departamento_id' => $deptoId,
                    'cargo_id' => $cargo?->id,
                    'responsable_id' => $responsable?->id,
                    'motivo_registro' => 'Contratación regular',
                    'jornada_laboral' => $jornadaLaboral,
                    'sucursal_id' => $sucursalId,
                    'user_id' => $userId,
                    'salario_diario' => $emp['salario'],
                    'turno_laboral_id' => $turnos[$index % count($turnos)],
                    'status' => true,
                ]
            );
        }
    }
}
