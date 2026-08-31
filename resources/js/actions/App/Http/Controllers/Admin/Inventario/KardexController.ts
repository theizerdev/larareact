import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\Inventario\KardexController::index
* @see app/Http/Controllers/Admin/Inventario/KardexController.php:15
* @route '/admin/inventario/kardex'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/inventario/kardex',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\Inventario\KardexController::index
* @see app/Http/Controllers/Admin/Inventario/KardexController.php:15
* @route '/admin/inventario/kardex'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\Inventario\KardexController::index
* @see app/Http/Controllers/Admin/Inventario/KardexController.php:15
* @route '/admin/inventario/kardex'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\Inventario\KardexController::index
* @see app/Http/Controllers/Admin/Inventario/KardexController.php:15
* @route '/admin/inventario/kardex'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

const KardexController = { index }

export default KardexController