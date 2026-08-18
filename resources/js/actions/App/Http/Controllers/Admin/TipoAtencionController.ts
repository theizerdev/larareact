import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\TipoAtencionController::index
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:16
 * @route '/admin/tipos-atencion'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/tipos-atencion',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\TipoAtencionController::index
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:16
 * @route '/admin/tipos-atencion'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TipoAtencionController::index
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:16
 * @route '/admin/tipos-atencion'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\TipoAtencionController::index
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:16
 * @route '/admin/tipos-atencion'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\TipoAtencionController::index
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:16
 * @route '/admin/tipos-atencion'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\TipoAtencionController::index
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:16
 * @route '/admin/tipos-atencion'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\TipoAtencionController::index
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:16
 * @route '/admin/tipos-atencion'
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
* @see \App\Http\Controllers\Admin\TipoAtencionController::store
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:78
 * @route '/admin/tipos-atencion'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/tipos-atencion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\TipoAtencionController::store
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:78
 * @route '/admin/tipos-atencion'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TipoAtencionController::store
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:78
 * @route '/admin/tipos-atencion'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\TipoAtencionController::store
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:78
 * @route '/admin/tipos-atencion'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\TipoAtencionController::store
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:78
 * @route '/admin/tipos-atencion'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\TipoAtencionController::update
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:110
 * @route '/admin/tipos-atencion/{tipoAtencion}'
 */
export const update = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/tipos-atencion/{tipoAtencion}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\TipoAtencionController::update
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:110
 * @route '/admin/tipos-atencion/{tipoAtencion}'
 */
update.url = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipoAtencion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { tipoAtencion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    tipoAtencion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipoAtencion: typeof args.tipoAtencion === 'object'
                ? args.tipoAtencion.id
                : args.tipoAtencion,
                }

    return update.definition.url
            .replace('{tipoAtencion}', parsedArgs.tipoAtencion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TipoAtencionController::update
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:110
 * @route '/admin/tipos-atencion/{tipoAtencion}'
 */
update.put = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\TipoAtencionController::update
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:110
 * @route '/admin/tipos-atencion/{tipoAtencion}'
 */
    const updateForm = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\TipoAtencionController::update
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:110
 * @route '/admin/tipos-atencion/{tipoAtencion}'
 */
        updateForm.put = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\TipoAtencionController::toggleStatus
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:138
 * @route '/admin/tipos-atencion/{tipoAtencion}/toggle-status'
 */
export const toggleStatus = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/tipos-atencion/{tipoAtencion}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\TipoAtencionController::toggleStatus
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:138
 * @route '/admin/tipos-atencion/{tipoAtencion}/toggle-status'
 */
toggleStatus.url = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipoAtencion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { tipoAtencion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    tipoAtencion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipoAtencion: typeof args.tipoAtencion === 'object'
                ? args.tipoAtencion.id
                : args.tipoAtencion,
                }

    return toggleStatus.definition.url
            .replace('{tipoAtencion}', parsedArgs.tipoAtencion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TipoAtencionController::toggleStatus
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:138
 * @route '/admin/tipos-atencion/{tipoAtencion}/toggle-status'
 */
toggleStatus.patch = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\TipoAtencionController::toggleStatus
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:138
 * @route '/admin/tipos-atencion/{tipoAtencion}/toggle-status'
 */
    const toggleStatusForm = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\TipoAtencionController::toggleStatus
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:138
 * @route '/admin/tipos-atencion/{tipoAtencion}/toggle-status'
 */
        toggleStatusForm.patch = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\TipoAtencionController::destroy
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:148
 * @route '/admin/tipos-atencion/{tipoAtencion}'
 */
export const destroy = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/tipos-atencion/{tipoAtencion}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\TipoAtencionController::destroy
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:148
 * @route '/admin/tipos-atencion/{tipoAtencion}'
 */
destroy.url = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipoAtencion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { tipoAtencion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    tipoAtencion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipoAtencion: typeof args.tipoAtencion === 'object'
                ? args.tipoAtencion.id
                : args.tipoAtencion,
                }

    return destroy.definition.url
            .replace('{tipoAtencion}', parsedArgs.tipoAtencion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TipoAtencionController::destroy
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:148
 * @route '/admin/tipos-atencion/{tipoAtencion}'
 */
destroy.delete = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\TipoAtencionController::destroy
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:148
 * @route '/admin/tipos-atencion/{tipoAtencion}'
 */
    const destroyForm = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\TipoAtencionController::destroy
 * @see app/Http/Controllers/Admin/TipoAtencionController.php:148
 * @route '/admin/tipos-atencion/{tipoAtencion}'
 */
        destroyForm.delete = (args: { tipoAtencion: number | { id: number } } | [tipoAtencion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const TipoAtencionController = { index, store, update, toggleStatus, destroy }

export default TipoAtencionController