import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PaisController::index
* @see app/Http/Controllers/Admin/PaisController.php:14
* @route '/admin/paises'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/paises',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PaisController::index
* @see app/Http/Controllers/Admin/PaisController.php:14
* @route '/admin/paises'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PaisController::index
* @see app/Http/Controllers/Admin/PaisController.php:14
* @route '/admin/paises'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PaisController::index
* @see app/Http/Controllers/Admin/PaisController.php:14
* @route '/admin/paises'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PaisController::store
* @see app/Http/Controllers/Admin/PaisController.php:60
* @route '/admin/paises'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/paises',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PaisController::store
* @see app/Http/Controllers/Admin/PaisController.php:60
* @route '/admin/paises'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PaisController::store
* @see app/Http/Controllers/Admin/PaisController.php:60
* @route '/admin/paises'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PaisController::update
* @see app/Http/Controllers/Admin/PaisController.php:99
* @route '/admin/paises/{pais}'
*/
export const update = (args: { pais: number | { id: number } } | [pais: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/paises/{pais}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\PaisController::update
* @see app/Http/Controllers/Admin/PaisController.php:99
* @route '/admin/paises/{pais}'
*/
update.url = (args: { pais: number | { id: number } } | [pais: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { pais: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { pais: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            pais: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        pais: typeof args.pais === 'object'
        ? args.pais.id
        : args.pais,
    }

    return update.definition.url
            .replace('{pais}', parsedArgs.pais.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PaisController::update
* @see app/Http/Controllers/Admin/PaisController.php:99
* @route '/admin/paises/{pais}'
*/
update.put = (args: { pais: number | { id: number } } | [pais: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\PaisController::bulkDestroy
* @see app/Http/Controllers/Admin/PaisController.php:160
* @route '/admin/paises/bulk-destroy'
*/
export const bulkDestroy = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkDestroy.url(options),
    method: 'post',
})

bulkDestroy.definition = {
    methods: ["post"],
    url: '/admin/paises/bulk-destroy',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PaisController::bulkDestroy
* @see app/Http/Controllers/Admin/PaisController.php:160
* @route '/admin/paises/bulk-destroy'
*/
bulkDestroy.url = (options?: RouteQueryOptions) => {
    return bulkDestroy.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PaisController::bulkDestroy
* @see app/Http/Controllers/Admin/PaisController.php:160
* @route '/admin/paises/bulk-destroy'
*/
bulkDestroy.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkDestroy.url(options),
    method: 'post',
})

const PaisController = { index, store, update, bulkDestroy }

export default PaisController