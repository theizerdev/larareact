import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\TestimonioController::index
* @see app/Http/Controllers/Admin/TestimonioController.php:15
* @route '/admin/testimonios'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/testimonios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\TestimonioController::index
* @see app/Http/Controllers/Admin/TestimonioController.php:15
* @route '/admin/testimonios'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TestimonioController::index
* @see app/Http/Controllers/Admin/TestimonioController.php:15
* @route '/admin/testimonios'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\TestimonioController::index
* @see app/Http/Controllers/Admin/TestimonioController.php:15
* @route '/admin/testimonios'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\TestimonioController::store
* @see app/Http/Controllers/Admin/TestimonioController.php:29
* @route '/admin/testimonios'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/testimonios',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\TestimonioController::store
* @see app/Http/Controllers/Admin/TestimonioController.php:29
* @route '/admin/testimonios'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TestimonioController::store
* @see app/Http/Controllers/Admin/TestimonioController.php:29
* @route '/admin/testimonios'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\TestimonioController::update
* @see app/Http/Controllers/Admin/TestimonioController.php:63
* @route '/admin/testimonios/{testimonio}'
*/
export const update = (args: { testimonio: number | { id: number } } | [testimonio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/testimonios/{testimonio}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Admin\TestimonioController::update
* @see app/Http/Controllers/Admin/TestimonioController.php:63
* @route '/admin/testimonios/{testimonio}'
*/
update.url = (args: { testimonio: number | { id: number } } | [testimonio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { testimonio: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { testimonio: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            testimonio: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        testimonio: typeof args.testimonio === 'object'
        ? args.testimonio.id
        : args.testimonio,
    }

    return update.definition.url
            .replace('{testimonio}', parsedArgs.testimonio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TestimonioController::update
* @see app/Http/Controllers/Admin/TestimonioController.php:63
* @route '/admin/testimonios/{testimonio}'
*/
update.put = (args: { testimonio: number | { id: number } } | [testimonio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\TestimonioController::update
* @see app/Http/Controllers/Admin/TestimonioController.php:63
* @route '/admin/testimonios/{testimonio}'
*/
update.patch = (args: { testimonio: number | { id: number } } | [testimonio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\TestimonioController::destroy
* @see app/Http/Controllers/Admin/TestimonioController.php:110
* @route '/admin/testimonios/{testimonio}'
*/
export const destroy = (args: { testimonio: number | { id: number } } | [testimonio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/testimonios/{testimonio}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\TestimonioController::destroy
* @see app/Http/Controllers/Admin/TestimonioController.php:110
* @route '/admin/testimonios/{testimonio}'
*/
destroy.url = (args: { testimonio: number | { id: number } } | [testimonio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { testimonio: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { testimonio: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            testimonio: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        testimonio: typeof args.testimonio === 'object'
        ? args.testimonio.id
        : args.testimonio,
    }

    return destroy.definition.url
            .replace('{testimonio}', parsedArgs.testimonio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TestimonioController::destroy
* @see app/Http/Controllers/Admin/TestimonioController.php:110
* @route '/admin/testimonios/{testimonio}'
*/
destroy.delete = (args: { testimonio: number | { id: number } } | [testimonio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\TestimonioController::toggleStatus
* @see app/Http/Controllers/Admin/TestimonioController.php:86
* @route '/admin/testimonios/{testimonio}/toggle-status'
*/
export const toggleStatus = (args: { testimonio: number | { id: number } } | [testimonio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/testimonios/{testimonio}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\TestimonioController::toggleStatus
* @see app/Http/Controllers/Admin/TestimonioController.php:86
* @route '/admin/testimonios/{testimonio}/toggle-status'
*/
toggleStatus.url = (args: { testimonio: number | { id: number } } | [testimonio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { testimonio: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { testimonio: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            testimonio: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        testimonio: typeof args.testimonio === 'object'
        ? args.testimonio.id
        : args.testimonio,
    }

    return toggleStatus.definition.url
            .replace('{testimonio}', parsedArgs.testimonio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TestimonioController::toggleStatus
* @see app/Http/Controllers/Admin/TestimonioController.php:86
* @route '/admin/testimonios/{testimonio}/toggle-status'
*/
toggleStatus.patch = (args: { testimonio: number | { id: number } } | [testimonio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\TestimonioController::toggleFeatured
* @see app/Http/Controllers/Admin/TestimonioController.php:98
* @route '/admin/testimonios/{testimonio}/toggle-featured'
*/
export const toggleFeatured = (args: { testimonio: number | { id: number } } | [testimonio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleFeatured.url(args, options),
    method: 'patch',
})

toggleFeatured.definition = {
    methods: ["patch"],
    url: '/admin/testimonios/{testimonio}/toggle-featured',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\TestimonioController::toggleFeatured
* @see app/Http/Controllers/Admin/TestimonioController.php:98
* @route '/admin/testimonios/{testimonio}/toggle-featured'
*/
toggleFeatured.url = (args: { testimonio: number | { id: number } } | [testimonio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { testimonio: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { testimonio: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            testimonio: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        testimonio: typeof args.testimonio === 'object'
        ? args.testimonio.id
        : args.testimonio,
    }

    return toggleFeatured.definition.url
            .replace('{testimonio}', parsedArgs.testimonio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TestimonioController::toggleFeatured
* @see app/Http/Controllers/Admin/TestimonioController.php:98
* @route '/admin/testimonios/{testimonio}/toggle-featured'
*/
toggleFeatured.patch = (args: { testimonio: number | { id: number } } | [testimonio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleFeatured.url(args, options),
    method: 'patch',
})

const testimonios = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
    toggleStatus: Object.assign(toggleStatus, toggleStatus),
    toggleFeatured: Object.assign(toggleFeatured, toggleFeatured),
}

export default testimonios