import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::index
* @see app/Http/Controllers/Admin/TaskMonitoringController.php:17
* @route '/admin/monitoring/tasks'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/tasks',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::index
* @see app/Http/Controllers/Admin/TaskMonitoringController.php:17
* @route '/admin/monitoring/tasks'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::index
* @see app/Http/Controllers/Admin/TaskMonitoringController.php:17
* @route '/admin/monitoring/tasks'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::index
* @see app/Http/Controllers/Admin/TaskMonitoringController.php:17
* @route '/admin/monitoring/tasks'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::run
* @see app/Http/Controllers/Admin/TaskMonitoringController.php:101
* @route '/admin/monitoring/tasks/run'
*/
export const run = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: run.url(options),
    method: 'post',
})

run.definition = {
    methods: ["post"],
    url: '/admin/monitoring/tasks/run',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::run
* @see app/Http/Controllers/Admin/TaskMonitoringController.php:101
* @route '/admin/monitoring/tasks/run'
*/
run.url = (options?: RouteQueryOptions) => {
    return run.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::run
* @see app/Http/Controllers/Admin/TaskMonitoringController.php:101
* @route '/admin/monitoring/tasks/run'
*/
run.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: run.url(options),
    method: 'post',
})

const tasks = {
    index: Object.assign(index, index),
    run: Object.assign(run, run),
}

export default tasks