import React from 'react';

// Lightweight pure TypeScript QR Code SVG component (No external dependencies)
// Based on standard QR Code ISO/IEC 18004 specification for Byte Mode

interface QRCodeSVGProps {
    value: string;
    size?: number;
    className?: string;
}

// Galois Field GF(256) math tables & Reed-Solomon generator polynomials for QR
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(function initGF() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        EXP_TABLE[i] = x;
        LOG_TABLE[x] = i;
        x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
    }
    for (let i = 255; i < 512; i++) {
        EXP_TABLE[i] = EXP_TABLE[i - 255];
    }
})();

function gfMul(x: number, y: number): number {
    if (x === 0 || y === 0) return 0;
    return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function rsGeneratorPoly(degree: number): number[] {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
        const next = new Array(poly.length + 1).fill(0);
        for (let j = 0; j < poly.length; j++) {
            next[j] ^= poly[j];
            next[j + 1] ^= gfMul(poly[j], EXP_TABLE[i]);
        }
        poly = next;
    }
    return poly;
}

function rsCalculateEcc(data: number[], eccLength: number): number[] {
    const poly = rsGeneratorPoly(eccLength);
    const res = new Array(eccLength).fill(0);
    for (let i = 0; i < data.length; i++) {
        const factor = data[i] ^ res[0];
        res.shift();
        res.push(0);
        for (let j = 0; j < eccLength; j++) {
            res[j] ^= gfMul(poly[j], factor);
        }
    }
    return res;
}

// Table of QR Specs: [Version, TotalModules, DataCap, EccLen, AlignPos]
// Using Medium Error Correction (M) for robust scanning
const QR_SPECS: { version: number; size: number; dataCap: number; eccLen: number; alignPos: number[] }[] = [
    { version: 1, size: 21, dataCap: 14, eccLen: 10, alignPos: [] },
    { version: 2, size: 25, dataCap: 26, eccLen: 16, alignPos: [6, 18] },
    { version: 3, size: 29, dataCap: 42, eccLen: 26, alignPos: [6, 22] },
    { version: 4, size: 33, dataCap: 62, eccLen: 36, alignPos: [6, 26] },
    { version: 5, size: 37, dataCap: 84, eccLen: 48, alignPos: [6, 30] },
    { version: 6, size: 41, dataCap: 106, eccLen: 64, alignPos: [6, 34] },
    { version: 7, size: 45, dataCap: 122, eccLen: 72, alignPos: [6, 22, 38] },
    { version: 8, size: 49, dataCap: 152, eccLen: 88, alignPos: [6, 24, 42] },
];

