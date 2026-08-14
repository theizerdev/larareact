import type { SVGAttributes } from 'react';

/**
 * Marca de Hoshō (保証 · "garantía"): el escudo del isotipo oficial,
 * trazado en monolínea para heredar currentColor. Único glifo dibujado a
 * mano del landing; el resto de la iconografía usa lucide-react.
 */
export default function HoshoMark(props: SVGAttributes<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            <path d="M12 2.6 19.5 6.2V11.3C19.5 16.5 16.1 19.7 12 21.3 7.9 19.7 4.5 16.5 4.5 11.3V6.2Z" />
        </svg>
    );
}
