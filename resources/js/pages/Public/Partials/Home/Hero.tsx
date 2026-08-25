import { usePage } from '@inertiajs/react';
import { ArrowRight, Workflow } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import AttendanceDemoPanel from './AttendanceDemoPanel';
import { shigotoButtonClass } from './button-styles';
import ShigotoMark from './ShigotoMark';

export default function Hero() {
    const { __ } = useTranslate();
    const { locale } = usePage().props as any;

    return (
        <section id="inicio" className="relative overflow-hidden bg-shigoto-bg">
            <div className="shigoto-hero-grid" />
            <div className="shigoto-hero-glow" />

            <div className="relative z-[2] mx-auto grid max-w-[1240px] gap-10 px-5 pt-14 pb-16 sm:px-8 sm:pt-20 sm:pb-24 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:gap-14">
                <div>
                    <div className="mb-[1.1rem] inline-flex items-center gap-2 rounded-full bg-shigoto-indigo-tint py-[.42rem] pr-[.85rem] pl-[.62rem]">
                        <ShigotoMark className="size-3.5 text-shigoto-indigo" />
                        <span className="font-shigoto-data text-[.68rem] tracking-[.07em] text-shigoto-indigo uppercase">
                            {__(
                                'Enterprise workforce time & attendance platform for Mexico',
                            )}
                        </span>
                    </div>

                    <h1 className="m-0 mb-5 font-shigoto-display text-[clamp(2.5rem,6.2vw,4.6rem)] leading-[1.03] font-bold tracking-[-.02em] text-shigoto-ink">
                        {locale === 'en' ? (
                            <>
                                Enterprise-grade
                                <br />
                                time &amp; attendance
                                <br />
                                <em className="text-shigoto-indigo not-italic">
                                    tracking.
                                </em>
                            </>
                        ) : (
                            <>
                                Marcaje de jornada
                                <br />
                                laboral de nivel
                                <br />
                                <em className="text-shigoto-indigo not-italic">
                                    empresarial.
                                </em>
                            </>
                        )}
                    </h1>

                    <p className="mb-[2.1rem] max-w-[33rem] text-[clamp(1rem,1.25vw,1.13rem)] font-normal text-shigoto-ink-soft">
                        {__(
                            'Shigoto centralizes workforce time and attendance, regulatory compliance and operational traceability for your organization. Clock-ins, breaks, meals and overtime captured through biometrics, alongside document-verified onboarding of suppliers, business partners and vehicles, with audit-ready evidence available at all times.',
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
                            className={shigotoButtonClass('primary')}
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
                            className={shigotoButtonClass('ghost')}
                        >
                            <span>{__('Discover the app')}</span>
                            <Workflow />
                        </a>
                    </div>

                    <div className="flex flex-wrap gap-[.9rem]">
                        {[
                            {
                                v: '<30 s',
                                l: __(
                                    'Average time to record a shift clock-in',
                                ),
                            },
                            {
                                v: __('8 modules'),
                                l: __(
                                    'Integrated modules within a unified enterprise architecture',
                                ),
                            },
                            {
                                v: '仕事',
                                l: __(
                                    'Shigoto: work. The time-and-attendance standard your organization needs for every audit.',
                                ),
                            },
                        ].map((fact, i) => (
                            <div
                                key={i}
                                className="max-w-[13rem] min-w-[9.4rem] rounded-shigoto-md border border-shigoto-line bg-shigoto-surface p-[1rem_1.15rem] shadow-shigoto-sm"
                            >
                                <b className="mb-1 block font-shigoto-display text-[1.4rem] leading-[1.15] font-bold text-shigoto-ink">
                                    {fact.v}
                                </b>
                                <p className="m-0 text-[.8rem] leading-[1.45] text-shigoto-ink-soft">
                                    {fact.l}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <AttendanceDemoPanel />
            </div>
        </section>
    );
}
