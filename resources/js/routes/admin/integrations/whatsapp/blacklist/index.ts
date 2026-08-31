import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\IntegrationController::add
* @see app/Http/Controllers/Admin/IntegrationController.php:700
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
* @see app/Http/Controllers/Admin/IntegrationController.php:700
* @route '/admin/integrations/whatsapp/blacklist'
*/
add.url = (options?: RouteQueryOptions) => {
    return add.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::add
* @see app/Http/Controllers/Admin/IntegrationController.php:700
* @route '/admin/integrations/whatsapp/blacklist'
*/
add.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: add.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::remove
* @see app/Http/Controllers/Admin/IntegrationController.php:728
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
* @see app/Http/Controllers/Admin/IntegrationController.php:728
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
* @see app/Http/Controllers/Admin/IntegrationController.php:728
* @route '/admin/integrations/whatsapp/blacklist/{phone}'
*/
remove.delete = (args: { phone: string | number } | [phone: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: remove.url(args, options),
    method: 'delete',
})

const blacklist = {
    add: Object.assign(add, add),
    remove: Object.assign(remove, remove),
}

export default blacklist