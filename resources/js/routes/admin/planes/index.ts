import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::index
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:12
 * @route '/admin/planes-financiamiento'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/planes-financiamiento',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::index
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:12
 * @route '/admin/planes-financiamiento'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::index
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:12
 * @route '/admin/planes-financiamiento'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::index
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:12
 * @route '/admin/planes-financiamiento'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::index
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:12
 * @route '/admin/planes-financiamiento'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::index
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:12
 * @route '/admin/planes-financiamiento'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::index
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:12
 * @route '/admin/planes-financiamiento'
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
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::store
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:43
 * @route '/admin/planes-financiamiento'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/planes-financiamiento',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::store
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:43
 * @route '/admin/planes-financiamiento'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::store
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:43
 * @route '/admin/planes-financiamiento'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::store
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:43
 * @route '/admin/planes-financiamiento'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::store
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:43
 * @route '/admin/planes-financiamiento'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::update
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:74
 * @route '/admin/planes-financiamiento/{plan}'
 */
export const update = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/planes-financiamiento/{plan}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::update
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:74
 * @route '/admin/planes-financiamiento/{plan}'
 */
update.url = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { plan: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { plan: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    plan: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        plan: typeof args.plan === 'object'
                ? args.plan.id
                : args.plan,
                }

    return update.definition.url
            .replace('{plan}', parsedArgs.plan.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::update
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:74
 * @route '/admin/planes-financiamiento/{plan}'
 */
update.put = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::update
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:74
 * @route '/admin/planes-financiamiento/{plan}'
 */
    const updateForm = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::update
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:74
 * @route '/admin/planes-financiamiento/{plan}'
 */
        updateForm.put = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::toggleStatus
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:105
 * @route '/admin/planes-financiamiento/{plan}/toggle-status'
 */
export const toggleStatus = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/planes-financiamiento/{plan}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::toggleStatus
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:105
 * @route '/admin/planes-financiamiento/{plan}/toggle-status'
 */
toggleStatus.url = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { plan: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { plan: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    plan: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        plan: typeof args.plan === 'object'
                ? args.plan.id
                : args.plan,
                }

    return toggleStatus.definition.url
            .replace('{plan}', parsedArgs.plan.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::toggleStatus
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:105
 * @route '/admin/planes-financiamiento/{plan}/toggle-status'
 */
toggleStatus.patch = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::toggleStatus
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:105
 * @route '/admin/planes-financiamiento/{plan}/toggle-status'
 */
    const toggleStatusForm = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::toggleStatus
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:105
 * @route '/admin/planes-financiamiento/{plan}/toggle-status'
 */
        toggleStatusForm.patch = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::destroy
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:125
 * @route '/admin/planes-financiamiento/{plan}'
 */
export const destroy = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/planes-financiamiento/{plan}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::destroy
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:125
 * @route '/admin/planes-financiamiento/{plan}'
 */
destroy.url = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { plan: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { plan: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    plan: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        plan: typeof args.plan === 'object'
                ? args.plan.id
                : args.plan,
                }

    return destroy.definition.url
            .replace('{plan}', parsedArgs.plan.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::destroy
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:125
 * @route '/admin/planes-financiamiento/{plan}'
 */
destroy.delete = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::destroy
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:125
 * @route '/admin/planes-financiamiento/{plan}'
 */
    const destroyForm = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PlanFinanciamientoController::destroy
 * @see app/Http/Controllers/Admin/PlanFinanciamientoController.php:125
 * @route '/admin/planes-financiamiento/{plan}'
 */
        destroyForm.delete = (args: { plan: number | { id: number } } | [plan: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const planes = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
update: Object.assign(update, update),
toggleStatus: Object.assign(toggleStatus, toggleStatus),
destroy: Object.assign(destroy, destroy),
}

export default planes