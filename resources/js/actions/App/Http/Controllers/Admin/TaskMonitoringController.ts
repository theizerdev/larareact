import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::index
 * @see app/Http/Controllers/Admin/TaskMonitoringController.php:16
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
 * @see app/Http/Controllers/Admin/TaskMonitoringController.php:16
 * @route '/admin/monitoring/tasks'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::index
 * @see app/Http/Controllers/Admin/TaskMonitoringController.php:16
 * @route '/admin/monitoring/tasks'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::index
 * @see app/Http/Controllers/Admin/TaskMonitoringController.php:16
 * @route '/admin/monitoring/tasks'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::index
 * @see app/Http/Controllers/Admin/TaskMonitoringController.php:16
 * @route '/admin/monitoring/tasks'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::index
 * @see app/Http/Controllers/Admin/TaskMonitoringController.php:16
 * @route '/admin/monitoring/tasks'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::index
 * @see app/Http/Controllers/Admin/TaskMonitoringController.php:16
 * @route '/admin/monitoring/tasks'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::run
 * @see app/Http/Controllers/Admin/TaskMonitoringController.php:62
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
 * @see app/Http/Controllers/Admin/TaskMonitoringController.php:62
 * @route '/admin/monitoring/tasks/run'
 */
run.url = (options?: RouteQueryOptions) => {
    return run.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::run
 * @see app/Http/Controllers/Admin/TaskMonitoringController.php:62
 * @route '/admin/monitoring/tasks/run'
 */
run.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: run.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::run
 * @see app/Http/Controllers/Admin/TaskMonitoringController.php:62
 * @route '/admin/monitoring/tasks/run'
 */
    const runForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: run.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\TaskMonitoringController::run
 * @see app/Http/Controllers/Admin/TaskMonitoringController.php:62
 * @route '/admin/monitoring/tasks/run'
 */
        runForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: run.url(options),
            method: 'post',
        })
    
    run.form = runForm
const TaskMonitoringController = { index, run }

export default TaskMonitoringController