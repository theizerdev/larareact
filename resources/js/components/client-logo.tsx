import { useState } from 'react';

const CLIENT_NAME = 'Smurfit Westrock';
const CLIENT_LOGO = '/image/logo/clientes/smurfit-westrock-logo.png';
const CLIENT_LOGO_DARK = '/image/logo/clientes/smurfit-westrock-logo-dark.png';

export default function ClientLogo({
    className = 'h-10 w-auto object-contain',
    textClassName = 'text-sm font-semibold',
    onDarkBackground = false,
}: {
    className?: string;
    textClassName?: string;
    onDarkBackground?: boolean;
}) {
    const [failed, setFailed] = useState(false);

    if (failed) {
        return <span className={textClassName}>{CLIENT_NAME}</span>;
    }

    if (onDarkBackground) {
        return (
            <img
                src={CLIENT_LOGO_DARK}
                alt={CLIENT_NAME}
                className={className}
                onError={() => setFailed(true)}
            />
        );
    }

    return (
        <>
            <img
                src={CLIENT_LOGO}
                alt={CLIENT_NAME}
                className={`${className} dark:hidden`}
                onError={() => setFailed(true)}
            />
            <img
                src={CLIENT_LOGO_DARK}
                alt={CLIENT_NAME}
                className={`${className} hidden dark:block`}
                onError={() => setFailed(true)}
            />
        </>
    );
}
