import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\AssistantController::chat
* @see app/Http/Controllers/Admin/AssistantController.php:22
* @route '/admin/assistant/chat'
*/
export const chat = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: chat.url(options),
    method: 'post',
})

chat.definition = {
    methods: ["post"],
    url: '/admin/assistant/chat',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\AssistantController::chat
* @see app/Http/Controllers/Admin/AssistantController.php:22
* @route '/admin/assistant/chat'
*/
chat.url = (options?: RouteQueryOptions) => {
    return chat.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AssistantController::chat
* @see app/Http/Controllers/Admin/AssistantController.php:22
* @route '/admin/assistant/chat'
*/
chat.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: chat.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\AssistantController::action
* @see app/Http/Controllers/Admin/AssistantController.php:41
* @route '/admin/assistant/action'
*/
export const action = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: action.url(options),
    method: 'post',
})

action.definition = {
    methods: ["post"],
    url: '/admin/assistant/action',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\AssistantController::action
* @see app/Http/Controllers/Admin/AssistantController.php:41
* @route '/admin/assistant/action'
*/
action.url = (options?: RouteQueryOptions) => {
    return action.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AssistantController::action
* @see app/Http/Controllers/Admin/AssistantController.php:41
* @route '/admin/assistant/action'
*/
action.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: action.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\AssistantController::quickStats
* @see app/Http/Controllers/Admin/AssistantController.php:60
* @route '/admin/assistant/quick-stats'
*/
export const quickStats = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: quickStats.url(options),
    method: 'get',
})

quickStats.definition = {
    methods: ["get","head"],
    url: '/admin/assistant/quick-stats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\AssistantController::quickStats
* @see app/Http/Controllers/Admin/AssistantController.php:60
* @route '/admin/assistant/quick-stats'
*/
quickStats.url = (options?: RouteQueryOptions) => {
    return quickStats.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AssistantController::quickStats
* @see app/Http/Controllers/Admin/AssistantController.php:60
* @route '/admin/assistant/quick-stats'
*/
quickStats.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: quickStats.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\AssistantController::quickStats
* @see app/Http/Controllers/Admin/AssistantController.php:60
* @route '/admin/assistant/quick-stats'
*/
quickStats.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: quickStats.url(options),
    method: 'head',
})

const assistant = {
    chat: Object.assign(chat, chat),
    action: Object.assign(action, action),
    quickStats: Object.assign(quickStats, quickStats),
}

export default assistant