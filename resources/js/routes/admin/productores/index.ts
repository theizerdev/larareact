import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/productores',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
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
* @see \App\Http\Controllers\Admin\ProductorController::store
 * @see app/Http/Controllers/Admin/ProductorController.php:73
 * @route '/admin/productores'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/productores',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::store
 * @see app/Http/Controllers/Admin/ProductorController.php:73
 * @route '/admin/productores'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::store
 * @see app/Http/Controllers/Admin/ProductorController.php:73
 * @route '/admin/productores'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::store
 * @see app/Http/Controllers/Admin/ProductorController.php:73
 * @route '/admin/productores'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::store
 * @see app/Http/Controllers/Admin/ProductorController.php:73
 * @route '/admin/productores'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\ProductorController::preRegistro
 * @see app/Http/Controllers/Admin/ProductorController.php:210
 * @route '/admin/productores/pre-registro'
 */
export const preRegistro = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: preRegistro.url(options),
    method: 'post',
})

preRegistro.definition = {
    methods: ["post"],
    url: '/admin/productores/pre-registro',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::preRegistro
 * @see app/Http/Controllers/Admin/ProductorController.php:210
 * @route '/admin/productores/pre-registro'
 */
preRegistro.url = (options?: RouteQueryOptions) => {
    return preRegistro.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::preRegistro
 * @see app/Http/Controllers/Admin/ProductorController.php:210
 * @route '/admin/productores/pre-registro'
 */
preRegistro.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: preRegistro.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::preRegistro
 * @see app/Http/Controllers/Admin/ProductorController.php:210
 * @route '/admin/productores/pre-registro'
 */
    const preRegistroForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: preRegistro.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::preRegistro
 * @see app/Http/Controllers/Admin/ProductorController.php:210
 * @route '/admin/productores/pre-registro'
 */
        preRegistroForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: preRegistro.url(options),
            method: 'post',
        })
    
    preRegistro.form = preRegistroForm
/**
* @see \App\Http\Controllers\Admin\ProductorController::update
 * @see app/Http/Controllers/Admin/ProductorController.php:173
 * @route '/admin/productores/{productor}'
 */
export const update = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/productores/{productor}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::update
 * @see app/Http/Controllers/Admin/ProductorController.php:173
 * @route '/admin/productores/{productor}'
 */
update.url = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { productor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: typeof args.productor === 'object'
                ? args.productor.id
                : args.productor,
                }

    return update.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::update
 * @see app/Http/Controllers/Admin/ProductorController.php:173
 * @route '/admin/productores/{productor}'
 */
update.put = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::update
 * @see app/Http/Controllers/Admin/ProductorController.php:173
 * @route '/admin/productores/{productor}'
 */
    const updateForm = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::update
 * @see app/Http/Controllers/Admin/ProductorController.php:173
 * @route '/admin/productores/{productor}'
 */
        updateForm.put = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\ProductorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProductorController.php:197
 * @route '/admin/productores/{productor}/toggle-status'
 */
export const toggleStatus = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/productores/{productor}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProductorController.php:197
 * @route '/admin/productores/{productor}/toggle-status'
 */
toggleStatus.url = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { productor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: typeof args.productor === 'object'
                ? args.productor.id
                : args.productor,
                }

    return toggleStatus.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProductorController.php:197
 * @route '/admin/productores/{productor}/toggle-status'
 */
toggleStatus.patch = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProductorController.php:197
 * @route '/admin/productores/{productor}/toggle-status'
 */
    const toggleStatusForm = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProductorController.php:197
 * @route '/admin/productores/{productor}/toggle-status'
 */
        toggleStatusForm.patch = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\ProductorController::destroy
 * @see app/Http/Controllers/Admin/ProductorController.php:190
 * @route '/admin/productores/{productor}'
 */
export const destroy = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/productores/{productor}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::destroy
 * @see app/Http/Controllers/Admin/ProductorController.php:190
 * @route '/admin/productores/{productor}'
 */
destroy.url = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { productor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: typeof args.productor === 'object'
                ? args.productor.id
                : args.productor,
                }

    return destroy.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::destroy
 * @see app/Http/Controllers/Admin/ProductorController.php:190
 * @route '/admin/productores/{productor}'
 */
destroy.delete = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::destroy
 * @see app/Http/Controllers/Admin/ProductorController.php:190
 * @route '/admin/productores/{productor}'
 */
    const destroyForm = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::destroy
 * @see app/Http/Controllers/Admin/ProductorController.php:190
 * @route '/admin/productores/{productor}'
 */
        destroyForm.delete = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const productores = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
preRegistro: Object.assign(preRegistro, preRegistro),
update: Object.assign(update, update),
toggleStatus: Object.assign(toggleStatus, toggleStatus),
destroy: Object.assign(destroy, destroy),
}

export default productores