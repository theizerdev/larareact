import { Check, X, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoxPasswordRequirementsProps {
    password: string;
    minLength?: number;
    historyLimit?: number;
    className?: string;
}

export function SoxPasswordRequirements({
    password,
    minLength = 15,
    historyLimit = 8,
    className,
}: SoxPasswordRequirementsProps) {
    const hasMinLength = password.length >= minLength;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasMixedCase = hasLower && hasUpper;
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    const rules = [
        { label: `Mínimo ${minLength} caracteres`, valid: hasMinLength },
        { label: 'Mayúsculas y minúsculas combinadas', valid: hasMixedCase },
        { label: 'Al menos un número (0-9)', valid: hasNumber },
        { label: 'Al menos un carácter especial (@$!%*?&#...)', valid: hasSymbol },
        { label: `No coincide con las últimas ${historyLimit} contraseñas`, valid: true, note: 'Validado al guardar' },
    ];

    const passedCount = [hasMinLength, hasMixedCase, hasNumber, hasSymbol].filter(Boolean).length;
    const progressPercent = (passedCount / 4) * 100;

    return (
        <div className={cn('rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-3', className)}>
            <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-foreground/90">
                    <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                    Requisitos de Seguridad SOX 404
                </span>
                <span className={cn(
                    'font-medium text-[11px] px-2 py-0.5 rounded-full',
                    passedCount === 4
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                )}>
                    {passedCount}/4 requisitos
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={cn(
                        'h-full transition-all duration-300',
                        progressPercent === 100
                            ? 'bg-emerald-500'
                            : progressPercent >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                    )}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                {rules.map((rule, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                        <span
                            className={cn(
                                'flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] transition-colors',
                                rule.valid
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                            )}
                        >
                            {rule.valid ? <Check className="size-2.5 stroke-[3]" /> : <X className="size-2.5" />}
                        </span>
                        <span className={cn(rule.valid && 'text-foreground font-medium', 'truncate')}>
                            {rule.label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default SoxPasswordRequirements;
