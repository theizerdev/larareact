import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    ChevronDown,
    Home,
    LayoutGrid,
    LogOut,
    Menu,
    Moon,
    Settings,
    Sun,
    User,
} from 'lucide-react';
import * as React from 'react';
import AppLogo from '@/components/app-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useAppearance } from '@/hooks/use-appearance';
import { useInitials } from '@/hooks/use-initials';
import { cn, toUrl } from '@/lib/utils';
import { dashboard, home, logout } from '@/routes';
import { edit as appearanceEdit } from '@/routes/appearance';
import { edit as profileEdit } from '@/routes/profile';
import type { BreadcrumbItem, NavItem } from '@/types';

type AdminSidebarLayoutProps = {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

function NavItemLink({
    item,
    mobile = false,
}: {
    item: NavItem;
    mobile?: boolean;
}) {
    const { url } = usePage();
    const active = url.startsWith(item.href as string);

    return (
        <Link
            href={item.href}
            className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                mobile
                    ? 'text-foreground hover:bg-accent'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                active &&
                    (mobile
                        ? 'bg-accent text-foreground'
                        : 'bg-sidebar-primary text-sidebar-primary-foreground'),
            )}
        >
            {item.icon && <item.icon className="size-5" />}
            {item.title}
        </Link>
    );
}

export default function AdminSidebarLayout({
    children,
    breadcrumbs = [],
}: AdminSidebarLayoutProps) {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { resolvedAppearance, updateAppearance } = useAppearance();

    return (
        <div className="flex min-h-svh w-full bg-background">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar lg:flex">
                <div className="flex h-16 items-center border-b border-sidebar-border px-6">
                    <Link
                        href={home()}
                        className="flex items-center gap-2 font-semibold"
                    >
                        <AppLogo />
                    </Link>
                </div>

                <nav className="flex-1 space-y-1 px-4 py-6">
                    {mainNavItems.map((item) => (
                        <NavItemLink key={item.title} item={item} />
                    ))}
                </nav>

                <div className="border-t border-sidebar-border p-4">
                    <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
                        <Avatar className="size-9">
                            <AvatarImage
                                src={auth.user?.avatar}
                                alt={auth.user?.name}
                            />
                            <AvatarFallback className="bg-sidebar-primary text-xs text-sidebar-primary-foreground">
                                {getInitials(auth.user?.name ?? '')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium">
                                {auth.user?.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {auth.user?.email}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex w-full flex-col lg:pl-64">
                {/* Header */}
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
                    <div className="flex items-center gap-3">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="lg:hidden"
                                >
                                    <Menu className="size-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64 p-0">
                                <SheetHeader className="border-b p-4">
                                    <SheetTitle className="text-left">
                                        <AppLogo />
                                    </SheetTitle>
                                </SheetHeader>
                                <nav className="space-y-1 p-4">
                                    {mainNavItems.map((item) => (
                                        <NavItemLink
                                            key={item.title}
                                            item={item}
                                            mobile
                                        />
                                    ))}
                                </nav>
                            </SheetContent>
                        </Sheet>

                        <nav className="hidden text-sm text-muted-foreground md:flex md:items-center md:gap-2">
                            <Link
                                href={home()}
                                className="flex items-center gap-1 hover:text-foreground"
                            >
                                <Home className="size-3.5" />
                                Inicio
                            </Link>
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={toUrl(crumb.href)}>
                                    <span className="text-border">/</span>
                                    {index === breadcrumbs.length - 1 ? (
                                        <span className="font-medium text-foreground">
                                            {crumb.title}
                                        </span>
                                    ) : (
                                        <Link
                                            href={crumb.href}
                                            className="hover:text-foreground"
                                        >
                                            {crumb.title}
                                        </Link>
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative"
                        >
                            <Bell className="size-5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                updateAppearance(
                                    resolvedAppearance === 'dark'
                                        ? 'light'
                                        : 'dark',
                                )
                            }
                        >
                            {resolvedAppearance === 'dark' ? (
                                <Sun className="size-5" />
                            ) : (
                                <Moon className="size-5" />
                            )}
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="gap-2 pr-3 pl-2"
                                >
                                    <Avatar className="size-8">
                                        <AvatarImage
                                            src={auth.user?.avatar}
                                            alt={auth.user?.name}
                                        />
                                        <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                                            {getInitials(auth.user?.name ?? '')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
                                        {auth.user?.name}
                                    </span>
                                    <ChevronDown className="hidden size-4 text-muted-foreground sm:inline" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="px-2 py-1.5">
                                    <p className="text-sm font-medium">
                                        {auth.user?.name}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {auth.user?.email}
                                    </p>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={profileEdit()}
                                        className="cursor-pointer"
                                    >
                                        <User className="mr-2 size-4" />
                                        Perfil
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={appearanceEdit()}
                                        className="cursor-pointer"
                                    >
                                        <Settings className="mr-2 size-4" />
                                        Apariencia
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
                                        Cerrar sesión
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
