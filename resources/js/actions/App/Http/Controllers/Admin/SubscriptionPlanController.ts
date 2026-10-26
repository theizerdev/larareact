import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::index
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:27
* @route '/admin/planes'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/planes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::index
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:27
* @route '/admin/planes'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::index
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:27
* @route '/admin/planes'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::index
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:27
* @route '/admin/planes'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::index
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:27
* @route '/admin/planes'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::index
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:27
* @route '/admin/planes'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::index
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:27
* @route '/admin/planes'
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
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::store
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:56
* @route '/admin/planes'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/planes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::store
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:56
* @route '/admin/planes'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::store
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:56
* @route '/admin/planes'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::store
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:56
* @route '/admin/planes'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::store
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:56
* @route '/admin/planes'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::update
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:108
* @route '/admin/planes/{plane}'
*/
export const update = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/planes/{plane}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::update
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:108
* @route '/admin/planes/{plane}'
*/
update.url = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { plane: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { plane: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            plane: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        plane: typeof args.plane === 'object'
        ? args.plane.id
        : args.plane,
    }

    return update.definition.url
            .replace('{plane}', parsedArgs.plane.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::update
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:108
* @route '/admin/planes/{plane}'
*/
update.put = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::update
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:108
* @route '/admin/planes/{plane}'
*/
const updateForm = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::update
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:108
* @route '/admin/planes/{plane}'
*/
updateForm.put = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::destroy
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:205
* @route '/admin/planes/{plane}'
*/
export const destroy = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/planes/{plane}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::destroy
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:205
* @route '/admin/planes/{plane}'
*/
destroy.url = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { plane: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { plane: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            plane: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        plane: typeof args.plane === 'object'
        ? args.plane.id
        : args.plane,
    }

    return destroy.definition.url
            .replace('{plane}', parsedArgs.plane.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::destroy
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:205
* @route '/admin/planes/{plane}'
*/
destroy.delete = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::destroy
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:205
* @route '/admin/planes/{plane}'
*/
const destroyForm = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::destroy
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:205
* @route '/admin/planes/{plane}'
*/
destroyForm.delete = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::togglePromo
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:145
* @route '/admin/planes/{plane}/toggle-promo'
*/
export const togglePromo = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: togglePromo.url(args, options),
    method: 'patch',
})

togglePromo.definition = {
    methods: ["patch"],
    url: '/admin/planes/{plane}/toggle-promo',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::togglePromo
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:145
* @route '/admin/planes/{plane}/toggle-promo'
*/
togglePromo.url = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { plane: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { plane: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            plane: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        plane: typeof args.plane === 'object'
        ? args.plane.id
        : args.plane,
    }

    return togglePromo.definition.url
            .replace('{plane}', parsedArgs.plane.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::togglePromo
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:145
* @route '/admin/planes/{plane}/toggle-promo'
*/
togglePromo.patch = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: togglePromo.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::togglePromo
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:145
* @route '/admin/planes/{plane}/toggle-promo'
*/
const togglePromoForm = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: togglePromo.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::togglePromo
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:145
* @route '/admin/planes/{plane}/toggle-promo'
*/
togglePromoForm.patch = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: togglePromo.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

togglePromo.form = togglePromoForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::toggleStatus
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:165
* @route '/admin/planes/{plane}/toggle-status'
*/
export const toggleStatus = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/planes/{plane}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::toggleStatus
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:165
* @route '/admin/planes/{plane}/toggle-status'
*/
toggleStatus.url = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { plane: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { plane: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            plane: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        plane: typeof args.plane === 'object'
        ? args.plane.id
        : args.plane,
    }

    return toggleStatus.definition.url
            .replace('{plane}', parsedArgs.plane.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::toggleStatus
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:165
* @route '/admin/planes/{plane}/toggle-status'
*/
toggleStatus.patch = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::toggleStatus
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:165
* @route '/admin/planes/{plane}/toggle-status'
*/
const toggleStatusForm = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: toggleStatus.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::toggleStatus
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:165
* @route '/admin/planes/{plane}/toggle-status'
*/
toggleStatusForm.patch = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::toggleDestacado
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:185
* @route '/admin/planes/{plane}/toggle-destacado'
*/
export const toggleDestacado = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleDestacado.url(args, options),
    method: 'patch',
})

toggleDestacado.definition = {
    methods: ["patch"],
    url: '/admin/planes/{plane}/toggle-destacado',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::toggleDestacado
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:185
* @route '/admin/planes/{plane}/toggle-destacado'
*/
toggleDestacado.url = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { plane: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { plane: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            plane: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        plane: typeof args.plane === 'object'
        ? args.plane.id
        : args.plane,
    }

    return toggleDestacado.definition.url
            .replace('{plane}', parsedArgs.plane.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::toggleDestacado
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:185
* @route '/admin/planes/{plane}/toggle-destacado'
*/
toggleDestacado.patch = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleDestacado.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::toggleDestacado
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:185
* @route '/admin/planes/{plane}/toggle-destacado'
*/
const toggleDestacadoForm = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: toggleDestacado.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionPlanController::toggleDestacado
* @see app/Http/Controllers/Admin/SubscriptionPlanController.php:185
* @route '/admin/planes/{plane}/toggle-destacado'
*/
toggleDestacadoForm.patch = (args: { plane: number | { id: number } } | [plane: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: toggleDestacado.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

toggleDestacado.form = toggleDestacadoForm

const SubscriptionPlanController = { index, store, update, destroy, togglePromo, toggleStatus, toggleDestacado }

export default SubscriptionPlanController