import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\Inventario\InventoryAdjustmentController::index
* @see app/Http/Controllers/Admin/Inventario/InventoryAdjustmentController.php:15
* @route '/admin/inventario/ajustes'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/inventario/ajustes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\Inventario\InventoryAdjustmentController::index
* @see app/Http/Controllers/Admin/Inventario/InventoryAdjustmentController.php:15
* @route '/admin/inventario/ajustes'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\Inventario\InventoryAdjustmentController::index
* @see app/Http/Controllers/Admin/Inventario/InventoryAdjustmentController.php:15
* @route '/admin/inventario/ajustes'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\Inventario\InventoryAdjustmentController::index
* @see app/Http/Controllers/Admin/Inventario/InventoryAdjustmentController.php:15
* @route '/admin/inventario/ajustes'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\Inventario\InventoryAdjustmentController::store
* @see app/Http/Controllers/Admin/Inventario/InventoryAdjustmentController.php:104
* @route '/admin/inventario/ajustes'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/inventario/ajustes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\Inventario\InventoryAdjustmentController::store
* @see app/Http/Controllers/Admin/Inventario/InventoryAdjustmentController.php:104
* @route '/admin/inventario/ajustes'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\Inventario\InventoryAdjustmentController::store
* @see app/Http/Controllers/Admin/Inventario/InventoryAdjustmentController.php:104
* @route '/admin/inventario/ajustes'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

const ajustes = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
}

export default ajustes