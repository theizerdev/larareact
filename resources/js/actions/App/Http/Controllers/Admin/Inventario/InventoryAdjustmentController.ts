import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../../wayfinder'
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
* @see \App\Http\Controllers\Admin\Inventario\InventoryAdjustmentController::index
* @see app/Http/Controllers/Admin/Inventario/InventoryAdjustmentController.php:15
* @route '/admin/inventario/ajustes'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\Inventario\InventoryAdjustmentController::index
* @see app/Http/Controllers/Admin/Inventario/InventoryAdjustmentController.php:15
* @route '/admin/inventario/ajustes'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\Inventario\InventoryAdjustmentController::index
* @see app/Http/Controllers/Admin/Inventario/InventoryAdjustmentController.php:15
* @route '/admin/inventario/ajustes'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

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

/**
* @see \App\Http\Controllers\Admin\Inventario\InventoryAdjustmentController::store
* @see app/Http/Controllers/Admin/Inventario/InventoryAdjustmentController.php:104
* @route '/admin/inventario/ajustes'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\Inventario\InventoryAdjustmentController::store
* @see app/Http/Controllers/Admin/Inventario/InventoryAdjustmentController.php:104
* @route '/admin/inventario/ajustes'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

const InventoryAdjustmentController = { index, store }

export default InventoryAdjustmentController