import DashboardController from './DashboardController'
import CitaController from './CitaController'
import PreconsultaAdminController from './PreconsultaAdminController'
import ConsultaMedicaController from './ConsultaMedicaController'
import DbMonitoringController from './DbMonitoringController'
import EmpresaController from './EmpresaController'
import EmpresaEspecialidadController from './EmpresaEspecialidadController'
import IntegrationController from './IntegrationController'
import LogMonitoringController from './LogMonitoringController'
import MedicoController from './MedicoController'
import PacienteController from './PacienteController'
import PaisController from './PaisController'
import QueueMonitoringController from './QueueMonitoringController'
import RoleController from './RoleController'
import ServerMonitoringController from './ServerMonitoringController'
import SessionMonitoringController from './SessionMonitoringController'
import SucursalController from './SucursalController'
import TaskMonitoringController from './TaskMonitoringController'
import TipoAtencionController from './TipoAtencionController'
import UserController from './UserController'
const Admin = {
    DashboardController: Object.assign(DashboardController, DashboardController),
CitaController: Object.assign(CitaController, CitaController),
PreconsultaAdminController: Object.assign(PreconsultaAdminController, PreconsultaAdminController),
ConsultaMedicaController: Object.assign(ConsultaMedicaController, ConsultaMedicaController),
DbMonitoringController: Object.assign(DbMonitoringController, DbMonitoringController),
EmpresaController: Object.assign(EmpresaController, EmpresaController),
EmpresaEspecialidadController: Object.assign(EmpresaEspecialidadController, EmpresaEspecialidadController),
IntegrationController: Object.assign(IntegrationController, IntegrationController),
LogMonitoringController: Object.assign(LogMonitoringController, LogMonitoringController),
MedicoController: Object.assign(MedicoController, MedicoController),
PacienteController: Object.assign(PacienteController, PacienteController),
PaisController: Object.assign(PaisController, PaisController),
QueueMonitoringController: Object.assign(QueueMonitoringController, QueueMonitoringController),
RoleController: Object.assign(RoleController, RoleController),
ServerMonitoringController: Object.assign(ServerMonitoringController, ServerMonitoringController),
SessionMonitoringController: Object.assign(SessionMonitoringController, SessionMonitoringController),
SucursalController: Object.assign(SucursalController, SucursalController),
TaskMonitoringController: Object.assign(TaskMonitoringController, TaskMonitoringController),
TipoAtencionController: Object.assign(TipoAtencionController, TipoAtencionController),
UserController: Object.assign(UserController, UserController),
}

export default Admin