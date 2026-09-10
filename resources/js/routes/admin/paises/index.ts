import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PaisController::index
 * @see app/Http/Controllers/Admin/PaisController.php:13
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
 * @see app/Http/Controllers/Admin/PaisController.php:13
 * @route '/admin/paises'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PaisController::index
 * @see app/Http/Controllers/Admin/PaisController.php:13
 * @route '/admin/paises'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\PaisController::index
 * @see app/Http/Controllers/Admin/PaisController.php:13
 * @route '/admin/paises'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\PaisController::index
 * @see app/Http/Controllers/Admin/PaisController.php:13
 * @route '/admin/paises'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\PaisController::index
 * @see app/Http/Controllers/Admin/PaisController.php:13
 * @route '/admin/paises'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\PaisController::index
 * @see app/Http/Controllers/Admin/PaisController.php:13
 * @route '/admin/paises'
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
* @see \App\Http\Controllers\Admin\PaisController::store
 * @see app/Http/Controllers/Admin/PaisController.php:59
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
 * @see app/Http/Controllers/Admin/PaisController.php:59
 * @route '/admin/paises'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PaisController::store
 * @see app/Http/Controllers/Admin/PaisController.php:59
 * @route '/admin/paises'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\PaisController::store
 * @see app/Http/Controllers/Admin/PaisController.php:59
 * @route '/admin/paises'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PaisController::store
 * @see app/Http/Controllers/Admin/PaisController.php:59
 * @route '/admin/paises'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\PaisController::update
 * @see app/Http/Controllers/Admin/PaisController.php:98
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
 * @see app/Http/Controllers/Admin/PaisController.php:98
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
 * @see app/Http/Controllers/Admin/PaisController.php:98
 * @route '/admin/paises/{pais}'
 */
update.put = (args: { pais: number | { id: number } } | [pais: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\PaisController::update
 * @see app/Http/Controllers/Admin/PaisController.php:98
 * @route '/admin/paises/{pais}'
 */
    const updateForm = (args: { pais: number | { id: number } } | [pais: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PaisController::update
 * @see app/Http/Controllers/Admin/PaisController.php:98
 * @route '/admin/paises/{pais}'
 */
        updateForm.put = (args: { pais: number | { id: number } } | [pais: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Admin\PaisController::bulkDestroy
 * @see app/Http/Controllers/Admin/PaisController.php:159
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
 * @see app/Http/Controllers/Admin/PaisController.php:159
 * @route '/admin/paises/bulk-destroy'
 */
bulkDestroy.url = (options?: RouteQueryOptions) => {
    return bulkDestroy.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PaisController::bulkDestroy
 * @see app/Http/Controllers/Admin/PaisController.php:159
 * @route '/admin/paises/bulk-destroy'
 */
bulkDestroy.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkDestroy.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\PaisController::bulkDestroy
 * @see app/Http/Controllers/Admin/PaisController.php:159
 * @route '/admin/paises/bulk-destroy'
 */
    const bulkDestroyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: bulkDestroy.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PaisController::bulkDestroy
 * @see app/Http/Controllers/Admin/PaisController.php:159
 * @route '/admin/paises/bulk-destroy'
 */
        bulkDestroyForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: bulkDestroy.url(options),
            method: 'post',
        })
    
    bulkDestroy.form = bulkDestroyForm
const paises = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
update: Object.assign(update, update),
bulkDestroy: Object.assign(bulkDestroy, bulkDestroy),
}

export default paises