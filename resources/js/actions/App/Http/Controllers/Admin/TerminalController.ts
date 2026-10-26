import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\TerminalController::index
* @see app/Http/Controllers/Admin/TerminalController.php:22
* @route '/admin/monitoring/terminal'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/terminal',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\TerminalController::index
* @see app/Http/Controllers/Admin/TerminalController.php:22
* @route '/admin/monitoring/terminal'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TerminalController::index
* @see app/Http/Controllers/Admin/TerminalController.php:22
* @route '/admin/monitoring/terminal'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\TerminalController::index
* @see app/Http/Controllers/Admin/TerminalController.php:22
* @route '/admin/monitoring/terminal'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\TerminalController::index
* @see app/Http/Controllers/Admin/TerminalController.php:22
* @route '/admin/monitoring/terminal'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\TerminalController::index
* @see app/Http/Controllers/Admin/TerminalController.php:22
* @route '/admin/monitoring/terminal'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\TerminalController::index
* @see app/Http/Controllers/Admin/TerminalController.php:22
* @route '/admin/monitoring/terminal'
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
* @see \App\Http\Controllers\Admin\TerminalController::execute
* @see app/Http/Controllers/Admin/TerminalController.php:206
* @route '/admin/monitoring/terminal/execute'
*/
export const execute = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: execute.url(options),
    method: 'post',
})

execute.definition = {
    methods: ["post"],
    url: '/admin/monitoring/terminal/execute',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\TerminalController::execute
* @see app/Http/Controllers/Admin/TerminalController.php:206
* @route '/admin/monitoring/terminal/execute'
*/
execute.url = (options?: RouteQueryOptions) => {
    return execute.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\TerminalController::execute
* @see app/Http/Controllers/Admin/TerminalController.php:206
* @route '/admin/monitoring/terminal/execute'
*/
execute.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: execute.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\TerminalController::execute
* @see app/Http/Controllers/Admin/TerminalController.php:206
* @route '/admin/monitoring/terminal/execute'
*/
const executeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: execute.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\TerminalController::execute
* @see app/Http/Controllers/Admin/TerminalController.php:206
* @route '/admin/monitoring/terminal/execute'
*/
executeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: execute.url(options),
    method: 'post',
})

execute.form = executeForm

const TerminalController = { index, execute }

export default TerminalController