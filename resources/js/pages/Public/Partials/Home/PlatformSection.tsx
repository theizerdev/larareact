import {
    Clock,
    MessageCircle,
    PackageSearch,
    ScanFace,
    ShieldCheck,
    Ticket,
    Truck,
    Workflow,
    LocateFixed,
} from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import HoshoMark from './HoshoMark';
import Reveal from './Reveal';

const MOD_ICONS = [
    ScanFace,
    Truck,
    LocateFixed,
    Clock,
    Ticket,
    PackageSearch,
    MessageCircle,
    Workflow,
    ShieldCheck,
];

export default function PlatformSection() {
    const { __ } = useTranslate();

    const modules = [
        {
            num: __('01 · Core'),
            title: __(
                'Access validation for suppliers, business partners and visitors',
            ),
            body: __(
                'Each individual enrolls once and remains permanently identified within the system. Hoshō validates the official identity document, captures a facial biometric record, confirms through a liveness check that a real person is present, and screens identity against current watchlists before granting access. Pre-registered visitors are cleared within seconds; any non-compliant attempt is automatically denied, with the reason recorded for audit purposes.',
            ),
            tags: [
                __('Biometric enrollment'),
                __('Liveness detection'),
                __('Document validation'),
                __('Invitation-based pre-registration'),
                __('Digital QR credential'),
                __('AML watchlist screening'),
            ],
        },
        {
            num: __('02'),
            title: __('Fleet control'),
            body: __(
                'Comprehensive management of vehicles, drivers and trailers, with an individual record for each asset: entries, exits, valid documentation, security seals and mileage. The organization maintains full visibility over the location and status of every unit at all times.',
            ),
            tags: [
                __('Yard and dock control'),
                __('Driver management'),
                __('Security seals'),
            ],
        },
        {
            num: __('03'),
            title: __('Asset management with GPS and artificial intelligence'),
            body: __(
                'Real-time monitoring of equipment and vehicles through predictive models that learn standard operating patterns and generate alerts upon deviation: unauthorized stops, geofence breaches or anomalous behavior.',
            ),
            tags: [
                __('Configurable geofences'),
                __('Anomaly alerts'),
                __('Route history'),
            ],
        },
        {
            num: __('04'),
            title: __('Workforce time and attendance'),
            body: __(
                'Recording of work shifts, breaks, meals and overtime through the same biometric infrastructure used for access control, ensuring data integrity and eliminating the risk of attendance fraud.',
            ),
            tags: [
                __('Shift management'),
                __('Breaks and meals'),
                __('Overtime tracking'),
                __('Payroll export'),
            ],
        },
        {
            num: __('05'),
            title: __('IT service management: incidents, requests and catalog'),
            body: __(
                'Logging, assignment, tracking and closure of incidents with supporting documentation, directly from the checkpoint. A service catalog, defined support tiers and response times measured against established service-level agreements.',
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
                'Full traceability of tools, spare parts and equipment: intake, custody and return. Withdrawals are authorized through digital vouchers, with automated cycle counting that removes reliance on spreadsheets.',
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
                'Invitations, digital credentials, supplier arrival notifications and anomaly alerts are delivered through the communication channel your organization and its personnel already use on a daily basis.',
            ),
            tags: [
                __('Automated invitations'),
                __('Real-time notifications'),
                __('Arrival confirmation'),
            ],
        },
        {
            num: __('08'),
            title: __('Integrations and security protocols'),
            body: __(
                'An open application programming interface for connecting to existing ERP, payroll, WMS and help-desk systems, as well as installed hardware infrastructure: turnstiles, vehicle barriers, biometric readers, video surveillance and physical access controls.',
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
                    <div className="mb-[1.1rem] inline-flex items-center gap-2 rounded-full bg-hosho-indigo-tint py-[.42rem] pr-[.85rem] pl-[.62rem]">
                        <HoshoMark className="size-3.5 text-hosho-indigo" />
                        <span className="font-hosho-data text-[.68rem] tracking-[.07em] text-hosho-indigo uppercase">
                            {__('Platform')}
                        </span>
                    </div>
                    <h2 className="m-0 mb-[.85rem] font-hosho-display text-[clamp(1.85rem,3.8vw,2.85rem)] leading-[1.1] font-bold tracking-[-.012em] text-hosho-ink">
                        {__(
                            'A unified architecture for access, asset and operations control.',
                        )}
                    </h2>
                    <p className="m-0 max-w-[40rem] text-[clamp(1rem,1.25vw,1.13rem)] text-hosho-ink-soft">
                        {__(
                            'Hoshō integrates people, vehicles, assets and workforce time tracking within a single corporate database, with one unified audit trail across the entire operation.',
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
                                    'rounded-hosho-md border border-hosho-line bg-hosho-surface p-[1.85rem_1.55rem_1.7rem] shadow-hosho-sm transition-all duration-300 hover:-translate-y-[3px] hover:border-[#CBD2F7] hover:shadow-hosho-md',
                                    isLead &&
                                        'border-hosho-navy bg-hosho-navy text-hosho-navy-ink lg:col-span-2',
                                )}
                            >
                                <div className="mb-[1.1rem] flex items-center gap-[.95rem]">
                                    <span
                                        className={cn(
                                            'grid size-12 flex-none place-items-center rounded-hosho-sm bg-hosho-indigo-tint text-hosho-indigo',
                                            isLead &&
                                                'bg-white/10 text-hosho-coral',
                                        )}
                                    >
                                        <Icon
                                            className="size-[23px]"
                                            strokeWidth={1.6}
                                        />
                                    </span>
                                    <span
                                        className={cn(
                                            'font-hosho-data text-[.66rem] tracking-[.1em] text-hosho-mist',
                                            isLead && 'text-[#9FB0FF]',
                                        )}
                                    >
                                        {m.num}
                                    </span>
                                </div>
                                <h3
                                    className={cn(
                                        'm-0 mb-[.55rem] font-hosho-display text-[clamp(1.08rem,1.6vw,1.24rem)] leading-[1.24] font-bold tracking-[-.004em] text-hosho-ink',
                                        isLead && 'text-hosho-navy-ink',
                                    )}
                                >
                                    {m.title}
                                </h3>
                                <p
                                    className={cn(
                                        'm-0 mb-4 text-[.92rem] leading-[1.6] text-hosho-ink-soft',
                                        isLead && 'text-hosho-navy-mist',
                                    )}
                                >
                                    {m.body}
                                </p>
                                <ul className="m-0 flex flex-wrap gap-[.4rem] p-0">
                                    {m.tags.map((tag, ti) => (
                                        <li
                                            key={ti}
                                            className={cn(
                                                'rounded-full bg-hosho-indigo-tint px-[.65rem] py-[.28rem] font-hosho-data text-[.66rem] text-hosho-indigo',
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
