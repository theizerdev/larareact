import { useTranslate } from '@/hooks/use-translate';
import HoshoMark from './HoshoMark';

export default function SiteFooter() {
    const { __ } = useTranslate();
    const year = new Date().getFullYear();

    const links = [
        { id: 'inicio', label: __('Home') },
        { id: 'aplicacion', label: __('Platform') },
        { id: 'clientes', label: __('Customers') },
        { id: 'aliados', label: __('Partners') },
        { id: 'contacto', label: __('Contact') },
    ];

    return (
        <footer className="border-t border-hosho-navy-line bg-hosho-navy pt-12 pb-8 text-hosho-navy-ink">
            <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
                <div className="grid gap-[2.1rem] border-b border-hosho-navy-line pb-[2.1rem] md:grid-cols-[1.4fr_1fr] md:items-start">
                    <div>
                        <div className="mb-4 flex items-center gap-3">
                            <span className="grid size-[34px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-white/10">
                                <img
                                    src="/image/logo/logo_innovacion-movil.png"
                                    alt={__('Innovación Móvil')}
                                    className="size-full object-contain p-1"
                                />
                            </span>
                            <span>
                                <strong className="block font-hosho-display text-[1.05rem] font-bold text-hosho-navy-ink">
                                    Innovación Móvil
                                </strong>
                                <span className="font-hosho-data text-[.6rem] tracking-[.1em] text-hosho-navy-mist uppercase">
                                    {__('Developer of Hoshō')}
                                </span>
                            </span>
                        </div>
                        <p className="m-0 max-w-[34rem] text-[.92rem] text-hosho-navy-mist">
                            {__(
                                'Innovación Móvil integrates technology to transform business processes. Hoshō is its platform for access, asset and workforce control, designed for operations that require audit-ready evidence.',
                            )}
                        </p>
                    </div>
                    <div>
                        <ul className="m-0 mb-[1.3rem] flex flex-wrap gap-[1.3rem] p-0">
                            {links.map((l) => (
                                <li key={l.id}>
                                    <a
                                        href={`#${l.id}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document
                                                .getElementById(l.id)
                                                ?.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'start',
                                                });
                                        }}
                                        className="text-[.885rem] text-[#C3C9E4] hover:text-hosho-navy-ink"
                                    >
                                        {l.label}
                                    </a>
                                </li>
                            ))}
                            <li>
                                <a
                                    href="https://www.innovacionmovil.com"
                                    target="_blank"
                                    rel="noopener"
                                    className="text-[.885rem] text-[#C3C9E4] hover:text-hosho-navy-ink"
                                >
                                    innovacionmovil.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 pt-[1.4rem]">
                    <p className="m-0 inline-flex items-center gap-2 font-hosho-data text-[.72rem] text-hosho-navy-mist">
                        <HoshoMark className="size-[15px]" />© {year} Innovación
                        Móvil · Hoshō 保証
                    </p>
                    <p className="m-0 font-hosho-data text-[.72rem] text-hosho-navy-mist">
                        {__('Privacy notice · Terms and conditions of service')}
                    </p>
                </div>
            </div>
        </footer>
    );
}
