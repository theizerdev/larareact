import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\AuditLogController::bitacora
* @see app/Http/Controllers/Admin/AuditLogController.php:17
* @route '/admin/seguridad/bitacora'
*/
export const bitacora = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bitacora.url(options),
    method: 'get',
})

bitacora.definition = {
    methods: ["get","head"],
    url: '/admin/seguridad/bitacora',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\AuditLogController::bitacora
* @see app/Http/Controllers/Admin/AuditLogController.php:17
* @route '/admin/seguridad/bitacora'
*/
bitacora.url = (options?: RouteQueryOptions) => {
    return bitacora.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AuditLogController::bitacora
* @see app/Http/Controllers/Admin/AuditLogController.php:17
* @route '/admin/seguridad/bitacora'
*/
bitacora.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bitacora.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\AuditLogController::bitacora
* @see app/Http/Controllers/Admin/AuditLogController.php:17
* @route '/admin/seguridad/bitacora'
*/
bitacora.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: bitacora.url(options),
    method: 'head',
})

const seguridad = {
    bitacora: Object.assign(bitacora, bitacora),
}

export default seguridad