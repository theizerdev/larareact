import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::index
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:67
* @route '/admin/monitoring/activities'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/activities',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::index
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:67
* @route '/admin/monitoring/activities'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::index
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:67
* @route '/admin/monitoring/activities'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::index
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:67
* @route '/admin/monitoring/activities'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::exportMethod
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:419
* @route '/admin/monitoring/activities/export'
*/
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/activities/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::exportMethod
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:419
* @route '/admin/monitoring/activities/export'
*/
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::exportMethod
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:419
* @route '/admin/monitoring/activities/export'
*/
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::exportMethod
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:419
* @route '/admin/monitoring/activities/export'
*/
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::clear
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:390
* @route '/admin/monitoring/activities/clear'
*/
export const clear = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clear.url(options),
    method: 'delete',
})

clear.definition = {
    methods: ["delete"],
    url: '/admin/monitoring/activities/clear',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::clear
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:390
* @route '/admin/monitoring/activities/clear'
*/
clear.url = (options?: RouteQueryOptions) => {
    return clear.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::clear
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:390
* @route '/admin/monitoring/activities/clear'
*/
clear.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clear.url(options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::destroy
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:363
* @route '/admin/monitoring/activities/{id}'
*/
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/monitoring/activities/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::destroy
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:363
* @route '/admin/monitoring/activities/{id}'
*/
destroy.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    if (Array.isArray(args)) {
        args = {
            id: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        id: args.id,
    }

    return destroy.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ActivityMonitoringController::destroy
* @see app/Http/Controllers/Admin/ActivityMonitoringController.php:363
* @route '/admin/monitoring/activities/{id}'
*/
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

const activities = {
    index: Object.assign(index, index),
    export: Object.assign(exportMethod, exportMethod),
    clear: Object.assign(clear, clear),
    destroy: Object.assign(destroy, destroy),
}

export default activities