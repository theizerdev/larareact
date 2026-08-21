import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:17
 * @route '/admin/productores/{productor}/empleados'
 */
export const index = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/productores/{productor}/empleados',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:17
 * @route '/admin/productores/{productor}/empleados'
 */
index.url = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: args.productor,
                }

    return index.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:17
 * @route '/admin/productores/{productor}/empleados'
 */
index.get = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:17
 * @route '/admin/productores/{productor}/empleados'
 */
index.head = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:17
 * @route '/admin/productores/{productor}/empleados'
 */
    const indexForm = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:17
 * @route '/admin/productores/{productor}/empleados'
 */
        indexForm.get = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::index
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:17
 * @route '/admin/productores/{productor}/empleados'
 */
        indexForm.head = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::store
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:33
 * @route '/admin/productores/{productor}/empleados'
 */
export const store = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/productores/{productor}/empleados',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::store
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:33
 * @route '/admin/productores/{productor}/empleados'
 */
store.url = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: args.productor,
                }

    return store.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::store
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:33
 * @route '/admin/productores/{productor}/empleados'
 */
store.post = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::store
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:33
 * @route '/admin/productores/{productor}/empleados'
 */
    const storeForm = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::store
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:33
 * @route '/admin/productores/{productor}/empleados'
 */
        storeForm.post = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::update
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:86
 * @route '/admin/productor-empleados/{id}'
 */
export const update = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(args, options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/admin/productor-empleados/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::update
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:86
 * @route '/admin/productor-empleados/{id}'
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
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::update
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:86
 * @route '/admin/productor-empleados/{id}'
 */
update.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::update
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:86
 * @route '/admin/productor-empleados/{id}'
 */
    const updateForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::update
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:86
 * @route '/admin/productor-empleados/{id}'
 */
        updateForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, options),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::destroy
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:144
 * @route '/admin/productor-empleados/{id}'
 */
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/productor-empleados/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::destroy
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:144
 * @route '/admin/productor-empleados/{id}'
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
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::destroy
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:144
 * @route '/admin/productor-empleados/{id}'
 */
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::destroy
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:144
 * @route '/admin/productor-empleados/{id}'
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
* @see \App\Http\Controllers\Admin\ProductorEmpleadoController::destroy
 * @see app/Http/Controllers/Admin/ProductorEmpleadoController.php:144
 * @route '/admin/productor-empleados/{id}'
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
const ProductorEmpleadoController = { index, store, update, destroy }

export default ProductorEmpleadoController