import { BadgeCheck } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';

export default function ComplianceMarquee() {
    const { __ } = useTranslate();

    const items = [
        __('CTPAT'),
        __('OEA · Authorized Economic Operator'),
        __('ISO/IEC 27001'),
        __('ISO/IEC 20000'),
        __('ISO 9001'),
        __('PLD'),
        __('AML'),
        __('Certified liveness detection'),
        __('Official document validation'),
        __('Timestamped audit trail'),
    ];
    const track = [...items, ...items];

    return (
        <div
            aria-label={__('Regulatory frameworks covered')}
            className="overflow-hidden bg-hosho-navy py-4"
        >
            <div className="flex w-max animate-hosho-marquee gap-3">
                {track.map((label, i) => (
                    <span
                        key={i}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-[.45rem] pr-[.9rem] pl-[.7rem] font-hosho-data text-[.72rem] whitespace-nowrap text-[#C7CCE6]"
                    >
                        <BadgeCheck
                            className="size-3.5 text-hosho-coral"
                            strokeWidth={1.6}
                        />
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
}
