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
} from 'lucide-react';
import * as React from 'react';
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
import { cn, toUrl } from '@/lib/utils';
import { dashboard, home, logout } from '@/routes';
import { edit as appearanceEdit } from '@/routes/appearance';
import { edit as profileEdit } from '@/routes/profile';
import { edit as securityEdit } from '@/routes/security';
import { index as paisesIndex } from '@/routes/admin/paises';
import type { BreadcrumbItem, NavItem } from '@/types';
import { useTranslate } from '@/hooks/use-translate';
import LanguageToggle from '@/components/language-toggle';

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
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
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
                            'group flex w-full items-center justify-center rounded-lg p-2.5 text-sm font-medium transition-all text-slate-400 hover:bg-white/5 hover:text-slate-100',
                            isAnyActive && 'bg-indigo-500/10 text-indigo-400'
                        )}
                    >
                        <Icon className="size-5 shrink-0" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <div className="flex flex-col gap-1 p-1">
                        <p className="font-semibold text-white border-b border-white/10 pb-1 mb-1">{__(title)}</p>
                        {items.map((item, idx) => (
                            <Link
                                key={idx}
                                href={item.href}
                                className={cn(
                                    'text-xs py-1 px-2 rounded hover:bg-white/10 block',
                                    url.startsWith(item.href) ? 'text-indigo-400 font-semibold' : 'text-slate-400'
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
                    'group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-slate-400 hover:bg-white/5 hover:text-slate-100',
                    isAnyActive && 'text-slate-200'
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
                                        ? 'text-indigo-400'
                                        : 'text-slate-500 hover:text-slate-300'
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
    const { appearance, resolvedAppearance, updateAppearance } =
        useAppearance();
    const [collapsed, setCollapsed] = React.useState(false);
    const { __ } = useTranslate();

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
                {/* Dark sidebar */}
                <aside
                    className={cn(
                        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-slate-950 text-slate-300 transition-all duration-300',
                        collapsed ? 'w-[72px]' : 'w-64',
                    )}
                >
                    {/* Logo area */}
                    <div className="flex h-16 items-center border-b border-white/10 px-4">
                        <Link
                            href={home()}
                            className="flex items-center gap-3 overflow-hidden"
                        >
                            <div className="flex shrink-0 items-center justify-center bg-transparent">
                                <img
                                    src="/image/logo/larareact_icon.png"
                                    alt="LaraReact Icon"
                                    className="h-9 w-auto object-contain"
                                />
                            </div>
                            <span
                                className={cn(
                                    'text-base font-semibold whitespace-nowrap text-white transition-opacity duration-300',
                                    collapsed && 'opacity-0',
                                )}
                            >
                                {name}
                            </span>
                        </Link>
                    </div>

                    {/* Search */}
                    <div className="px-3 py-4">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
                            <Input
                                type="search"
                                placeholder={collapsed ? '' : 'Buscar...'}
                                className={cn(
                                    'h-9 border-slate-800 bg-slate-900/50 pl-9 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500',
                                    collapsed && 'w-full pl-9',
                                )}
                            />
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 px-3 py-2">
                        <p
                            className={cn(
                                'px-3 pb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase transition-opacity duration-300',
                                collapsed && 'opacity-0',
                            )}
                        >
                            {__('Platform')}
                        </p>
                        {mainNavItems.map((item) => (
                            <NavItem
                                key={item.title}
                                item={item}
                                collapsed={collapsed}
                            />
                        ))}

                        <div className="pt-4">
                            <CollapsibleNavItem
                                title="Settings"
                                icon={Settings}
                                collapsed={collapsed}
                                items={[

                                    {
                                        title: 'Countries',
                                        href: paisesIndex.url(),
                                    },
                                ]}
                            />
                        </div>
                    </nav>

                    {/* Bottom section */}
                    <div className="border-t border-white/10 p-3">
                        <div
                            className={cn(
                                'mb-3 flex items-center gap-3 rounded-lg bg-white/5 p-3 transition-all',
                                collapsed && 'justify-center px-2',
                            )}
                        >
                            <Avatar className="size-9 shrink-0 border border-white/10">
                                <AvatarImage
                                    src={auth.user?.avatar}
                                    alt={auth.user?.name}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-medium text-white">
                                    {getInitials(auth.user?.name ?? '')}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className={cn(
                                    'min-w-0 flex-1 overflow-hidden transition-opacity duration-300',
                                    collapsed && 'opacity-0',
                                )}
                            >
                                <p className="truncate text-sm font-medium text-white">
                                    {auth.user?.name}
                                </p>
                                <p className="truncate text-xs text-slate-500">
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
                                        className="text-slate-400 hover:bg-white/5 hover:text-slate-100"
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
                        'flex flex-1 flex-col transition-all duration-300',
                        collapsed ? 'pl-[72px]' : 'pl-64',
                    )}
                >
                    {/* Top bar */}
                    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-xl">
                        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Link
                                href={home()}
                                className="flex items-center gap-1 transition-colors hover:text-foreground"
                            >
                                <Home className="size-3.5" />
                                <span>{__('Home')}</span>
                            </Link>
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment
                                    key={`${toUrl(crumb.href)}-${index}`}
                                >
                                    <span className="text-border">/</span>
                                    {index === breadcrumbs.length - 1 ? (
                                        <span className="font-medium text-foreground">
                                            {__(crumb.title)}
                                        </span>
                                    ) : (
                                        <Link
                                            href={crumb.href}
                                            className="hover:text-foreground"
                                        >
                                            {__(crumb.title)}
                                        </Link>
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>

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

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCollapsed(!collapsed)}
                                className="hidden lg:flex"
                            >
                                {collapsed ? (
                                    <ChevronRight className="size-5" />
                                ) : (
                                    <ChevronLeft className="size-5" />
                                )}
                            </Button>
                        </div>
                    </header>

                    {/* Page content */}
                    <main className="flex-1 p-6 lg:p-8">{children}</main>
                </div>
            </div>
        </TooltipProvider>
    );
}
