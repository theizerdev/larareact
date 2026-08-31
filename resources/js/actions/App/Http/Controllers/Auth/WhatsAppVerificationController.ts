import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::show
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:17
* @route '/verify-whatsapp'
*/
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/verify-whatsapp',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::show
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:17
* @route '/verify-whatsapp'
*/
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::show
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:17
* @route '/verify-whatsapp'
*/
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::show
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:17
* @route '/verify-whatsapp'
*/
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::verify
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:50
* @route '/verify-whatsapp/verify'
*/
export const verify = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verify.url(options),
    method: 'post',
})

verify.definition = {
    methods: ["post"],
    url: '/verify-whatsapp/verify',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::verify
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:50
* @route '/verify-whatsapp/verify'
*/
verify.url = (options?: RouteQueryOptions) => {
    return verify.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::verify
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:50
* @route '/verify-whatsapp/verify'
*/
verify.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verify.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::resend
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:95
* @route '/verify-whatsapp/resend'
*/
export const resend = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resend.url(options),
    method: 'post',
})

resend.definition = {
    methods: ["post"],
    url: '/verify-whatsapp/resend',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::resend
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:95
* @route '/verify-whatsapp/resend'
*/
resend.url = (options?: RouteQueryOptions) => {
    return resend.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::resend
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:95
* @route '/verify-whatsapp/resend'
*/
resend.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resend.url(options),
    method: 'post',
})

const WhatsAppVerificationController = { show, verify, resend }

export default WhatsAppVerificationController