export function QRCodeSVG({ value, size = 140, className = '' }: QRCodeSVGProps) {
    const safeValue = value || 'https://fixsalepos.com';
    const bytes = new TextEncoder().encode(safeValue);
    const dataLen = bytes.length;

    // Pick QR Version based on data length
    let spec = QR_SPECS.find((s) => s.dataCap >= dataLen + 3);
    if (!spec) spec = QR_SPECS[QR_SPECS.length - 1];

    const N = spec.size;

    // Build Data Bitstream (Byte Mode: 0100 + 8-bit count + data + terminator + pad)
    const bits: number[] = [];
    const pushBits = (val: number, len: number) => {
        for (let i = len - 1; i >= 0; i--) {
            bits.push((val >> i) & 1);
        }
    };

    pushBits(0b0100, 4); // Byte Mode Indicator
    pushBits(dataLen, spec.version <= 9 ? 8 : 16);
    for (let i = 0; i < dataLen; i++) {
        pushBits(bytes[i], 8);
    }

    // Terminate and Pad bits to total capacity
    const totalDataBits = spec.dataCap * 8;
    while (bits.length < totalDataBits && bits.length % 8 !== 0) {
        bits.push(0);
    }
    const padBytes = [236, 17];
    let padIdx = 0;
    while (bits.length < totalDataBits) {
        pushBits(padBytes[padIdx % 2], 8);
        padIdx++;
    }

    // Convert bitstream to data bytes
    const dataBytes: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
        let b = 0;
        for (let j = 0; j < 8; j++) {
            b = (b << 1) | (bits[i + j] || 0);
        }
        dataBytes.push(b);
    }

    // Compute Reed-Solomon ECC bytes
    const eccBytes = rsCalculateEcc(dataBytes, spec.eccLen);
    const finalCodewords = [...dataBytes, ...eccBytes];

    // Convert all codewords to a final bit array for placement
    const finalBits: number[] = [];
    for (const cw of finalCodewords) {
        for (let i = 7; i >= 0; i--) {
            finalBits.push((cw >> i) & 1);
        }
    }

    // Grid matrices: matrix[r][c] is 1 (black), 0 (white), or null (unassigned)
    const matrix: (number | null)[][] = Array.from({ length: N }, () => new Array(N).fill(null));
    const isReserved: boolean[][] = Array.from({ length: N }, () => new Array(N).fill(false));

    // Place Finder Patterns (7x7 squares at 3 corners)
    const addFinder = (row: number, col: number) => {
        for (let r = -1; r <= 7; r++) {
            for (let c = -1; c <= 7; c++) {
                const mr = row + r;
                const mc = col + c;
                if (mr >= 0 && mr < N && mc >= 0 && mc < N) {
                    isReserved[mr][mc] = true;
                    if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
                        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                            matrix[mr][mc] = 1;
                        } else {
                            matrix[mr][mc] = 0;
                        }
                    } else {
                        matrix[mr][mc] = 0; // Quiet zone around finder
                    }
                }
            }
        }
    };

    addFinder(0, 0);
    addFinder(0, N - 7);
    addFinder(N - 7, 0);

    // Alignment Patterns
    if (spec.alignPos.length > 0) {
        for (const r of spec.alignPos) {
            for (const c of spec.alignPos) {
                if (isReserved[r][c]) continue;
                for (let ar = -2; ar <= 2; ar++) {
                    for (let ac = -2; ac <= 2; ac++) {
                        const mr = r + ar;
                        const mc = c + ac;
                        isReserved[mr][mc] = true;
                        if (Math.abs(ar) === 2 || Math.abs(ac) === 2 || (ar === 0 && ac === 0)) {
                            matrix[mr][mc] = 1;
                        } else {
                            matrix[mr][mc] = 0;
                        }
                    }
                }
            }
        }
    }

    // Timing Patterns (row 6 and col 6)
    for (let i = 0; i < N; i++) {
        if (!isReserved[6][i]) {
            isReserved[6][i] = true;
            matrix[6][i] = i % 2 === 0 ? 1 : 0;
        }
        if (!isReserved[i][6]) {
            isReserved[i][6] = true;
            matrix[i][6] = i % 2 === 0 ? 1 : 0;
        }
    }

    // Dark Module
    const darkRow = 4 * spec.version + 9;
    if (darkRow < N) {
        isReserved[darkRow][8] = true;
        matrix[darkRow][8] = 1;
    }

    // Reserve Format Information Areas
    for (let i = 0; i < 9; i++) {
        if (i < N) {
            if (!isReserved[8][i]) isReserved[8][i] = true;
            if (!isReserved[i][8]) isReserved[i][8] = true;
            if (N - 1 - i >= 0) {
                if (!isReserved[8][N - 1 - i]) isReserved[8][N - 1 - i] = true;
                if (!isReserved[N - 1 - i][8]) isReserved[N - 1 - i][8] = true;
            }
        }
    }

    // Place Data Bits in Matrix (zig-zag right-to-left)
    let bitIdx = 0;
    let right = N - 1;
    let dir = -1; // up = -1, down = 1

    while (right > 0) {
        if (right === 6) right--; // Skip vertical timing column
        const colList = [right, right - 1];
        const rowList = dir === -1 ? Array.from({ length: N }, (_, i) => N - 1 - i) : Array.from({ length: N }, (_, i) => i);

        for (const r of rowList) {
            for (const c of colList) {
                if (c >= 0 && !isReserved[r][c]) {
                    const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
                    // Apply Mask 0 ( (row + col) % 2 === 0 )
                    const mask = (r + c) % 2 === 0 ? 1 : 0;
                    matrix[r][c] = bit ^ mask;
                }
            }
        }
        dir = -dir;
        right -= 2;
    }

    // Format Info for ECC Level M + Mask 0
    const formatInfoBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

    // Write Format Info into Reserved Area
    let fIdx = 0;
    // Top-left horizontal
    for (let c = 0; c <= 8; c++) {
        if (c !== 6) matrix[8][c] = formatInfoBits[fIdx++];
    }
    // Top-left vertical
    fIdx = 0;
    for (let r = 8; r >= 0; r--) {
        if (r !== 6) matrix[r][8] = formatInfoBits[fIdx++];
    }
    // Right horizontal
    fIdx = 7;
    for (let c = N - 8; c < N; c++) {
        matrix[8][c] = formatInfoBits[fIdx++];
    }
    // Bottom vertical
    fIdx = 7;
    for (let r = N - 1; r >= N - 7; r--) {
        matrix[r][8] = formatInfoBits[fIdx++];
    }

    // Render SVG
    const border = 2;
    const totalSize = N + border * 2;

    const rects: React.ReactNode[] = [];
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            if (matrix[r][c] === 1) {
                rects.push(
                    <rect
                        key={`${r}-${c}`}
                        x={c + border}
                        y={r + border}
                        width={1.02}
                        height={1.02}
                        fill="black"
                    />
                );
            }
        }
    }

    return (
        <svg
            viewBox={`0 0 ${totalSize} ${totalSize}`}
            width={size}
            height={size}
            className={`bg-white border border-black p-1 mx-auto block ${className}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect x="0" y="0" width={totalSize} height={totalSize} fill="white" />
            {rects}
        </svg>
    );
}
