import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <linearGradient id="laravel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF2D20" />
                    <stop offset="100%" stopColor="#FF754C" />
                </linearGradient>
                <linearGradient id="react-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00F2FE" />
                    <stop offset="100%" stopColor="#4FACFE" />
                </linearGradient>
            </defs>
            <path
                d="M 32 20 L 32 80 L 58 80"
                stroke="url(#laravel-grad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <path
                d="M 32 20 H 58 C 72 20 72 46 58 46 H 32"
                stroke="url(#react-grad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.95"
            />
            <path
                d="M 45 46 L 68 80"
                stroke="url(#react-grad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}
