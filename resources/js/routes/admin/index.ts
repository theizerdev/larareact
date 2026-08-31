import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
import testimonios from './testimonios'
import monitoring from './monitoring'
import contabilidad from './contabilidad'
import creditConfig from './credit-config'
import empresas from './empresas'
import categorias from './categorias'
import marcas from './marcas'
import familias from './familias'
import modelos from './modelos'
import productos from './productos'
import integrations from './integrations'
import inventario from './inventario'
import seguridad from './seguridad'
import nomina from './nomina'
import paises from './paises'
import cajas from './cajas'
import pos from './pos'
import servicios from './servicios'
import ventas from './ventas'
import clientes from './clientes'
import compras from './compras'
import fondoMensual from './fondo-mensual'
import stockAlerts from './stock-alerts'
import proveedores from './proveedores'
import reparaciones from './reparaciones'
import roles from './roles'
import subscription from './subscription'
import planes from './planes'
import sucursales from './sucursales'
import usuarios from './usuarios'
/**
* @see \App\Http\Controllers\Admin\DashboardController::dashboard
* @see app/Http/Controllers/Admin/DashboardController.php:20
* @route '/admin/dashboard'
*/
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/admin/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DashboardController::dashboard
* @see app/Http/Controllers/Admin/DashboardController.php:20
* @route '/admin/dashboard'
*/
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DashboardController::dashboard
* @see app/Http/Controllers/Admin/DashboardController.php:20
* @route '/admin/dashboard'
*/
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\DashboardController::dashboard
* @see app/Http/Controllers/Admin/DashboardController.php:20
* @route '/admin/dashboard'
*/
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})

const admin = {
    dashboard: Object.assign(dashboard, dashboard),
    testimonios: Object.assign(testimonios, testimonios),
    monitoring: Object.assign(monitoring, monitoring),
    contabilidad: Object.assign(contabilidad, contabilidad),
    creditConfig: Object.assign(creditConfig, creditConfig),
    empresas: Object.assign(empresas, empresas),
    categorias: Object.assign(categorias, categorias),
    marcas: Object.assign(marcas, marcas),
    familias: Object.assign(familias, familias),
    modelos: Object.assign(modelos, modelos),
    productos: Object.assign(productos, productos),
    integrations: Object.assign(integrations, integrations),
    inventario: Object.assign(inventario, inventario),
    seguridad: Object.assign(seguridad, seguridad),
    nomina: Object.assign(nomina, nomina),
    paises: Object.assign(paises, paises),
    cajas: Object.assign(cajas, cajas),
    pos: Object.assign(pos, pos),
    servicios: Object.assign(servicios, servicios),
    ventas: Object.assign(ventas, ventas),
    clientes: Object.assign(clientes, clientes),
    compras: Object.assign(compras, compras),
    fondoMensual: Object.assign(fondoMensual, fondoMensual),
    stockAlerts: Object.assign(stockAlerts, stockAlerts),
    proveedores: Object.assign(proveedores, proveedores),
    reparaciones: Object.assign(reparaciones, reparaciones),
    roles: Object.assign(roles, roles),
    subscription: Object.assign(subscription, subscription),
    planes: Object.assign(planes, planes),
    sucursales: Object.assign(sucursales, sucursales),
    usuarios: Object.assign(usuarios, usuarios),
}

export default admin