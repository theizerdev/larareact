import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    ChevronDown,
    Command,
    Home,
    LayoutDashboard,
    LogOut,
    Menu,
    Moon,
    Search,
    Settings,
    Sun,
    User,
} from 'lucide-react';
import * as React from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import LanguageToggle from '@/components/language-toggle';
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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useAppearance } from '@/hooks/use-appearance';
import { useInitials } from '@/hooks/use-initials';
import { useTranslate } from '@/hooks/use-translate';
import { cn, toUrl } from '@/lib/utils';
import { dashboard, home, logout } from '@/routes';
import { edit as appearanceEdit } from '@/routes/appearance';
import { edit as profileEdit } from '@/routes/profile';
import type { BreadcrumbItem, NavItem } from '@/types';

type AdminHeaderLayoutProps = {
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

function NavLink({
    item,
    mobile = false,
}: {
    item: NavItem;
    mobile?: boolean;
}) {
    const { url } = usePage();
    const active = url.startsWith(item.href as string);
    const { __ } = useTranslate();

    return (
        <Link
            href={item.href}
            className={cn(
                'group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                mobile
                    ? 'text-foreground hover:bg-accent'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                active &&
                    (mobile
                        ? 'bg-accent text-foreground'
                        : 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground'),
            )}
        >
            {item.icon && <item.icon className="size-4" />}
            {__(item.title)}
        </Link>
    );
}

export default function AdminHeaderLayout({
    children,
    breadcrumbs = [],
}: AdminHeaderLayoutProps) {
    const page = usePage();
    const { auth, name } = page.props;
    const getInitials = useInitials();
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const { __ } = useTranslate();

    return (
        <div className="flex min-h-svh flex-col bg-background">
            {/* Top navigation bar */}
            <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo + desktop nav */}
                    <div className="flex items-center gap-8">
                        <Link
                            href={home()}
                            className="flex items-center gap-2.5"
                        >
                            <div className="flex items-center justify-center bg-transparent">
                                <img
                                    src="/image/logo/larareact_icon.png"
                                    alt="LaraReact Icon"
                                    className="h-8 w-auto object-contain"
                                />
                            </div>
                            <span className="hidden text-lg font-semibold tracking-tight sm:inline">
                                {name}
                            </span>
                        </Link>

                        <nav className="hidden items-center gap-1 md:flex">
                            {mainNavItems.map((item) => (
                                <NavLink key={item.title} item={item} />
                            ))}
                        </nav>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="relative hidden sm:block">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar..."
                                className="h-9 w-64 rounded-full border-none bg-muted pr-4 pl-9 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <div className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 items-center gap-1 text-xs text-muted-foreground lg:flex">
                                <Command className="size-3" />
                                <span>K</span>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative rounded-full"
                        >
                            <Bell className="size-5" />
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                        </Button>

                        <LanguageToggle />

                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
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
                                    className="gap-2 rounded-full pr-3 pl-1.5"
                                >
                                    <Avatar className="size-8 border">
                                        <AvatarImage
                                            src={auth.user?.avatar}
                                            alt={auth.user?.name}
                                        />
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-medium text-white">
                                            {getInitials(auth.user?.name ?? '')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden max-w-[100px] truncate text-sm font-medium lg:inline">
                                        {auth.user?.name}
                                    </span>
                                    <ChevronDown className="hidden size-3.5 text-muted-foreground lg:inline" />
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
                                        {__('Profile')}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={appearanceEdit()}
                                        className="cursor-pointer"
                                    >
                                        <Settings className="mr-2 size-4" />
                                        {__('Appearance')}
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

                        {/* Mobile menu */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full md:hidden"
                                >
                                    <Menu className="size-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-72 p-0">
                                <SheetHeader className="border-b p-5">
                                    <SheetTitle className="flex items-center gap-2 text-left">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                                            <AppLogoIcon className="size-5 fill-current" />
                                        </div>
                                        {name}
                                    </SheetTitle>
                                </SheetHeader>
                                <nav className="space-y-1 p-4">
                                    {mainNavItems.map((item) => (
                                        <NavLink
                                            key={item.title}
                                            item={item}
                                            mobile
                                        />
                                    ))}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            {/* Subheader with breadcrumbs */}
            <div className="border-b bg-muted/30">
                <div className="mx-auto flex h-12 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link
                            href={home()}
                            className="flex items-center gap-1 transition-colors hover:text-foreground"
                        >
                            <Home className="size-3.5" />
                            <span className="hidden sm:inline">
                                {__('Home')}
                            </span>
                        </Link>
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={toUrl(crumb.href)}>
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
                </div>
            </div>

            {/* Main content */}
            <main className="flex-1">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
