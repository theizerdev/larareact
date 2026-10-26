import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::index
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:35
* @route '/admin/servicios'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/servicios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::index
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:35
* @route '/admin/servicios'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::index
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:35
* @route '/admin/servicios'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::index
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:35
* @route '/admin/servicios'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::index
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:35
* @route '/admin/servicios'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::index
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:35
* @route '/admin/servicios'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::index
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:35
* @route '/admin/servicios'
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
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::store
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:87
* @route '/admin/servicios'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/servicios',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::store
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:87
* @route '/admin/servicios'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::store
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:87
* @route '/admin/servicios'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::store
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:87
* @route '/admin/servicios'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::store
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:87
* @route '/admin/servicios'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::show
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:0
* @route '/admin/servicios/{servicio}'
*/
export const show = (args: { servicio: string | number } | [servicio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/servicios/{servicio}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::show
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:0
* @route '/admin/servicios/{servicio}'
*/
show.url = (args: { servicio: string | number } | [servicio: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { servicio: args }
    }

    if (Array.isArray(args)) {
        args = {
            servicio: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        servicio: args.servicio,
    }

    return show.definition.url
            .replace('{servicio}', parsedArgs.servicio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::show
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:0
* @route '/admin/servicios/{servicio}'
*/
show.get = (args: { servicio: string | number } | [servicio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::show
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:0
* @route '/admin/servicios/{servicio}'
*/
show.head = (args: { servicio: string | number } | [servicio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::show
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:0
* @route '/admin/servicios/{servicio}'
*/
const showForm = (args: { servicio: string | number } | [servicio: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::show
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:0
* @route '/admin/servicios/{servicio}'
*/
showForm.get = (args: { servicio: string | number } | [servicio: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::show
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:0
* @route '/admin/servicios/{servicio}'
*/
showForm.head = (args: { servicio: string | number } | [servicio: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::update
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:123
* @route '/admin/servicios/{servicio}'
*/
export const update = (args: { servicio: number | { id: number } } | [servicio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/servicios/{servicio}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::update
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:123
* @route '/admin/servicios/{servicio}'
*/
update.url = (args: { servicio: number | { id: number } } | [servicio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { servicio: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { servicio: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            servicio: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        servicio: typeof args.servicio === 'object'
        ? args.servicio.id
        : args.servicio,
    }

    return update.definition.url
            .replace('{servicio}', parsedArgs.servicio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::update
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:123
* @route '/admin/servicios/{servicio}'
*/
update.put = (args: { servicio: number | { id: number } } | [servicio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::update
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:123
* @route '/admin/servicios/{servicio}'
*/
update.patch = (args: { servicio: number | { id: number } } | [servicio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::update
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:123
* @route '/admin/servicios/{servicio}'
*/
const updateForm = (args: { servicio: number | { id: number } } | [servicio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::update
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:123
* @route '/admin/servicios/{servicio}'
*/
updateForm.put = (args: { servicio: number | { id: number } } | [servicio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::update
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:123
* @route '/admin/servicios/{servicio}'
*/
updateForm.patch = (args: { servicio: number | { id: number } } | [servicio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::destroy
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:154
* @route '/admin/servicios/{servicio}'
*/
export const destroy = (args: { servicio: number | { id: number } } | [servicio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/servicios/{servicio}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::destroy
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:154
* @route '/admin/servicios/{servicio}'
*/
destroy.url = (args: { servicio: number | { id: number } } | [servicio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { servicio: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { servicio: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            servicio: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        servicio: typeof args.servicio === 'object'
        ? args.servicio.id
        : args.servicio,
    }

    return destroy.definition.url
            .replace('{servicio}', parsedArgs.servicio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::destroy
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:154
* @route '/admin/servicios/{servicio}'
*/
destroy.delete = (args: { servicio: number | { id: number } } | [servicio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::destroy
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:154
* @route '/admin/servicios/{servicio}'
*/
const destroyForm = (args: { servicio: number | { id: number } } | [servicio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\ServicioController::destroy
* @see app/Http/Controllers/Admin/PointOfSale/ServicioController.php:154
* @route '/admin/servicios/{servicio}'
*/
destroyForm.delete = (args: { servicio: number | { id: number } } | [servicio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const ServicioController = { index, store, show, update, destroy }

export default ServicioController