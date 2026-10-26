import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ContactController::send
* @see app/Http/Controllers/ContactController.php:15
* @route '/contact-request'
*/
export const send = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: send.url(options),
    method: 'post',
})

send.definition = {
    methods: ["post"],
    url: '/contact-request',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ContactController::send
* @see app/Http/Controllers/ContactController.php:15
* @route '/contact-request'
*/
send.url = (options?: RouteQueryOptions) => {
    return send.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ContactController::send
* @see app/Http/Controllers/ContactController.php:15
* @route '/contact-request'
*/
send.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: send.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ContactController::send
* @see app/Http/Controllers/ContactController.php:15
* @route '/contact-request'
*/
const sendForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: send.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ContactController::send
* @see app/Http/Controllers/ContactController.php:15
* @route '/contact-request'
*/
sendForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: send.url(options),
    method: 'post',
})

send.form = sendForm

const ContactController = { send }

export default ContactController