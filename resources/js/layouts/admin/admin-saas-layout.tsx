import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    BellRing,
    Check,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Home,
    LayoutDashboard,
    LogOut,
    Monitor,
    Moon,
    Search,
    Settings,
    Shield,
    Sun,
    User,
    Globe,
    Menu,
    Volume2,
    VolumeX,
    X,
    Activity,
    Link2,
} from 'lucide-react';
import { Building2, GitBranch, Briefcase, Calendar, Fingerprint } from 'lucide-react';
import * as React from 'react';
import LanguageToggle from '@/components/language-toggle';
import TemplateCustomizer from '@/components/template-customizer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppearance } from '@/hooks/use-appearance';
import { useDesktopNotifications } from '@/hooks/use-desktop-notifications';
import { useInitials } from '@/hooks/use-initials';
import { useTemplateSettings } from '@/hooks/use-template-settings';
import { useTranslate } from '@/hooks/use-translate';
import { cn, toUrl } from '@/lib/utils';
import { dashboard, home, logout } from '@/routes';
import { index as cargosIndex } from '@/routes/admin/cargos';
import { index as departamentosIndex } from '@/routes/admin/departamentos';
import { index as empresasIndex } from '@/routes/admin/empresas';
import { index as dbMonitoringIndex } from '@/routes/admin/monitoring/database';
import { index as paisesIndex } from '@/routes/admin/paises';
import { edit as appearanceEdit } from '@/routes/appearance';
import { edit as profileEdit } from '@/routes/profile';
import { edit as securityEdit } from '@/routes/security';
import { index as sucursalesIndex } from '@/routes/admin/sucursales';
import { index as responsablesIndex } from '@/routes/admin/responsables';
import { index as rolesIndex } from '@/routes/admin/roles';
import { index as usuariosIndex } from '@/routes/admin/usuarios';
import { index as serverMonitoringIndex } from '@/routes/admin/monitoring/server';
import { index as sessionMonitoringIndex } from '@/routes/admin/monitoring/sessions';
import { index as logMonitoringIndex } from '@/routes/admin/monitoring/logs';
import { index as queuesMonitoringIndex } from '@/routes/admin/monitoring/queues';
import { index as tasksMonitoringIndex } from '@/routes/admin/monitoring/tasks';
import { index as integrationsIndex } from '@/routes/admin/integrations';
import type { BreadcrumbItem, NavItem } from '@/types';

type AdminSaasLayoutProps = {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutDashboard,
    },
];

// We removed settingsNavItems as they are now defined inline in the CollapsibleNavItem component.

function NavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
    const { url } = usePage();
    const active = url.startsWith(item.href as string);
    const { __ } = useTranslate();

    const linkContent = (
        <Link
            href={item.href}
            className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
        >
            {item.icon && <item.icon className="size-5 shrink-0" />}
            <span
                className={cn(
                    'whitespace-nowrap transition-opacity duration-300',
                    collapsed && 'opacity-0',
                )}
            >
                {__(item.title)}
            </span>
        </Link>
    );

    return collapsed ? (
        <Tooltip>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side="right">{__(item.title)}</TooltipContent>
        </Tooltip>
    ) : (
        linkContent
    );
}

type CollapsibleLeaf = { title: string; href: string };
type CollapsibleEntry =
    | CollapsibleLeaf
    | { title: string; children: CollapsibleLeaf[] };

const isGroupEntry = (
    item: CollapsibleEntry,
): item is { title: string; children: CollapsibleLeaf[] } => 'children' in item;

const collapsibleHrefs = (items: CollapsibleEntry[]): string[] =>
    items.flatMap((item) =>
        isGroupEntry(item) ? item.children.map((c) => c.href) : [item.href],
    );

