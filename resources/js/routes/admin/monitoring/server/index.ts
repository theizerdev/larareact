import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::index
* @see app/Http/Controllers/Admin/ServerMonitoringController.php:16
* @route '/admin/monitoring/server'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/server',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::index
* @see app/Http/Controllers/Admin/ServerMonitoringController.php:16
* @route '/admin/monitoring/server'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::index
* @see app/Http/Controllers/Admin/ServerMonitoringController.php:16
* @route '/admin/monitoring/server'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::index
* @see app/Http/Controllers/Admin/ServerMonitoringController.php:16
* @route '/admin/monitoring/server'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::metrics
* @see app/Http/Controllers/Admin/ServerMonitoringController.php:28
* @route '/admin/monitoring/server/metrics'
*/
export const metrics = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: metrics.url(options),
    method: 'get',
})

metrics.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/server/metrics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::metrics
* @see app/Http/Controllers/Admin/ServerMonitoringController.php:28
* @route '/admin/monitoring/server/metrics'
*/
metrics.url = (options?: RouteQueryOptions) => {
    return metrics.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::metrics
* @see app/Http/Controllers/Admin/ServerMonitoringController.php:28
* @route '/admin/monitoring/server/metrics'
*/
metrics.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: metrics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::metrics
* @see app/Http/Controllers/Admin/ServerMonitoringController.php:28
* @route '/admin/monitoring/server/metrics'
*/
metrics.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: metrics.url(options),
    method: 'head',
})

const server = {
    index: Object.assign(index, index),
    metrics: Object.assign(metrics, metrics),
}

export default server