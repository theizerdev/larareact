import * as React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type SectionCardProps = {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    headerAction?: React.ReactNode;
};

function SectionCard({
    title,
    description,
    children,
    className,
    headerAction,
}: SectionCardProps) {
    return (
        <Card className={cn('overflow-hidden', className)}>
            {(title || description || headerAction) && (
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                        {title && <CardTitle>{title}</CardTitle>}
                        {description && (
                            <CardDescription>{description}</CardDescription>
                        )}
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </CardHeader>
            )}
            <CardContent>{children}</CardContent>
        </Card>
    );
}

export { SectionCard };
