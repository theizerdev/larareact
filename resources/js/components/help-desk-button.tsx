import { useState, useRef, useEffect, useCallback } from 'react';
import { Headset, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const GLPI_HELPDESK_URL = 'https://itsm-driscolls.innovacionmovil.com/';
const HOVER_EXPAND_DELAY = 1200; // 1.2 segundos de espera para evitar activaciones accidentales
const AUTO_COLLAPSE_DELAY = 1800; // 1.8 segundos de gracia tras salir el cursor antes de replegarse

export function HelpDeskButton() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimers = useCallback(() => {
        if (expandTimerRef.current) {
            clearTimeout(expandTimerRef.current);
            expandTimerRef.current = null;
        }
        if (collapseTimerRef.current) {
            clearTimeout(collapseTimerRef.current);
            collapseTimerRef.current = null;
        }
    }, []);

    // Limpieza de temporizadores al desmontar el componente
    useEffect(() => {
        return () => clearTimers();
    }, [clearTimers]);

    const handleMouseEnter = () => {
        // Cancelar temporizador de repliegue si el usuario regresa con el cursor
        if (collapseTimerRef.current) {
            clearTimeout(collapseTimerRef.current);
            collapseTimerRef.current = null;
        }

        if (!isExpanded) {
            setIsHovering(true);
            expandTimerRef.current = setTimeout(() => {
                setIsExpanded(true);
                setIsHovering(false);
            }, HOVER_EXPAND_DELAY);
        }
    };

    const handleMouseLeave = () => {
        // Si el usuario pasa de largo antes de cumplir el retardo, abortar despliegue de inmediato
        if (expandTimerRef.current) {
            clearTimeout(expandTimerRef.current);
            expandTimerRef.current = null;
        }
        setIsHovering(false);

        // Si ya está desplegado, iniciar tiempo de gracia antes de ocultarlo en el lateral
        if (isExpanded) {
            collapseTimerRef.current = setTimeout(() => {
                setIsExpanded(false);
            }, AUTO_COLLAPSE_DELAY);
        }
    };

    const handleManualCollapse = (e: React.MouseEvent) => {
        e.stopPropagation();
        clearTimers();
        setIsExpanded(false);
        setIsHovering(false);
    };

    const handleTabClick = () => {
        clearTimers();
        setIsExpanded((prev) => !prev);
    };

    return (
        <aside
            aria-label="Mesa de Ayuda"
            className={cn(
                'fixed right-0 bottom-8 z-40 flex items-center transition-all duration-300 ease-out select-none',
                isExpanded
                    ? 'translate-x-0'
                    : isHovering
                      ? 'translate-x-[calc(100%-18px)] cursor-pointer'
                      : 'translate-x-[calc(100%-12px)] cursor-pointer'
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex h-12 items-center rounded-l-2xl border-l border-y border-primary-foreground/20 bg-primary text-primary-foreground shadow-2xl shadow-primary/30">
                {/* Pestaña lateral que asoma discretamente en el borde */}
                <button
                    type="button"
                    onClick={handleTabClick}
                    aria-label={isExpanded ? 'Ocultar Mesa de Ayuda' : 'Mostrar Mesa de Ayuda'}
                    title="Mesa de Ayuda (mantén el cursor 1s en el lateral para desplegar)"
                    className="flex h-full w-4 cursor-pointer items-center justify-center transition-colors hover:bg-primary-foreground/10 focus:outline-none"
                >
                    <div
                        className={cn(
                            'w-1 rounded-full bg-primary-foreground/60 transition-all duration-300',
                            isHovering ? 'h-7 bg-primary-foreground' : 'h-4'
                        )}
                    />
                </button>

                {/* Enlace principal a Mesa de Ayuda (visible y activo al desplegarse) */}
                <a
                    href={GLPI_HELPDESK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Mesa de Ayuda (abrir soporte GLPI)"
                    className={cn(
                        'flex items-center gap-2.5 py-1.5 pl-1.5 pr-3 transition-opacity duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-1',
                        isExpanded ? 'opacity-100' : 'pointer-events-none opacity-0'
                    )}
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/20 text-primary-foreground shadow-inner">
                        <Headset className="size-4.5" />
                    </div>
                    <div className="flex flex-col pr-1 text-left">
                        <span className="text-xs font-semibold whitespace-nowrap leading-tight">Mesa de Ayuda</span>
                        <span className="text-[10px] whitespace-nowrap leading-tight text-primary-foreground/75">Soporte GLPI &rarr;</span>
                    </div>
                </a>

                {/* Botón para replegar manualmente al instante */}
                {isExpanded && (
                    <button
                        type="button"
                        onClick={handleManualCollapse}
                        aria-label="Ocultar Mesa de Ayuda en lateral"
                        title="Ocultar en lateral"
                        className="mr-2 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-primary-foreground/70 transition-colors hover:bg-primary-foreground/20 hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                )}
            </div>
        </aside>
    );
}

export default HelpDeskButton;