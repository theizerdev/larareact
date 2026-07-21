import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\CargoController::index
 * @see app/Http/Controllers/Admin/CargoController.php:16
 * @route '/admin/cargos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/cargos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\CargoController::index
 * @see app/Http/Controllers/Admin/CargoController.php:16
 * @route '/admin/cargos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CargoController::index
 * @see app/Http/Controllers/Admin/CargoController.php:16
 * @route '/admin/cargos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\CargoController::index
 * @see app/Http/Controllers/Admin/CargoController.php:16
 * @route '/admin/cargos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\CargoController::index
 * @see app/Http/Controllers/Admin/CargoController.php:16
 * @route '/admin/cargos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\CargoController::index
 * @see app/Http/Controllers/Admin/CargoController.php:16
 * @route '/admin/cargos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\CargoController::index
 * @see app/Http/Controllers/Admin/CargoController.php:16
 * @route '/admin/cargos'
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
* @see \App\Http\Controllers\Admin\CargoController::store
 * @see app/Http/Controllers/Admin/CargoController.php:53
 * @route '/admin/cargos'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/cargos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\CargoController::store
 * @see app/Http/Controllers/Admin/CargoController.php:53
 * @route '/admin/cargos'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CargoController::store
 * @see app/Http/Controllers/Admin/CargoController.php:53
 * @route '/admin/cargos'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\CargoController::store
 * @see app/Http/Controllers/Admin/CargoController.php:53
 * @route '/admin/cargos'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\CargoController::store
 * @see app/Http/Controllers/Admin/CargoController.php:53
 * @route '/admin/cargos'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\CargoController::update
 * @see app/Http/Controllers/Admin/CargoController.php:63
 * @route '/admin/cargos/{cargo}'
 */
export const update = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/cargos/{cargo}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\CargoController::update
 * @see app/Http/Controllers/Admin/CargoController.php:63
 * @route '/admin/cargos/{cargo}'
 */
update.url = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cargo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cargo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cargo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cargo: typeof args.cargo === 'object'
                ? args.cargo.id
                : args.cargo,
                }

    return update.definition.url
            .replace('{cargo}', parsedArgs.cargo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CargoController::update
 * @see app/Http/Controllers/Admin/CargoController.php:63
 * @route '/admin/cargos/{cargo}'
 */
update.put = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\CargoController::update
 * @see app/Http/Controllers/Admin/CargoController.php:63
 * @route '/admin/cargos/{cargo}'
 */
    const updateForm = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\CargoController::update
 * @see app/Http/Controllers/Admin/CargoController.php:63
 * @route '/admin/cargos/{cargo}'
 */
        updateForm.put = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\CargoController::toggleStatus
 * @see app/Http/Controllers/Admin/CargoController.php:73
 * @route '/admin/cargos/{cargo}/toggle-status'
 */
export const toggleStatus = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/cargos/{cargo}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\CargoController::toggleStatus
 * @see app/Http/Controllers/Admin/CargoController.php:73
 * @route '/admin/cargos/{cargo}/toggle-status'
 */
toggleStatus.url = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cargo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cargo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cargo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cargo: typeof args.cargo === 'object'
                ? args.cargo.id
                : args.cargo,
                }

    return toggleStatus.definition.url
            .replace('{cargo}', parsedArgs.cargo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CargoController::toggleStatus
 * @see app/Http/Controllers/Admin/CargoController.php:73
 * @route '/admin/cargos/{cargo}/toggle-status'
 */
toggleStatus.patch = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\CargoController::toggleStatus
 * @see app/Http/Controllers/Admin/CargoController.php:73
 * @route '/admin/cargos/{cargo}/toggle-status'
 */
    const toggleStatusForm = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\CargoController::toggleStatus
 * @see app/Http/Controllers/Admin/CargoController.php:73
 * @route '/admin/cargos/{cargo}/toggle-status'
 */
        toggleStatusForm.patch = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: toggleStatus.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    toggleStatus.form = toggleStatusForm
/**
* @see \App\Http\Controllers\Admin\CargoController::destroy
 * @see app/Http/Controllers/Admin/CargoController.php:83
 * @route '/admin/cargos/{cargo}'
 */
export const destroy = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/cargos/{cargo}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\CargoController::destroy
 * @see app/Http/Controllers/Admin/CargoController.php:83
 * @route '/admin/cargos/{cargo}'
 */
destroy.url = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cargo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cargo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cargo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cargo: typeof args.cargo === 'object'
                ? args.cargo.id
                : args.cargo,
                }

    return destroy.definition.url
            .replace('{cargo}', parsedArgs.cargo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CargoController::destroy
 * @see app/Http/Controllers/Admin/CargoController.php:83
 * @route '/admin/cargos/{cargo}'
 */
destroy.delete = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\CargoController::destroy
 * @see app/Http/Controllers/Admin/CargoController.php:83
 * @route '/admin/cargos/{cargo}'
 */
    const destroyForm = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\CargoController::destroy
 * @see app/Http/Controllers/Admin/CargoController.php:83
 * @route '/admin/cargos/{cargo}'
 */
        destroyForm.delete = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const cargos = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
update: Object.assign(update, update),
toggleStatus: Object.assign(toggleStatus, toggleStatus),
destroy: Object.assign(destroy, destroy),
}

export default cargos