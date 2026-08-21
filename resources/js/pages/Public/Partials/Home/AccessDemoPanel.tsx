import {
    Check,
    FileCheck2,
    ListChecks,
    Radar,
    ScanFace,
    ScrollText,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

type StepStatus = 'waiting' | 'active' | 'done' | 'denied';
type DenyReason = 'watchlist' | 'legal';

const STEP_ICONS = [FileCheck2, ScanFace, Radar, ListChecks];

const ROLE_KEYS = [
    'prov_mant',
    'socio_carga',
    'visita_auditoria',
    'contratista_obra',
    'socio_refacciones',
] as const;
const QUEUE_NAMES = [
    'M. Reyes Solano',
    'Transportes Sierra',
    'A. Vázquez Lira',
    'L. Ontiveros',
    'Grupo Delta Norte',
];
// null = access authorized; otherwise the reason the watchlist step denied it.
const QUEUE_DENY: Array<DenyReason | null> = [
    null,
    'watchlist',
    null,
    'legal',
    null,
];

function clockNow() {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');

    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export default function AccessDemoPanel() {
    const { __ } = useTranslate();
    const tRef = useRef(__);
    useEffect(() => {
        tRef.current = __;
    });

    const [steps, setSteps] = useState<StepStatus[]>([
        'waiting',
        'waiting',
        'waiting',
        'waiting',
    ]);
    const [phaseWord, setPhaseWord] = useState<string[]>(['', '', '', '']);
    const [sealOn, setSealOn] = useState(false);
    const [verdictOn, setVerdictOn] = useState(false);
    const [current, setCurrent] = useState<{
        name: string;
        roleKey: string;
        folio: number;
        denyReason: DenyReason | null;
    } | null>(null);
    const [ledger, setLedger] = useState<
        Array<{
            time: string;
            folio: number;
            name: string;
            fresh: boolean;
            denyReason: DenyReason | null;
        }>
    >([]);

    const panelRef = useRef<HTMLDivElement>(null);
    const timersRef = useRef<number[]>([]);
    const idxRef = useRef(0);
    const folioRef = useRef(4718);

    useEffect(() => {
        const clearTimers = () => {
            timersRef.current.forEach((id) => window.clearTimeout(id));
            timersRef.current = [];
        };
        const at = (fn: () => void, ms: number) => {
            timersRef.current.push(window.setTimeout(fn, ms));
        };

        const reduceMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        const pushLedger = (
            name: string,
            folio: number,
            denyReason: DenyReason | null,
        ) => {
            setLedger((prev) =>
                [
                    { time: clockNow(), folio, name, fresh: true, denyReason },
                    ...prev,
                ].slice(0, 4),
            );
        };

        function runCycle() {
            clearTimers();
            setSteps(['waiting', 'waiting', 'waiting', 'waiting']);
            setPhaseWord(['', '', '', '']);
            setSealOn(false);
            setVerdictOn(false);

            const roleKey = ROLE_KEYS[idxRef.current % ROLE_KEYS.length];
            const name = QUEUE_NAMES[idxRef.current % QUEUE_NAMES.length];
            const denyReason = QUEUE_DENY[idxRef.current % QUEUE_DENY.length];
            idxRef.current += 1;
            folioRef.current += 1;
            const folio = folioRef.current;
            setCurrent({ name, roleKey, folio, denyReason });

            if (reduceMotion) {
                setSteps([
                    'done',
                    'done',
                    'done',
                    denyReason ? 'denied' : 'done',
                ]);
                setSealOn(true);
                setVerdictOn(true);
                pushLedger(name, folio, denyReason);

                return;
            }

            const phases = [
                tRef.current('Analyzing'),
                tRef.current('Matching'),
                tRef.current('Verifying'),
                tRef.current('Screening'),
            ];
            let t = 500;
            [0, 1, 2, 3].forEach((i) => {
                at(() => {
                    setSteps((s) => s.map((v, j) => (j === i ? 'active' : v)));
                    setPhaseWord((p) =>
                        p.map((v, j) => (j === i ? phases[i] : v)),
                    );
                }, t);
                t += 780;
                at(
                    () =>
                        setSteps((s) =>
                            s.map((v, j) =>
                                j === i
                                    ? i === 3 && denyReason
                                        ? 'denied'
                                        : 'done'
                                    : v,
                            ),
                        ),
                    t,
                );
                t += 220;
            });
            at(() => {
                setSealOn(true);
                setVerdictOn(true);
                pushLedger(name, folio, denyReason);
            }, t + 180);
            at(runCycle, t + 3400);
        }

        const panel = panelRef.current;

        if (
            !panel ||
            reduceMotion ||
            typeof IntersectionObserver === 'undefined'
        ) {
            runCycle();

            return () => clearTimers();
        }

        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];

                if (!entry.isIntersecting) {
                    clearTimers();
                } else if (timersRef.current.length === 0) {
                    runCycle();
                }
            },
            { threshold: 0.15 },
        );
        io.observe(panel);

        return () => {
            clearTimers();
            io.disconnect();
        };
    }, []);

    const stepDefs = [
        {
            label: __('Official document validation'),
            sub: __("Driver's license · Passport · Professional ID"),
        },
        {
            label: __('Facial biometric verification'),
            sub: __('1:1 match against the official document'),
        },
        {
            label: __('Liveness detection'),
            sub: __('Passive anti-spoofing protocol'),
        },
        {
            label: __('Watchlist screening'),
            sub: __('AML · sanctions · internal restrictions'),
        },
    ];

    const roleLabels: Record<string, string> = {
        prov_mant: __('Maintenance supplier'),
        socio_carga: __('Business partner · Freight logistics'),
        visita_auditoria: __('Visitor · Compliance audit'),
        contratista_obra: __('Contractor · Civil works'),
        socio_refacciones: __('Business partner · Spare-parts supply'),
    };

    const denyLabels: Record<DenyReason, string> = {
        watchlist: __('Match found'),
        legal: __('Restricted'),
    };
    const denyReasons: Record<DenyReason, string> = {
        watchlist: __('PLD/AML watchlist match'),
        legal: __('Active legal restriction'),
    };

    return (
        <div
            ref={panelRef}
            aria-label={__('Access validation demonstration')}
            className="overflow-hidden rounded-hosho-lg border border-hosho-line bg-hosho-surface shadow-hosho-lg"
        >
            <div className="flex items-center gap-2.5 border-b border-hosho-line bg-hosho-surface-2 px-[1.1rem] py-[.85rem]">
                <span className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="size-2 rounded-full bg-hosho-line"
                        />
                    ))}
                </span>
                <span className="font-hosho-data text-[.72rem] text-hosho-mist">
                    hosho.app
                </span>
                <span className="ml-auto flex items-center gap-2.5 text-right">
                    <span className="size-1.5 flex-none animate-hosho-pulse rounded-full bg-hosho-jade" />
                    <span className="leading-tight">
                        <strong className="block text-[.82rem] leading-[1.2] font-semibold text-hosho-ink">
                            {current?.name ?? '—'}
                        </strong>
                        <span className="font-hosho-data text-[.66rem] text-hosho-mist">
                            {current ? roleLabels[current.roleKey] : '—'}
                        </span>
                    </span>
                </span>
            </div>

            <div className="px-[1.2rem] pt-[.85rem] pb-[.2rem] font-hosho-data text-[.68rem] tracking-[.06em] text-hosho-mist uppercase">
                {__('Checkpoint 01 · Main entrance')}
            </div>

            <div className="px-[1.2rem] pt-[.4rem] pb-[.6rem]">
                {stepDefs.map((step, i) => {
                    const status = steps[i];
                    const Icon =
                        status === 'denied' ? X : STEP_ICONS[i];

                    return (
                        <div
                            key={i}
                            className={cn(
                                'grid grid-cols-[42px_1fr_auto] items-center gap-4 border-b border-hosho-line py-[.85rem] last:border-b-0',
                            )}
                        >
                            <span
                                className={cn(
                                    'grid size-[42px] place-items-center rounded-hosho-sm border border-hosho-line bg-hosho-surface-2 text-hosho-mist transition-colors',
                                    status === 'active' &&
                                        'animate-hosho-scan border-transparent bg-hosho-coral-tint text-hosho-coral',
                                    status === 'done' &&
                                        'border-transparent bg-hosho-jade-tint text-hosho-jade',
                                    status === 'denied' &&
                                        'border-transparent bg-hosho-coral-tint text-hosho-coral',
                                )}
                            >
                                <Icon
                                    className="size-[21px]"
                                    strokeWidth={1.6}
                                />
                            </span>
                            <span
                                className={cn(
                                    'text-[.92rem]',
                                    status === 'done' ||
                                        status === 'active' ||
                                        status === 'denied'
                                        ? 'text-hosho-ink'
                                        : 'text-hosho-ink-soft',
                                )}
                            >
                                {step.label}
                                <small className="mt-[.15rem] block font-hosho-data text-[.66rem] text-hosho-mist">
                                    {step.sub}
                                </small>
                            </span>
                            <span
                                className={cn(
                                    'inline-flex items-center gap-[.4rem] rounded-full bg-hosho-surface-2 px-[.65rem] py-[.32rem] font-hosho-data text-[.65rem] tracking-[.06em] whitespace-nowrap text-hosho-mist uppercase transition-colors',
                                    status === 'active' &&
                                        'bg-hosho-coral-tint text-hosho-coral',
                                    status === 'done' &&
                                        'bg-hosho-jade-tint text-hosho-jade',
                                    status === 'denied' &&
                                        'bg-hosho-coral-tint text-hosho-coral',
                                )}
                            >
                                <i className="not-italic">
                                    {status === 'active'
                                        ? phaseWord[i]
                                        : status === 'done'
                                          ? __('Verified')
                                          : status === 'denied' &&
                                              current?.denyReason
                                            ? denyLabels[current.denyReason]
                                            : __('Pending')}
                                </i>
                                {status === 'done' && (
                                    <Check
                                        className="size-[11px]"
                                        strokeWidth={3}
                                    />
                                )}
                                {status === 'denied' && (
                                    <X
                                        className="size-[11px]"
                                        strokeWidth={3}
                                    />
                                )}
                            </span>
                        </div>
                    );
                })}

                <div className="mt-[.3rem] flex min-h-[76px] items-center gap-4 border-t border-hosho-line pt-[1.1rem] pb-[1.2rem]">
                    <div
                        className={cn(
                            'grid size-14 flex-none scale-[.55] place-items-center rounded-hosho-sm opacity-0',
                            current?.denyReason
                                ? 'bg-hosho-coral-tint text-hosho-coral'
                                : 'bg-hosho-jade-tint text-hosho-jade',
                            sealOn && 'animate-hosho-stamp',
                        )}
                    >
                        {current?.denyReason ? (
                            <X className="size-[26px]" strokeWidth={2.6} />
                        ) : (
                            <Check className="size-[26px]" strokeWidth={2.6} />
                        )}
                    </div>
                    <div>
                        <strong
                            className={cn(
                                'block font-hosho-display text-[1.22rem] font-bold opacity-0 transition-opacity delay-[120ms] duration-300',
                                current?.denyReason
                                    ? 'text-hosho-coral'
                                    : 'text-hosho-ink',
                                verdictOn && 'opacity-100',
                            )}
                        >
                            {current?.denyReason
                                ? __('Access denied')
                                : __('Access authorized')}
                        </strong>
                        <span
                            className={cn(
                                'font-hosho-data text-[.68rem] text-hosho-mist opacity-0 transition-opacity delay-[220ms] duration-300',
                                verdictOn && 'opacity-100',
                            )}
                        >
                            {current
                                ? `F-${current.folio} · ${
                                      current.denyReason
                                          ? denyReasons[current.denyReason]
                                          : __('validity: 8 hours')
                                  }`
                                : '—'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="rounded-b-hosho-lg border-t border-hosho-line bg-hosho-surface-2 px-[1.2rem] pt-[.65rem] pb-[.85rem]">
                <div className="mb-[.4rem] flex items-center justify-between">
                    <span className="inline-flex items-center gap-[.4rem] font-hosho-data text-[.68rem] tracking-[.06em] text-hosho-mist uppercase">
                        <ScrollText className="size-[13px]" strokeWidth={1.6} />
                        {__('Immutable audit trail')}
                    </span>
                    <span className="font-hosho-data text-[.68rem] tracking-[.06em] text-hosho-mist uppercase">
                        {__('Recent events')}
                    </span>
                </div>
                <ol
                    aria-live="polite"
                    className="m-0 max-h-[5.6rem] list-none overflow-hidden p-0 font-hosho-data text-[.68rem] text-hosho-ink-soft"
                >
                    {ledger.map((entry, i) => (
                        <li
                            key={`${entry.folio}-${i}`}
                            title={
                                entry.denyReason
                                    ? denyReasons[entry.denyReason]
                                    : undefined
                            }
                            className={cn(
                                'flex items-center gap-[.7rem] overflow-hidden py-[.15rem] text-ellipsis whitespace-nowrap',
                                entry.fresh && 'animate-hosho-slidein',
                            )}
                        >
                            <span>{entry.time}</span>
                            <span>F-{entry.folio}</span>
                            <span className="overflow-hidden text-ellipsis">
                                {entry.name}
                            </span>
                            <span
                                className={cn(
                                    'ml-auto inline-flex items-center gap-[.3rem]',
                                    entry.denyReason
                                        ? 'text-hosho-coral'
                                        : 'text-hosho-jade',
                                )}
                            >
                                {entry.denyReason ? (
                                    <X className="size-[10px]" strokeWidth={3} />
                                ) : (
                                    <Check
                                        className="size-[10px]"
                                        strokeWidth={3}
                                    />
                                )}
                                {entry.denyReason
                                    ? __('DENIED')
                                    : __('AUTHORIZED')}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}
