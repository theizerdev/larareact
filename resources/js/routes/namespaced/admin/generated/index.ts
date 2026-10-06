import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see [serialized-closure]:2
* @route '/admin/reparaciones/{reparacion}/update-estado'
*/
export const JzUjsvI7UdPvJqG6 = (args: { reparacion: string | number } | [reparacion: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: JzUjsvI7UdPvJqG6.url(args, options),
    method: 'get',
})

JzUjsvI7UdPvJqG6.definition = {
    methods: ["get","head"],
    url: '/admin/reparaciones/{reparacion}/update-estado',
} satisfies RouteDefinition<["get","head"]>

/**
* @see [serialized-closure]:2
* @route '/admin/reparaciones/{reparacion}/update-estado'
*/
JzUjsvI7UdPvJqG6.url = (args: { reparacion: string | number } | [reparacion: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacion: args }
    }

    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: args.reparacion,
    }

    return JzUjsvI7UdPvJqG6.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see [serialized-closure]:2
* @route '/admin/reparaciones/{reparacion}/update-estado'
*/
JzUjsvI7UdPvJqG6.get = (args: { reparacion: string | number } | [reparacion: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: JzUjsvI7UdPvJqG6.url(args, options),
    method: 'get',
})

/**
* @see [serialized-closure]:2
* @route '/admin/reparaciones/{reparacion}/update-estado'
*/
JzUjsvI7UdPvJqG6.head = (args: { reparacion: string | number } | [reparacion: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: JzUjsvI7UdPvJqG6.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::F6b8oSm1PYXV463n
* @see app/Http/Controllers/Admin/ReparacionController.php:1056
* @route '/admin/reparaciones/{reparacion}/update-estado'
*/
export const F6b8oSm1PYXV463n = (args: { reparacion: string | number } | [reparacion: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: F6b8oSm1PYXV463n.url(args, options),
    method: 'post',
})

F6b8oSm1PYXV463n.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/{reparacion}/update-estado',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::F6b8oSm1PYXV463n
* @see app/Http/Controllers/Admin/ReparacionController.php:1056
* @route '/admin/reparaciones/{reparacion}/update-estado'
*/
F6b8oSm1PYXV463n.url = (args: { reparacion: string | number } | [reparacion: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacion: args }
    }

    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: args.reparacion,
    }

    return F6b8oSm1PYXV463n.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::F6b8oSm1PYXV463n
* @see app/Http/Controllers/Admin/ReparacionController.php:1056
* @route '/admin/reparaciones/{reparacion}/update-estado'
*/
F6b8oSm1PYXV463n.post = (args: { reparacion: string | number } | [reparacion: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: F6b8oSm1PYXV463n.url(args, options),
    method: 'post',
})

/**
* @see [serialized-closure]:2
* @route '/admin/reparaciones/{reparacion}/preservicio'
*/
export const t9kYgHuKmUatRIS5 = (args: { reparacion: string | number } | [reparacion: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: t9kYgHuKmUatRIS5.url(args, options),
    method: 'get',
})

t9kYgHuKmUatRIS5.definition = {
    methods: ["get","head"],
    url: '/admin/reparaciones/{reparacion}/preservicio',
} satisfies RouteDefinition<["get","head"]>

/**
* @see [serialized-closure]:2
* @route '/admin/reparaciones/{reparacion}/preservicio'
*/
t9kYgHuKmUatRIS5.url = (args: { reparacion: string | number } | [reparacion: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacion: args }
    }

    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: args.reparacion,
    }

    return t9kYgHuKmUatRIS5.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see [serialized-closure]:2
* @route '/admin/reparaciones/{reparacion}/preservicio'
*/
t9kYgHuKmUatRIS5.get = (args: { reparacion: string | number } | [reparacion: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: t9kYgHuKmUatRIS5.url(args, options),
    method: 'get',
})

/**
* @see [serialized-closure]:2
* @route '/admin/reparaciones/{reparacion}/preservicio'
*/
t9kYgHuKmUatRIS5.head = (args: { reparacion: string | number } | [reparacion: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: t9kYgHuKmUatRIS5.url(args, options),
    method: 'head',
})

const generated = {
    JzUjsvI7UdPvJqG6: Object.assign(JzUjsvI7UdPvJqG6, JzUjsvI7UdPvJqG6),
    F6b8oSm1PYXV463n: Object.assign(F6b8oSm1PYXV463n, F6b8oSm1PYXV463n),
    t9kYgHuKmUatRIS5: Object.assign(t9kYgHuKmUatRIS5, t9kYgHuKmUatRIS5),
}

export default generated