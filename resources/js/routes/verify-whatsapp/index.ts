import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::index
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:17
* @route '/verify-whatsapp'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/verify-whatsapp',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::index
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:17
* @route '/verify-whatsapp'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::index
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:17
* @route '/verify-whatsapp'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\WhatsAppVerificationController::index
* @see app/Http/Controllers/Auth/WhatsAppVerificationController.php:17
* @route '/verify-whatsapp'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
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

const verifyWhatsapp = {
    index: Object.assign(index, index),
    verify: Object.assign(verify, verify),
    resend: Object.assign(resend, resend),
}

export default verifyWhatsapp