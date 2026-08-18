import { usePage } from '@inertiajs/react';
import { ArrowRight, Workflow } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import AccessDemoPanel from './AccessDemoPanel';
import { hoshoButtonClass } from './button-styles';
import HoshoMark from './HoshoMark';

export default function Hero() {
    const { __ } = useTranslate();
    const { locale } = usePage().props as any;

    return (
        <section id="inicio" className="relative overflow-hidden bg-hosho-bg">
            <div className="hosho-hero-grid" />
            <div className="hosho-hero-glow" />

            <div className="relative z-[2] mx-auto grid max-w-[1240px] gap-10 px-5 pt-14 pb-16 sm:px-8 sm:pt-20 sm:pb-24 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:gap-14">
                <div>
                    <div className="mb-[1.1rem] inline-flex items-center gap-2 rounded-full bg-hosho-indigo-tint py-[.42rem] pr-[.85rem] pl-[.62rem]">
                        <HoshoMark className="size-3.5 text-hosho-indigo" />
                        <span className="font-hosho-data text-[.68rem] tracking-[.07em] text-hosho-indigo uppercase">
                            {__(
                                'Enterprise access-control platform for Mexico',
                            )}
                        </span>
                    </div>

                    <h1 className="m-0 mb-5 font-hosho-display text-[clamp(2.5rem,6.2vw,4.6rem)] leading-[1.03] font-bold tracking-[-.02em] text-hosho-ink">
                        {locale === 'en' ? (
                            <>
                                Enterprise-grade
                                <br />
                                access
                                <br />
                                <em className="text-hosho-indigo not-italic">
                                    control.
                                </em>
                            </>
                        ) : (
                            <>
                                Control de accesos
                                <br />
                                de nivel
                                <br />
                                <em className="text-hosho-indigo not-italic">
                                    empresarial.
                                </em>
                            </>
                        )}
                    </h1>

                    <p className="mb-[2.1rem] max-w-[33rem] text-[clamp(1rem,1.25vw,1.13rem)] font-normal text-hosho-ink-soft">
                        {__(
                            'Hoshō centralizes identity verification, regulatory compliance and operational traceability for your organization. Facial biometrics, liveness detection and document validation in a single workflow, with audit-ready evidence available at all times.',
                        )}
                    </p>

                    <div className="mb-[2.3rem] flex flex-wrap gap-3.5">
                        <a
                            href="#contacto"
                            onClick={(e) => {
                                e.preventDefault();
                                document
                                    .getElementById('contacto')
                                    ?.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start',
                                    });
                            }}
                            className={hoshoButtonClass('primary')}
                        >
                            <span>{__('Request a demonstration')}</span>
                            <ArrowRight />
                        </a>
                        <a
                            href="#aplicacion"
                            onClick={(e) => {
                                e.preventDefault();
                                document
                                    .getElementById('aplicacion')
                                    ?.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start',
                                    });
                            }}
                            className={hoshoButtonClass('ghost')}
                        >
                            <span>{__('Explore the platform')}</span>
                            <Workflow />
                        </a>
                    </div>

                    <div className="flex flex-wrap gap-[.9rem]">
                        {[
                            {
                                v: '<8 s',
                                l: __(
                                    'Average validation time per access event',
                                ),
                            },
                            {
                                v: __('9 modules'),
                                l: __(
                                    'Integrated modules within a unified enterprise architecture',
                                ),
                            },
                            {
                                v: '保証',
                                l: __(
                                    'Hoshō: guarantee. The evidence standard your organization needs for every audit.',
                                ),
                            },
                        ].map((fact, i) => (
                            <div
                                key={i}
                                className="max-w-[13rem] min-w-[9.4rem] rounded-hosho-md border border-hosho-line bg-hosho-surface p-[1rem_1.15rem] shadow-hosho-sm"
                            >
                                <b className="mb-1 block font-hosho-display text-[1.4rem] leading-[1.15] font-bold text-hosho-ink">
                                    {fact.v}
                                </b>
                                <p className="m-0 text-[.8rem] leading-[1.45] text-hosho-ink-soft">
                                    {fact.l}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <AccessDemoPanel />
            </div>
        </section>
    );
}
