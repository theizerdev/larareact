import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\EmpresaController::index
 * @see app/Http/Controllers/Admin/EmpresaController.php:15
 * @route '/admin/empresas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/empresas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\EmpresaController::index
 * @see app/Http/Controllers/Admin/EmpresaController.php:15
 * @route '/admin/empresas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpresaController::index
 * @see app/Http/Controllers/Admin/EmpresaController.php:15
 * @route '/admin/empresas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\EmpresaController::index
 * @see app/Http/Controllers/Admin/EmpresaController.php:15
 * @route '/admin/empresas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\EmpresaController::index
 * @see app/Http/Controllers/Admin/EmpresaController.php:15
 * @route '/admin/empresas'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpresaController::index
 * @see app/Http/Controllers/Admin/EmpresaController.php:15
 * @route '/admin/empresas'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\EmpresaController::index
 * @see app/Http/Controllers/Admin/EmpresaController.php:15
 * @route '/admin/empresas'
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
* @see \App\Http\Controllers\Admin\EmpresaController::store
 * @see app/Http/Controllers/Admin/EmpresaController.php:54
 * @route '/admin/empresas'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/empresas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\EmpresaController::store
 * @see app/Http/Controllers/Admin/EmpresaController.php:54
 * @route '/admin/empresas'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpresaController::store
 * @see app/Http/Controllers/Admin/EmpresaController.php:54
 * @route '/admin/empresas'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\EmpresaController::store
 * @see app/Http/Controllers/Admin/EmpresaController.php:54
 * @route '/admin/empresas'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpresaController::store
 * @see app/Http/Controllers/Admin/EmpresaController.php:54
 * @route '/admin/empresas'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\EmpresaController::update
 * @see app/Http/Controllers/Admin/EmpresaController.php:89
 * @route '/admin/empresas/{empresa}'
 */
export const update = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/empresas/{empresa}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\EmpresaController::update
 * @see app/Http/Controllers/Admin/EmpresaController.php:89
 * @route '/admin/empresas/{empresa}'
 */
update.url = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empresa: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { empresa: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    empresa: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        empresa: typeof args.empresa === 'object'
                ? args.empresa.id
                : args.empresa,
                }

    return update.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpresaController::update
 * @see app/Http/Controllers/Admin/EmpresaController.php:89
 * @route '/admin/empresas/{empresa}'
 */
update.put = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\EmpresaController::update
 * @see app/Http/Controllers/Admin/EmpresaController.php:89
 * @route '/admin/empresas/{empresa}'
 */
    const updateForm = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpresaController::update
 * @see app/Http/Controllers/Admin/EmpresaController.php:89
 * @route '/admin/empresas/{empresa}'
 */
        updateForm.put = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\EmpresaController::toggleStatus
 * @see app/Http/Controllers/Admin/EmpresaController.php:123
 * @route '/admin/empresas/{empresa}/toggle-status'
 */
export const toggleStatus = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/empresas/{empresa}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\EmpresaController::toggleStatus
 * @see app/Http/Controllers/Admin/EmpresaController.php:123
 * @route '/admin/empresas/{empresa}/toggle-status'
 */
toggleStatus.url = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empresa: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { empresa: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    empresa: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        empresa: typeof args.empresa === 'object'
                ? args.empresa.id
                : args.empresa,
                }

    return toggleStatus.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpresaController::toggleStatus
 * @see app/Http/Controllers/Admin/EmpresaController.php:123
 * @route '/admin/empresas/{empresa}/toggle-status'
 */
toggleStatus.patch = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\EmpresaController::toggleStatus
 * @see app/Http/Controllers/Admin/EmpresaController.php:123
 * @route '/admin/empresas/{empresa}/toggle-status'
 */
    const toggleStatusForm = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpresaController::toggleStatus
 * @see app/Http/Controllers/Admin/EmpresaController.php:123
 * @route '/admin/empresas/{empresa}/toggle-status'
 */
        toggleStatusForm.patch = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\EmpresaController::logos
 * @see app/Http/Controllers/Admin/EmpresaController.php:143
 * @route '/admin/empresas/{empresa}/logos'
 */
export const logos = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logos.url(args, options),
    method: 'post',
})

logos.definition = {
    methods: ["post"],
    url: '/admin/empresas/{empresa}/logos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\EmpresaController::logos
 * @see app/Http/Controllers/Admin/EmpresaController.php:143
 * @route '/admin/empresas/{empresa}/logos'
 */
logos.url = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empresa: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { empresa: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    empresa: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        empresa: typeof args.empresa === 'object'
                ? args.empresa.id
                : args.empresa,
                }

    return logos.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpresaController::logos
 * @see app/Http/Controllers/Admin/EmpresaController.php:143
 * @route '/admin/empresas/{empresa}/logos'
 */
logos.post = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logos.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\EmpresaController::logos
 * @see app/Http/Controllers/Admin/EmpresaController.php:143
 * @route '/admin/empresas/{empresa}/logos'
 */
    const logosForm = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: logos.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpresaController::logos
 * @see app/Http/Controllers/Admin/EmpresaController.php:143
 * @route '/admin/empresas/{empresa}/logos'
 */
        logosForm.post = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: logos.url(args, options),
            method: 'post',
        })
    
    logos.form = logosForm
const empresas = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
update: Object.assign(update, update),
toggleStatus: Object.assign(toggleStatus, toggleStatus),
logos: Object.assign(logos, logos),
}

export default empresas