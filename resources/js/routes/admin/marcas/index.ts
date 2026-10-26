import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\MarcaController::index
* @see app/Http/Controllers/Admin/MarcaController.php:14
* @route '/admin/marcas'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/marcas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\MarcaController::index
* @see app/Http/Controllers/Admin/MarcaController.php:14
* @route '/admin/marcas'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MarcaController::index
* @see app/Http/Controllers/Admin/MarcaController.php:14
* @route '/admin/marcas'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::index
* @see app/Http/Controllers/Admin/MarcaController.php:14
* @route '/admin/marcas'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::index
* @see app/Http/Controllers/Admin/MarcaController.php:14
* @route '/admin/marcas'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::index
* @see app/Http/Controllers/Admin/MarcaController.php:14
* @route '/admin/marcas'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::index
* @see app/Http/Controllers/Admin/MarcaController.php:14
* @route '/admin/marcas'
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
* @see \App\Http\Controllers\Admin\MarcaController::store
* @see app/Http/Controllers/Admin/MarcaController.php:38
* @route '/admin/marcas'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/marcas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\MarcaController::store
* @see app/Http/Controllers/Admin/MarcaController.php:38
* @route '/admin/marcas'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MarcaController::store
* @see app/Http/Controllers/Admin/MarcaController.php:38
* @route '/admin/marcas'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::store
* @see app/Http/Controllers/Admin/MarcaController.php:38
* @route '/admin/marcas'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::store
* @see app/Http/Controllers/Admin/MarcaController.php:38
* @route '/admin/marcas'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Admin\MarcaController::show
* @see app/Http/Controllers/Admin/MarcaController.php:0
* @route '/admin/marcas/{marca}'
*/
export const show = (args: { marca: string | number } | [marca: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/marcas/{marca}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\MarcaController::show
* @see app/Http/Controllers/Admin/MarcaController.php:0
* @route '/admin/marcas/{marca}'
*/
show.url = (args: { marca: string | number } | [marca: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { marca: args }
    }

    if (Array.isArray(args)) {
        args = {
            marca: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        marca: args.marca,
    }

    return show.definition.url
            .replace('{marca}', parsedArgs.marca.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MarcaController::show
* @see app/Http/Controllers/Admin/MarcaController.php:0
* @route '/admin/marcas/{marca}'
*/
show.get = (args: { marca: string | number } | [marca: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::show
* @see app/Http/Controllers/Admin/MarcaController.php:0
* @route '/admin/marcas/{marca}'
*/
show.head = (args: { marca: string | number } | [marca: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::show
* @see app/Http/Controllers/Admin/MarcaController.php:0
* @route '/admin/marcas/{marca}'
*/
const showForm = (args: { marca: string | number } | [marca: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::show
* @see app/Http/Controllers/Admin/MarcaController.php:0
* @route '/admin/marcas/{marca}'
*/
showForm.get = (args: { marca: string | number } | [marca: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::show
* @see app/Http/Controllers/Admin/MarcaController.php:0
* @route '/admin/marcas/{marca}'
*/
showForm.head = (args: { marca: string | number } | [marca: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Admin\MarcaController::update
* @see app/Http/Controllers/Admin/MarcaController.php:74
* @route '/admin/marcas/{marca}'
*/
export const update = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/marcas/{marca}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Admin\MarcaController::update
* @see app/Http/Controllers/Admin/MarcaController.php:74
* @route '/admin/marcas/{marca}'
*/
update.url = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { marca: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { marca: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            marca: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        marca: typeof args.marca === 'object'
        ? args.marca.id
        : args.marca,
    }

    return update.definition.url
            .replace('{marca}', parsedArgs.marca.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MarcaController::update
* @see app/Http/Controllers/Admin/MarcaController.php:74
* @route '/admin/marcas/{marca}'
*/
update.put = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::update
* @see app/Http/Controllers/Admin/MarcaController.php:74
* @route '/admin/marcas/{marca}'
*/
update.patch = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::update
* @see app/Http/Controllers/Admin/MarcaController.php:74
* @route '/admin/marcas/{marca}'
*/
const updateForm = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::update
* @see app/Http/Controllers/Admin/MarcaController.php:74
* @route '/admin/marcas/{marca}'
*/
updateForm.put = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::update
* @see app/Http/Controllers/Admin/MarcaController.php:74
* @route '/admin/marcas/{marca}'
*/
updateForm.patch = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\MarcaController::destroy
* @see app/Http/Controllers/Admin/MarcaController.php:96
* @route '/admin/marcas/{marca}'
*/
export const destroy = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/marcas/{marca}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\MarcaController::destroy
* @see app/Http/Controllers/Admin/MarcaController.php:96
* @route '/admin/marcas/{marca}'
*/
destroy.url = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { marca: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { marca: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            marca: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        marca: typeof args.marca === 'object'
        ? args.marca.id
        : args.marca,
    }

    return destroy.definition.url
            .replace('{marca}', parsedArgs.marca.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MarcaController::destroy
* @see app/Http/Controllers/Admin/MarcaController.php:96
* @route '/admin/marcas/{marca}'
*/
destroy.delete = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::destroy
* @see app/Http/Controllers/Admin/MarcaController.php:96
* @route '/admin/marcas/{marca}'
*/
const destroyForm = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\MarcaController::destroy
* @see app/Http/Controllers/Admin/MarcaController.php:96
* @route '/admin/marcas/{marca}'
*/
destroyForm.delete = (args: { marca: number | { id: number } } | [marca: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const marcas = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    show: Object.assign(show, show),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
}

export default marcas