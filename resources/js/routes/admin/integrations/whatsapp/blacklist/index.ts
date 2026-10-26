import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\IntegrationController::add
* @see app/Http/Controllers/Admin/IntegrationController.php:785
* @route '/admin/integrations/whatsapp/blacklist'
*/
export const add = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: add.url(options),
    method: 'post',
})

add.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/blacklist',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::add
* @see app/Http/Controllers/Admin/IntegrationController.php:785
* @route '/admin/integrations/whatsapp/blacklist'
*/
add.url = (options?: RouteQueryOptions) => {
    return add.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::add
* @see app/Http/Controllers/Admin/IntegrationController.php:785
* @route '/admin/integrations/whatsapp/blacklist'
*/
add.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: add.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::add
* @see app/Http/Controllers/Admin/IntegrationController.php:785
* @route '/admin/integrations/whatsapp/blacklist'
*/
const addForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: add.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::add
* @see app/Http/Controllers/Admin/IntegrationController.php:785
* @route '/admin/integrations/whatsapp/blacklist'
*/
addForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: add.url(options),
    method: 'post',
})

add.form = addForm

/**
* @see \App\Http\Controllers\Admin\IntegrationController::remove
* @see app/Http/Controllers/Admin/IntegrationController.php:812
* @route '/admin/integrations/whatsapp/blacklist/{phone}'
*/
export const remove = (args: { phone: string | number } | [phone: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: remove.url(args, options),
    method: 'delete',
})

remove.definition = {
    methods: ["delete"],
    url: '/admin/integrations/whatsapp/blacklist/{phone}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::remove
* @see app/Http/Controllers/Admin/IntegrationController.php:812
* @route '/admin/integrations/whatsapp/blacklist/{phone}'
*/
remove.url = (args: { phone: string | number } | [phone: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { phone: args }
    }

    if (Array.isArray(args)) {
        args = {
            phone: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        phone: args.phone,
    }

    return remove.definition.url
            .replace('{phone}', parsedArgs.phone.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::remove
* @see app/Http/Controllers/Admin/IntegrationController.php:812
* @route '/admin/integrations/whatsapp/blacklist/{phone}'
*/
remove.delete = (args: { phone: string | number } | [phone: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: remove.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::remove
* @see app/Http/Controllers/Admin/IntegrationController.php:812
* @route '/admin/integrations/whatsapp/blacklist/{phone}'
*/
const removeForm = (args: { phone: string | number } | [phone: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: remove.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::remove
* @see app/Http/Controllers/Admin/IntegrationController.php:812
* @route '/admin/integrations/whatsapp/blacklist/{phone}'
*/
removeForm.delete = (args: { phone: string | number } | [phone: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: remove.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

remove.form = removeForm

const blacklist = {
    add: Object.assign(add, add),
    remove: Object.assign(remove, remove),
}

export default blacklist