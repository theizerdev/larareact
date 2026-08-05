<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompraRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'proveedor_id' => ['required', 'exists:proveedores,id'],
            'sucursal_id' => ['nullable', 'exists:sucursales,id'],
            'numero_factura' => ['nullable', 'string', 'max:100'],
            'numero_control' => ['nullable', 'string', 'max:100'],
            'tipo_pago' => ['required', 'in:contado,credito'],
            'fecha_emision' => ['required', 'date'],
            'fecha_vencimiento' => ['nullable', 'date'],
            'descuento' => ['nullable', 'numeric', 'min:0'],
            'monto_inicial_pagado' => ['nullable', 'numeric', 'min:0'],
            'metodo_pago' => ['nullable', 'string'],
            'referencia_pago' => ['nullable', 'string'],
            'pagar_con_caja' => ['nullable', 'boolean'],
            'usar_fondo_mes' => ['nullable', 'boolean'],
            'cierre_mensual_id' => ['nullable', 'exists:cierres_mensuales,id'],
            'notas' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.producto_id' => ['required', 'exists:productos,id'],
            'items.*.cantidad' => ['required', 'numeric', 'gt:0'],
            'items.*.costo_unitario' => ['required', 'numeric', 'min:0'],
            'items.*.impuesto_unitario' => ['nullable', 'numeric', 'min:0'],
            'items.*.update_sale_price' => ['nullable', 'boolean'],
            'items.*.nuevo_precio_venta' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
