import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'ghost' | 'ghost-band';
type ButtonSize = 'md' | 'sm';

const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-all duration-200 [&_svg]:size-[15px] [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-[3px]';

const sizes: Record<ButtonSize, string> = {
    md: 'px-6 py-3.5 text-sm',
    sm: 'px-4.5 py-2.5 text-[13px]',
};

const variants: Record<ButtonVariant, string> = {
    primary:
        'bg-hosho-indigo text-white shadow-[0_10px_24px_-10px_rgba(59,79,224,.55)] hover:bg-hosho-indigo-deep hover:-translate-y-px hover:shadow-[0_14px_28px_-10px_rgba(59,79,224,.6)]',
    ghost: 'border border-hosho-line bg-hosho-surface text-hosho-ink hover:border-hosho-indigo hover:text-hosho-indigo hover:bg-hosho-indigo-tint',
    'ghost-band':
        'border border-white/[0.18] text-hosho-navy-ink hover:border-white/[0.32] hover:bg-white/[0.08]',
};

export function hoshoButtonClass(
    variant: ButtonVariant = 'primary',
    size: ButtonSize = 'md',
    className?: string,
) {
    return cn(base, sizes[size], variants[variant], className);
}
