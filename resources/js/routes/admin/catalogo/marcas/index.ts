import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\MarcaController::index
 * @see app/Http/Controllers/Admin/MarcaController.php:13
 * @route '/admin/catalogo/marcas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/catalogo/marcas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\MarcaController::index
 * @see app/Http/Controllers/Admin/MarcaController.php:13
 * @route '/admin/catalogo/marcas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MarcaController::index
 * @see app/Http/Controllers/Admin/MarcaController.php:13
 * @route '/admin/catalogo/marcas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\MarcaController::index
 * @see app/Http/Controllers/Admin/MarcaController.php:13
 * @route '/admin/catalogo/marcas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::store
 * @see app/Http/Controllers/Admin/MarcaController.php:38
 * @route '/admin/catalogo/marcas'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/catalogo/marcas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\MarcaController::store
 * @see app/Http/Controllers/Admin/MarcaController.php:38
 * @route '/admin/catalogo/marcas'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MarcaController::store
 * @see app/Http/Controllers/Admin/MarcaController.php:38
 * @route '/admin/catalogo/marcas'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::update
 * @see app/Http/Controllers/Admin/MarcaController.php:66
 * @route '/admin/catalogo/marcas/{marca}'
 */
export const update = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/catalogo/marcas/{marca}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\MarcaController::update
 * @see app/Http/Controllers/Admin/MarcaController.php:66
 * @route '/admin/catalogo/marcas/{marca}'
 */
update.url = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { marca: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { marca: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    marca: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        marca: typeof args.marca === 'object'
                ? args.marca.id
                : args.marca,
                }

    return update.definition.url
            .replace('{marca}', parsedArgs.marca.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MarcaController::update
 * @see app/Http/Controllers/Admin/MarcaController.php:66
 * @route '/admin/catalogo/marcas/{marca}'
 */
update.put = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::toggleStatus
 * @see app/Http/Controllers/Admin/MarcaController.php:94
 * @route '/admin/catalogo/marcas/{marca}/toggle-status'
 */
export const toggleStatus = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/catalogo/marcas/{marca}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\MarcaController::toggleStatus
 * @see app/Http/Controllers/Admin/MarcaController.php:94
 * @route '/admin/catalogo/marcas/{marca}/toggle-status'
 */
toggleStatus.url = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { marca: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { marca: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    marca: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        marca: typeof args.marca === 'object'
                ? args.marca.id
                : args.marca,
                }

    return toggleStatus.definition.url
            .replace('{marca}', parsedArgs.marca.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MarcaController::toggleStatus
 * @see app/Http/Controllers/Admin/MarcaController.php:94
 * @route '/admin/catalogo/marcas/{marca}/toggle-status'
 */
toggleStatus.patch = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::destroy
 * @see app/Http/Controllers/Admin/MarcaController.php:114
 * @route '/admin/catalogo/marcas/{marca}'
 */
export const destroy = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/catalogo/marcas/{marca}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\MarcaController::destroy
 * @see app/Http/Controllers/Admin/MarcaController.php:114
 * @route '/admin/catalogo/marcas/{marca}'
 */
destroy.url = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { marca: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { marca: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    marca: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        marca: typeof args.marca === 'object'
                ? args.marca.id
                : args.marca,
                }

    return destroy.definition.url
            .replace('{marca}', parsedArgs.marca.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MarcaController::destroy
 * @see app/Http/Controllers/Admin/MarcaController.php:114
 * @route '/admin/catalogo/marcas/{marca}'
 */
destroy.delete = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})
const marcas = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
update: Object.assign(update, update),
toggleStatus: Object.assign(toggleStatus, toggleStatus),
destroy: Object.assign(destroy, destroy),
}

export default marcas