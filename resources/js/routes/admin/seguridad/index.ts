import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
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

/**
* @see \App\Http\Controllers\Admin\AuditLogController::bitacora
* @see app/Http/Controllers/Admin/AuditLogController.php:17
* @route '/admin/seguridad/bitacora'
*/
const bitacoraForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: bitacora.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\AuditLogController::bitacora
* @see app/Http/Controllers/Admin/AuditLogController.php:17
* @route '/admin/seguridad/bitacora'
*/
bitacoraForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: bitacora.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\AuditLogController::bitacora
* @see app/Http/Controllers/Admin/AuditLogController.php:17
* @route '/admin/seguridad/bitacora'
*/
bitacoraForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: bitacora.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

bitacora.form = bitacoraForm

const seguridad = {
    bitacora: Object.assign(bitacora, bitacora),
}

export default seguridad