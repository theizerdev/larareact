import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
import setup90f0be from './setup'
import planCuentasC9faeb from './plan-cuentas'
import asientosA07b47 from './asientos'
/**
* @see \App\Http\Controllers\Admin\ContabilidadController::setup
* @see app/Http/Controllers/Admin/ContabilidadController.php:28
* @route '/admin/contabilidad/setup'
*/
export const setup = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: setup.url(options),
    method: 'get',
})

setup.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/setup',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::setup
* @see app/Http/Controllers/Admin/ContabilidadController.php:28
* @route '/admin/contabilidad/setup'
*/
setup.url = (options?: RouteQueryOptions) => {
    return setup.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::setup
* @see app/Http/Controllers/Admin/ContabilidadController.php:28
* @route '/admin/contabilidad/setup'
*/
setup.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: setup.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::setup
* @see app/Http/Controllers/Admin/ContabilidadController.php:28
* @route '/admin/contabilidad/setup'
*/
setup.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: setup.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::planCuentas
* @see app/Http/Controllers/Admin/ContabilidadController.php:73
* @route '/admin/contabilidad/plan-cuentas'
*/
export const planCuentas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: planCuentas.url(options),
    method: 'get',
})

planCuentas.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/plan-cuentas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::planCuentas
* @see app/Http/Controllers/Admin/ContabilidadController.php:73
* @route '/admin/contabilidad/plan-cuentas'
*/
planCuentas.url = (options?: RouteQueryOptions) => {
    return planCuentas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::planCuentas
* @see app/Http/Controllers/Admin/ContabilidadController.php:73
* @route '/admin/contabilidad/plan-cuentas'
*/
planCuentas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: planCuentas.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::planCuentas
* @see app/Http/Controllers/Admin/ContabilidadController.php:73
* @route '/admin/contabilidad/plan-cuentas'
*/
planCuentas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: planCuentas.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::asientos
* @see app/Http/Controllers/Admin/ContabilidadController.php:125
* @route '/admin/contabilidad/asientos'
*/
export const asientos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: asientos.url(options),
    method: 'get',
})

asientos.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/asientos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::asientos
* @see app/Http/Controllers/Admin/ContabilidadController.php:125
* @route '/admin/contabilidad/asientos'
*/
asientos.url = (options?: RouteQueryOptions) => {
    return asientos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::asientos
* @see app/Http/Controllers/Admin/ContabilidadController.php:125
* @route '/admin/contabilidad/asientos'
*/
asientos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: asientos.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::asientos
* @see app/Http/Controllers/Admin/ContabilidadController.php:125
* @route '/admin/contabilidad/asientos'
*/
asientos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: asientos.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::mayor
* @see app/Http/Controllers/Admin/ContabilidadController.php:235
* @route '/admin/contabilidad/mayor'
*/
export const mayor = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mayor.url(options),
    method: 'get',
})

mayor.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/mayor',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::mayor
* @see app/Http/Controllers/Admin/ContabilidadController.php:235
* @route '/admin/contabilidad/mayor'
*/
mayor.url = (options?: RouteQueryOptions) => {
    return mayor.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::mayor
* @see app/Http/Controllers/Admin/ContabilidadController.php:235
* @route '/admin/contabilidad/mayor'
*/
mayor.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mayor.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::mayor
* @see app/Http/Controllers/Admin/ContabilidadController.php:235
* @route '/admin/contabilidad/mayor'
*/
mayor.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mayor.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::reportes
* @see app/Http/Controllers/Admin/ContabilidadController.php:267
* @route '/admin/contabilidad/reportes'
*/
export const reportes = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportes.url(options),
    method: 'get',
})

reportes.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/reportes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::reportes
* @see app/Http/Controllers/Admin/ContabilidadController.php:267
* @route '/admin/contabilidad/reportes'
*/
reportes.url = (options?: RouteQueryOptions) => {
    return reportes.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::reportes
* @see app/Http/Controllers/Admin/ContabilidadController.php:267
* @route '/admin/contabilidad/reportes'
*/
reportes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportes.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::reportes
* @see app/Http/Controllers/Admin/ContabilidadController.php:267
* @route '/admin/contabilidad/reportes'
*/
reportes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportes.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::impuestos
* @see app/Http/Controllers/Admin/ContabilidadController.php:366
* @route '/admin/contabilidad/impuestos'
*/
export const impuestos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: impuestos.url(options),
    method: 'get',
})

impuestos.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/impuestos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::impuestos
* @see app/Http/Controllers/Admin/ContabilidadController.php:366
* @route '/admin/contabilidad/impuestos'
*/
impuestos.url = (options?: RouteQueryOptions) => {
    return impuestos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::impuestos
* @see app/Http/Controllers/Admin/ContabilidadController.php:366
* @route '/admin/contabilidad/impuestos'
*/
impuestos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: impuestos.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::impuestos
* @see app/Http/Controllers/Admin/ContabilidadController.php:366
* @route '/admin/contabilidad/impuestos'
*/
impuestos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: impuestos.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::cierreEjercicio
* @see app/Http/Controllers/Admin/ContabilidadController.php:210
* @route '/admin/contabilidad/cierre-ejercicio'
*/
export const cierreEjercicio = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cierreEjercicio.url(options),
    method: 'post',
})

cierreEjercicio.definition = {
    methods: ["post"],
    url: '/admin/contabilidad/cierre-ejercicio',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::cierreEjercicio
* @see app/Http/Controllers/Admin/ContabilidadController.php:210
* @route '/admin/contabilidad/cierre-ejercicio'
*/
cierreEjercicio.url = (options?: RouteQueryOptions) => {
    return cierreEjercicio.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::cierreEjercicio
* @see app/Http/Controllers/Admin/ContabilidadController.php:210
* @route '/admin/contabilidad/cierre-ejercicio'
*/
cierreEjercicio.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cierreEjercicio.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::exportarExcel
* @see app/Http/Controllers/Admin/ContabilidadController.php:492
* @route '/admin/contabilidad/exportar-excel'
*/
export const exportarExcel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportarExcel.url(options),
    method: 'get',
})

exportarExcel.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/exportar-excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::exportarExcel
* @see app/Http/Controllers/Admin/ContabilidadController.php:492
* @route '/admin/contabilidad/exportar-excel'
*/
exportarExcel.url = (options?: RouteQueryOptions) => {
    return exportarExcel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::exportarExcel
* @see app/Http/Controllers/Admin/ContabilidadController.php:492
* @route '/admin/contabilidad/exportar-excel'
*/
exportarExcel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportarExcel.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::exportarExcel
* @see app/Http/Controllers/Admin/ContabilidadController.php:492
* @route '/admin/contabilidad/exportar-excel'
*/
exportarExcel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportarExcel.url(options),
    method: 'head',
})

const contabilidad = {
    setup: Object.assign(setup, setup90f0be),
    planCuentas: Object.assign(planCuentas, planCuentasC9faeb),
    asientos: Object.assign(asientos, asientosA07b47),
    mayor: Object.assign(mayor, mayor),
    reportes: Object.assign(reportes, reportes),
    impuestos: Object.assign(impuestos, impuestos),
    cierreEjercicio: Object.assign(cierreEjercicio, cierreEjercicio),
    exportarExcel: Object.assign(exportarExcel, exportarExcel),
}

export default contabilidad