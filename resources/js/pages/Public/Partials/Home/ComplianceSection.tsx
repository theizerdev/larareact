import {
    BadgeCheck,
    Check,
    Globe,
    ListChecks,
    Scale,
    ScanFace,
    ShieldCheck,
    Ticket,
    Warehouse,
} from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import Reveal from './Reveal';
import ShigotoMark from './ShigotoMark';

const NORM_ICONS = [
    Scale,
    Warehouse,
    Globe,
    ShieldCheck,
    Ticket,
    BadgeCheck,
    ListChecks,
    ScanFace,
];

export default function ComplianceSection() {
    const { __ } = useTranslate();

    const norms = [
        {
            title: __('Federal Labor Law 2027'),
            body: __(
                "Recordkeeping of shifts, breaks, meals and overtime in the format required by Mexico's 2027 labor-law reform, with evidence available for labor-authority inspections.",
            ),
        },
        {
            title: __('CTPAT'),
            body: __(
                'Traceability of facility access and control of personnel, visitors and carriers throughout the supply chain.',
            ),
        },
        {
            title: __('OEA'),
            body: __(
                'Authorized Economic Operator: physical access control, formal identification and systematic entry/exit logging.',
            ),
        },
        {
            title: __('ISO 27001'),
            body: __(
                'Information security: access control, audit logging, identity management and data encryption.',
            ),
        },
        {
            title: __('ISO 20000'),
            body: __(
                'IT service management: incidents, requests, a service catalog and measurable service levels.',
            ),
        },
        {
            title: __('ISO 9001'),
            body: __(
                'Quality management: documented processes, consistent records and evidence of continuous improvement.',
            ),
        },
        {
            title: __('PLD'),
            body: __(
                'Anti-money laundering: systematic screening of individuals and business partners against watchlists.',
            ),
        },
        {
            title: __('AML'),
            body: __(
                'Identity verification and a digital record for every third party interacting with the organization.',
            ),
        },
    ];

    const evidenceItems = [
        __(
            'Who clocked in, at what time, at which site and under which assigned shift.',
        ),
        __(
            'Breaks, meals and overtime recorded for every shift, with supervisor approval on file.',
        ),
        __(
            'The validated identity document and biometric enrollment record for every supplier, partner and vehicle on site.',
        ),
        __(
            'A record with no after-the-fact edits, timestamped and version-controlled.',
        ),
    ];

    return (
        <section
            id="cumplimiento"
            className="bg-shigoto-navy py-[clamp(4.25rem,9vh,7rem)] text-shigoto-navy-ink"
        >
            <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
                <Reveal className="mb-[clamp(2.3rem,4.4vw,3.4rem)] max-w-[46rem]">
                    <div className="mb-[1.1rem] inline-flex items-center gap-2 rounded-full bg-white/[.16] py-[.42rem] pr-[.85rem] pl-[.62rem]">
                        <ShigotoMark className="size-3.5 text-[#9FB0FF]" />
                        <span className="font-shigoto-data text-[.68rem] tracking-[.07em] text-[#9FB0FF] uppercase">
                            {__('Regulatory compliance')}
                        </span>
                    </div>
                    <h2 className="m-0 mb-[.85rem] font-shigoto-display text-[clamp(1.85rem,3.8vw,2.85rem)] leading-[1.1] font-bold tracking-[-.012em] text-shigoto-navy-ink">
                        {__(
                            'An architecture built to sustain the audit, not react to it.',
                        )}
                    </h2>
                    <p className="m-0 max-w-[40rem] text-[clamp(1rem,1.25vw,1.13rem)] text-shigoto-navy-mist">
                        {__(
                            "Shigoto operates within the regulatory frameworks that govern your organization's certification. Every clock-in, approval and registration generates a record with date, time, responsible party and supporting evidence, in a format ready for auditor review with no after-the-fact reconstruction required.",
                        )}
                    </p>
                </Reveal>

                <Reveal className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {norms.map((n, i) => {
                        const Icon = NORM_ICONS[i];

                        return (
                            <div
                                key={i}
                                className="rounded-shigoto-md border border-shigoto-navy-line bg-shigoto-navy-2 p-[1.5rem_1.3rem] transition-all duration-300 hover:-translate-y-[3px] hover:border-shigoto-indigo"
                            >
                                <span className="mb-4 grid size-12 place-items-center rounded-shigoto-sm bg-[rgba(90,110,255,.16)] text-[#9FB0FF]">
                                    <Icon
                                        className="size-[23px]"
                                        strokeWidth={1.6}
                                    />
                                </span>
                                <b className="mb-[.35rem] block font-shigoto-display text-[1.1rem] font-bold text-shigoto-navy-ink">
                                    {n.title}
                                </b>
                                <p className="m-0 text-[.83rem] leading-[1.55] text-shigoto-navy-mist">
                                    {n.body}
                                </p>
                            </div>
                        );
                    })}
                </Reveal>

                <Reveal className="mt-10 grid gap-6 rounded-shigoto-lg border border-shigoto-navy-line bg-shigoto-navy-2 p-[1.9rem_2rem] md:grid-cols-[1fr_1.25fr] md:items-center">
                    <div>
                        <ShieldCheck
                            className="mb-[.9rem] block size-[30px] text-shigoto-coral"
                            strokeWidth={1.6}
                        />
                        <div className="mb-0 inline-flex items-center gap-2 rounded-full bg-white/[.16] py-[.42rem] pr-[.85rem] pl-[.62rem]">
                            <Check className="size-3.5 text-[#9FB0FF]" />
                            <span className="font-shigoto-data text-[.68rem] tracking-[.07em] text-[#9FB0FF] uppercase">
                                {__('Deliverable for audit day')}
                            </span>
                        </div>
                        <h3 className="mt-[.85rem] mb-0 font-shigoto-display text-[1.5rem] leading-[1.18] font-bold text-shigoto-navy-ink">
                            {__(
                                'The complete file, available in a single click.',
                            )}
                        </h3>
                    </div>
                    <ul className="m-0 grid gap-3 p-0">
                        {evidenceItems.map((item, i) => (
                            <li
                                key={i}
                                className="grid grid-cols-[26px_1fr] items-start gap-[.85rem] text-[.93rem] leading-[1.5] text-shigoto-navy-mist"
                            >
                                <span className="grid size-[38px] place-items-center rounded-[10px] bg-[rgba(21,154,108,.18)] text-[#3FE0AA]">
                                    <Check
                                        className="size-[18px]"
                                        strokeWidth={1.6}
                                    />
                                </span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </Reveal>
            </div>
        </section>
    );
}
