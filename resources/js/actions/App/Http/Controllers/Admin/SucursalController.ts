import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SucursalController::index
* @see app/Http/Controllers/Admin/SucursalController.php:17
* @route '/admin/sucursales'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/sucursales',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SucursalController::index
* @see app/Http/Controllers/Admin/SucursalController.php:17
* @route '/admin/sucursales'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SucursalController::index
* @see app/Http/Controllers/Admin/SucursalController.php:17
* @route '/admin/sucursales'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SucursalController::index
* @see app/Http/Controllers/Admin/SucursalController.php:17
* @route '/admin/sucursales'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SucursalController::store
* @see app/Http/Controllers/Admin/SucursalController.php:83
* @route '/admin/sucursales'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/sucursales',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SucursalController::store
* @see app/Http/Controllers/Admin/SucursalController.php:83
* @route '/admin/sucursales'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SucursalController::store
* @see app/Http/Controllers/Admin/SucursalController.php:83
* @route '/admin/sucursales'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SucursalController::update
* @see app/Http/Controllers/Admin/SucursalController.php:117
* @route '/admin/sucursales/{sucursal}'
*/
export const update = (args: { sucursal: number | { id: number } } | [sucursal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/sucursales/{sucursal}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\SucursalController::update
* @see app/Http/Controllers/Admin/SucursalController.php:117
* @route '/admin/sucursales/{sucursal}'
*/
update.url = (args: { sucursal: number | { id: number } } | [sucursal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { sucursal: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { sucursal: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            sucursal: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        sucursal: typeof args.sucursal === 'object'
        ? args.sucursal.id
        : args.sucursal,
    }

    return update.definition.url
            .replace('{sucursal}', parsedArgs.sucursal.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SucursalController::update
* @see app/Http/Controllers/Admin/SucursalController.php:117
* @route '/admin/sucursales/{sucursal}'
*/
update.put = (args: { sucursal: number | { id: number } } | [sucursal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\SucursalController::destroy
* @see app/Http/Controllers/Admin/SucursalController.php:140
* @route '/admin/sucursales/{sucursal}'
*/
export const destroy = (args: { sucursal: number | { id: number } } | [sucursal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/sucursales/{sucursal}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\SucursalController::destroy
* @see app/Http/Controllers/Admin/SucursalController.php:140
* @route '/admin/sucursales/{sucursal}'
*/
destroy.url = (args: { sucursal: number | { id: number } } | [sucursal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { sucursal: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { sucursal: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            sucursal: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        sucursal: typeof args.sucursal === 'object'
        ? args.sucursal.id
        : args.sucursal,
    }

    return destroy.definition.url
            .replace('{sucursal}', parsedArgs.sucursal.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SucursalController::destroy
* @see app/Http/Controllers/Admin/SucursalController.php:140
* @route '/admin/sucursales/{sucursal}'
*/
destroy.delete = (args: { sucursal: number | { id: number } } | [sucursal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\SucursalController::toggleStatus
* @see app/Http/Controllers/Admin/SucursalController.php:159
* @route '/admin/sucursales/{sucursal}/toggle-status'
*/
export const toggleStatus = (args: { sucursal: number | { id: number } } | [sucursal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/sucursales/{sucursal}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\SucursalController::toggleStatus
* @see app/Http/Controllers/Admin/SucursalController.php:159
* @route '/admin/sucursales/{sucursal}/toggle-status'
*/
toggleStatus.url = (args: { sucursal: number | { id: number } } | [sucursal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { sucursal: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { sucursal: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            sucursal: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        sucursal: typeof args.sucursal === 'object'
        ? args.sucursal.id
        : args.sucursal,
    }

    return toggleStatus.definition.url
            .replace('{sucursal}', parsedArgs.sucursal.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SucursalController::toggleStatus
* @see app/Http/Controllers/Admin/SucursalController.php:159
* @route '/admin/sucursales/{sucursal}/toggle-status'
*/
toggleStatus.patch = (args: { sucursal: number | { id: number } } | [sucursal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

const SucursalController = { index, store, update, destroy, toggleStatus }

export default SucursalController