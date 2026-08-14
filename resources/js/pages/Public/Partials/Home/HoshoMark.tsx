import type { SVGAttributes } from 'react';

/**
 * Marca de Hoshō (保証 · "garantía"): un techo/torii sobre una base,
 * evocando puerta de acceso y resguardo. Único glifo dibujado a mano del
 * landing; el resto de la iconografía usa lucide-react.
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
            <path d="M4 10.5 12 4l8 6.5" />
            <path d="M6 9.5V20h12V9.5" />
            <path d="M10 20v-5.5h4V20" />
        </svg>
    );
}
