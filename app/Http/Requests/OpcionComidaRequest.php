<?php

namespace App\Http\Requests;

use App\Models\OpcionComida;
use App\Models\Sucursal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class OpcionComidaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:80',
            'tipo' => ['required', 'string', Rule::in([
                OpcionComida::TIPO_DESAYUNO,
                OpcionComida::TIPO_ALMUERZO,
                OpcionComida::TIPO_CENA,
                OpcionComida::TIPO_REFRIGERIO,
            ])],
            'descripcion' => 'nullable|string|max:255',
            'costo_empleado' => 'required|numeric|min:0|max:99999',
            'costo_empresa' => 'nullable|numeric|min:0|max:99999',
            'hora_inicio' => ['nullable', 'regex:/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/'],
            'hora_fin' => ['nullable', 'regex:/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/'],
            'dias_disponibles' => 'nullable|array',
            'dias_disponibles.*' => 'string|in:lunes,martes,miercoles,jueves,viernes,sabado,domingo',
            'icono' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'orden' => 'nullable|integer|min:0|max:999',
            'status' => 'nullable|boolean',
            'sucursal_id' => 'nullable|exists:sucursales,id',
        ];
    }

    public function attributes(): array
    {
        return [
            'nombre' => 'nombre de la comida',
            'tipo' => 'tipo de comida (Desayuno, Almuerzo, Cena, Refrigerio)',
            'descripcion' => 'descripción',
            'costo_empleado' => 'costo al colaborador',
            'costo_empresa' => 'costo a la empresa / proveedor',
            'hora_inicio' => 'hora de inicio',
            'hora_fin' => 'hora de fin',
            'icono' => 'ícono',
            'color' => 'color distintivo',
            'orden' => 'orden de visualización',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $user = $this->user();
            if (! $user || $user->isSuperAdmin()) {
                return;
            }

            if ($this->filled('sucursal_id')) {
                $sucursalId = (int) $this->input('sucursal_id');
                if ($user->sucursal_id && $sucursalId !== (int) $user->sucursal_id) {
                    $validator->errors()->add('sucursal_id', 'No tiene permisos para asignar esta sucursal.');
                }

                if ($user->empresa_id && ! Sucursal::where('id', $sucursalId)->where('empresa_id', $user->empresa_id)->exists()) {
                    $validator->errors()->add('sucursal_id', 'La sucursal seleccionada no pertenece a su empresa.');
                }
            }
        });
    }
}
