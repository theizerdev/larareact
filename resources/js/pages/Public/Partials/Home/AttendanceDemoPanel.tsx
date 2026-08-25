import {
    CalendarClock,
    Check,
    Clock,
    MessageCircle,
    ScanFace,
    ScrollText,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

type StepStatus = 'waiting' | 'active' | 'done' | 'denied';
type FlagReason = 'fuera_horario' | 'requiere_autorizacion';

const STEP_ICONS = [ScanFace, CalendarClock, Clock, MessageCircle];

const ROLE_KEYS = [
    'oper_produccion',
    'supervisor_turno',
    'chofer_reparto',
    'almacen_logistica',
    'soporte_ti',
] as const;
const QUEUE_NAMES = [
    'M. Reyes Solano',
    'Transportes Sierra',
    'A. Vázquez Lira',
    'L. Ontiveros',
    'Grupo Delta Norte',
];
// null = clock-in recorded normally; otherwise the reason it was flagged for review.
const QUEUE_FLAG: Array<FlagReason | null> = [
    null,
    'fuera_horario',
    null,
    'requiere_autorizacion',
    null,
];

function clockNow() {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');

    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export default function AttendanceDemoPanel() {
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
        flagReason: FlagReason | null;
    } | null>(null);
    const [ledger, setLedger] = useState<
        Array<{
            time: string;
            folio: number;
            name: string;
            fresh: boolean;
            flagReason: FlagReason | null;
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
            flagReason: FlagReason | null,
        ) => {
            setLedger((prev) =>
                [
                    { time: clockNow(), folio, name, fresh: true, flagReason },
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
            const flagReason = QUEUE_FLAG[idxRef.current % QUEUE_FLAG.length];
            idxRef.current += 1;
            folioRef.current += 1;
            const folio = folioRef.current;
            setCurrent({ name, roleKey, folio, flagReason });

            if (reduceMotion) {
                setSteps([
                    'done',
                    flagReason ? 'denied' : 'done',
                    'done',
                    'done',
                ]);
                setSealOn(true);
                setVerdictOn(true);
                pushLedger(name, folio, flagReason);

                return;
            }

            const phases = [
                tRef.current('Matching'),
                tRef.current('Validating'),
                tRef.current('Recording'),
                tRef.current('Notifying'),
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
                                    ? i === 1 && flagReason
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
                pushLedger(name, folio, flagReason);
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
            label: __('Biometric identification'),
            sub: __('Facial match against the enrollment record'),
        },
        {
            label: __('Shift and schedule validation'),
            sub: __('Confirms the assigned shift and clock-in point'),
        },
        {
            label: __('Clock event registration'),
            sub: __('Entry, exit, break or meal'),
        },
        {
            label: __('WhatsApp confirmation'),
            sub: __('Notification sent to employee and supervisor'),
        },
    ];

    const roleLabels: Record<string, string> = {
        oper_produccion: __('Production operator'),
        supervisor_turno: __('Shift supervisor'),
        chofer_reparto: __('Delivery driver'),
        almacen_logistica: __('Warehouse & logistics'),
        soporte_ti: __('IT support'),
    };

    const flagLabels: Record<FlagReason, string> = {
        fuera_horario: __('Out of schedule'),
        requiere_autorizacion: __('Needs approval'),
    };
    const flagReasonsText: Record<FlagReason, string> = {
        fuera_horario: __(
            'Clock-in attempt outside the assigned shift window',
        ),
        requiere_autorizacion: __('Overtime pending supervisor approval'),
    };

    return (
        <div
            ref={panelRef}
            aria-label={__('Attendance clock-in demonstration')}
            className="overflow-hidden rounded-shigoto-lg border border-shigoto-line bg-shigoto-surface shadow-shigoto-lg"
        >
            <div className="flex items-center gap-2.5 border-b border-shigoto-line bg-shigoto-surface-2 px-[1.1rem] py-[.85rem]">
                <span className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="size-2 rounded-full bg-shigoto-line"
                        />
                    ))}
                </span>
                <span className="font-shigoto-data text-[.72rem] text-shigoto-mist">
                    shigoto.app
                </span>
                <span className="ml-auto flex items-center gap-2.5 text-right">
                    <span className="size-1.5 flex-none animate-shigoto-pulse rounded-full bg-shigoto-jade" />
                    <span className="leading-tight">
                        <strong className="block text-[.82rem] leading-[1.2] font-semibold text-shigoto-ink">
                            {current?.name ?? '—'}
                        </strong>
                        <span className="font-shigoto-data text-[.66rem] text-shigoto-mist">
                            {current ? roleLabels[current.roleKey] : '—'}
                        </span>
                    </span>
                </span>
            </div>

            <div className="px-[1.2rem] pt-[.85rem] pb-[.2rem] font-shigoto-data text-[.68rem] tracking-[.06em] text-shigoto-mist uppercase">
                {__('Clock-in point 01 · Main entrance')}
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
                                'grid grid-cols-[42px_1fr_auto] items-center gap-4 border-b border-shigoto-line py-[.85rem] last:border-b-0',
                            )}
                        >
                            <span
                                className={cn(
                                    'grid size-[42px] place-items-center rounded-shigoto-sm border border-shigoto-line bg-shigoto-surface-2 text-shigoto-mist transition-colors',
                                    status === 'active' &&
                                        'animate-shigoto-scan border-transparent bg-shigoto-coral-tint text-shigoto-coral',
                                    status === 'done' &&
                                        'border-transparent bg-shigoto-jade-tint text-shigoto-jade',
                                    status === 'denied' &&
                                        'border-transparent bg-shigoto-coral-tint text-shigoto-coral',
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
                                        ? 'text-shigoto-ink'
                                        : 'text-shigoto-ink-soft',
                                )}
                            >
                                {step.label}
                                <small className="mt-[.15rem] block font-shigoto-data text-[.66rem] text-shigoto-mist">
                                    {step.sub}
                                </small>
                            </span>
                            <span
                                className={cn(
                                    'inline-flex items-center gap-[.4rem] rounded-full bg-shigoto-surface-2 px-[.65rem] py-[.32rem] font-shigoto-data text-[.65rem] tracking-[.06em] whitespace-nowrap text-shigoto-mist uppercase transition-colors',
                                    status === 'active' &&
                                        'bg-shigoto-coral-tint text-shigoto-coral',
                                    status === 'done' &&
                                        'bg-shigoto-jade-tint text-shigoto-jade',
                                    status === 'denied' &&
                                        'bg-shigoto-coral-tint text-shigoto-coral',
                                )}
                            >
                                <i className="not-italic">
                                    {status === 'active'
                                        ? phaseWord[i]
                                        : status === 'done'
                                          ? __('Recorded')
                                          : status === 'denied' &&
                                              current?.flagReason
                                            ? flagLabels[current.flagReason]
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

                <div className="mt-[.3rem] flex min-h-[76px] items-center gap-4 border-t border-shigoto-line pt-[1.1rem] pb-[1.2rem]">
                    <div
                        className={cn(
                            'grid size-14 flex-none scale-[.55] place-items-center rounded-shigoto-sm opacity-0',
                            current?.flagReason
                                ? 'bg-shigoto-coral-tint text-shigoto-coral'
                                : 'bg-shigoto-jade-tint text-shigoto-jade',
                            sealOn && 'animate-shigoto-stamp',
                        )}
                    >
                        {current?.flagReason ? (
                            <X className="size-[26px]" strokeWidth={2.6} />
                        ) : (
                            <Check className="size-[26px]" strokeWidth={2.6} />
                        )}
                    </div>
                    <div>
                        <strong
                            className={cn(
                                'block font-shigoto-display text-[1.22rem] font-bold opacity-0 transition-opacity delay-[120ms] duration-300',
                                current?.flagReason
                                    ? 'text-shigoto-coral'
                                    : 'text-shigoto-ink',
                                verdictOn && 'opacity-100',
                            )}
                        >
                            {current?.flagReason
                                ? __('Flagged for review')
                                : __('Attendance recorded')}
                        </strong>
                        <span
                            className={cn(
                                'font-shigoto-data text-[.68rem] text-shigoto-mist opacity-0 transition-opacity delay-[220ms] duration-300',
                                verdictOn && 'opacity-100',
                            )}
                        >
                            {current
                                ? `M-${current.folio} · ${
                                      current.flagReason
                                          ? flagReasonsText[
                                                current.flagReason
                                            ]
                                          : __('shift: 8 hours')
                                  }`
                                : '—'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="rounded-b-shigoto-lg border-t border-shigoto-line bg-shigoto-surface-2 px-[1.2rem] pt-[.65rem] pb-[.85rem]">
                <div className="mb-[.4rem] flex items-center justify-between">
                    <span className="inline-flex items-center gap-[.4rem] font-shigoto-data text-[.68rem] tracking-[.06em] text-shigoto-mist uppercase">
                        <ScrollText className="size-[13px]" strokeWidth={1.6} />
                        {__('Immutable audit trail')}
                    </span>
                    <span className="font-shigoto-data text-[.68rem] tracking-[.06em] text-shigoto-mist uppercase">
                        {__('Recent events')}
                    </span>
                </div>
                <ol
                    aria-live="polite"
                    className="m-0 max-h-[5.6rem] list-none overflow-hidden p-0 font-shigoto-data text-[.68rem] text-shigoto-ink-soft"
                >
                    {ledger.map((entry, i) => (
                        <li
                            key={`${entry.folio}-${i}`}
                            title={
                                entry.flagReason
                                    ? flagReasonsText[entry.flagReason]
                                    : undefined
                            }
                            className={cn(
                                'flex items-center gap-[.7rem] overflow-hidden py-[.15rem] text-ellipsis whitespace-nowrap',
                                entry.fresh && 'animate-shigoto-slidein',
                            )}
                        >
                            <span>{entry.time}</span>
                            <span>M-{entry.folio}</span>
                            <span className="overflow-hidden text-ellipsis">
                                {entry.name}
                            </span>
                            <span
                                className={cn(
                                    'ml-auto inline-flex items-center gap-[.3rem]',
                                    entry.flagReason
                                        ? 'text-shigoto-coral'
                                        : 'text-shigoto-jade',
                                )}
                            >
                                {entry.flagReason ? (
                                    <X className="size-[10px]" strokeWidth={3} />
                                ) : (
                                    <Check
                                        className="size-[10px]"
                                        strokeWidth={3}
                                    />
                                )}
                                {entry.flagReason
                                    ? __('REVIEW')
                                    : __('RECORDED')}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}
