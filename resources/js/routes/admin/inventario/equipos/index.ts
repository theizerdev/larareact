import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\InventarioEquipoController::index
 * @see app/Http/Controllers/Admin/InventarioEquipoController.php:16
 * @route '/admin/inventario/equipos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/inventario/equipos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\InventarioEquipoController::index
 * @see app/Http/Controllers/Admin/InventarioEquipoController.php:16
 * @route '/admin/inventario/equipos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\InventarioEquipoController::index
 * @see app/Http/Controllers/Admin/InventarioEquipoController.php:16
 * @route '/admin/inventario/equipos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\InventarioEquipoController::index
 * @see app/Http/Controllers/Admin/InventarioEquipoController.php:16
 * @route '/admin/inventario/equipos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\InventarioEquipoController::store
 * @see app/Http/Controllers/Admin/InventarioEquipoController.php:81
 * @route '/admin/inventario/equipos'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/inventario/equipos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\InventarioEquipoController::store
 * @see app/Http/Controllers/Admin/InventarioEquipoController.php:81
 * @route '/admin/inventario/equipos'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\InventarioEquipoController::store
 * @see app/Http/Controllers/Admin/InventarioEquipoController.php:81
 * @route '/admin/inventario/equipos'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\InventarioEquipoController::update
 * @see app/Http/Controllers/Admin/InventarioEquipoController.php:114
 * @route '/admin/inventario/equipos/{equipo}'
 */
export const update = (args: { equipo: number | { id: number } } | [equipo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/inventario/equipos/{equipo}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\InventarioEquipoController::update
 * @see app/Http/Controllers/Admin/InventarioEquipoController.php:114
 * @route '/admin/inventario/equipos/{equipo}'
 */
update.url = (args: { equipo: number | { id: number } } | [equipo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { equipo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { equipo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    equipo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        equipo: typeof args.equipo === 'object'
                ? args.equipo.id
                : args.equipo,
                }

    return update.definition.url
            .replace('{equipo}', parsedArgs.equipo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\InventarioEquipoController::update
 * @see app/Http/Controllers/Admin/InventarioEquipoController.php:114
 * @route '/admin/inventario/equipos/{equipo}'
 */
update.put = (args: { equipo: number | { id: number } } | [equipo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\InventarioEquipoController::destroy
 * @see app/Http/Controllers/Admin/InventarioEquipoController.php:148
 * @route '/admin/inventario/equipos/{equipo}'
 */
export const destroy = (args: { equipo: number | { id: number } } | [equipo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/inventario/equipos/{equipo}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\InventarioEquipoController::destroy
 * @see app/Http/Controllers/Admin/InventarioEquipoController.php:148
 * @route '/admin/inventario/equipos/{equipo}'
 */
destroy.url = (args: { equipo: number | { id: number } } | [equipo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { equipo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { equipo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    equipo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        equipo: typeof args.equipo === 'object'
                ? args.equipo.id
                : args.equipo,
                }

    return destroy.definition.url
            .replace('{equipo}', parsedArgs.equipo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\InventarioEquipoController::destroy
 * @see app/Http/Controllers/Admin/InventarioEquipoController.php:148
 * @route '/admin/inventario/equipos/{equipo}'
 */
destroy.delete = (args: { equipo: number | { id: number } } | [equipo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})
const equipos = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
}

export default equipos