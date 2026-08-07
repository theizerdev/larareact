<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductoRequest extends FormRequest
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
            'modelo_id' => ['nullable'],
            'categoria_id' => ['nullable'],
            'marca_id' => ['nullable'],
            'familia_id' => ['nullable'],
            'sku' => ['required', 'string', 'max:100', 'unique:productos,sku'],
            'codigo_barras' => ['nullable', 'string', 'max:100', 'unique:productos,codigo_barras'],
            'nombre_variante' => ['required', 'string', 'max:255'],
            'condicion' => ['required', 'string', 'in:nuevo,usado,reacondicionado,repuesto'],
            'tipo_producto' => ['nullable', 'string', 'in:venta,repuesto,servicio'],
            'tipo_venta' => ['required', 'string', 'in:unidad,granel,paquete'],
            'usa_inventario' => ['boolean'],
            'variant_specs' => ['nullable', 'array'],
            'precio_compra' => ['required', 'numeric', 'gt:0'],
            'precio_venta' => ['required', 'numeric', 'gt:0'],
            'precio_mayoreo' => ['nullable', 'numeric', 'gt:0'],
            'stock' => ['required_if:usa_inventario,true', 'nullable', 'numeric', 'min:0'],
            'stock_minimo' => ['required_if:usa_inventario,true', 'nullable', 'numeric', 'min:0'],
            'tipo_impuesto' => ['required', 'string', 'in:gravado,exento,tasa_cero'],
            'tasa_iva' => ['nullable', 'numeric', 'min:0'],
            'aplica_impuesto_adicional' => ['boolean'],
            'tasa_impuesto_adicional' => ['nullable', 'numeric', 'min:0'],
            'aplica_retencion' => ['boolean'],
            'tasa_retencion' => ['nullable', 'numeric', 'min:0'],
            'precio_incluye_impuestos' => ['boolean'],
            'clave_sat_producto' => ['nullable', 'string', 'max:20'],
            'clave_sat_unidad' => ['nullable', 'string', 'max:20'],
            'objeto_impuesto_sat' => ['nullable', 'string', 'max:5'],
            'estado' => ['boolean'],
            'empresa_id' => ['nullable', 'exists:empresas,id'],
            'sucursal_id' => ['nullable', 'exists:sucursales,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'precio_compra.required' => __('El precio de compra es obligatorio.'),
            'precio_compra.gt' => __('El precio de compra debe ser mayor a 0.00.'),
            'precio_venta.required' => __('El precio de venta es obligatorio.'),
            'precio_venta.gt' => __('El precio de venta debe ser mayor a 0.00.'),
            'precio_mayoreo.gt' => __('El precio mayoreo debe ser mayor a 0.00.'),
            'stock.required' => __('La cantidad actual (stock) es obligatoria.'),
            'stock.required_if' => __('Debe ingresar la cantidad actual de stock.'),
            'stock.numeric' => __('La cantidad de stock debe ser un número válido.'),
            'stock.min' => __('El stock no puede ser negativo.'),
        ];
    }
}
