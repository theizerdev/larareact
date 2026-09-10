import DashboardController from './DashboardController'
import ClienteController from './ClienteController'
import CreditoController from './CreditoController'
import DbMonitoringController from './DbMonitoringController'
import EmpresaController from './EmpresaController'
import IntegrationController from './IntegrationController'
import InventarioEquipoController from './InventarioEquipoController'
import LogMonitoringController from './LogMonitoringController'
import PaisController from './PaisController'
import PlanFinanciamientoController from './PlanFinanciamientoController'
import QueueMonitoringController from './QueueMonitoringController'
import RoleController from './RoleController'
import ServerMonitoringController from './ServerMonitoringController'
import SessionMonitoringController from './SessionMonitoringController'
import SucursalController from './SucursalController'
import TaskMonitoringController from './TaskMonitoringController'
import UserController from './UserController'
const Admin = {
    DashboardController: Object.assign(DashboardController, DashboardController),
ClienteController: Object.assign(ClienteController, ClienteController),
CreditoController: Object.assign(CreditoController, CreditoController),
DbMonitoringController: Object.assign(DbMonitoringController, DbMonitoringController),
EmpresaController: Object.assign(EmpresaController, EmpresaController),
IntegrationController: Object.assign(IntegrationController, IntegrationController),
InventarioEquipoController: Object.assign(InventarioEquipoController, InventarioEquipoController),
LogMonitoringController: Object.assign(LogMonitoringController, LogMonitoringController),
PaisController: Object.assign(PaisController, PaisController),
PlanFinanciamientoController: Object.assign(PlanFinanciamientoController, PlanFinanciamientoController),
QueueMonitoringController: Object.assign(QueueMonitoringController, QueueMonitoringController),
RoleController: Object.assign(RoleController, RoleController),
ServerMonitoringController: Object.assign(ServerMonitoringController, ServerMonitoringController),
SessionMonitoringController: Object.assign(SessionMonitoringController, SessionMonitoringController),
SucursalController: Object.assign(SucursalController, SucursalController),
TaskMonitoringController: Object.assign(TaskMonitoringController, TaskMonitoringController),
UserController: Object.assign(UserController, UserController),
}

export default Admin