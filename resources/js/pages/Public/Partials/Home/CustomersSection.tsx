import { Building2, Factory, Landmark, Warehouse } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import HoshoMark from './HoshoMark';
import Reveal from './Reveal';

const SECTOR_ICONS = [Factory, Warehouse, Landmark, Building2];

const CLIENT_LOGOS = [
    { name: "Driscoll's", src: '/image/logo/driscolls_logo.png' },
    { name: 'Persistent', src: '/image/logo/clientes/persistent-logo.svg' },
    { name: 'WALOOK', src: '/image/logo/clientes/walook-logo.webp' },
    { name: 'TecNovum', src: '/image/logo/clientes/tecnovum-logo.jpeg' },
    {
        name: 'Medical Orthosis',
        src: '/image/logo/clientes/medical-orthosis-logo.svg',
    },
    { name: 'Inteck-Pro', src: '/image/logo/clientes/inteck-pro-logo.svg' },
];
const CLIENT_LOGO_PLACEHOLDER_COUNT = 0;

export default function CustomersSection() {
    const { __ } = useTranslate();

    const sectors = [
        {
            title: __('Manufacturing'),
            body: __(
                'Plants with rotating suppliers, contractor personnel and continuous operating shifts.',
            ),
        },
        {
            title: __('Logistics and foreign trade'),
            body: __(
                'Yards, docks and carriers operating under CTPAT and OEA frameworks.',
            ),
        },
        {
            title: __('Banking and financial institutions'),
            body: __(
                'Branches and data centers subject to AML compliance obligations.',
            ),
        },
        {
            title: __('Corporate campuses and industrial parks'),
            body: __(
                'Shared facilities with visitor traffic, courier services and personnel from multiple organizations.',
            ),
        },
    ];

    return (
        <section id="clientes" className="py-[clamp(4.25rem,9vh,7rem)]">
            <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
                <Reveal className="mb-[clamp(2.3rem,4.4vw,3.4rem)] max-w-[46rem]">
                    <div className="mb-[1.1rem] inline-flex items-center gap-2 rounded-full bg-hosho-indigo-tint py-[.42rem] pr-[.85rem] pl-[.62rem]">
                        <HoshoMark className="size-3.5 text-hosho-indigo" />
                        <span className="font-hosho-data text-[.68rem] tracking-[.07em] text-hosho-indigo uppercase">
                            {__('Customers')}
                        </span>
                    </div>
                    <h2 className="m-0 mb-[.85rem] font-hosho-display text-[clamp(1.85rem,3.8vw,2.85rem)] leading-[1.1] font-bold tracking-[-.012em] text-hosho-ink">
                        {__(
                            'Organizations where access control is an operational requirement, not a formality.',
                        )}
                    </h2>
                    <p className="m-0 max-w-[40rem] text-[clamp(1rem,1.25vw,1.13rem)] text-hosho-ink-soft">
                        {__(
                            'Hoshō is deployed in operations that receive external personnel on an ongoing basis and must maintain evidence for regulators, customers or certification bodies.',
                        )}
                    </p>
                </Reveal>

                <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {sectors.map((s, i) => {
                        const Icon = SECTOR_ICONS[i];

                        return (
                            <div
                                key={i}
                                className="flex min-h-[180px] flex-col items-start justify-between gap-5 rounded-hosho-md border border-hosho-line bg-hosho-surface p-[1.55rem_1.35rem] shadow-hosho-sm transition-all duration-300 hover:-translate-y-[3px] hover:shadow-hosho-md"
                            >
                                <span className="grid size-12 place-items-center rounded-hosho-sm bg-hosho-indigo-tint text-hosho-indigo">
                                    <Icon
                                        className="size-[23px]"
                                        strokeWidth={1.6}
                                    />
                                </span>
                                <div>
                                    <b className="mb-[.35rem] block font-hosho-display text-[1.06rem] font-bold text-hosho-ink">
                                        {s.title}
                                    </b>
                                    <p className="m-0 text-[.85rem] leading-[1.5] text-hosho-ink-soft">
                                        {s.body}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </Reveal>

                <Reveal
                    aria-label={__('Client logos')}
                    className="mt-[2.1rem] grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4"
                >
                    {CLIENT_LOGOS.map((logo) => (
                        <div
                            key={logo.name}
                            className="grid min-h-[100px] place-items-center rounded-hosho-md border border-hosho-line bg-hosho-surface p-4 text-center"
                        >
                            <img
                                src={logo.src}
                                alt={logo.name}
                                className="max-h-9 w-full object-contain"
                                loading="lazy"
                            />
                        </div>
                    ))}
                    {Array.from({ length: CLIENT_LOGO_PLACEHOLDER_COUNT }).map(
                        (_, i) => (
                            <div
                                key={`placeholder-${i}`}
                                className="grid min-h-[100px] place-items-center rounded-hosho-md border border-hosho-line bg-hosho-surface p-4 text-center"
                            >
                                <span className="w-full rounded-hosho-sm border border-dashed border-hosho-line px-[.8rem] py-[.65rem] font-hosho-data text-[.62rem] tracking-[.08em] text-hosho-mist">
                                    {__('Client logo')}
                                </span>
                            </div>
                        ),
                    )}
                </Reveal>
            </div>
        </section>
    );
}
