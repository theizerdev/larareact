import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\AuditLogController::index
* @see app/Http/Controllers/Admin/AuditLogController.php:17
* @route '/admin/seguridad/bitacora'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/seguridad/bitacora',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\AuditLogController::index
* @see app/Http/Controllers/Admin/AuditLogController.php:17
* @route '/admin/seguridad/bitacora'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AuditLogController::index
* @see app/Http/Controllers/Admin/AuditLogController.php:17
* @route '/admin/seguridad/bitacora'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\AuditLogController::index
* @see app/Http/Controllers/Admin/AuditLogController.php:17
* @route '/admin/seguridad/bitacora'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

const AuditLogController = { index }

export default AuditLogController