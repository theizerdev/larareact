import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ModeloController::index
* @see app/Http/Controllers/Admin/ModeloController.php:14
* @route '/admin/modelos'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/modelos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ModeloController::index
* @see app/Http/Controllers/Admin/ModeloController.php:14
* @route '/admin/modelos'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ModeloController::index
* @see app/Http/Controllers/Admin/ModeloController.php:14
* @route '/admin/modelos'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::index
* @see app/Http/Controllers/Admin/ModeloController.php:14
* @route '/admin/modelos'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::index
* @see app/Http/Controllers/Admin/ModeloController.php:14
* @route '/admin/modelos'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::index
* @see app/Http/Controllers/Admin/ModeloController.php:14
* @route '/admin/modelos'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::index
* @see app/Http/Controllers/Admin/ModeloController.php:14
* @route '/admin/modelos'
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
* @see \App\Http\Controllers\Admin\ModeloController::store
* @see app/Http/Controllers/Admin/ModeloController.php:59
* @route '/admin/modelos'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/modelos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ModeloController::store
* @see app/Http/Controllers/Admin/ModeloController.php:59
* @route '/admin/modelos'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ModeloController::store
* @see app/Http/Controllers/Admin/ModeloController.php:59
* @route '/admin/modelos'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::store
* @see app/Http/Controllers/Admin/ModeloController.php:59
* @route '/admin/modelos'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::store
* @see app/Http/Controllers/Admin/ModeloController.php:59
* @route '/admin/modelos'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Admin\ModeloController::show
* @see app/Http/Controllers/Admin/ModeloController.php:0
* @route '/admin/modelos/{modelo}'
*/
export const show = (args: { modelo: string | number } | [modelo: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/modelos/{modelo}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ModeloController::show
* @see app/Http/Controllers/Admin/ModeloController.php:0
* @route '/admin/modelos/{modelo}'
*/
show.url = (args: { modelo: string | number } | [modelo: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { modelo: args }
    }

    if (Array.isArray(args)) {
        args = {
            modelo: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        modelo: args.modelo,
    }

    return show.definition.url
            .replace('{modelo}', parsedArgs.modelo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ModeloController::show
* @see app/Http/Controllers/Admin/ModeloController.php:0
* @route '/admin/modelos/{modelo}'
*/
show.get = (args: { modelo: string | number } | [modelo: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::show
* @see app/Http/Controllers/Admin/ModeloController.php:0
* @route '/admin/modelos/{modelo}'
*/
show.head = (args: { modelo: string | number } | [modelo: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::show
* @see app/Http/Controllers/Admin/ModeloController.php:0
* @route '/admin/modelos/{modelo}'
*/
const showForm = (args: { modelo: string | number } | [modelo: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::show
* @see app/Http/Controllers/Admin/ModeloController.php:0
* @route '/admin/modelos/{modelo}'
*/
showForm.get = (args: { modelo: string | number } | [modelo: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::show
* @see app/Http/Controllers/Admin/ModeloController.php:0
* @route '/admin/modelos/{modelo}'
*/
showForm.head = (args: { modelo: string | number } | [modelo: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Admin\ModeloController::update
* @see app/Http/Controllers/Admin/ModeloController.php:136
* @route '/admin/modelos/{modelo}'
*/
export const update = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/modelos/{modelo}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Admin\ModeloController::update
* @see app/Http/Controllers/Admin/ModeloController.php:136
* @route '/admin/modelos/{modelo}'
*/
update.url = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { modelo: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { modelo: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            modelo: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        modelo: typeof args.modelo === 'object'
        ? args.modelo.id
        : args.modelo,
    }

    return update.definition.url
            .replace('{modelo}', parsedArgs.modelo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ModeloController::update
* @see app/Http/Controllers/Admin/ModeloController.php:136
* @route '/admin/modelos/{modelo}'
*/
update.put = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::update
* @see app/Http/Controllers/Admin/ModeloController.php:136
* @route '/admin/modelos/{modelo}'
*/
update.patch = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::update
* @see app/Http/Controllers/Admin/ModeloController.php:136
* @route '/admin/modelos/{modelo}'
*/
const updateForm = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::update
* @see app/Http/Controllers/Admin/ModeloController.php:136
* @route '/admin/modelos/{modelo}'
*/
updateForm.put = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::update
* @see app/Http/Controllers/Admin/ModeloController.php:136
* @route '/admin/modelos/{modelo}'
*/
updateForm.patch = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\ModeloController::destroy
* @see app/Http/Controllers/Admin/ModeloController.php:159
* @route '/admin/modelos/{modelo}'
*/
export const destroy = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/modelos/{modelo}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ModeloController::destroy
* @see app/Http/Controllers/Admin/ModeloController.php:159
* @route '/admin/modelos/{modelo}'
*/
destroy.url = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { modelo: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { modelo: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            modelo: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        modelo: typeof args.modelo === 'object'
        ? args.modelo.id
        : args.modelo,
    }

    return destroy.definition.url
            .replace('{modelo}', parsedArgs.modelo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ModeloController::destroy
* @see app/Http/Controllers/Admin/ModeloController.php:159
* @route '/admin/modelos/{modelo}'
*/
destroy.delete = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::destroy
* @see app/Http/Controllers/Admin/ModeloController.php:159
* @route '/admin/modelos/{modelo}'
*/
const destroyForm = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ModeloController::destroy
* @see app/Http/Controllers/Admin/ModeloController.php:159
* @route '/admin/modelos/{modelo}'
*/
destroyForm.delete = (args: { modelo: number | { id: number } } | [modelo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const modelos = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    show: Object.assign(show, show),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
}

export default modelos