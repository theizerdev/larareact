import {
    ArrowRight,
    ClipboardCheck,
    Handshake,
    ScanLine,
    Workflow,
} from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import { hoshoButtonClass } from './button-styles';
import HoshoMark from './HoshoMark';
import Reveal from './Reveal';

const ALLY_ICONS = [Handshake, ScanLine, Workflow, ClipboardCheck];

export default function PartnersSection() {
    const { __ } = useTranslate();

    const allies = [
        {
            title: __('Integrators and channel partners'),
            body: __(
                'Certified partners that implement, configure and provide on-site first-line support, with direct guidance from the Innovación Móvil team.',
            ),
        },
        {
            title: __('Hardware manufacturers'),
            body: __(
                'Turnstiles, vehicle barriers, biometric readers, enrollment kiosks, video surveillance and physical access controllers.',
            ),
        },
        {
            title: __('Enterprise platforms'),
            body: __(
                'ERP, payroll, WMS, help-desk and corporate directory systems, via REST API, webhooks and single sign-on.',
            ),
        },
        {
            title: __('Compliance consultants'),
            body: __(
                'Firms that support CTPAT, OEA and ISO certification processes and rely on Hoshō as their primary source of evidence.',
            ),
        },
    ];

    return (
        <section
            id="aliados"
            className="bg-hosho-navy py-[clamp(4.25rem,9vh,7rem)] text-hosho-navy-ink"
        >
            <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
                <Reveal className="mb-[clamp(2.3rem,4.4vw,3.4rem)] max-w-[46rem]">
                    <div className="mb-[1.1rem] inline-flex items-center gap-2 rounded-full bg-white/[.16] py-[.42rem] pr-[.85rem] pl-[.62rem]">
                        <HoshoMark className="size-3.5 text-[#9FB0FF]" />
                        <span className="font-hosho-data text-[.68rem] tracking-[.07em] text-[#9FB0FF] uppercase">
                            {__('Strategic partners')}
                        </span>
                    </div>
                    <h2 className="m-0 mb-[.85rem] font-hosho-display text-[clamp(1.85rem,3.8vw,2.85rem)] leading-[1.1] font-bold tracking-[-.012em] text-hosho-navy-ink">
                        {__(
                            'Hoshō integrates with your existing infrastructure; it does not replace it.',
                        )}
                    </h2>
                    <p className="m-0 max-w-[40rem] text-[clamp(1rem,1.25vw,1.13rem)] text-hosho-navy-mist">
                        {__(
                            'We collaborate with integrators, hardware manufacturers and infrastructure providers so that implementation builds on the technology your organization already has in place.',
                        )}
                    </p>
                </Reveal>

                <Reveal className="grid gap-9 md:grid-cols-2">
                    <div>
                        {allies.map((a, i) => {
                            const Icon = ALLY_ICONS[i];

                            return (
                                <div
                                    key={i}
                                    className="grid grid-cols-[44px_1fr] items-start gap-[1.1rem] border-b border-hosho-navy-line py-[1.3rem] first:pt-0"
                                >
                                    <span className="grid size-[38px] place-items-center rounded-[10px] bg-[rgba(90,110,255,.16)] text-[#9FB0FF]">
                                        <Icon
                                            className="size-[18px]"
                                            strokeWidth={1.6}
                                        />
                                    </span>
                                    <div>
                                        <b className="mb-[.28rem] block font-hosho-display text-[1.08rem] font-bold text-hosho-navy-ink">
                                            {a.title}
                                        </b>
                                        <p className="m-0 text-[.9rem] leading-[1.55] text-hosho-navy-mist">
                                            {a.body}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div>
                        <div
                            aria-label={__('Partner logos')}
                            className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4"
                        >
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="grid min-h-[100px] place-items-center rounded-hosho-md border border-hosho-navy-line bg-hosho-navy-2 p-4 text-center"
                                >
                                    <span className="w-full rounded-hosho-sm border border-dashed border-hosho-navy-line px-[.8rem] py-[.65rem] font-hosho-data text-[.62rem] tracking-[.08em] text-hosho-navy-mist">
                                        {__('Partner logo')}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="my-[1.6rem] text-[.93rem] leading-[1.6] text-hosho-navy-mist">
                            {__(
                                'Does your organization integrate physical-security or compliance solutions? The partner program includes a sandbox environment, technical API documentation and deal registration.',
                            )}
                        </p>
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
                            className={hoshoButtonClass('ghost-band')}
                        >
                            <span>{__('Apply as a partner')}</span>
                            <ArrowRight />
                        </a>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
