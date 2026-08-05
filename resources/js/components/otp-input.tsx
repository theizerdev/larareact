import React, { useState, useRef, useEffect } from 'react';
import { Clipboard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OtpInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    onComplete?: (code: string) => void;
    disabled?: boolean;
    autoFocus?: boolean;
}

export default function OtpInput({
    length = 8,
    value,
    onChange,
    onComplete,
    disabled = false,
    autoFocus = true,
}: OtpInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [digits, setDigits] = useState<string[]>(() => {
        const initial = value.split('').slice(0, length);
        while (initial.length < length) initial.push('');
        return initial;
    });
    const [clipboardText, setClipboardText] = useState<string | null>(null);
    const [isPasted, setIsPasted] = useState(false);

    // Synchronize external value changes
    useEffect(() => {
        if (value.length === 0) {
            setDigits(Array(length).fill(''));
        }
    }, [value, length]);

    // Focus first input on mount
    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0]?.focus();
        }
    }, [autoFocus]);

    // Check clipboard for available code on focus or mount
    const checkClipboard = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                const clean = text.replace(/\D/g, '').slice(0, length);
                if (clean.length === length) {
                    setClipboardText(clean);
                } else {
                    setClipboardText(null);
                }
            }
        } catch (e) {
            setClipboardText(null);
        }
    };

    useEffect(() => {
        checkClipboard();
        window.addEventListener('focus', checkClipboard);
        return () => window.removeEventListener('focus', checkClipboard);
    }, [length]);

    const updateDigits = (newDigits: string[]) => {
        setDigits(newDigits);
        const codeString = newDigits.join('');
        onChange(codeString);

        if (codeString.length === length && onComplete) {
            onComplete(codeString);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const inputVal = e.target.value;
        const lastDigit = inputVal.replace(/\D/g, '').slice(-1);

        const newDigits = [...digits];
        newDigits[index] = lastDigit;

        updateDigits(newDigits);

        if (lastDigit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const newDigits = [...digits];

            if (newDigits[index]) {
                newDigits[index] = '';
                updateDigits(newDigits);
            } else if (index > 0) {
                newDigits[index - 1] = '';
                updateDigits(newDigits);
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        applyPastedCode(pastedText);
    };

    const applyPastedCode = (rawText: string) => {
        const cleanCode = rawText.replace(/\D/g, '').slice(0, length);
        if (!cleanCode) return;

        const newDigits = Array(length).fill('');
        for (let i = 0; i < cleanCode.length; i++) {
            newDigits[i] = cleanCode[i];
        }

        updateDigits(newDigits);

        setIsPasted(true);
        setTimeout(() => setIsPasted(false), 2000);

        const focusIndex = Math.min(cleanCode.length, length - 1);
        inputRefs.current[focusIndex]?.focus();
    };

    const handlePasteClick = async () => {
        try {
            const text = await navigator.clipboard.readText();
            applyPastedCode(text);
        } catch (e) {
            if (clipboardText) {
                applyPastedCode(clipboardText);
            }
        }
    };

    return (
        <div className="space-y-3">
            {/* Input boxes for each digit */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                {digits.map((digit, index) => (
                    <React.Fragment key={index}>
                        <input
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onPaste={handlePaste}
                            disabled={disabled}
                            className={`w-9 h-12 sm:w-11 sm:h-13 text-center text-xl font-bold font-mono rounded-lg border transition-all duration-150 outline-none select-none shadow-sm ${
                                digit
                                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                                    : 'border-input bg-background text-foreground hover:border-muted-foreground/40 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/30'
                            }`}
                        />
                        {length === 8 && index === 3 && (
                            <span className="text-muted-foreground/40 font-bold px-0.5 select-none">-</span>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Paste Code Button */}
            <div className="flex justify-center">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePasteClick}
                    disabled={disabled}
                    className="h-8 text-xs font-semibold text-indigo-600 border-indigo-200 dark:border-indigo-900/60 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 gap-1.5 rounded-full px-3 transition-all"
                >
                    {isPasted ? (
                        <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Código pegado</span>
                        </>
                    ) : (
                        <>
                            <Clipboard className="h-3.5 w-3.5" />
                            <span>Pegar código {clipboardText ? `(${clipboardText})` : ''}</span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
