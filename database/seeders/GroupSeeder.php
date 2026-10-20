<?php

namespace Database\Seeders;

use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class GroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $operadorRole = Role::where('name', 'operador')->first();
        $adminRole = Role::where('name', 'admin')->first();
        $encargadoRole = Role::where('name', 'encargado')->first();
        $viewerRole = Role::where('name', 'viewer')->first();
        $clienteRole = Role::where('name', 'cliente')->first();

        $groups = [
            [
                'name' => 'Seguridad y Control de Garita',
                'slug' => 'seguridad-garita',
                'description' => 'Personal responsable del registro de accesos en garita, pesaje de camiones y control de visitantes.',
                'roles' => array_filter([$operadorRole?->id]),
            ],
            [
                'name' => 'Administración del sistema',
                'slug' => 'administracion-sistema',
                'description' => 'Administradores del sistema con control total sobre todas las funcionalidades.',
                'roles' => array_filter([$adminRole?->id]),
            ],
            [
                'name' => 'Recursos Humanos',
                'slug' => 'recursos-humanos',
                'description' => 'Gestión integral del personal de planta, pre-registros, asistencias y departamentos.',
                'roles' => array_filter([$encargadoRole?->id]),
            ],
            [
                'name' => 'Supervisión y Auditoría',
                'slug' => 'supervision-auditoria',
                'description' => 'Personal auditor con privilegios de solo lectura y monitoreo de cumplimiento normativo.',
                'roles' => array_filter([$viewerRole?->id]),
            ],
            [
                'name' => 'Clientes y Contratistas Externos',
                'slug' => 'clientes-externos',
                'description' => 'Acceso limitado para seguimiento de operaciones y consulta de pases autorizados.',
                'roles' => array_filter([$clienteRole?->id]),
            ],
        ];

        foreach ($groups as $groupData) {
            $roles = $groupData['roles'];
            unset($groupData['roles']);

            $group = Group::firstOrCreate(
                ['name' => $groupData['name']],
                $groupData
            );

            if (!empty($roles)) {
                $group->roles()->syncWithoutDetaching($roles);
            }
        }

        // Asignar grupos de prueba a usuarios existentes según su rol principal
        $operadorUser = User::role('operador')->first();
        $garitaGroup = Group::where('slug', 'seguridad-garita')->first();
        if ($operadorUser && $garitaGroup) {
            $operadorUser->groups()->syncWithoutDetaching([$garitaGroup->id]);
        }

        $encargadoUser = User::role('encargado')->first();
        $rrhhGroup = Group::where('slug', 'recursos-humanos')->first();
        if ($encargadoUser && $rrhhGroup) {
            $encargadoUser->groups()->syncWithoutDetaching([$rrhhGroup->id]);
        }

        $clienteUser = User::role('cliente')->first();
        $clienteGroup = Group::where('slug', 'clientes-externos')->first();
        if ($clienteUser && $clienteGroup) {
            $clienteUser->groups()->syncWithoutDetaching([$clienteGroup->id]);
        }
    }
}
