import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\FamiliaController::index
* @see app/Http/Controllers/Admin/FamiliaController.php:14
* @route '/admin/familias'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/familias',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\FamiliaController::index
* @see app/Http/Controllers/Admin/FamiliaController.php:14
* @route '/admin/familias'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\FamiliaController::index
* @see app/Http/Controllers/Admin/FamiliaController.php:14
* @route '/admin/familias'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::index
* @see app/Http/Controllers/Admin/FamiliaController.php:14
* @route '/admin/familias'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::index
* @see app/Http/Controllers/Admin/FamiliaController.php:14
* @route '/admin/familias'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::index
* @see app/Http/Controllers/Admin/FamiliaController.php:14
* @route '/admin/familias'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::index
* @see app/Http/Controllers/Admin/FamiliaController.php:14
* @route '/admin/familias'
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
* @see \App\Http\Controllers\Admin\FamiliaController::store
* @see app/Http/Controllers/Admin/FamiliaController.php:50
* @route '/admin/familias'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/familias',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\FamiliaController::store
* @see app/Http/Controllers/Admin/FamiliaController.php:50
* @route '/admin/familias'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\FamiliaController::store
* @see app/Http/Controllers/Admin/FamiliaController.php:50
* @route '/admin/familias'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::store
* @see app/Http/Controllers/Admin/FamiliaController.php:50
* @route '/admin/familias'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::store
* @see app/Http/Controllers/Admin/FamiliaController.php:50
* @route '/admin/familias'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Admin\FamiliaController::show
* @see app/Http/Controllers/Admin/FamiliaController.php:0
* @route '/admin/familias/{familia}'
*/
export const show = (args: { familia: string | number } | [familia: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/familias/{familia}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\FamiliaController::show
* @see app/Http/Controllers/Admin/FamiliaController.php:0
* @route '/admin/familias/{familia}'
*/
show.url = (args: { familia: string | number } | [familia: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { familia: args }
    }

    if (Array.isArray(args)) {
        args = {
            familia: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        familia: args.familia,
    }

    return show.definition.url
            .replace('{familia}', parsedArgs.familia.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\FamiliaController::show
* @see app/Http/Controllers/Admin/FamiliaController.php:0
* @route '/admin/familias/{familia}'
*/
show.get = (args: { familia: string | number } | [familia: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::show
* @see app/Http/Controllers/Admin/FamiliaController.php:0
* @route '/admin/familias/{familia}'
*/
show.head = (args: { familia: string | number } | [familia: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::show
* @see app/Http/Controllers/Admin/FamiliaController.php:0
* @route '/admin/familias/{familia}'
*/
const showForm = (args: { familia: string | number } | [familia: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::show
* @see app/Http/Controllers/Admin/FamiliaController.php:0
* @route '/admin/familias/{familia}'
*/
showForm.get = (args: { familia: string | number } | [familia: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::show
* @see app/Http/Controllers/Admin/FamiliaController.php:0
* @route '/admin/familias/{familia}'
*/
showForm.head = (args: { familia: string | number } | [familia: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Admin\FamiliaController::update
* @see app/Http/Controllers/Admin/FamiliaController.php:70
* @route '/admin/familias/{familia}'
*/
export const update = (args: { familia: number | { id: number } } | [familia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/familias/{familia}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Admin\FamiliaController::update
* @see app/Http/Controllers/Admin/FamiliaController.php:70
* @route '/admin/familias/{familia}'
*/
update.url = (args: { familia: number | { id: number } } | [familia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { familia: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { familia: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            familia: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        familia: typeof args.familia === 'object'
        ? args.familia.id
        : args.familia,
    }

    return update.definition.url
            .replace('{familia}', parsedArgs.familia.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\FamiliaController::update
* @see app/Http/Controllers/Admin/FamiliaController.php:70
* @route '/admin/familias/{familia}'
*/
update.put = (args: { familia: number | { id: number } } | [familia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::update
* @see app/Http/Controllers/Admin/FamiliaController.php:70
* @route '/admin/familias/{familia}'
*/
update.patch = (args: { familia: number | { id: number } } | [familia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::update
* @see app/Http/Controllers/Admin/FamiliaController.php:70
* @route '/admin/familias/{familia}'
*/
const updateForm = (args: { familia: number | { id: number } } | [familia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::update
* @see app/Http/Controllers/Admin/FamiliaController.php:70
* @route '/admin/familias/{familia}'
*/
updateForm.put = (args: { familia: number | { id: number } } | [familia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::update
* @see app/Http/Controllers/Admin/FamiliaController.php:70
* @route '/admin/familias/{familia}'
*/
updateForm.patch = (args: { familia: number | { id: number } } | [familia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\FamiliaController::destroy
* @see app/Http/Controllers/Admin/FamiliaController.php:82
* @route '/admin/familias/{familia}'
*/
export const destroy = (args: { familia: number | { id: number } } | [familia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/familias/{familia}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\FamiliaController::destroy
* @see app/Http/Controllers/Admin/FamiliaController.php:82
* @route '/admin/familias/{familia}'
*/
destroy.url = (args: { familia: number | { id: number } } | [familia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { familia: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { familia: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            familia: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        familia: typeof args.familia === 'object'
        ? args.familia.id
        : args.familia,
    }

    return destroy.definition.url
            .replace('{familia}', parsedArgs.familia.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\FamiliaController::destroy
* @see app/Http/Controllers/Admin/FamiliaController.php:82
* @route '/admin/familias/{familia}'
*/
destroy.delete = (args: { familia: number | { id: number } } | [familia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::destroy
* @see app/Http/Controllers/Admin/FamiliaController.php:82
* @route '/admin/familias/{familia}'
*/
const destroyForm = (args: { familia: number | { id: number } } | [familia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\FamiliaController::destroy
* @see app/Http/Controllers/Admin/FamiliaController.php:82
* @route '/admin/familias/{familia}'
*/
destroyForm.delete = (args: { familia: number | { id: number } } | [familia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const FamiliaController = { index, store, show, update, destroy }

export default FamiliaController