import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ProveedorController::index
 * @see app/Http/Controllers/Admin/ProveedorController.php:17
 * @route '/admin/proveedores'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/proveedores',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorController::index
 * @see app/Http/Controllers/Admin/ProveedorController.php:17
 * @route '/admin/proveedores'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorController::index
 * @see app/Http/Controllers/Admin/ProveedorController.php:17
 * @route '/admin/proveedores'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ProveedorController::index
 * @see app/Http/Controllers/Admin/ProveedorController.php:17
 * @route '/admin/proveedores'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ProveedorController::index
 * @see app/Http/Controllers/Admin/ProveedorController.php:17
 * @route '/admin/proveedores'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ProveedorController::index
 * @see app/Http/Controllers/Admin/ProveedorController.php:17
 * @route '/admin/proveedores'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ProveedorController::index
 * @see app/Http/Controllers/Admin/ProveedorController.php:17
 * @route '/admin/proveedores'
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
* @see \App\Http\Controllers\Admin\ProveedorController::store
 * @see app/Http/Controllers/Admin/ProveedorController.php:68
 * @route '/admin/proveedores'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/proveedores',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorController::store
 * @see app/Http/Controllers/Admin/ProveedorController.php:68
 * @route '/admin/proveedores'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorController::store
 * @see app/Http/Controllers/Admin/ProveedorController.php:68
 * @route '/admin/proveedores'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProveedorController::store
 * @see app/Http/Controllers/Admin/ProveedorController.php:68
 * @route '/admin/proveedores'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProveedorController::store
 * @see app/Http/Controllers/Admin/ProveedorController.php:68
 * @route '/admin/proveedores'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\ProveedorController::generatePreRegistro
 * @see app/Http/Controllers/Admin/ProveedorController.php:117
 * @route '/admin/proveedores/pre-registro'
 */
export const generatePreRegistro = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generatePreRegistro.url(options),
    method: 'post',
})

generatePreRegistro.definition = {
    methods: ["post"],
    url: '/admin/proveedores/pre-registro',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorController::generatePreRegistro
 * @see app/Http/Controllers/Admin/ProveedorController.php:117
 * @route '/admin/proveedores/pre-registro'
 */
generatePreRegistro.url = (options?: RouteQueryOptions) => {
    return generatePreRegistro.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorController::generatePreRegistro
 * @see app/Http/Controllers/Admin/ProveedorController.php:117
 * @route '/admin/proveedores/pre-registro'
 */
generatePreRegistro.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generatePreRegistro.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProveedorController::generatePreRegistro
 * @see app/Http/Controllers/Admin/ProveedorController.php:117
 * @route '/admin/proveedores/pre-registro'
 */
    const generatePreRegistroForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: generatePreRegistro.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProveedorController::generatePreRegistro
 * @see app/Http/Controllers/Admin/ProveedorController.php:117
 * @route '/admin/proveedores/pre-registro'
 */
        generatePreRegistroForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: generatePreRegistro.url(options),
            method: 'post',
        })
    
    generatePreRegistro.form = generatePreRegistroForm
/**
* @see \App\Http\Controllers\Admin\ProveedorController::update
 * @see app/Http/Controllers/Admin/ProveedorController.php:83
 * @route '/admin/proveedores/{proveedor}'
 */
export const update = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/proveedores/{proveedor}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorController::update
 * @see app/Http/Controllers/Admin/ProveedorController.php:83
 * @route '/admin/proveedores/{proveedor}'
 */
update.url = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proveedor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proveedor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proveedor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proveedor: typeof args.proveedor === 'object'
                ? args.proveedor.id
                : args.proveedor,
                }

    return update.definition.url
            .replace('{proveedor}', parsedArgs.proveedor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorController::update
 * @see app/Http/Controllers/Admin/ProveedorController.php:83
 * @route '/admin/proveedores/{proveedor}'
 */
update.put = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\ProveedorController::update
 * @see app/Http/Controllers/Admin/ProveedorController.php:83
 * @route '/admin/proveedores/{proveedor}'
 */
    const updateForm = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProveedorController::update
 * @see app/Http/Controllers/Admin/ProveedorController.php:83
 * @route '/admin/proveedores/{proveedor}'
 */
        updateForm.put = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\ProveedorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProveedorController.php:104
 * @route '/admin/proveedores/{proveedor}/toggle-status'
 */
export const toggleStatus = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/proveedores/{proveedor}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProveedorController.php:104
 * @route '/admin/proveedores/{proveedor}/toggle-status'
 */
toggleStatus.url = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proveedor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proveedor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proveedor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proveedor: typeof args.proveedor === 'object'
                ? args.proveedor.id
                : args.proveedor,
                }

    return toggleStatus.definition.url
            .replace('{proveedor}', parsedArgs.proveedor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProveedorController.php:104
 * @route '/admin/proveedores/{proveedor}/toggle-status'
 */
toggleStatus.patch = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\ProveedorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProveedorController.php:104
 * @route '/admin/proveedores/{proveedor}/toggle-status'
 */
    const toggleStatusForm = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProveedorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProveedorController.php:104
 * @route '/admin/proveedores/{proveedor}/toggle-status'
 */
        toggleStatusForm.patch = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\ProveedorController::destroy
 * @see app/Http/Controllers/Admin/ProveedorController.php:97
 * @route '/admin/proveedores/{proveedor}'
 */
export const destroy = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/proveedores/{proveedor}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorController::destroy
 * @see app/Http/Controllers/Admin/ProveedorController.php:97
 * @route '/admin/proveedores/{proveedor}'
 */
destroy.url = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proveedor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proveedor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proveedor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proveedor: typeof args.proveedor === 'object'
                ? args.proveedor.id
                : args.proveedor,
                }

    return destroy.definition.url
            .replace('{proveedor}', parsedArgs.proveedor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorController::destroy
 * @see app/Http/Controllers/Admin/ProveedorController.php:97
 * @route '/admin/proveedores/{proveedor}'
 */
destroy.delete = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\ProveedorController::destroy
 * @see app/Http/Controllers/Admin/ProveedorController.php:97
 * @route '/admin/proveedores/{proveedor}'
 */
    const destroyForm = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProveedorController::destroy
 * @see app/Http/Controllers/Admin/ProveedorController.php:97
 * @route '/admin/proveedores/{proveedor}'
 */
        destroyForm.delete = (args: { proveedor: number | { id: number } } | [proveedor: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const ProveedorController = { index, store, generatePreRegistro, update, toggleStatus, destroy }

export default ProveedorController