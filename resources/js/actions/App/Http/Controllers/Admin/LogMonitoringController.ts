import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::index
* @see app/Http/Controllers/Admin/LogMonitoringController.php:15
* @route '/admin/monitoring/logs'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/logs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::index
* @see app/Http/Controllers/Admin/LogMonitoringController.php:15
* @route '/admin/monitoring/logs'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::index
* @see app/Http/Controllers/Admin/LogMonitoringController.php:15
* @route '/admin/monitoring/logs'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::index
* @see app/Http/Controllers/Admin/LogMonitoringController.php:15
* @route '/admin/monitoring/logs'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::clear
* @see app/Http/Controllers/Admin/LogMonitoringController.php:35
* @route '/admin/monitoring/logs/clear'
*/
export const clear = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clear.url(options),
    method: 'delete',
})

clear.definition = {
    methods: ["delete"],
    url: '/admin/monitoring/logs/clear',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::clear
* @see app/Http/Controllers/Admin/LogMonitoringController.php:35
* @route '/admin/monitoring/logs/clear'
*/
clear.url = (options?: RouteQueryOptions) => {
    return clear.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::clear
* @see app/Http/Controllers/Admin/LogMonitoringController.php:35
* @route '/admin/monitoring/logs/clear'
*/
clear.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clear.url(options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::download
* @see app/Http/Controllers/Admin/LogMonitoringController.php:52
* @route '/admin/monitoring/logs/download'
*/
export const download = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(options),
    method: 'get',
})

download.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/logs/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::download
* @see app/Http/Controllers/Admin/LogMonitoringController.php:52
* @route '/admin/monitoring/logs/download'
*/
download.url = (options?: RouteQueryOptions) => {
    return download.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::download
* @see app/Http/Controllers/Admin/LogMonitoringController.php:52
* @route '/admin/monitoring/logs/download'
*/
download.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::download
* @see app/Http/Controllers/Admin/LogMonitoringController.php:52
* @route '/admin/monitoring/logs/download'
*/
download.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: download.url(options),
    method: 'head',
})

const LogMonitoringController = { index, clear, download }

export default LogMonitoringController