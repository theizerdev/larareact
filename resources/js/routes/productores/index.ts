import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
export const carnet = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: carnet.url(args, options),
    method: 'get',
})

carnet.definition = {
    methods: ["get","head"],
    url: '/admin/productores/{productor}/carnet',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
carnet.url = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { productor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: typeof args.productor === 'object'
                ? args.productor.id
                : args.productor,
                }

    return carnet.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
carnet.get = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: carnet.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
carnet.head = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: carnet.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
    const carnetForm = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: carnet.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
        carnetForm.get = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: carnet.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
        carnetForm.head = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Admin\ProductorController::sendCarnetWhatsapp
 * @see app/Http/Controllers/Admin/ProductorController.php:109
 * @route '/admin/productores/{productor}/send-carnet-whatsapp'
 */
export const sendCarnetWhatsapp = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendCarnetWhatsapp.url(args, options),
    method: 'post',
})

sendCarnetWhatsapp.definition = {
    methods: ["post"],
    url: '/admin/productores/{productor}/send-carnet-whatsapp',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::sendCarnetWhatsapp
 * @see app/Http/Controllers/Admin/ProductorController.php:109
 * @route '/admin/productores/{productor}/send-carnet-whatsapp'
 */
sendCarnetWhatsapp.url = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { productor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: typeof args.productor === 'object'
                ? args.productor.id
                : args.productor,
                }

    return sendCarnetWhatsapp.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::sendCarnetWhatsapp
 * @see app/Http/Controllers/Admin/ProductorController.php:109
 * @route '/admin/productores/{productor}/send-carnet-whatsapp'
 */
sendCarnetWhatsapp.post = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendCarnetWhatsapp.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::sendCarnetWhatsapp
 * @see app/Http/Controllers/Admin/ProductorController.php:109
 * @route '/admin/productores/{productor}/send-carnet-whatsapp'
 */
    const sendCarnetWhatsappForm = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sendCarnetWhatsapp.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::sendCarnetWhatsapp
 * @see app/Http/Controllers/Admin/ProductorController.php:109
 * @route '/admin/productores/{productor}/send-carnet-whatsapp'
 */
        sendCarnetWhatsappForm.post = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sendCarnetWhatsapp.url(args, options),
            method: 'post',
        })
    
    sendCarnetWhatsapp.form = sendCarnetWhatsappForm
const productores = {
    carnet: Object.assign(carnet, carnet),
sendCarnetWhatsapp: Object.assign(sendCarnetWhatsapp, sendCarnetWhatsapp),
}

export default productores