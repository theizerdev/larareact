import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::index
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:13
 * @route '/admin/catalogo/modelos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/catalogo/modelos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::index
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:13
 * @route '/admin/catalogo/modelos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::index
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:13
 * @route '/admin/catalogo/modelos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::index
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:13
 * @route '/admin/catalogo/modelos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::index
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:13
 * @route '/admin/catalogo/modelos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::index
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:13
 * @route '/admin/catalogo/modelos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::index
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:13
 * @route '/admin/catalogo/modelos'
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
* @see \App\Http\Controllers\Admin\ModeloEquipoController::store
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:56
 * @route '/admin/catalogo/modelos'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/catalogo/modelos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::store
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:56
 * @route '/admin/catalogo/modelos'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::store
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:56
 * @route '/admin/catalogo/modelos'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::store
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:56
 * @route '/admin/catalogo/modelos'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::store
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:56
 * @route '/admin/catalogo/modelos'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::update
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:87
 * @route '/admin/catalogo/modelos/{modelo}'
 */
export const update = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/catalogo/modelos/{modelo}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::update
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:87
 * @route '/admin/catalogo/modelos/{modelo}'
 */
update.url = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { modelo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { modelo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    modelo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        modelo: typeof args.modelo === 'object'
                ? args.modelo.id
                : args.modelo,
                }

    return update.definition.url
            .replace('{modelo}', parsedArgs.modelo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::update
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:87
 * @route '/admin/catalogo/modelos/{modelo}'
 */
update.put = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::update
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:87
 * @route '/admin/catalogo/modelos/{modelo}'
 */
    const updateForm = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::update
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:87
 * @route '/admin/catalogo/modelos/{modelo}'
 */
        updateForm.put = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\ModeloEquipoController::toggleStatus
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:118
 * @route '/admin/catalogo/modelos/{modelo}/toggle-status'
 */
export const toggleStatus = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/catalogo/modelos/{modelo}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::toggleStatus
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:118
 * @route '/admin/catalogo/modelos/{modelo}/toggle-status'
 */
toggleStatus.url = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { modelo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { modelo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    modelo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        modelo: typeof args.modelo === 'object'
                ? args.modelo.id
                : args.modelo,
                }

    return toggleStatus.definition.url
            .replace('{modelo}', parsedArgs.modelo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::toggleStatus
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:118
 * @route '/admin/catalogo/modelos/{modelo}/toggle-status'
 */
toggleStatus.patch = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::toggleStatus
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:118
 * @route '/admin/catalogo/modelos/{modelo}/toggle-status'
 */
    const toggleStatusForm = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::toggleStatus
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:118
 * @route '/admin/catalogo/modelos/{modelo}/toggle-status'
 */
        toggleStatusForm.patch = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\ModeloEquipoController::destroy
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:138
 * @route '/admin/catalogo/modelos/{modelo}'
 */
export const destroy = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/catalogo/modelos/{modelo}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::destroy
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:138
 * @route '/admin/catalogo/modelos/{modelo}'
 */
destroy.url = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { modelo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { modelo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    modelo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        modelo: typeof args.modelo === 'object'
                ? args.modelo.id
                : args.modelo,
                }

    return destroy.definition.url
            .replace('{modelo}', parsedArgs.modelo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::destroy
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:138
 * @route '/admin/catalogo/modelos/{modelo}'
 */
destroy.delete = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::destroy
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:138
 * @route '/admin/catalogo/modelos/{modelo}'
 */
    const destroyForm = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ModeloEquipoController::destroy
 * @see app/Http/Controllers/Admin/ModeloEquipoController.php:138
 * @route '/admin/catalogo/modelos/{modelo}'
 */
        destroyForm.delete = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const ModeloEquipoController = { index, store, update, toggleStatus, destroy }

export default ModeloEquipoController