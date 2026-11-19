<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Database\Seeder;

class EmpresaSucursalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pais = Pais::where('codigo_iso2', 'MX')->first() ?? Pais::first();

        // 1. Crear o actualizar la empresa principal (ID 1)
        $empresa = Empresa::withoutGlobalScopes()->updateOrCreate(
            ['id' => 1],
            [
                'pais_id' => $pais?->id,
                'pais_telefono_id' => $pais?->id,
                'razon_social' => 'Smurfit Westrock México',
                'nombre_comercial' => 'Smurfit Westrock',
                'documento' => 'SWM850101XXX',
                'zona_horaria' => 'America/Mexico_City',
                'direccion' => 'Av. Reforma 222, Ciudad de México, CDMX',
                'latitud' => 19.4326077,
                'longitud' => -99.1332080,
                'telefono' => '5500000000',
                'email' => 'contacto@smurfitwestrock.com',
                'logo' => '/image/logo/aliados/360-global-it-logo.png',
                'logo_mini' => '/image/logo/aliados/360-global-it-logo.png',
                'status' => true,
            ]
        );

        // 2. Crear o actualizar la sucursal principal (ID 1)
        $sucursal = Sucursal::withoutGlobalScopes()->updateOrCreate(
            ['id' => 1],
            [
                'empresa_id' => $empresa->id,
                'nombre' => 'Planta Principal',
                'codigo_numeral' => '01',
                'pais_telefono_id' => $pais?->id,
                'telefono' => '5500000000',
                'direccion' => 'Av. Reforma 222, Ciudad de México, CDMX',
                'latitud' => 19.4326077,
                'longitud' => -99.1332080,
                'zona_horaria' => 'America/Mexico_City',
                'status' => true,
            ]
        );

        // 3. Asociar automáticamente usuarios existentes sin empresa o sucursal asignada
        $users = User::withoutGlobalScopes()
            ->where(function ($query) {
                $query->whereNull('empresa_id')
                    ->orWhereNull('sucursal_id');
            })
            ->get();

        foreach ($users as $user) {
            $updates = [];

            if (is_null($user->empresa_id)) {
                $updates['empresa_id'] = $empresa->id;
            }

            if (is_null($user->sucursal_id)) {
                $updates['sucursal_id'] = $sucursal->id;
            }

            if (is_null($user->pais_telefono_id) && $pais) {
                $updates['pais_telefono_id'] = $pais->id;
            }

            if (! empty($updates)) {
                $user->update($updates);
            }
        }
    }
}
