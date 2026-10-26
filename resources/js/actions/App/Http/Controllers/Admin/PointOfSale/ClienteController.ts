import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::index
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:38
* @route '/admin/clientes'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/clientes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::index
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:38
* @route '/admin/clientes'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::index
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:38
* @route '/admin/clientes'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::index
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:38
* @route '/admin/clientes'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::index
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:38
* @route '/admin/clientes'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::index
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:38
* @route '/admin/clientes'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::index
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:38
* @route '/admin/clientes'
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
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::store
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:62
* @route '/admin/clientes'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/clientes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::store
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:62
* @route '/admin/clientes'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::store
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:62
* @route '/admin/clientes'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::store
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:62
* @route '/admin/clientes'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::store
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:62
* @route '/admin/clientes'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::show
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:96
* @route '/admin/clientes/{cliente}'
*/
export const show = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/clientes/{cliente}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::show
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:96
* @route '/admin/clientes/{cliente}'
*/
show.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cliente: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { cliente: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            cliente: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        cliente: typeof args.cliente === 'object'
        ? args.cliente.id
        : args.cliente,
    }

    return show.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::show
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:96
* @route '/admin/clientes/{cliente}'
*/
show.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::show
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:96
* @route '/admin/clientes/{cliente}'
*/
show.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::show
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:96
* @route '/admin/clientes/{cliente}'
*/
const showForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::show
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:96
* @route '/admin/clientes/{cliente}'
*/
showForm.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::show
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:96
* @route '/admin/clientes/{cliente}'
*/
showForm.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::update
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:74
* @route '/admin/clientes/{cliente}'
*/
export const update = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/clientes/{cliente}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::update
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:74
* @route '/admin/clientes/{cliente}'
*/
update.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cliente: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { cliente: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            cliente: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        cliente: typeof args.cliente === 'object'
        ? args.cliente.id
        : args.cliente,
    }

    return update.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::update
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:74
* @route '/admin/clientes/{cliente}'
*/
update.put = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::update
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:74
* @route '/admin/clientes/{cliente}'
*/
update.patch = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::update
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:74
* @route '/admin/clientes/{cliente}'
*/
const updateForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::update
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:74
* @route '/admin/clientes/{cliente}'
*/
updateForm.put = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::update
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:74
* @route '/admin/clientes/{cliente}'
*/
updateForm.patch = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::destroy
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:86
* @route '/admin/clientes/{cliente}'
*/
export const destroy = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/clientes/{cliente}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::destroy
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:86
* @route '/admin/clientes/{cliente}'
*/
destroy.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cliente: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { cliente: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            cliente: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        cliente: typeof args.cliente === 'object'
        ? args.cliente.id
        : args.cliente,
    }

    return destroy.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::destroy
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:86
* @route '/admin/clientes/{cliente}'
*/
destroy.delete = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::destroy
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:86
* @route '/admin/clientes/{cliente}'
*/
const destroyForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::destroy
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:86
* @route '/admin/clientes/{cliente}'
*/
destroyForm.delete = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::registrarAbono
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:113
* @route '/admin/clientes/{cliente}/abono'
*/
export const registrarAbono = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarAbono.url(args, options),
    method: 'post',
})

registrarAbono.definition = {
    methods: ["post"],
    url: '/admin/clientes/{cliente}/abono',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::registrarAbono
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:113
* @route '/admin/clientes/{cliente}/abono'
*/
registrarAbono.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cliente: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { cliente: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            cliente: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        cliente: typeof args.cliente === 'object'
        ? args.cliente.id
        : args.cliente,
    }

    return registrarAbono.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::registrarAbono
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:113
* @route '/admin/clientes/{cliente}/abono'
*/
registrarAbono.post = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarAbono.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::registrarAbono
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:113
* @route '/admin/clientes/{cliente}/abono'
*/
const registrarAbonoForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: registrarAbono.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ClienteController::registrarAbono
* @see app/Http/Controllers/Admin/PointOfSale/ClienteController.php:113
* @route '/admin/clientes/{cliente}/abono'
*/
registrarAbonoForm.post = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: registrarAbono.url(args, options),
    method: 'post',
})

registrarAbono.form = registrarAbonoForm

const ClienteController = { index, store, show, update, destroy, registrarAbono }

export default ClienteController