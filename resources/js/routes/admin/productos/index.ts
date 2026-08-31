import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ProductoController::quickStock
* @see app/Http/Controllers/Admin/ProductoController.php:264
* @route '/admin/productos/{producto}/quick-stock'
*/
export const quickStock = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: quickStock.url(args, options),
    method: 'post',
})

quickStock.definition = {
    methods: ["post"],
    url: '/admin/productos/{producto}/quick-stock',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProductoController::quickStock
* @see app/Http/Controllers/Admin/ProductoController.php:264
* @route '/admin/productos/{producto}/quick-stock'
*/
quickStock.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { producto: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            producto: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        producto: typeof args.producto === 'object'
        ? args.producto.id
        : args.producto,
    }

    return quickStock.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductoController::quickStock
* @see app/Http/Controllers/Admin/ProductoController.php:264
* @route '/admin/productos/{producto}/quick-stock'
*/
quickStock.post = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: quickStock.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ProductoController::index
* @see app/Http/Controllers/Admin/ProductoController.php:30
* @route '/admin/productos'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/productos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProductoController::index
* @see app/Http/Controllers/Admin/ProductoController.php:30
* @route '/admin/productos'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductoController::index
* @see app/Http/Controllers/Admin/ProductoController.php:30
* @route '/admin/productos'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ProductoController::index
* @see app/Http/Controllers/Admin/ProductoController.php:30
* @route '/admin/productos'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ProductoController::store
* @see app/Http/Controllers/Admin/ProductoController.php:163
* @route '/admin/productos'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/productos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProductoController::store
* @see app/Http/Controllers/Admin/ProductoController.php:163
* @route '/admin/productos'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductoController::store
* @see app/Http/Controllers/Admin/ProductoController.php:163
* @route '/admin/productos'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ProductoController::show
* @see app/Http/Controllers/Admin/ProductoController.php:0
* @route '/admin/productos/{producto}'
*/
export const show = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/productos/{producto}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProductoController::show
* @see app/Http/Controllers/Admin/ProductoController.php:0
* @route '/admin/productos/{producto}'
*/
show.url = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    if (Array.isArray(args)) {
        args = {
            producto: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        producto: args.producto,
    }

    return show.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductoController::show
* @see app/Http/Controllers/Admin/ProductoController.php:0
* @route '/admin/productos/{producto}'
*/
show.get = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ProductoController::show
* @see app/Http/Controllers/Admin/ProductoController.php:0
* @route '/admin/productos/{producto}'
*/
show.head = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ProductoController::update
* @see app/Http/Controllers/Admin/ProductoController.php:207
* @route '/admin/productos/{producto}'
*/
export const update = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/productos/{producto}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Admin\ProductoController::update
* @see app/Http/Controllers/Admin/ProductoController.php:207
* @route '/admin/productos/{producto}'
*/
update.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { producto: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            producto: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        producto: typeof args.producto === 'object'
        ? args.producto.id
        : args.producto,
    }

    return update.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductoController::update
* @see app/Http/Controllers/Admin/ProductoController.php:207
* @route '/admin/productos/{producto}'
*/
update.put = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\ProductoController::update
* @see app/Http/Controllers/Admin/ProductoController.php:207
* @route '/admin/productos/{producto}'
*/
update.patch = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\ProductoController::destroy
* @see app/Http/Controllers/Admin/ProductoController.php:251
* @route '/admin/productos/{producto}'
*/
export const destroy = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/productos/{producto}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ProductoController::destroy
* @see app/Http/Controllers/Admin/ProductoController.php:251
* @route '/admin/productos/{producto}'
*/
destroy.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { producto: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            producto: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        producto: typeof args.producto === 'object'
        ? args.producto.id
        : args.producto,
    }

    return destroy.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductoController::destroy
* @see app/Http/Controllers/Admin/ProductoController.php:251
* @route '/admin/productos/{producto}'
*/
destroy.delete = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

const productos = {
    quickStock: Object.assign(quickStock, quickStock),
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    show: Object.assign(show, show),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
}

export default productos