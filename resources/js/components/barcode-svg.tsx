import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeSVGProps {
    value: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
    format?: string;
    className?: string;
}

export function BarcodeSVG({
    value,
    width = 1.6,
    height = 45,
    displayValue = false,
    fontSize = 12,
    margin = 0,
    format = 'CODE128',
    className = '',
}: BarcodeSVGProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current && value) {
            try {
                JsBarcode(svgRef.current, String(value), {
                    format,
                    width,
                    height,
                    displayValue,
                    fontSize,
                    margin,
                    background: 'transparent',
                    lineColor: '#000000',
                });
            } catch (err) {
                console.error('[BarcodeSVG Error]', err);
            }
        }
    }, [value, width, height, displayValue, fontSize, margin, format]);

    if (!value) return null;

    return <svg ref={svgRef} className={className} />;
}
