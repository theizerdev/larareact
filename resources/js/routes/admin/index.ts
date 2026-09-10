import clientes from './clientes'
import creditos from './creditos'
import cuotas from './cuotas'
import monitoring from './monitoring'
import empresas from './empresas'
import integrations from './integrations'
import inventario from './inventario'
import paises from './paises'
import planes from './planes'
import roles from './roles'
import sucursales from './sucursales'
import usuarios from './usuarios'
const admin = {
    clientes: Object.assign(clientes, clientes),
creditos: Object.assign(creditos, creditos),
cuotas: Object.assign(cuotas, cuotas),
monitoring: Object.assign(monitoring, monitoring),
empresas: Object.assign(empresas, empresas),
integrations: Object.assign(integrations, integrations),
inventario: Object.assign(inventario, inventario),
paises: Object.assign(paises, paises),
planes: Object.assign(planes, planes),
roles: Object.assign(roles, roles),
sucursales: Object.assign(sucursales, sucursales),
usuarios: Object.assign(usuarios, usuarios),
}

export default admin