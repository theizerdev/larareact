import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <defs>
                <linearGradient
                    id="fixsale-navy-grad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor="#0B2545" />
                    <stop offset="100%" stopColor="#134074" />
                </linearGradient>
                <linearGradient
                    id="fixsale-cyan-grad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor="#00F2FE" />
                    <stop offset="100%" stopColor="#4FACFE" />
                </linearGradient>
            </defs>
            {/* Background Shield / Rounded Box */}
            <rect width="90" height="90" x="5" y="5" rx="20" fill="url(#fixsale-navy-grad)" />

            {/* Letter F + X Cross Icon */}
            <path
                d="M 28 26 H 72 M 28 26 V 74 M 28 48 H 60"
                stroke="#FFFFFF"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            {/* Tech Cross Accent (X Node) */}
            <path
                d="M 52 56 L 74 74 M 74 56 L 52 74"
                stroke="url(#fixsale-cyan-grad)"
                strokeWidth="7.5"
                strokeLinecap="round"
                fill="none"
            />
            {/* Precision Dot */}
            <circle cx="74" cy="26" r="4.5" fill="url(#fixsale-cyan-grad)" />
        </svg>
    );
}
