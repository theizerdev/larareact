import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ResponsableController::index
 * @see app/Http/Controllers/Admin/ResponsableController.php:19
 * @route '/admin/responsables'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/responsables',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ResponsableController::index
 * @see app/Http/Controllers/Admin/ResponsableController.php:19
 * @route '/admin/responsables'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ResponsableController::index
 * @see app/Http/Controllers/Admin/ResponsableController.php:19
 * @route '/admin/responsables'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ResponsableController::index
 * @see app/Http/Controllers/Admin/ResponsableController.php:19
 * @route '/admin/responsables'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ResponsableController::index
 * @see app/Http/Controllers/Admin/ResponsableController.php:19
 * @route '/admin/responsables'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ResponsableController::index
 * @see app/Http/Controllers/Admin/ResponsableController.php:19
 * @route '/admin/responsables'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ResponsableController::index
 * @see app/Http/Controllers/Admin/ResponsableController.php:19
 * @route '/admin/responsables'
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
* @see \App\Http\Controllers\Admin\ResponsableController::store
 * @see app/Http/Controllers/Admin/ResponsableController.php:84
 * @route '/admin/responsables'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/responsables',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ResponsableController::store
 * @see app/Http/Controllers/Admin/ResponsableController.php:84
 * @route '/admin/responsables'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ResponsableController::store
 * @see app/Http/Controllers/Admin/ResponsableController.php:84
 * @route '/admin/responsables'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ResponsableController::store
 * @see app/Http/Controllers/Admin/ResponsableController.php:84
 * @route '/admin/responsables'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ResponsableController::store
 * @see app/Http/Controllers/Admin/ResponsableController.php:84
 * @route '/admin/responsables'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\ResponsableController::update
 * @see app/Http/Controllers/Admin/ResponsableController.php:94
 * @route '/admin/responsables/{responsable}'
 */
export const update = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/responsables/{responsable}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\ResponsableController::update
 * @see app/Http/Controllers/Admin/ResponsableController.php:94
 * @route '/admin/responsables/{responsable}'
 */
update.url = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { responsable: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { responsable: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    responsable: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        responsable: typeof args.responsable === 'object'
                ? args.responsable.id
                : args.responsable,
                }

    return update.definition.url
            .replace('{responsable}', parsedArgs.responsable.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ResponsableController::update
 * @see app/Http/Controllers/Admin/ResponsableController.php:94
 * @route '/admin/responsables/{responsable}'
 */
update.put = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\ResponsableController::update
 * @see app/Http/Controllers/Admin/ResponsableController.php:94
 * @route '/admin/responsables/{responsable}'
 */
    const updateForm = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ResponsableController::update
 * @see app/Http/Controllers/Admin/ResponsableController.php:94
 * @route '/admin/responsables/{responsable}'
 */
        updateForm.put = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\ResponsableController::toggleStatus
 * @see app/Http/Controllers/Admin/ResponsableController.php:104
 * @route '/admin/responsables/{responsable}/toggle-status'
 */
export const toggleStatus = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/responsables/{responsable}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\ResponsableController::toggleStatus
 * @see app/Http/Controllers/Admin/ResponsableController.php:104
 * @route '/admin/responsables/{responsable}/toggle-status'
 */
toggleStatus.url = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { responsable: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { responsable: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    responsable: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        responsable: typeof args.responsable === 'object'
                ? args.responsable.id
                : args.responsable,
                }

    return toggleStatus.definition.url
            .replace('{responsable}', parsedArgs.responsable.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ResponsableController::toggleStatus
 * @see app/Http/Controllers/Admin/ResponsableController.php:104
 * @route '/admin/responsables/{responsable}/toggle-status'
 */
toggleStatus.patch = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\ResponsableController::toggleStatus
 * @see app/Http/Controllers/Admin/ResponsableController.php:104
 * @route '/admin/responsables/{responsable}/toggle-status'
 */
    const toggleStatusForm = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ResponsableController::toggleStatus
 * @see app/Http/Controllers/Admin/ResponsableController.php:104
 * @route '/admin/responsables/{responsable}/toggle-status'
 */
        toggleStatusForm.patch = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\ResponsableController::destroy
 * @see app/Http/Controllers/Admin/ResponsableController.php:114
 * @route '/admin/responsables/{responsable}'
 */
export const destroy = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/responsables/{responsable}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ResponsableController::destroy
 * @see app/Http/Controllers/Admin/ResponsableController.php:114
 * @route '/admin/responsables/{responsable}'
 */
destroy.url = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { responsable: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { responsable: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    responsable: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        responsable: typeof args.responsable === 'object'
                ? args.responsable.id
                : args.responsable,
                }

    return destroy.definition.url
            .replace('{responsable}', parsedArgs.responsable.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ResponsableController::destroy
 * @see app/Http/Controllers/Admin/ResponsableController.php:114
 * @route '/admin/responsables/{responsable}'
 */
destroy.delete = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\ResponsableController::destroy
 * @see app/Http/Controllers/Admin/ResponsableController.php:114
 * @route '/admin/responsables/{responsable}'
 */
    const destroyForm = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ResponsableController::destroy
 * @see app/Http/Controllers/Admin/ResponsableController.php:114
 * @route '/admin/responsables/{responsable}'
 */
        destroyForm.delete = (args: { responsable: number | { id: number } } | [responsable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const ResponsableController = { index, store, update, toggleStatus, destroy }

export default ResponsableController