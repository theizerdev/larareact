import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';

export function ControlAccesoErrorBanner({ message }: { message: string }) {
    const { __ } = useTranslate();

    return (
        <Card className="border-rose-300 bg-rose-50/50 dark:bg-rose-950/10">
            <CardContent className="flex items-start gap-3 p-4">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-rose-800 dark:text-rose-400">{__('Access Control Middleware Unavailable')}</h3>
                    <p className="text-sm text-rose-700 dark:text-rose-500/90 mt-1">{message}</p>
                </div>
            </CardContent>
        </Card>
    );
}
