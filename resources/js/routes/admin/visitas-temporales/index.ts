import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::index
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:26
 * @route '/admin/visitas-temporales'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/visitas-temporales',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::index
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:26
 * @route '/admin/visitas-temporales'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::index
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:26
 * @route '/admin/visitas-temporales'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::index
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:26
 * @route '/admin/visitas-temporales'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::index
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:26
 * @route '/admin/visitas-temporales'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::index
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:26
 * @route '/admin/visitas-temporales'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::index
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:26
 * @route '/admin/visitas-temporales'
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
* @see \App\Http\Controllers\Admin\VisitaTemporalController::store
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:90
 * @route '/admin/visitas-temporales'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/visitas-temporales',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::store
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:90
 * @route '/admin/visitas-temporales'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::store
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:90
 * @route '/admin/visitas-temporales'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::store
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:90
 * @route '/admin/visitas-temporales'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::store
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:90
 * @route '/admin/visitas-temporales'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::preRegistro
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:439
 * @route '/admin/visitas-temporales/pre-registro'
 */
export const preRegistro = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: preRegistro.url(options),
    method: 'post',
})

preRegistro.definition = {
    methods: ["post"],
    url: '/admin/visitas-temporales/pre-registro',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::preRegistro
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:439
 * @route '/admin/visitas-temporales/pre-registro'
 */
preRegistro.url = (options?: RouteQueryOptions) => {
    return preRegistro.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::preRegistro
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:439
 * @route '/admin/visitas-temporales/pre-registro'
 */
preRegistro.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: preRegistro.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::preRegistro
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:439
 * @route '/admin/visitas-temporales/pre-registro'
 */
    const preRegistroForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: preRegistro.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::preRegistro
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:439
 * @route '/admin/visitas-temporales/pre-registro'
 */
        preRegistroForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: preRegistro.url(options),
            method: 'post',
        })
    
    preRegistro.form = preRegistroForm
/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::update
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:125
 * @route '/admin/visitas-temporales/{visitaTemporal}'
 */
export const update = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/visitas-temporales/{visitaTemporal}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::update
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:125
 * @route '/admin/visitas-temporales/{visitaTemporal}'
 */
update.url = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { visitaTemporal: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { visitaTemporal: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    visitaTemporal: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        visitaTemporal: typeof args.visitaTemporal === 'object'
                ? args.visitaTemporal.id
                : args.visitaTemporal,
                }

    return update.definition.url
            .replace('{visitaTemporal}', parsedArgs.visitaTemporal.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::update
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:125
 * @route '/admin/visitas-temporales/{visitaTemporal}'
 */
update.put = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::update
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:125
 * @route '/admin/visitas-temporales/{visitaTemporal}'
 */
    const updateForm = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::update
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:125
 * @route '/admin/visitas-temporales/{visitaTemporal}'
 */
        updateForm.put = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\VisitaTemporalController::toggleStatus
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:329
 * @route '/admin/visitas-temporales/{visitaTemporal}/toggle-status'
 */
export const toggleStatus = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/visitas-temporales/{visitaTemporal}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::toggleStatus
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:329
 * @route '/admin/visitas-temporales/{visitaTemporal}/toggle-status'
 */
toggleStatus.url = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { visitaTemporal: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { visitaTemporal: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    visitaTemporal: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        visitaTemporal: typeof args.visitaTemporal === 'object'
                ? args.visitaTemporal.id
                : args.visitaTemporal,
                }

    return toggleStatus.definition.url
            .replace('{visitaTemporal}', parsedArgs.visitaTemporal.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::toggleStatus
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:329
 * @route '/admin/visitas-temporales/{visitaTemporal}/toggle-status'
 */
toggleStatus.patch = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::toggleStatus
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:329
 * @route '/admin/visitas-temporales/{visitaTemporal}/toggle-status'
 */
    const toggleStatusForm = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::toggleStatus
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:329
 * @route '/admin/visitas-temporales/{visitaTemporal}/toggle-status'
 */
        toggleStatusForm.patch = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\VisitaTemporalController::destroy
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:350
 * @route '/admin/visitas-temporales/{visitaTemporal}'
 */
export const destroy = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/visitas-temporales/{visitaTemporal}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::destroy
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:350
 * @route '/admin/visitas-temporales/{visitaTemporal}'
 */
destroy.url = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { visitaTemporal: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { visitaTemporal: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    visitaTemporal: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        visitaTemporal: typeof args.visitaTemporal === 'object'
                ? args.visitaTemporal.id
                : args.visitaTemporal,
                }

    return destroy.definition.url
            .replace('{visitaTemporal}', parsedArgs.visitaTemporal.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::destroy
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:350
 * @route '/admin/visitas-temporales/{visitaTemporal}'
 */
destroy.delete = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::destroy
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:350
 * @route '/admin/visitas-temporales/{visitaTemporal}'
 */
    const destroyForm = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::destroy
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:350
 * @route '/admin/visitas-temporales/{visitaTemporal}'
 */
        destroyForm.delete = (args: { visitaTemporal: number | { id: number } } | [visitaTemporal: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const visitasTemporales = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
preRegistro: Object.assign(preRegistro, preRegistro),
update: Object.assign(update, update),
toggleStatus: Object.assign(toggleStatus, toggleStatus),
destroy: Object.assign(destroy, destroy),
}

export default visitasTemporales