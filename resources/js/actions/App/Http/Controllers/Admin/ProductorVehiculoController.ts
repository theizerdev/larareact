import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::index
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:17
 * @route '/admin/productores/{productor}/vehiculos'
 */
export const index = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/productores/{productor}/vehiculos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::index
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:17
 * @route '/admin/productores/{productor}/vehiculos'
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
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::index
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:17
 * @route '/admin/productores/{productor}/vehiculos'
 */
index.get = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::index
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:17
 * @route '/admin/productores/{productor}/vehiculos'
 */
index.head = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::index
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:17
 * @route '/admin/productores/{productor}/vehiculos'
 */
    const indexForm = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::index
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:17
 * @route '/admin/productores/{productor}/vehiculos'
 */
        indexForm.get = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::index
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:17
 * @route '/admin/productores/{productor}/vehiculos'
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
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::store
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:33
 * @route '/admin/productores/{productor}/vehiculos'
 */
export const store = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/productores/{productor}/vehiculos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::store
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:33
 * @route '/admin/productores/{productor}/vehiculos'
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
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::store
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:33
 * @route '/admin/productores/{productor}/vehiculos'
 */
store.post = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::store
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:33
 * @route '/admin/productores/{productor}/vehiculos'
 */
    const storeForm = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::store
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:33
 * @route '/admin/productores/{productor}/vehiculos'
 */
        storeForm.post = (args: { productor: string | number } | [productor: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::update
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:79
 * @route '/admin/productor-vehiculos/{id}'
 */
export const update = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(args, options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/admin/productor-vehiculos/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::update
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:79
 * @route '/admin/productor-vehiculos/{id}'
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
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::update
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:79
 * @route '/admin/productor-vehiculos/{id}'
 */
update.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::update
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:79
 * @route '/admin/productor-vehiculos/{id}'
 */
    const updateForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::update
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:79
 * @route '/admin/productor-vehiculos/{id}'
 */
        updateForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, options),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::destroy
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:127
 * @route '/admin/productor-vehiculos/{id}'
 */
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/productor-vehiculos/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::destroy
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:127
 * @route '/admin/productor-vehiculos/{id}'
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
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::destroy
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:127
 * @route '/admin/productor-vehiculos/{id}'
 */
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::destroy
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:127
 * @route '/admin/productor-vehiculos/{id}'
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
* @see \App\Http\Controllers\Admin\ProductorVehiculoController::destroy
 * @see app/Http/Controllers/Admin/ProductorVehiculoController.php:127
 * @route '/admin/productor-vehiculos/{id}'
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
const ProductorVehiculoController = { index, store, update, destroy }

export default ProductorVehiculoController