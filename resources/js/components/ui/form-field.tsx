import * as React from 'react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FormFieldProps = {
    label?: string;
    htmlFor?: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
    required?: boolean;
};

function FormField({
    label,
    htmlFor,
    error,
    children,
    className,
    required,
}: FormFieldProps) {
    return (
        <div className={cn('grid gap-2', className)}>
            {label && (
                <Label htmlFor={htmlFor}>
                    {label}
                    {required && (
                        <span className="ml-0.5 text-destructive">*</span>
                    )}
                </Label>
            )}
            {children}
            <InputError message={error} />
        </div>
    );
}

export { FormField };
