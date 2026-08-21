import { Headset } from 'lucide-react';

const GLPI_URL = 'https://itsm-driscolls.innovacionmovil.com/';

export function HelpDeskButton() {
    return (
        <a
            href={GLPI_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Mesa de ayuda (GLPI)"
            aria-label="Mesa de ayuda (GLPI)"
            className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-violet-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
            <Headset className="h-6 w-6" />
        </a>
    );
}
