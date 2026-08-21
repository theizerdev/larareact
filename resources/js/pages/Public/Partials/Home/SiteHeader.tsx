import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import LanguageToggle from '@/components/language-toggle';
import { useTranslate } from '@/hooks/use-translate';
import { dashboard, login } from '@/routes';
import { hoshoButtonClass } from './button-styles';

export default function SiteHeader() {
    const { __ } = useTranslate();
    const { auth } = usePage().props as any;
    const [open, setOpen] = useState(false);

    const links = [
        { id: 'inicio', label: __('Home') },
        { id: 'aplicacion', label: __('Platform') },
        { id: 'clientes', label: __('Customers') },
        { id: 'aliados', label: __('Partners') },
        { id: 'contacto', label: __('Contact') },
    ];

    const goTo = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        setOpen(false);
        document
            .getElementById(id)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <header className="sticky top-0 z-50 border-b border-hosho-line bg-hosho-bg/[.86] backdrop-blur-lg">
            <div className="mx-auto flex h-[68px] max-w-[1240px] items-center gap-6 px-5 sm:px-8">
                <a
                    href="#inicio"
                    onClick={(e) => goTo(e, 'inicio')}
                    className="mr-auto flex shrink-0 items-center gap-2.5"
                >
                    <img
                        src="/image/logo/hosho/icon.png"
                        alt=""
                        className="h-[34px] w-auto shrink-0"
                    />
                    <span className="leading-none">
                        <span className="block font-hosho-display text-[1.28rem] leading-none font-bold tracking-tight text-hosho-ink">
                            Hoshō
                        </span>
                    </span>
                </a>

                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    className="inline-flex items-center gap-2 rounded-full border border-hosho-line bg-hosho-surface px-3.5 py-2 font-hosho-body text-[.8rem] font-medium text-hosho-ink md:hidden"
                >
                    {open ? (
                        <X className="size-[15px]" />
                    ) : (
                        <Menu className="size-[15px]" />
                    )}
                    {open ? __('Close') : __('Menu')}
                </button>

                <nav
                    className={
                        open
                            ? 'absolute top-[68px] right-0 left-0 flex flex-col gap-0 border-b border-hosho-line bg-hosho-surface px-5 pt-2 pb-3 sm:px-8 md:static md:flex md:flex-row md:gap-7 md:border-0 md:bg-transparent md:p-0'
                            : 'hidden md:flex md:flex-row md:gap-7'
                    }
                >
                    {links.map((l) => (
                        <a
                            key={l.id}
                            href={`#${l.id}`}
                            onClick={(e) => goTo(e, l.id)}
                            className="hosho-navlink border-b border-hosho-line py-3 font-hosho-body text-[.9rem] font-medium text-hosho-ink-soft hover:text-hosho-ink md:border-0 md:py-1"
                        >
                            {l.label}
                        </a>
                    ))}

                    <div className="flex items-center justify-between gap-3 pt-3 md:hidden">
                        <LanguageToggle />
                        <Link
                            href={auth?.user ? dashboard() : login()}
                            className={hoshoButtonClass('primary', 'sm')}
                        >
                            <span>
                                {auth?.user
                                    ? __('Go to Dashboard')
                                    : __('Log in')}
                            </span>
                            <ArrowRight />
                        </Link>
                    </div>
                </nav>

                <div className="hidden md:block">
                    <LanguageToggle />
                </div>

                <Link
                    href={auth?.user ? dashboard() : login()}
                    className={hoshoButtonClass(
                        'primary',
                        'sm',
                        'hidden md:inline-flex',
                    )}
                >
                    <span>
                        {auth?.user ? __('Go to Dashboard') : __('Log in')}
                    </span>
                    <ArrowRight />
                </Link>
            </div>
        </header>
    );
}
