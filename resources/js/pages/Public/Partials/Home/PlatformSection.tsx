import {
    CalendarClock,
    Clock,
    MessageCircle,
    PackageSearch,
    ScanFace,
    Ticket,
    Truck,
    Workflow,
} from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import Reveal from './Reveal';
import ShigotoMark from './ShigotoMark';

const MOD_ICONS = [
    Clock,
    CalendarClock,
    ScanFace,
    Truck,
    Ticket,
    PackageSearch,
    MessageCircle,
    Workflow,
];

export default function PlatformSection() {
    const { __ } = useTranslate();

    const modules = [
        {
            num: __('01 · Core'),
            title: __(
                'Biometric time and attendance for the entire workforce',
            ),
            body: __(
                'Every employee enrolls once and clocks in and out through facial biometrics and liveness detection, eliminating buddy punching and manual timesheets. Shigoto captures entries, exits, breaks, meals and overtime in real time, with a permanent, audit-ready record for every shift.',
            ),
            tags: [
                __('Biometric clock-in'),
                __('Liveness detection'),
                __('Breaks and meals'),
                __('Overtime tracking'),
                __('Shift schedules'),
                __('Payroll export'),
            ],
        },
        {
            num: __('02'),
            title: __('Shift scheduling and overtime management'),
            body: __(
                'Define shift patterns, rotations and tolerance windows by site or department. Overtime and irregularities are flagged automatically and routed for supervisor approval before they reach payroll.',
            ),
            tags: [
                __('Rotating shifts'),
                __('Approval workflow'),
                __('Attendance alerts'),
            ],
        },
        {
            num: __('03'),
            title: __(
                'Supplier and business-partner onboarding with identity validation',
            ),
            body: __(
                'Each supplier and business partner enrolls once: official identity document validation, facial biometric capture and a digital profile shared across every site of the organization. Pre-registered visits and deliveries are cleared within seconds.',
            ),
            tags: [
                __('Document validation'),
                __('Biometric enrollment'),
                __('Digital QR credential'),
                __('Invitation-based pre-registration'),
            ],
        },
        {
            num: __('04'),
            title: __('Vehicle registration and yard control'),
            body: __(
                'An individual record for every vehicle associated with a supplier or partner: registration, driver, valid documentation and entry/exit logging at each checkpoint, with full visibility over units currently on site.',
            ),
            tags: [
                __('Vehicle registry'),
                __('Driver association'),
                __('Yard entry/exit log'),
            ],
        },
        {
            num: __('05'),
            title: __('IT service management: incidents, requests and catalog'),
            body: __(
                'Logging, assignment, tracking and closure of incidents and requests with supporting evidence. A service catalog, defined support tiers and response times measured against established service-level agreements.',
            ),
            tags: [
                __('Service desk'),
                __('Service catalog'),
                __('Service-level agreements'),
            ],
        },
        {
            num: __('06'),
            title: __('Inventory control'),
            body: __(
                'Full traceability of tools, equipment and consumables: intake, custody and return. Withdrawals are authorized through digital vouchers, with automated cycle counting that removes reliance on spreadsheets.',
            ),
            tags: [
                __('Custody tracking'),
                __('Digital vouchers'),
                __('Automated cycle counts'),
            ],
        },
        {
            num: __('07'),
            title: __('Operational messaging via WhatsApp'),
            body: __(
                'Shift reminders, digital credentials, overtime approvals and attendance alerts are delivered through the communication channel your organization and its personnel already use every day.',
            ),
            tags: [
                __('Automated reminders'),
                __('Real-time notifications'),
                __('Digital credential delivery'),
            ],
        },
        {
            num: __('08'),
            title: __('Integrations and security protocols'),
            body: __(
                'An open application programming interface for connecting to existing ERP, payroll, WMS and help-desk systems, as well as installed hardware infrastructure: biometric time clocks, turnstiles and access controllers.',
            ),
            tags: [
                __('REST API'),
                __('Webhooks'),
                __('Single sign-on (SSO / SAML)'),
                __('Encryption in transit and at rest'),
            ],
        },
    ];

    return (
        <section id="aplicacion" className="py-[clamp(4.25rem,9vh,7rem)]">
            <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
                <Reveal className="mb-[clamp(2.3rem,4.4vw,3.4rem)] max-w-[46rem]">
                    <div className="mb-[1.1rem] inline-flex items-center gap-2 rounded-full bg-shigoto-indigo-tint py-[.42rem] pr-[.85rem] pl-[.62rem]">
                        <ShigotoMark className="size-3.5 text-shigoto-indigo" />
                        <span className="font-shigoto-data text-[.68rem] tracking-[.07em] text-shigoto-indigo uppercase">
                            {__('Platform')}
                        </span>
                    </div>
                    <h2 className="m-0 mb-[.85rem] font-shigoto-display text-[clamp(1.85rem,3.8vw,2.85rem)] leading-[1.1] font-bold tracking-[-.012em] text-shigoto-ink">
                        {__(
                            'A unified architecture for time and attendance, workforce and operations control.',
                        )}
                    </h2>
                    <p className="m-0 max-w-[40rem] text-[clamp(1rem,1.25vw,1.13rem)] text-shigoto-ink-soft">
                        {__(
                            'Shigoto integrates workforce time tracking, supplier and vehicle onboarding, IT service management and inventory within a single corporate database, with one unified audit trail across the entire operation.',
                        )}
                    </p>
                </Reveal>

                <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {modules.map((m, i) => {
                        const Icon = MOD_ICONS[i];
                        const isLead = i === 0;

                        return (
                            <article
                                key={i}
                                className={cn(
                                    'rounded-shigoto-md border border-shigoto-line bg-shigoto-surface p-[1.85rem_1.55rem_1.7rem] shadow-shigoto-sm transition-all duration-300 hover:-translate-y-[3px] hover:border-[#CBD2F7] hover:shadow-shigoto-md',
                                    isLead &&
                                        'border-shigoto-navy bg-shigoto-navy text-shigoto-navy-ink lg:col-span-2',
                                )}
                            >
                                <div className="mb-[1.1rem] flex items-center gap-[.95rem]">
                                    <span
                                        className={cn(
                                            'grid size-12 flex-none place-items-center rounded-shigoto-sm bg-shigoto-indigo-tint text-shigoto-indigo',
                                            isLead &&
                                                'bg-white/10 text-shigoto-coral',
                                        )}
                                    >
                                        <Icon
                                            className="size-[23px]"
                                            strokeWidth={1.6}
                                        />
                                    </span>
                                    <span
                                        className={cn(
                                            'font-shigoto-data text-[.66rem] tracking-[.1em] text-shigoto-mist',
                                            isLead && 'text-[#9FB0FF]',
                                        )}
                                    >
                                        {m.num}
                                    </span>
                                </div>
                                <h3
                                    className={cn(
                                        'm-0 mb-[.55rem] font-shigoto-display text-[clamp(1.08rem,1.6vw,1.24rem)] leading-[1.24] font-bold tracking-[-.004em] text-shigoto-ink',
                                        isLead && 'text-shigoto-navy-ink',
                                    )}
                                >
                                    {m.title}
                                </h3>
                                <p
                                    className={cn(
                                        'm-0 mb-4 text-[.92rem] leading-[1.6] text-shigoto-ink-soft',
                                        isLead && 'text-shigoto-navy-mist',
                                    )}
                                >
                                    {m.body}
                                </p>
                                <ul className="m-0 flex flex-wrap gap-[.4rem] p-0">
                                    {m.tags.map((tag, ti) => (
                                        <li
                                            key={ti}
                                            className={cn(
                                                'rounded-full bg-shigoto-indigo-tint px-[.65rem] py-[.28rem] font-shigoto-data text-[.66rem] text-shigoto-indigo',
                                                isLead &&
                                                    'bg-white/[.08] text-[#8FE3BE]',
                                            )}
                                        >
                                            {tag}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        );
                    })}
                </Reveal>
            </div>
        </section>
    );
}
