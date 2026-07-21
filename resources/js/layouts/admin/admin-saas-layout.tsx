import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
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
    X,
    Activity,
    Link2,
} from 'lucide-react';
import { Building2, GitBranch, Briefcase, Calendar, Smartphone } from 'lucide-react';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppearance } from '@/hooks/use-appearance';
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

function CollapsibleNavItem({
    title,
    icon: Icon,
    items,
    collapsed,
}: {
    title: string;
    icon: React.ComponentType<any>;
    items: { title: string; href: string }[];
    collapsed: boolean;
}) {
    const { url } = usePage();
    const { __ } = useTranslate();

    // Determine if any of the sub-items are active
    const isAnyActive = items.some((item) => url.startsWith(item.href));

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
                        {items.map((item, idx) => (
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
                        ))}
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
                        const active = url.startsWith(item.href);

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
    const { auth, name } = page.props;
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

    const [notifications, setNotifications] = React.useState([
        {
            id: '1',
            title: 'Welcome to the system',
            message: 'Your account has been created successfully.',
            time: 'A few minutes ago',
            read: false,
        },
        {
            id: '2',
            title: 'Update completed',
            message: 'The system has been updated successfully.',
            time: '2 hours ago',
            read: false,
        },
    ]);

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

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
                                    src={(auth as any)?.user?.empresa?.logo_mini || (auth as any)?.user?.empresa?.logo || "/image/logo/larareact_icon.png"}
                                    alt={(auth as any)?.user?.empresa?.razon_social || "LaraReact Icon"}
                                    className="h-9 w-auto object-contain"
                                />
                            </div>
                            <span
                                className={cn(
                                    'text-base font-semibold whitespace-nowrap text-white transition-opacity duration-300',
                                    collapsed && 'opacity-0',
                                )}
                            >
                                {(auth as any)?.user?.empresa?.razon_social || name}
                            </span>
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


                        {/* Equipos Group */}
                        {(() => {
                            const equiposItems = [
                                {
                                    title: 'Categorías',
                                    href: '/admin/categorias',
                                    permission: 'categorias.view',
                                },
                                {
                                    title: 'Marcas',
                                    href: '/admin/marcas',
                                    permission: 'marcas.view',
                                },
                                {
                                    title: 'Familias',
                                    href: '/admin/familias',
                                    permission: 'familias.view',
                                },
                                {
                                    title: 'Modelos',
                                    href: '/admin/modelos',
                                    permission: 'modelos.view',
                                },
                            ].filter(item => hasPermission(item.permission));

                            if (equiposItems.length === 0) return null;

                            return (
                                <div className="pt-2">
                                    <CollapsibleNavItem
                                        title="Equipos"
                                        icon={Smartphone}
                                        collapsed={collapsed}
                                        items={equiposItems}
                                    />
                                </div>
                            );
                        })()}
                        {(() => {
                            const settingsItems = [
                                {
                                    title: 'Companies',
                                    href: empresasIndex.url(),
                                    permission: 'empresas.view',
                                },
                                {
                                    title: 'Branches',
                                    href: sucursalesIndex.url(),
                                    permission: 'sucursales.view',
                                },
                                {
                                    title: 'Countries',
                                    href: paisesIndex.url(),
                                    permission: 'paises.view',
                                },

                                {
                                    title: 'Appearance',
                                    href: appearanceEdit().url,
                                    permission: 'empresas.view',
                                },
                            ].filter(item => hasPermission(item.permission));

                            if (settingsItems.length === 0) return null;

                            return (
                                <div className="pt-2">
                                    <CollapsibleNavItem
                                        title="Settings"
                                        icon={Settings}
                                        collapsed={collapsed}
                                        items={settingsItems}
                                    />
                                </div>
                            );
                        })()}

                        {/* Integrations Group */}
                        {(() => {
                            const integrationsItems = [
                                {
                                    title: 'Catalog',
                                    href: integrationsIndex.url(),
                                    permission: 'integrations.view',
                                },
                            ].filter(item => hasPermission(item.permission));

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
                        {(() => {
                            const securityItems = [
                                {
                                    title: 'Users',
                                    href: usuariosIndex.url(),
                                    permission: 'users.view',
                                },
                                {
                                    title: 'Roles',
                                    href: rolesIndex.url(),
                                    permission: 'roles.view',
                                },
                            ].filter(item => hasPermission(item.permission));

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
                        {(() => {
                            const monitoringItems = [
                                {
                                    title: 'Database',
                                    href: dbMonitoringIndex.url(),
                                    permission: 'monitoreo.database',
                                },
                                {
                                    title: 'Server',
                                    href: serverMonitoringIndex.url(),
                                    permission: 'monitoreo.server',
                                },
                                {
                                    title: 'User Sessions',
                                    href: sessionMonitoringIndex.url(),
                                    permission: 'monitoreo.logins',
                                },
                                {
                                    title: 'System Logs',
                                    href: logMonitoringIndex.url(),
                                    permission: 'monitoreo.view',
                                },
                                {
                                    title: 'Queue Monitor',
                                    href: queuesMonitoringIndex.url(),
                                    permission: 'monitoreo.view',
                                },
                                {
                                    title: 'Scheduled Tasks',
                                    href: tasksMonitoringIndex.url(),
                                    permission: 'monitoreo.view',
                                },
                            ].filter(item => hasPermission(item.permission));

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
                                                                    {__(
                                                                        notification.title,
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {__(
                                                                        notification.message,
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {__(
                                                                        notification.time,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ),
                                            )
                                        )}
                                    </div>
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
