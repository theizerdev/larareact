import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\CategoriaController::index
* @see app/Http/Controllers/Admin/CategoriaController.php:27
* @route '/admin/categorias'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/categorias',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\CategoriaController::index
* @see app/Http/Controllers/Admin/CategoriaController.php:27
* @route '/admin/categorias'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CategoriaController::index
* @see app/Http/Controllers/Admin/CategoriaController.php:27
* @route '/admin/categorias'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\CategoriaController::index
* @see app/Http/Controllers/Admin/CategoriaController.php:27
* @route '/admin/categorias'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\CategoriaController::store
* @see app/Http/Controllers/Admin/CategoriaController.php:56
* @route '/admin/categorias'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/categorias',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\CategoriaController::store
* @see app/Http/Controllers/Admin/CategoriaController.php:56
* @route '/admin/categorias'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CategoriaController::store
* @see app/Http/Controllers/Admin/CategoriaController.php:56
* @route '/admin/categorias'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\CategoriaController::show
* @see app/Http/Controllers/Admin/CategoriaController.php:0
* @route '/admin/categorias/{categoria}'
*/
export const show = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/categorias/{categoria}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\CategoriaController::show
* @see app/Http/Controllers/Admin/CategoriaController.php:0
* @route '/admin/categorias/{categoria}'
*/
show.url = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { categoria: args }
    }

    if (Array.isArray(args)) {
        args = {
            categoria: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        categoria: args.categoria,
    }

    return show.definition.url
            .replace('{categoria}', parsedArgs.categoria.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CategoriaController::show
* @see app/Http/Controllers/Admin/CategoriaController.php:0
* @route '/admin/categorias/{categoria}'
*/
show.get = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\CategoriaController::show
* @see app/Http/Controllers/Admin/CategoriaController.php:0
* @route '/admin/categorias/{categoria}'
*/
show.head = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\CategoriaController::update
* @see app/Http/Controllers/Admin/CategoriaController.php:78
* @route '/admin/categorias/{categoria}'
*/
export const update = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/categorias/{categoria}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Admin\CategoriaController::update
* @see app/Http/Controllers/Admin/CategoriaController.php:78
* @route '/admin/categorias/{categoria}'
*/
update.url = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { categoria: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { categoria: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            categoria: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        categoria: typeof args.categoria === 'object'
        ? args.categoria.id
        : args.categoria,
    }

    return update.definition.url
            .replace('{categoria}', parsedArgs.categoria.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CategoriaController::update
* @see app/Http/Controllers/Admin/CategoriaController.php:78
* @route '/admin/categorias/{categoria}'
*/
update.put = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\CategoriaController::update
* @see app/Http/Controllers/Admin/CategoriaController.php:78
* @route '/admin/categorias/{categoria}'
*/
update.patch = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\CategoriaController::destroy
* @see app/Http/Controllers/Admin/CategoriaController.php:92
* @route '/admin/categorias/{categoria}'
*/
export const destroy = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/categorias/{categoria}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\CategoriaController::destroy
* @see app/Http/Controllers/Admin/CategoriaController.php:92
* @route '/admin/categorias/{categoria}'
*/
destroy.url = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { categoria: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { categoria: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            categoria: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        categoria: typeof args.categoria === 'object'
        ? args.categoria.id
        : args.categoria,
    }

    return destroy.definition.url
            .replace('{categoria}', parsedArgs.categoria.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CategoriaController::destroy
* @see app/Http/Controllers/Admin/CategoriaController.php:92
* @route '/admin/categorias/{categoria}'
*/
destroy.delete = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

const CategoriaController = { index, store, show, update, destroy }

export default CategoriaController