import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ProveedorController::carnet
 * @see app/Http/Controllers/Admin/ProveedorController.php:167
 * @route '/admin/proveedores/{proveedor}/carnet'
 */
export const carnet = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: carnet.url(args, options),
    method: 'get',
})

carnet.definition = {
    methods: ["get","head"],
    url: '/admin/proveedores/{proveedor}/carnet',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorController::carnet
 * @see app/Http/Controllers/Admin/ProveedorController.php:167
 * @route '/admin/proveedores/{proveedor}/carnet'
 */
carnet.url = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proveedor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proveedor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proveedor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proveedor: typeof args.proveedor === 'object'
                ? args.proveedor.id
                : args.proveedor,
                }

    return carnet.definition.url
            .replace('{proveedor}', parsedArgs.proveedor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorController::carnet
 * @see app/Http/Controllers/Admin/ProveedorController.php:167
 * @route '/admin/proveedores/{proveedor}/carnet'
 */
carnet.get = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: carnet.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ProveedorController::carnet
 * @see app/Http/Controllers/Admin/ProveedorController.php:167
 * @route '/admin/proveedores/{proveedor}/carnet'
 */
carnet.head = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: carnet.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ProveedorController::carnet
 * @see app/Http/Controllers/Admin/ProveedorController.php:167
 * @route '/admin/proveedores/{proveedor}/carnet'
 */
    const carnetForm = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: carnet.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ProveedorController::carnet
 * @see app/Http/Controllers/Admin/ProveedorController.php:167
 * @route '/admin/proveedores/{proveedor}/carnet'
 */
        carnetForm.get = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: carnet.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ProveedorController::carnet
 * @see app/Http/Controllers/Admin/ProveedorController.php:167
 * @route '/admin/proveedores/{proveedor}/carnet'
 */
        carnetForm.head = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: carnet.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    carnet.form = carnetForm
/**
* @see \App\Http\Controllers\Admin\ProveedorController::sendCarnetWhatsapp
 * @see app/Http/Controllers/Admin/ProveedorController.php:185
 * @route '/admin/proveedores/{proveedor}/send-carnet-whatsapp'
 */
export const sendCarnetWhatsapp = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendCarnetWhatsapp.url(args, options),
    method: 'post',
})

sendCarnetWhatsapp.definition = {
    methods: ["post"],
    url: '/admin/proveedores/{proveedor}/send-carnet-whatsapp',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorController::sendCarnetWhatsapp
 * @see app/Http/Controllers/Admin/ProveedorController.php:185
 * @route '/admin/proveedores/{proveedor}/send-carnet-whatsapp'
 */
sendCarnetWhatsapp.url = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proveedor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proveedor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proveedor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proveedor: typeof args.proveedor === 'object'
                ? args.proveedor.id
                : args.proveedor,
                }

    return sendCarnetWhatsapp.definition.url
            .replace('{proveedor}', parsedArgs.proveedor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorController::sendCarnetWhatsapp
 * @see app/Http/Controllers/Admin/ProveedorController.php:185
 * @route '/admin/proveedores/{proveedor}/send-carnet-whatsapp'
 */
sendCarnetWhatsapp.post = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendCarnetWhatsapp.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProveedorController::sendCarnetWhatsapp
 * @see app/Http/Controllers/Admin/ProveedorController.php:185
 * @route '/admin/proveedores/{proveedor}/send-carnet-whatsapp'
 */
    const sendCarnetWhatsappForm = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sendCarnetWhatsapp.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProveedorController::sendCarnetWhatsapp
 * @see app/Http/Controllers/Admin/ProveedorController.php:185
 * @route '/admin/proveedores/{proveedor}/send-carnet-whatsapp'
 */
        sendCarnetWhatsappForm.post = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sendCarnetWhatsapp.url(args, options),
            method: 'post',
        })
    
    sendCarnetWhatsapp.form = sendCarnetWhatsappForm
const proveedores = {
    carnet: Object.assign(carnet, carnet),
sendCarnetWhatsapp: Object.assign(sendCarnetWhatsapp, sendCarnetWhatsapp),
}

export default proveedores