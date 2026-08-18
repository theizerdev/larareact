import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:17
 * @route '/admin/proveedores/{proveedor}/empleados'
 */
export const index = (args: { proveedor: string | number } | [proveedor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/proveedores/{proveedor}/empleados',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:17
 * @route '/admin/proveedores/{proveedor}/empleados'
 */
index.url = (args: { proveedor: string | number } | [proveedor: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proveedor: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    proveedor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proveedor: args.proveedor,
                }

    return index.definition.url
            .replace('{proveedor}', parsedArgs.proveedor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:17
 * @route '/admin/proveedores/{proveedor}/empleados'
 */
index.get = (args: { proveedor: string | number } | [proveedor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:17
 * @route '/admin/proveedores/{proveedor}/empleados'
 */
index.head = (args: { proveedor: string | number } | [proveedor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:17
 * @route '/admin/proveedores/{proveedor}/empleados'
 */
    const indexForm = (args: { proveedor: string | number } | [proveedor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:17
 * @route '/admin/proveedores/{proveedor}/empleados'
 */
        indexForm.get = (args: { proveedor: string | number } | [proveedor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:17
 * @route '/admin/proveedores/{proveedor}/empleados'
 */
        indexForm.head = (args: { proveedor: string | number } | [proveedor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::store
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:33
 * @route '/admin/proveedores/{proveedor}/empleados'
 */
export const store = (args: { proveedor: string | number } | [proveedor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/proveedores/{proveedor}/empleados',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::store
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:33
 * @route '/admin/proveedores/{proveedor}/empleados'
 */
store.url = (args: { proveedor: string | number } | [proveedor: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proveedor: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    proveedor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proveedor: args.proveedor,
                }

    return store.definition.url
            .replace('{proveedor}', parsedArgs.proveedor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::store
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:33
 * @route '/admin/proveedores/{proveedor}/empleados'
 */
store.post = (args: { proveedor: string | number } | [proveedor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::store
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:33
 * @route '/admin/proveedores/{proveedor}/empleados'
 */
    const storeForm = (args: { proveedor: string | number } | [proveedor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::store
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:33
 * @route '/admin/proveedores/{proveedor}/empleados'
 */
        storeForm.post = (args: { proveedor: string | number } | [proveedor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::update
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:86
 * @route '/admin/proveedor-empleados/{id}'
 */
export const update = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(args, options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/admin/proveedor-empleados/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::update
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:86
 * @route '/admin/proveedor-empleados/{id}'
 */
update.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return update.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::update
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:86
 * @route '/admin/proveedor-empleados/{id}'
 */
update.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::update
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:86
 * @route '/admin/proveedor-empleados/{id}'
 */
    const updateForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::update
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:86
 * @route '/admin/proveedor-empleados/{id}'
 */
        updateForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, options),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::destroy
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:145
 * @route '/admin/proveedor-empleados/{id}'
 */
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/proveedor-empleados/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::destroy
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:145
 * @route '/admin/proveedor-empleados/{id}'
 */
destroy.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return destroy.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::destroy
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:145
 * @route '/admin/proveedor-empleados/{id}'
 */
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::destroy
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:145
 * @route '/admin/proveedor-empleados/{id}'
 */
    const destroyForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProveedorEmpleadoController::destroy
 * @see app/Http/Controllers/Admin/ProveedorEmpleadoController.php:145
 * @route '/admin/proveedor-empleados/{id}'
 */
        destroyForm.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const ProveedorEmpleadoController = { index, store, update, destroy }

export default ProveedorEmpleadoController