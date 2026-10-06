import { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Bot, 
    X, 
    Send, 
    Mic, 
    MicOff, 
    RotateCcw, 
    Sparkles, 
    CheckCircle2, 
    AlertTriangle, 
    ExternalLink, 
    MessageSquare, 
    Wrench, 
    Package, 
    ChevronDown,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';

interface QuickAction {
    label: string;
    action?: string;
    params?: Record<string, any>;
    url?: string;
    type?: 'link' | 'action';
    variant?: 'primary' | 'success' | 'warning' | 'default';
    text?: string;
}

interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
    type?: string;
    data?: any;
    quick_actions?: QuickAction[];
    whatsapp?: any;
    order?: any;
    summary?: any;
    items?: any[];
}

export default function FloatingAssistantWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        const saved = sessionStorage.getItem('fixsale_assistant_chat');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                // Ignore parse errors
            }
        }
        return [
            {
                id: 'welcome',
                sender: 'assistant',
                text: '¡Hola! Soy tu copiloto interno de FixSale. Puedes consultarme órdenes por número (ej: **orden 1**), cambiar estados (**estado 1 listo**), consultar el resumen del taller o alertas de stock.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                quick_actions: [
                    { label: '📊 Resumen de Hoy', action: 'get_summary' },
                    { label: '⚠️ Alertas de Stock', action: 'get_stock_alerts' },
                    { label: '❓ Ver Comandos', text: 'ayuda' },
                ],
            },
        ];
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    // Guardar historial en sessionStorage
    useEffect(() => {
        sessionStorage.setItem('fixsale_assistant_chat', JSON.stringify(messages));
    }, [messages]);

    // Scroll automático al último mensaje
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen, isMinimized, messages, scrollToBottom]);

    // Inicializar reconocimiento de voz (Web Speech API)
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setSpeechSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'es-ES';

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
                // Enviar automáticamente si se reconoció la frase
                setTimeout(() => handleSendMessage(transcript), 300);
            };

            recognition.onerror = () => {
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleSpeech = () => {
        if (!speechSupported || !recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                setIsListening(false);
            }
        }
    };

    const getCsrfToken = () => {
        return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    };

    const handleSendMessage = async (customText?: string) => {
        const queryText = (customText !== undefined ? customText : input).trim();
        if (!queryText || loading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: queryText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/admin/assistant/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ message: queryText }),
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'assistant',
                text: data.message || 'Operación completada.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: data.type,
                quick_actions: data.quick_actions,
                whatsapp: data.whatsapp,
                order: data.order,
                summary: data.summary,
                items: data.items,
            };

            setMessages((prev) => [...prev, botMsg]);
        } catch (error) {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'assistant',
                text: '⚠️ Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAction = async (actionItem: QuickAction) => {
        if (actionItem.url) {
            router.visit(actionItem.url);
            return;
        }

        if (actionItem.text) {
            handleSendMessage(actionItem.text);
            return;
        }

        if (actionItem.action) {
            setLoading(true);
            try {
                const res = await fetch('/admin/assistant/action', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        action: actionItem.action,
                        params: actionItem.params || {},
                    }),
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                const botMsg: ChatMessage = {
                    id: Date.now().toString(),
                    sender: 'assistant',
                    text: data.message || 'Acción ejecutada.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: data.type,
                    quick_actions: data.quick_actions,
                    whatsapp: data.whatsapp,
                    order: data.order,
                    summary: data.summary,
                    items: data.items,
                };

                setMessages((prev) => [...prev, botMsg]);
            } catch (err) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        sender: 'assistant',
                        text: '⚠️ Error al ejecutar la acción.',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                ]);
            } finally {
                setLoading(false);
            }
        }
    };

    const clearChat = () => {
        const welcome: ChatMessage = {
            id: Date.now().toString(),
            sender: 'assistant',
            text: 'Conversación reiniciada. ¿En qué te ayudo ahora?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quick_actions: [
                { label: '📊 Resumen de Hoy', action: 'get_summary' },
                { label: '⚠️ Alertas de Stock', action: 'get_stock_alerts' },
                { label: '❓ Comandos', text: 'ayuda' },
            ],
        };
        setMessages([welcome]);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
            {/* Ventana de Chat */}
            {isOpen && (
                <div
                    className={cn(
                        'w-[92vw] sm:w-[430px] rounded-2xl shadow-2xl border border-border/80 bg-background/95 backdrop-blur-xl transition-all duration-300 flex flex-col overflow-hidden mb-3',
                        isMinimized ? 'h-14' : 'h-[580px] max-h-[82vh]'
                    )}
                >
                    {/* Header del Chat */}
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-between shadow-sm select-none">
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-indigo-600 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold leading-tight flex items-center gap-1.5">
                                    Copiloto FixSale
                                    <span className="text-[10px] font-medium bg-white/20 px-1.5 py-0.5 rounded-full">
                                        Fase 1
                                    </span>
                                </h3>
                                <p className="text-[11px] text-white/80 leading-tight">
                                    Taller, Órdenes y Stock
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={clearChat}
                                title="Reiniciar chat"
                                className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                title={isMinimized ? 'Expandir' : 'Minimizar'}
                                className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                            >
                                <ChevronDown
                                    className={cn('w-4 h-4 transition-transform', isMinimized && 'rotate-180')}
                                />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                title="Cerrar"
                                className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Cuerpo del Chat */}
                    {!isMinimized && (
                        <>
                            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-muted/20">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            'flex flex-col',
                                            msg.sender === 'user' ? 'items-end' : 'items-start'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm',
                                                msg.sender === 'user'
                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
                                                    : 'bg-card border border-border/80 text-foreground rounded-tl-none'
                                            )}
                                        >
                                            <p className="whitespace-pre-line">{msg.text}</p>

                                            {/* Tarjeta de Orden Detallada */}
                                            {msg.order && (
                                                <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1.5 text-[11px]">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-primary">
                                                            #{msg.order.numero_orden}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                                            {msg.order.estado_label}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-muted-foreground">
                                                        <div>👤 {msg.order.cliente_nombre}</div>
                                                        <div>📞 {msg.order.cliente_telefono}</div>
                                                        <div className="col-span-2">📱 {msg.order.equipo}</div>
                                                        <div>👨‍🔧 {msg.order.tecnico}</div>
                                                        <div>💰 Saldo: {msg.order.saldo_restante}</div>
                                                    </div>
                                                    {msg.order.falla && (
                                                        <div className="text-[10px] bg-muted/50 p-1.5 rounded-lg border border-border/30 mt-1">
                                                            <span className="font-medium">Falla:</span> {msg.order.falla}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Tarjeta de Resumen del Taller */}
                                            {msg.summary && (
                                                <div className="mt-2.5 grid grid-cols-2 gap-1.5 pt-2 border-t border-border/40">
                                                    <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-xl text-center">
                                                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                            {msg.summary.recibidas_hoy}
                                                        </div>
                                                        <div className="text-[9px] text-muted-foreground uppercase font-medium">
                                                            Nuevas Hoy
                                                        </div>
                                                    </div>
                                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-center">
                                                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                            {msg.summary.listo_para_retiro}
                                                        </div>
                                                        <div className="text-[9px] text-muted-foreground uppercase font-medium">
                                                            Listos Retiro
                                                        </div>
                                                    </div>
                                                    <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl text-center">
                                                        <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                                            {msg.summary.en_reparacion}
                                                        </div>
                                                        <div className="text-[9px] text-muted-foreground uppercase font-medium">
                                                            En Reparación
                                                        </div>
                                                    </div>
                                                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-xl text-center">
                                                        <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                            {msg.summary.total_activas}
                                                        </div>
                                                        <div className="text-[9px] text-muted-foreground uppercase font-medium">
                                                            Total Activas
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Botones de Acciones Rápidas */}
                                            {msg.quick_actions && msg.quick_actions.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-1.5 pt-1.5 border-t border-border/30">
                                                    {msg.quick_actions.map((qa, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleQuickAction(qa)}
                                                            className={cn(
                                                                'px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all inline-flex items-center gap-1 shadow-xs',
                                                                qa.variant === 'success'
                                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                                    : qa.variant === 'primary'
                                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/50'
                                                            )}
                                                        >
                                                            {qa.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[9px] text-muted-foreground/70 mt-1 px-1">
                                            {msg.timestamp}
                                        </span>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                        Consultando sistema...
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Barra de Sugerencias Rápidas */}
                            <div className="px-3 py-1.5 bg-muted/40 border-t border-border/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
                                <button
                                    onClick={() => handleSendMessage('resumen hoy')}
                                    className="px-2 py-0.5 rounded-full bg-background border border-border/60 hover:border-primary text-muted-foreground hover:text-foreground text-[10px] font-medium whitespace-nowrap transition-colors"
                                >
                                    📊 Resumen
                                </button>
                                <button
                                    onClick={() => handleSendMessage('alertas stock')}
                                    className="px-2 py-0.5 rounded-full bg-background border border-border/60 hover:border-primary text-muted-foreground hover:text-foreground text-[10px] font-medium whitespace-nowrap transition-colors"
                                >
                                    ⚠️ Stock Bajo
                                </button>
                                <button
                                    onClick={() => handleSendMessage('ayuda')}
                                    className="px-2 py-0.5 rounded-full bg-background border border-border/60 hover:border-primary text-muted-foreground hover:text-foreground text-[10px] font-medium whitespace-nowrap transition-colors"
                                >
                                    ❓ Comandos
                                </button>
                            </div>

                            {/* Formulario de Entrada */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="p-3 bg-card border-t border-border flex items-center gap-2"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={
                                        isListening
                                            ? '🎙️ Escuchando tu voz...'
                                            : "Ej: 'orden 1', 'estado 1 listo', 'resumen'..."
                                    }
                                    disabled={loading}
                                    className={cn(
                                        'flex-1 text-xs px-3 py-2 rounded-xl bg-muted/40 border border-input focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all',
                                        isListening && 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                                    )}
                                />

                                {speechSupported && (
                                    <button
                                        type="button"
                                        onClick={toggleSpeech}
                                        title={isListening ? 'Detener dictado' : 'Hablar por micrófono'}
                                        className={cn(
                                            'p-2 rounded-xl transition-all',
                                            isListening
                                                ? 'bg-rose-500 text-white animate-pulse shadow-md'
                                                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-40 transition-all shadow-md active:scale-95"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}

            {/* Botón Flotante Principal */}
            {!isOpen && (
                <button
                    onClick={() => {
                        setIsOpen(true);
                        setIsMinimized(false);
                    }}
                    className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
                    title="Abrir Copiloto FixSale"
                >
                    <div className="relative">
                        <Bot className="w-5 h-5 text-white" />
                        <Sparkles className="w-2.5 h-2.5 text-amber-300 absolute -top-1 -right-1 animate-ping" />
                    </div>
                    <span className="text-xs font-bold tracking-wide">
                        Copiloto
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white/40" />
                </button>
            )}
        </div>
    );
}
