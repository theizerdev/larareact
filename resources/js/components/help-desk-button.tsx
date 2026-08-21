import { Headset } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const GLPI_HELPDESK_URL = 'https://glpi.innovacionmovil.com/';

export default function HelpDeskButton() {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <a
                    href={GLPI_HELPDESK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Mesa de Ayuda"
                    className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-110 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                    <span className="absolute inset-0 -z-10 rounded-full bg-primary/60 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    <Headset className="size-6" />
                </a>
            </TooltipTrigger>
            <TooltipContent side="left">Mesa de Ayuda</TooltipContent>
        </Tooltip>
    );
}
