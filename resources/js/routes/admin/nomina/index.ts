import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
import detalles from './detalles'
/**
* @see \App\Http\Controllers\Admin\NominaController::index
* @see app/Http/Controllers/Admin/NominaController.php:17
* @route '/admin/nomina'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/nomina',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\NominaController::index
* @see app/Http/Controllers/Admin/NominaController.php:17
* @route '/admin/nomina'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\NominaController::index
* @see app/Http/Controllers/Admin/NominaController.php:17
* @route '/admin/nomina'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\NominaController::index
* @see app/Http/Controllers/Admin/NominaController.php:17
* @route '/admin/nomina'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\NominaController::generar
* @see app/Http/Controllers/Admin/NominaController.php:79
* @route '/admin/nomina/generar'
*/
export const generar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generar.url(options),
    method: 'post',
})

generar.definition = {
    methods: ["post"],
    url: '/admin/nomina/generar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\NominaController::generar
* @see app/Http/Controllers/Admin/NominaController.php:79
* @route '/admin/nomina/generar'
*/
generar.url = (options?: RouteQueryOptions) => {
    return generar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\NominaController::generar
* @see app/Http/Controllers/Admin/NominaController.php:79
* @route '/admin/nomina/generar'
*/
generar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generar.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\NominaController::cerrar
* @see app/Http/Controllers/Admin/NominaController.php:243
* @route '/admin/nomina/{nomina}/cerrar'
*/
export const cerrar = (args: { nomina: number | { id: number } } | [nomina: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cerrar.url(args, options),
    method: 'post',
})

cerrar.definition = {
    methods: ["post"],
    url: '/admin/nomina/{nomina}/cerrar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\NominaController::cerrar
* @see app/Http/Controllers/Admin/NominaController.php:243
* @route '/admin/nomina/{nomina}/cerrar'
*/
cerrar.url = (args: { nomina: number | { id: number } } | [nomina: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { nomina: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { nomina: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            nomina: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        nomina: typeof args.nomina === 'object'
        ? args.nomina.id
        : args.nomina,
    }

    return cerrar.definition.url
            .replace('{nomina}', parsedArgs.nomina.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\NominaController::cerrar
* @see app/Http/Controllers/Admin/NominaController.php:243
* @route '/admin/nomina/{nomina}/cerrar'
*/
cerrar.post = (args: { nomina: number | { id: number } } | [nomina: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cerrar.url(args, options),
    method: 'post',
})

const nomina = {
    index: Object.assign(index, index),
    generar: Object.assign(generar, generar),
    detalles: Object.assign(detalles, detalles),
    cerrar: Object.assign(cerrar, cerrar),
}

export default nomina