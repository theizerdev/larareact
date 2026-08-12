import React from 'react';

// High-Accuracy Production QR Code Component
interface QRCodeSVGProps {
    value: string;
    size?: number;
    className?: string;
}

export function QRCodeSVG({ value, size = 140, className = '' }: QRCodeSVGProps) {
    const safeValue = value || 'https://servitec.theizerdev.com';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(safeValue)}&margin=1`;

    return (
        <img
            src={qrUrl}
            alt="Código QR"
            width={size}
            height={size}
            className={`object-contain inline-block ${className}`}
            style={{ width: `${size}px`, height: `${size}px` }}
        />
    );
}
