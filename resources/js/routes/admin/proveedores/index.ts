import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ProveedorController::index
* @see app/Http/Controllers/Admin/ProveedorController.php:14
* @route '/admin/proveedores'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/proveedores',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorController::index
* @see app/Http/Controllers/Admin/ProveedorController.php:14
* @route '/admin/proveedores'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorController::index
* @see app/Http/Controllers/Admin/ProveedorController.php:14
* @route '/admin/proveedores'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ProveedorController::index
* @see app/Http/Controllers/Admin/ProveedorController.php:14
* @route '/admin/proveedores'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ProveedorController::store
* @see app/Http/Controllers/Admin/ProveedorController.php:47
* @route '/admin/proveedores'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/proveedores',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorController::store
* @see app/Http/Controllers/Admin/ProveedorController.php:47
* @route '/admin/proveedores'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorController::store
* @see app/Http/Controllers/Admin/ProveedorController.php:47
* @route '/admin/proveedores'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ProveedorController::update
* @see app/Http/Controllers/Admin/ProveedorController.php:74
* @route '/admin/proveedores/{proveedor}'
*/
export const update = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/proveedores/{proveedor}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorController::update
* @see app/Http/Controllers/Admin/ProveedorController.php:74
* @route '/admin/proveedores/{proveedor}'
*/
update.url = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proveedor: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { proveedor: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            proveedor: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        proveedor: typeof args.proveedor === 'object'
        ? args.proveedor.id
        : args.proveedor,
    }

    return update.definition.url
            .replace('{proveedor}', parsedArgs.proveedor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorController::update
* @see app/Http/Controllers/Admin/ProveedorController.php:74
* @route '/admin/proveedores/{proveedor}'
*/
update.put = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\ProveedorController::destroy
* @see app/Http/Controllers/Admin/ProveedorController.php:97
* @route '/admin/proveedores/{proveedor}'
*/
export const destroy = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/proveedores/{proveedor}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorController::destroy
* @see app/Http/Controllers/Admin/ProveedorController.php:97
* @route '/admin/proveedores/{proveedor}'
*/
destroy.url = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proveedor: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { proveedor: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            proveedor: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        proveedor: typeof args.proveedor === 'object'
        ? args.proveedor.id
        : args.proveedor,
    }

    return destroy.definition.url
            .replace('{proveedor}', parsedArgs.proveedor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorController::destroy
* @see app/Http/Controllers/Admin/ProveedorController.php:97
* @route '/admin/proveedores/{proveedor}'
*/
destroy.delete = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

const proveedores = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
}

export default proveedores