// Sub-grupo desplegable dentro de un CollapsibleNavItem (p. ej. "BioTime PRO"
// vive aquí dentro de "Reloj Checador"). Sin icono, solo título + chevron.
function NestedNavGroup({
    title,
    items,
}: {
    title: string;
    items: CollapsibleLeaf[];
}) {
    const { url } = usePage();
    const { __ } = useTranslate();

    const isAnyActive = items.some((item) => url.startsWith(item.href));
    const [isOpen, setIsOpen] = React.useState(isAnyActive);

    React.useEffect(() => {
        if (isAnyActive) {
            setIsOpen(true);
        }
    }, [isAnyActive]);

    return (
        <div className="space-y-1">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }}
                className={cn(
                    'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all text-sidebar-foreground/60 hover:text-sidebar-accent-foreground',
                    isAnyActive && 'text-sidebar-foreground/90 font-semibold',
                )}
            >
                <span className="whitespace-nowrap">{__(title)}</span>
                {isOpen ? (
                    <ChevronDown className="size-4 text-slate-500 group-hover:text-slate-300" />
                ) : (
                    <ChevronRight className="size-4 text-slate-500 group-hover:text-slate-300" />
                )}
            </button>

            {isOpen && (
                <div className="pl-4 space-y-1">
                    {items.map((item, idx) => {
                        const active = url === item.href || url.startsWith(item.href);

                        return (
                            <Link
                                key={idx}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all block',
                                    active
                                        ? 'text-primary font-semibold'
                                        : 'text-sidebar-foreground/60 hover:text-sidebar-accent-foreground',
                                )}
                            >
                                {__(item.title)}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function CollapsibleNavItem({
    title,
    icon: Icon,
    items,
    collapsed,
}: {
    title: string;
    icon: React.ComponentType<any>;
    items: CollapsibleEntry[];
    collapsed: boolean;
}) {
    const { url } = usePage();
    const { __ } = useTranslate();

    // Determine if any of the sub-items are active
    const isAnyActive = collapsibleHrefs(items).some((href) => url.startsWith(href));

    // State to toggle open/closed
    const [isOpen, setIsOpen] = React.useState(isAnyActive);

    // Keep it open if one of the children becomes active
    React.useEffect(() => {
        if (isAnyActive) {
            setIsOpen(true);
        }
    }, [isAnyActive]);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsOpen(!isOpen);
    };

    if (collapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleToggle}
                        className={cn(
                            'group flex w-full items-center justify-center rounded-lg p-2.5 text-sm font-medium transition-all text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            isAnyActive && 'bg-primary/10 text-primary'
                        )}
                    >
                        <Icon className="size-5 shrink-0" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <div className="flex flex-col gap-1 p-1">
                        <p className="font-semibold text-white border-b border-sidebar-border pb-1 mb-1">{__(title)}</p>
                        {items.map((item, idx) =>
                            isGroupEntry(item) ? (
                                <div key={idx} className="mt-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-sidebar-foreground/50 px-2 pt-1">
                                        {__(item.title)}
                                    </p>
                                    {item.children.map((child, cIdx) => (
                                        <Link
                                            key={cIdx}
                                            href={child.href}
                                            className={cn(
                                                'text-xs py-1 px-2 rounded hover:bg-sidebar-accent block',
                                                url.startsWith(child.href) ? 'text-primary font-semibold' : 'text-sidebar-foreground/80'
                                            )}
                                        >
                                            {__(child.title)}
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <Link
                                    key={idx}
                                    href={item.href}
                                    className={cn(
                                        'text-xs py-1 px-2 rounded hover:bg-sidebar-accent block',
                                        url.startsWith(item.href) ? 'text-primary font-semibold' : 'text-sidebar-foreground/80'
                                    )}
                                >
                                    {__(item.title)}
                                </Link>
                            )
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <div className="space-y-1">
            <button
                onClick={handleToggle}
                className={cn(
                    'group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isAnyActive && 'bg-sidebar-accent/30 text-sidebar-foreground/90 font-semibold'
                )}
            >
                <div className="flex items-center gap-3">
                    <Icon className="size-5 shrink-0" />
                    <span className="whitespace-nowrap">{__(title)}</span>
                </div>
                {isOpen ? (
                    <ChevronDown className="size-4 text-slate-500 group-hover:text-slate-300" />
                ) : (
                    <ChevronRight className="size-4 text-slate-500 group-hover:text-slate-300" />
                )}
            </button>

            {isOpen && (
                <div className="pl-9 space-y-1 transition-all duration-300">
                    {items.map((item, idx) => {
                        if (isGroupEntry(item)) {
                            return (
                                <NestedNavGroup
                                    key={idx}
                                    title={item.title}
                                    items={item.children}
                                />
                            );
                        }

                        const active = url === item.href || (url.startsWith(item.href) && item.href.length > 22 && !url.includes('/garita'));

                        return (
                            <Link
                                key={idx}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all block',
                                    active
                                        ? 'text-primary font-semibold'
                                        : 'text-sidebar-foreground/60 hover:text-sidebar-accent-foreground'
                                )}
                            >
                                {__(item.title)}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function AdminSaasLayout({
    children,
    breadcrumbs = [],
}: AdminSaasLayoutProps) {
    const page = usePage();
    const { auth, name, notifications, unreadNotificationsCount } = page.props;
    const getInitials = useInitials();
    const {
        settings,
        appearance,
        resolvedAppearance,
        updateAppearance,
        updateSetting
    } = useTemplateSettings();
    const collapsed = settings.collapsed;
    const setCollapsed = (val: boolean) => updateSetting('collapsed', val);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const { __ } = useTranslate();

    const userPermissions = (auth as any)?.user?.permissions || [];
    const hasPermission = (permission: string) => {
        return userPermissions.includes(permission);
    };

    // Visibilidad del menú controlada por el superadmin (global, solo visual).
    // Ausencia de clave = visible. Ocultar aquí no afecta permisos ni rutas.
    const isSuperAdmin = (auth as any)?.user?.is_super_admin === true;
    const menuVisibility = ((page.props as any)?.menuVisibility || {}) as Record<string, boolean>;
    const isMenuVisible = (key: string) => menuVisibility[key] !== false;

    const markAsRead = (id: string) => {
        router.post(
            `/notifications/${id}/read`,
            {},
            { preserveScroll: true, preserveState: true, only: ['notifications', 'unreadNotificationsCount'] },
        );
    };

    const markAllAsRead = () => {
        router.post(
            '/notifications/read-all',
            {},
            { preserveScroll: true, preserveState: true, only: ['notifications', 'unreadNotificationsCount'] },
        );
    };

    const unreadCount = unreadNotificationsCount;

    // Avisos del sistema operativo + sonido para las notificaciones.
    const desktopNotif = useDesktopNotifications();

    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex min-h-svh bg-background">
                {/* Mobile sidebar backdrop overlay */}
                {mobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={cn(
                        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
                        collapsed ? 'lg:w-[72px]' : 'lg:w-64',
                        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                        'w-64 lg:flex',
                    )}
                >
                    {/* Desktop Collapse Toggle Button (Floating Embedded) */}
                    <div
                        className="hidden lg:flex absolute top-[10px] -right-[22px] z-50 h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="h-7 w-7 items-center justify-center rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow focus:outline-none cursor-pointer flex border border-primary/20"
                            title={collapsed ? __('Expand sidebar') : __('Collapse sidebar')}
                        >
                            {collapsed ? (
                                <ChevronRight className="size-4" />
                            ) : (
                                <ChevronLeft className="size-4" />
                            )}
                        </button>
                    </div>

                    {/* Logo area */}
                    <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
                        <Link
                            href={home()}
                            className="flex items-center gap-3 overflow-hidden"
                        >
                            <div className="flex shrink-0 items-center justify-center bg-transparent">
                                <img
                                    src={(auth as any)?.user?.empresa?.logo_mini || (auth as any)?.user?.empresa?.logo || "/image/logo/hosho/icon-dark.png"}
                                    alt={(auth as any)?.user?.empresa?.razon_social || "Hoshō"}
                                    className="h-9 w-auto object-contain"
                                />
                            </div>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden text-slate-400 hover:bg-white/5 hover:text-slate-100"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <X className="size-5" />
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="px-3 py-4">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sidebar-foreground/50" />
                            <Input
                                type="search"
                                placeholder={collapsed ? '' : 'Buscar...'}
                                className={cn(
                                    'h-9 border-sidebar-border bg-sidebar-accent/30 pl-9 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus-visible:ring-primary',
                                    collapsed && 'w-full pl-9',
                                )}
                            />
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-1 px-3 py-2">
                        <p
                            className={cn(
                                'px-3 pb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase transition-opacity duration-300',
                                collapsed && 'opacity-0',
                            )}
                        >
                            {__('Platform')}
                        </p>
                        {mainNavItems
                            .filter(item => {
                                if (item.title === 'Dashboard') {
                                    return hasPermission('dashboard.view');
                                }
                                return true;
                            })
                            .map((item) => (
                                <NavItem
                                    key={item.title}
                                    item={item}
                                    collapsed={collapsed}
                                />
                            ))
                        }

                        {/* Organization Group */}
                        {isMenuVisible('organization') && (() => {
                            const orgItems = [
                                {
                                    title: 'Branches',
                                    href: sucursalesIndex.url(),
                                    permission: 'sucursales.view',
                                    key: 'organization.branches',
                                },
                                {
                                    title: 'Departments',
                                    href: departamentosIndex.url(),
                                    permission: 'departamentos.view',
                                    key: 'organization.departments',
                                },
                                {
                                    title: 'Positions',
                                    href: cargosIndex.url(),
                                    permission: 'cargos.view',
                                    key: 'organization.positions',
                                },
                                {
                                    title: 'Responsibles',
                                    href: responsablesIndex.url(),
                                    permission: 'responsables.view',
                                    key: 'organization.responsibles',
                                },
                                {
                                    title: 'Employees',
                                    href: '/admin/empleados',
                                    permission: 'empleados.view',
                                    key: 'organization.employees',
                                },
                                {
                                    title: 'Suppliers',
                                    href: '/admin/proveedores',
                                    permission: 'proveedores.view',
                                    key: 'organization.suppliers',
                                },
                                {
                                    title: 'Commercial Partners',
                                    href: '/admin/productores',
                                    permission: 'productores.view',
                                    key: 'organization.partners',
                                },
                            ].filter(item => hasPermission(item.permission) && isMenuVisible(item.key));

                            if (orgItems.length === 0) return null;

                            return (
                                <div className="pt-4">
                                    <CollapsibleNavItem
                                        title="Organization"
                                        icon={Briefcase}
                                        collapsed={collapsed}
                                        items={orgItems}
                                    />
                                </div>
                            );
                        })()}

                        {/* Visits Group */}
                        {isMenuVisible('visits') && (() => {
                            const visitsItems = [
                                {
                                    title: 'Temporary Visits',
                                    href: '/admin/visitas-temporales',
                                    permission: 'visitas_temporales.view',
                                    key: 'visits.temporary',
                                },
                                {
                                    title: 'Facility Accesses',
                                    href: '/admin/visitas-accesos',
                                    permission: 'visitas_temporales.view',
                                    key: 'visits.accesses',
                                },
                                {
                                    title: 'Gate Control (QR Reader)',
                                    href: '/admin/visitas-accesos/garita',
                                    permission: 'visitas_temporales.view',
                                    key: 'visits.gate',
                                },
                            ].filter(item => hasPermission(item.permission) && isMenuVisible(item.key));

                            if (visitsItems.length === 0) return null;

                            return (
                                <div className="pt-2">
                                    <CollapsibleNavItem
                                        title="Visits"
                                        icon={Calendar}
                                        collapsed={collapsed}
                                        items={visitsItems}
                                    />
                                </div>
                            );
                        })()}

                        {/* Access Control Group */}
                        {isMenuVisible('access_control') && (() => {
                            const controlAccesoItems = [
                                {
                                    title: 'IVMS Employees',
                                    href: '/admin/control-acceso/empleados',
                                    permission: 'control_acceso.view',
                                    key: 'access_control.ivms_employees',
                                },
                                {
                                    title: 'Access Cards',
                                    href: '/admin/control-acceso/tarjetas',
                                    permission: 'control_acceso.view',
                                    key: 'access_control.cards',
                                },
                                {
                                    title: 'Pedestrian Access Events',
                                    href: '/admin/control-acceso/eventos-peatonales',
                                    permission: 'control_acceso.view',
                                    key: 'access_control.pedestrian_events',
                                },
                                {
                                    title: 'Vehicles',
                                    href: '/admin/control-acceso/vehiculos',
                                    permission: 'control_acceso.view',
                                    key: 'access_control.vehicles',
                                },
                                {
                                    title: 'Vehicle Access Events',
                                    href: '/admin/control-acceso/eventos-vehiculares',
                                    permission: 'control_acceso.view',
                                    key: 'access_control.vehicle_events',
                                },
                            ].filter(item => hasPermission(item.permission) && isMenuVisible(item.key));

                            if (controlAccesoItems.length === 0) return null;

                            return (
                                <div className="pt-2">
                                    <CollapsibleNavItem
                                        title="Access Control"
                                        icon={Fingerprint}
                                        collapsed={collapsed}
                                        items={controlAccesoItems}
                                    />
                                </div>
                            );
                        })()}

                        {/* Asistencia & Reloj Checador Group */}
                        {isMenuVisible('reloj_checador') && (() => {
                            const asistenciaItems = [
                                {
                                    title: 'Kiosko Checador',
                                    href: '/admin/reloj-checador/kiosko',
                                    permission: 'asistencia.kiosko',
                                    key: 'reloj_checador.kiosko',
                                },
                                {
                                    title: 'Pre-Nómina y Horas Extra',
                                    href: '/admin/asistencia/calculo-nomina',
                                    permission: 'asistencia.nomina',
                                    key: 'reloj_checador.nomina',
                                },
                                {
                                    title: 'Bitácora de Marcajes',
                                    href: '/admin/asistencia/bitacora',
                                    permission: 'asistencia.bitacora',
                                    key: 'reloj_checador.bitacora',
                                },
                                {
                                    title: 'Configuración y Turnos',
                                    href: '/admin/asistencia/configuracion',
                                    permission: 'asistencia.configuracion',
                                    key: 'reloj_checador.configuracion',
                                },
                            ].filter(item => (hasPermission(item.permission) || hasPermission('asistencia.view')) && isMenuVisible(item.key));

                            // BioTime PRO (espejo de solo lectura de ZKTeco BioTime): sub-menú
                            // desplegable propio dentro de Reloj Checador, para no mezclarlo con
                            // los demás asuntos de asistencia.
                            const biotimeItems = [
                                { title: 'Relojes BioTime', href: '/admin/biotime/dispositivos', permission: 'biotime.view' },
                                { title: 'Empleados BioTime', href: '/admin/biotime/empleados', permission: 'biotime.view' },
                                { title: 'Marcajes BioTime', href: '/admin/biotime/marcajes', permission: 'biotime.view' },
                            ].filter(item => hasPermission(item.permission));

                            const relojChecadorItems = [
                                ...asistenciaItems,
                                ...(biotimeItems.length > 0 && isMenuVisible('reloj_checador.biotime')
                                    ? [{ title: 'BioTime PRO', children: biotimeItems }]
                                    : []),
                            ];

                            if (relojChecadorItems.length === 0) return null;

                            return (
                                <div className="pt-2">
                                    <CollapsibleNavItem
                                        title="Reloj Checador"
                                        icon={Activity}
                                        collapsed={collapsed}
                                        items={relojChecadorItems}
                                    />
                                </div>
                            );
                        })()}

                        {/* Settings Group */}
                        {isMenuVisible('settings') && (() => {
                            const settingsItems = [
                                {
                                    title: 'Companies',
                                    href: empresasIndex.url(),
                                    permission: 'empresas.view',
                                    key: 'settings.companies',
                                },
                                {
                                    title: 'Countries',
                                    href: paisesIndex.url(),
                                    permission: 'paises.view',
                                    key: 'settings.countries',
                                },

                                {
                                    title: 'Appearance',
                                    href: appearanceEdit().url,
                                    permission: 'empresas.view',
                                    key: 'settings.appearance',
                                },
                            ].filter(item => hasPermission(item.permission) && isMenuVisible(item.key));

                            // Solo superadmin: panel para ocultar/mostrar módulos del menú.
                            // No es ocultable, se añade después del filtro de visibilidad.
                            const settingsWithSuper = isSuperAdmin
                                ? [...settingsItems, { title: 'Menu Visibility', href: '/admin/configuracion/menu-visibilidad' }]
                                : settingsItems;

                            if (settingsWithSuper.length === 0) return null;

                            return (
                                <div className="pt-2">
                                    <CollapsibleNavItem
                                        title="Settings"
                                        icon={Settings}
                                        collapsed={collapsed}
                                        items={settingsWithSuper}
                                    />
                                </div>
                            );
                        })()}

                        {/* Integrations Group */}
                        {isMenuVisible('integrations') && (() => {
                            const integrationsItems = [
                                {
                                    title: 'Catalog',
                                    href: integrationsIndex.url(),
                                    permission: 'integrations.view',
                                    key: 'integrations.catalog',
                                },
                                {
                                    title: 'Validations',
                                    href: '/admin/integrations/validaciones',
                                    permission: 'jaak.view',
                                    key: 'integrations.validations',
                                },
                                {
                                    title: 'Reloj Checador',
                                    href: '/admin/integrations/reloj-checador',
                                    permission: 'integrations.view',
                                    key: 'integrations.reloj_checador',
                                },
                                {
                                    title: 'Control de Acceso',
                                    href: '/admin/integrations/control-acceso',
                                    permission: 'integrations.view',
                                    key: 'integrations.control_acceso',
                                },
                            ].filter(item => hasPermission(item.permission) && isMenuVisible(item.key));

                            if (integrationsItems.length === 0) return null;

                            return (
                                <div className="pt-2">
                                    <CollapsibleNavItem
                                        title="Integrations"
                                        icon={Link2}
                                        collapsed={collapsed}
                                        items={integrationsItems}
                                    />
                                </div>
                            );
                        })()}

                        {/* Security Group */}
                        {isMenuVisible('security') && (() => {
                            const securityItems = [
                                {
                                    title: 'Users',
                                    href: usuariosIndex.url(),
                                    permission: 'users.view',
                                    key: 'security.users',
                                },
                                {
                                    title: 'Roles',
                                    href: rolesIndex.url(),
                                    permission: 'roles.view',
                                    key: 'security.roles',
                                },
                            ].filter(item => hasPermission(item.permission) && isMenuVisible(item.key));

                            if (securityItems.length === 0) return null;

                            return (
                                <div className="pt-2">
                                    <CollapsibleNavItem
                                        title="Security"
                                        icon={Shield}
                                        collapsed={collapsed}
                                        items={securityItems}
                                    />
                                </div>
                            );
                        })()}

                        {/* Monitoring Group */}
                        {isMenuVisible('monitoring') && (() => {
                            const monitoringItems = [
                                {
                                    title: 'Database',
                                    href: dbMonitoringIndex.url(),
                                    permission: 'monitoreo.database',
                                    key: 'monitoring.database',
                                },
                                {
                                    title: 'Server',
                                    href: serverMonitoringIndex.url(),
                                    permission: 'monitoreo.server',
                                    key: 'monitoring.server',
                                },
                                {
                                    title: 'User Sessions',
                                    href: sessionMonitoringIndex.url(),
                                    permission: 'monitoreo.logins',
                                    key: 'monitoring.sessions',
                                },
                                {
                                    title: 'System Activity',
                                    href: '/admin/monitoring/activity',
                                    permission: 'monitoreo.activities',
                                    key: 'monitoring.activity',
                                },
                                {
                                    title: 'System Logs',
                                    href: logMonitoringIndex.url(),
                                    permission: 'monitoreo.view',
                                    key: 'monitoring.logs',
                                },
                                {
                                    title: 'Queue Monitor',
                                    href: queuesMonitoringIndex.url(),
                                    permission: 'monitoreo.view',
                                    key: 'monitoring.queues',
                                },
                                {
                                    title: 'Scheduled Tasks',
                                    href: tasksMonitoringIndex.url(),
                                    permission: 'monitoreo.view',
                                    key: 'monitoring.tasks',
                                },
                            ].filter(item => (hasPermission(item.permission) || hasPermission('monitoreo.view')) && isMenuVisible(item.key));

                            if (monitoringItems.length === 0) return null;

                            return (
                                <div className="pt-2">
                                    <CollapsibleNavItem
                                        title="Monitoring"
                                        icon={Activity}
                                        collapsed={collapsed}
                                        items={monitoringItems}
                                    />
                                </div>
                            );
                        })()}
                    </nav>

                    {/* Bottom section */}
                    <div className="border-t border-sidebar-border p-3">
                        <div
                            className={cn(
                                'mb-3 flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3 transition-all',
                                collapsed && 'justify-center px-2',
                            )}
                        >
                            <Avatar className="size-9 shrink-0 border border-sidebar-border">
                                <AvatarImage
                                    src={auth.user?.avatar}
                                    alt={auth.user?.name}
                                />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                                    {getInitials(auth.user?.name ?? '')}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className={cn(
                                    'min-w-0 flex-1 overflow-hidden transition-opacity duration-300',
                                    collapsed && 'opacity-0',
                                )}
                            >
                                <p className="truncate text-sm font-medium text-sidebar-foreground">
                                    {auth.user?.name}
                                </p>
                                <p className="truncate text-xs text-sidebar-foreground/50">
                                    {auth.user?.email}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                    >
                                        <Settings className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    side="right"
                                    align="end"
                                    className="w-48"
                                >
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={profileEdit()}
                                            className="cursor-pointer"
                                        >
                                            <User className="mr-2 size-4" />
                                            {__('Profile')}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={securityEdit()}
                                            className="cursor-pointer"
                                        >
                                            <Shield className="mr-2 size-4" />
                                            {__('Security')}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={logout()}
                                            method="post"
                                            as="button"
                                            className="w-full cursor-pointer text-destructive focus:text-destructive"
                                        >
                                            <LogOut className="mr-2 size-4" />
                                            {__('Log out')}
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </aside>

                {/* Main content area */}
                <div
                    className={cn(
                        'flex flex-1 flex-col transition-all duration-300 min-w-0',
                        collapsed ? 'lg:pl-[72px]' : 'lg:pl-64',
                        'pl-0',
                    )}
                >
                    {/* Top bar */}
                    <header
                        className={cn(
                            'h-16 items-center justify-between border-b px-6 transition-all flex',
                            settings.navbarType === 'sticky' && 'sticky top-0 z-30 bg-background/80 backdrop-blur-xl',
                            settings.navbarType === 'static' && 'relative bg-background',
                            settings.navbarType === 'hidden' && 'hidden'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden text-muted-foreground hover:bg-accent -ml-2"
                                onClick={() => setMobileMenuOpen(true)}
                            >
                                <Menu className="size-5" />
                            </Button>

                            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Link
                                    href={home()}
                                    className="flex items-center gap-1 transition-colors hover:text-foreground shrink-0"
                                >
                                    <Home className="size-3.5" />
                                    <span className="hidden sm:inline">{__('Home')}</span>
                                </Link>
                                {breadcrumbs.map((crumb, index) => (
                                    <React.Fragment
                                        key={`${toUrl(crumb.href)}-${index}`}
                                    >
                                        <span className="text-border shrink-0">/</span>
                                        {index === breadcrumbs.length - 1 ? (
                                            <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
                                                {__(crumb.title)}
                                            </span>
                                        ) : (
                                            <Link
                                                href={crumb.href}
                                                className="hover:text-foreground shrink-0 truncate max-w-[120px] sm:max-w-none"
                                            >
                                                {__(crumb.title)}
                                            </Link>
                                        )}
                                    </React.Fragment>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Language toggle */}
                            <LanguageToggle />

                            {/* Theme toggle */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        {resolvedAppearance === 'dark' ? (
                                            <Moon className="size-5" />
                                        ) : resolvedAppearance === 'light' ? (
                                            <Sun className="size-5" />
                                        ) : (
                                            <Monitor className="size-5" />
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                >
                                    <DropdownMenuItem
                                        onClick={() =>
                                            updateAppearance('light')
                                        }
                                        className="cursor-pointer"
                                    >
                                        <Sun className="mr-2 size-4" />
                                        Claro
                                        {appearance === 'light' && (
                                            <Check className="ml-auto size-4" />
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => updateAppearance('dark')}
                                        className="cursor-pointer"
                                    >
                                        <Moon className="mr-2 size-4" />
                                        Oscuro
                                        {appearance === 'dark' && (
                                            <Check className="ml-auto size-4" />
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            updateAppearance('system')
                                        }
                                        className="cursor-pointer"
                                    >
                                        <Monitor className="mr-2 size-4" />
                                        Sistema
                                        {appearance === 'system' && (
                                            <Check className="ml-auto size-4" />
                                        )}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Notifications */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="relative"
                                    >
                                        <Bell className="size-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white ring-2 ring-background">
                                                {unreadCount > 9
                                                    ? '9+'
                                                    : unreadCount}
                                            </span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-80"
                                >
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <p className="text-sm font-semibold">
                                            {__('Notifications')}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto px-2 py-1 text-xs"
                                            onClick={markAllAsRead}
                                            disabled={unreadCount === 0}
                                        >
                                            {__('Mark all as read')}
                                        </Button>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                                {__('No notifications')}
                                            </div>
                                        ) : (
                                            notifications.map(
                                                (notification) => (
                                                    <DropdownMenuItem
                                                        key={notification.id}
                                                        className="cursor-pointer px-3 py-3"
                                                        onClick={() =>
                                                            markAsRead(
                                                                notification.id,
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div
                                                                className={cn(
                                                                    'mt-0.5 size-2 rounded-full',
                                                                    notification.read
                                                                        ? 'bg-muted'
                                                                        : 'bg-primary',
                                                                )}
                                                            />
                                                            <div className="flex-1 space-y-1">
                                                                <p className="text-sm font-medium">
                                                                    {notification.title}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {notification.time}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ),
                                            )
                                        )}
                                    </div>

                                    {desktopNotif.supported && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <div className="px-3 py-2.5">
                                                {desktopNotif.permission === 'denied' ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        {__('Desktop notifications are blocked in your browser settings.')}
                                                    </p>
                                                ) : !desktopNotif.enabled ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full justify-start gap-2 text-xs"
                                                        onClick={() => {
                                                            void desktopNotif.enable();
                                                        }}
                                                    >
                                                        <BellRing className="size-4" />
                                                        {__('Enable desktop notifications')}
                                                    </Button>
                                                ) : (
                                                    <div className="space-y-2.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="flex items-center gap-2 text-xs font-medium">
                                                                <BellRing className="size-4" />
                                                                {__('Desktop notifications')}
                                                            </span>
                                                            <Switch
                                                                checked={desktopNotif.enabled}
                                                                onCheckedChange={(value) =>
                                                                    value
                                                                        ? void desktopNotif.enable()
                                                                        : desktopNotif.disable()
                                                                }
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="flex items-center gap-2 text-xs font-medium">
                                                                {desktopNotif.soundEnabled ? (
                                                                    <Volume2 className="size-4" />
                                                                ) : (
                                                                    <VolumeX className="size-4" />
                                                                )}
                                                                {__('Sound')}
                                                            </span>
                                                            <Switch
                                                                checked={desktopNotif.soundEnabled}
                                                                onCheckedChange={desktopNotif.setSoundEnabled}
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-auto w-full px-2 py-1 text-xs text-muted-foreground"
                                                            onClick={desktopNotif.sendTest}
                                                        >
                                                            {__('Send test notification')}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                        </div>
                    </header>

                    {/* Page content */}
                    <main
                        className={cn(
                            'flex-1 p-6 lg:p-8',
                            settings.contentWidth === 'compact' ? 'mx-auto max-w-[1200px] w-full' : 'w-full'
                        )}
                    >
                        {children}
                    </main>
                </div>
                <TemplateCustomizer />
            </div>
        </TooltipProvider>
    );
}