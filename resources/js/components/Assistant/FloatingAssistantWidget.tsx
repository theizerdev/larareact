import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
    XCircle,
    ExternalLink,
    ChevronDown,
    Loader2,
    Maximize2,
    Minimize2,
    Copy,
    Check,
    User as UserIcon,
    HelpCircle,
    CornerDownLeft,
    ChevronRight,
    Trash2,
    Link2,
    UserPlus,
    Wrench,
    Tag,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import MessageContent from './MessageContent';
import {
    ASSISTANT_COMMANDS,
    COMMAND_CATEGORIES,
    suggestCommands,
    type AssistantCommand,
    type CommandCategoryId,
} from './assistantCommands';

interface QuickAction {
    label: string;
    action?: string;
    params?: Record<string, any>;
    url?: string;
    type?: 'link' | 'action';
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
    text?: string;
    prefill?: boolean;
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
    quote?: any;
    price_card?: any;
    deleted_order?: any;
    today_sales?: any;
}

type MessageTone = 'default' | 'success' | 'warning' | 'error' | 'danger';

const STORAGE_MESSAGES = 'fixsale_assistant_chat';
const STORAGE_HISTORY = 'fixsale_assistant_history';
const MAX_HISTORY = 30;

const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const WELCOME_ACTIONS: QuickAction[] = [
    { label: '📊 Resumen Taller', action: 'get_summary' },
    { label: '📈 Ventas Hoy', text: 'ventas hoy' },
    { label: '💡 Cotizar', text: 'cotizar pantalla', prefill: true },
    { label: '💰 Estado Caja', action: 'get_cash_status' },
    { label: '💳 Deudas Clientes', action: 'list_debtors' },
    { label: '👤 Clientes', action: 'list_clientes' },
    { label: '🎯 Metas Ventas', action: 'get_sales_goals' },
    { label: '📦 Ver Kardex', action: 'get_kardex' },
    { label: '🏦 Fondo Mes', action: 'get_monthly_fund' },
    { label: '⚠️ Alertas Stock', action: 'get_stock_alerts' },
    { label: '❓ Comandos', text: 'ayuda' },
];

const buildWelcome = (text: string, id = 'welcome'): ChatMessage => ({
    id,
    sender: 'assistant',
    text,
    timestamp: nowLabel(),
    quick_actions: WELCOME_ACTIONS,
});

const WELCOME_TEXT =
    '¡Hola! Soy Fixy, tu copilot de FixSale. Puedo ayudarte con servicio técnico y creación de órdenes, caja chica, cobranzas y clientes, inventario y Kardex, catálogo y finanzas.\n\nEscribe un comando o elige una categoría abajo.';

const toneFor = (type?: string): MessageTone => {
    if (!type) return 'default';
    if (type === 'error') return 'error';
    if (type === 'repair_deleted') return 'danger';
    if (['not_found', 'unknown', 'need_brand', 'client_exists', 'info', 'cash_closed', 'confirm_delete'].includes(type)) return 'warning';
    if (type === 'product_price' || type.endsWith('_created') || ['stock_adjusted', 'whatsapp_sent', 'status_updated', 'updated', 'cash_opened', 'credit_payment'].includes(type)) {
        return 'success';
    }
    return 'default';
};

const TONE_STYLES: Record<MessageTone, { bar: string; badge: string; label: string }> = {
    default: { bar: '', badge: '', label: '' },
    success: {
        bar: 'border-l-4 border-l-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        label: 'Completado',
    },
    warning: {
        bar: 'border-l-4 border-l-amber-500',
        badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
        label: 'Atención',
    },
    error: {
        bar: 'border-l-4 border-l-rose-500',
        badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
        label: 'Error',
    },
    danger: {
        bar: 'border-l-4 border-l-red-600',
        badge: 'bg-red-600/10 text-red-700 dark:text-red-300',
        label: 'Eliminado',
    },
};

/** Colores del badge de estado según la clave de estado de la orden */
const ORDER_STATUS_STYLES: Record<string, string> = {
    recibido: 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300',
    en_diagnostico_presupuesto: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    confirmacion_presupuesto: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    espera_refaccion: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
    en_reparacion: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    listo_reparado: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    listo_sin_solucion: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    entregado_finalizado: 'border-green-700/30 bg-green-700/10 text-green-800 dark:text-green-300',
    reincidencia_garantia: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
};

const orderStatusClass = (key?: string) =>
    ORDER_STATUS_STYLES[key ?? ''] ?? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300';

const ORDER_STEPS = [
    { label: 'Recepción', step: 1 },
    { label: 'Diagnóstico', step: 2 },
    { label: 'Reparación', step: 3 },
    { label: 'Listo', step: 4 },
    { label: 'Entregado', step: 5 },
];

const getOrderStep = (key?: string): number => {
    switch (key) {
        case 'recibido':
            return 1;
        case 'en_diagnostico_presupuesto':
        case 'confirmacion_presupuesto':
            return 2;
        case 'en_reparacion':
        case 'espera_refaccion':
            return 3;
        case 'listo_reparado':
        case 'listo_sin_solucion':
            return 4;
        case 'entregado_finalizado':
        case 'reincidencia_garantia':
            return 5;
        default:
            return 1;
    }
};

const stripMarkdown = (text: string) => text.replace(/\*\*/g, '').replace(/`/g, '');

const loadHistory = (): string[] => {
    try {
        const raw = localStorage.getItem(STORAGE_HISTORY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    } catch {
        return [];
    }
};

export default function FloatingAssistantWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [activeCategory, setActiveCategory] = useState<CommandCategoryId | null>(null);
    const [suggestIndex, setSuggestIndex] = useState(-1);
    const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_MESSAGES);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {
            // Ignorar errores de parseo
        }
        return [buildWelcome(WELCOME_TEXT)];
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const sendRef = useRef<(text?: string) => void>(() => {});
    const historyRef = useRef<string[]>(loadHistory());
    const historyPosRef = useRef(-1);
    const draftRef = useRef('');

    const suggestions = useMemo<AssistantCommand[]>(() => {
        if (loading || isListening || suggestionsDismissed) return [];
        return suggestCommands(input);
    }, [input, loading, isListening, suggestionsDismissed]);

    // Guardar historial de mensajes en sessionStorage
    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
        } catch {
            // Almacenamiento no disponible
        }
    }, [messages]);

    // Scroll automático al último mensaje
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, []);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
        }
    }, [isOpen, isMinimized, isExpanded, messages, loading, scrollToBottom]);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            const timer = setTimeout(() => inputRef.current?.focus(), 150);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isMinimized]);

    // Atajo de teclado: Escape cierra el panel de categorías
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && activeCategory) {
                setActiveCategory(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, activeCategory]);

    // Reconocimiento de voz (Web Speech API)
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setIsListening(false);
            setTimeout(() => sendRef.current(transcript), 300);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
    }, []);

    const toggleSpeech = () => {
        if (!speechSupported || !recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch {
            setIsListening(false);
        }
    };

    const getCsrfToken = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

    const rememberCommand = (text: string) => {
        const history = historyRef.current;
        if (history[history.length - 1] !== text) {
            history.push(text);
            if (history.length > MAX_HISTORY) history.shift();
            try {
                localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history));
            } catch {
                // Almacenamiento no disponible
            }
        }
        historyPosRef.current = -1;
        draftRef.current = '';
    };

    const toBotMessage = (data: any, fallback: string): ChatMessage => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender: 'assistant',
        text: data?.message || fallback,
        timestamp: nowLabel(),
        type: data?.type,
        quick_actions: data?.quick_actions,
        whatsapp: data?.whatsapp,
        order: data?.order,
        summary: data?.summary,
        items: data?.items,
        quote: data?.quote,
        price_card: data?.price_card,
        deleted_order: data?.deleted_order,
        today_sales: data?.today_sales,
    });

    const pushError = (text: string) =>
        setMessages((prev) => [
            ...prev,
            {
                id: `${Date.now()}-err`,
                sender: 'assistant',
                text,
                timestamp: nowLabel(),
                type: 'error',
            },
        ]);

    const handleSendMessage = async (customText?: string) => {
        const queryText = (customText !== undefined ? customText : input).trim();
        if (!queryText || loading) return;

        const userMsg: ChatMessage = {
            id: `${Date.now()}-u`,
            sender: 'user',
            text: queryText,
            timestamp: nowLabel(),
        };

        rememberCommand(queryText);
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setActiveCategory(null);
        setSuggestIndex(-1);
        setSuggestionsDismissed(false);
        setLoading(true);

        try {
            const res = await fetch('/admin/assistant/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ message: queryText }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            setMessages((prev) => [...prev, toBotMessage(data, 'Operación completada.')]);
        } catch {
            pushError('Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    sendRef.current = handleSendMessage;

    const handleQuickAction = async (actionItem: QuickAction) => {
        if (actionItem.url) {
            if (actionItem.url.startsWith('http://') || actionItem.url.startsWith('https://')) {
                window.open(actionItem.url, '_blank', 'noopener,noreferrer');
                return;
            }
            router.visit(actionItem.url);
            return;
        }

        if (actionItem.text) {
            handleSendMessage(actionItem.text);
            return;
        }

        if (actionItem.action) {
            if (loading) return;
            setLoading(true);
            try {
                const res = await fetch('/admin/assistant/action', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        action: actionItem.action,
                        params: actionItem.params || {},
                    }),
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                setMessages((prev) => [...prev, toBotMessage(data, 'Acción ejecutada.')]);
            } catch {
                pushError('Error al ejecutar la acción.');
            } finally {
                setLoading(false);
            }
        }
    };

    const clearChat = () => {
        setMessages([buildWelcome('Conversación reiniciada. ¿En qué te ayudo ahora?', `welcome-${Date.now()}`)]);
        setActiveCategory(null);
    };

    const copyMessage = async (msg: ChatMessage) => {
        try {
            await navigator.clipboard.writeText(stripMarkdown(msg.text));
            setCopiedId(msg.id);
            setTimeout(() => setCopiedId((current) => (current === msg.id ? null : current)), 1800);
        } catch {
            // Portapapeles no disponible
        }
    };

    const applyCommand = (command: AssistantCommand) => {
        setActiveCategory(null);
        setSuggestIndex(-1);

        if (command.prefill) {
            setInput(command.text);
            setSuggestionsDismissed(true);
            setTimeout(() => inputRef.current?.focus(), 0);
            return;
        }

        handleSendMessage(command.text);
    };

    const handleInputChange = (value: string) => {
        setInput(value);
        setSuggestIndex(-1);
        setSuggestionsDismissed(false);
        historyPosRef.current = -1;
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const hasSuggestions = suggestions.length > 0;

        if (hasSuggestions) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSuggestIndex((index) => (index + 1) % suggestions.length);
                return;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSuggestIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
                return;
            }
            if (event.key === 'Tab') {
                event.preventDefault();
                const command = suggestions[suggestIndex >= 0 ? suggestIndex : 0];
                setInput(command.text);
                setSuggestIndex(-1);
                setSuggestionsDismissed(!command.prefill ? false : true);
                return;
            }
            if (event.key === 'Enter' && suggestIndex >= 0) {
                event.preventDefault();
                applyCommand(suggestions[suggestIndex]);
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                setSuggestionsDismissed(true);
                return;
            }
        }

        // Historial con flechas (solo si el campo está vacío o ya se está navegando)
        const history = historyRef.current;
        const browsing = historyPosRef.current >= 0;

        if (event.key === 'ArrowUp' && history.length > 0 && (input === '' || browsing)) {
            event.preventDefault();
            if (!browsing) draftRef.current = input;
            const nextPos = browsing ? Math.max(historyPosRef.current - 1, 0) : history.length - 1;
            historyPosRef.current = nextPos;
            setInput(history[nextPos]);
            setSuggestionsDismissed(true);
            return;
        }

        if (event.key === 'ArrowDown' && browsing) {
            event.preventDefault();
            const nextPos = historyPosRef.current + 1;
            if (nextPos >= history.length) {
                historyPosRef.current = -1;
                setInput(draftRef.current);
            } else {
                historyPosRef.current = nextPos;
                setInput(history[nextPos]);
            }
            setSuggestionsDismissed(true);
        }
    };

    const categoryCommands = activeCategory
        ? ASSISTANT_COMMANDS.filter((command) => command.category === activeCategory)
        : [];

    const bubbleMax = isExpanded ? 'max-w-[82%]' : 'max-w-[88%]';

    return (
        <div className="pointer-events-auto fixed right-4 bottom-4 z-50 flex flex-col items-end sm:right-6 sm:bottom-6">
            {/* Ventana de Chat */}
            {isOpen && (
                <div
                    id="assistant-window"
                    className={cn(
                        'animate-in fade-in zoom-in-95 slide-in-from-bottom-4 mb-3 flex origin-bottom-right flex-col overflow-hidden rounded-3xl border border-white/10 bg-background/90 shadow-[0_24px_80px_-12px_rgba(79,70,229,0.45)] ring-1 ring-black/5 backdrop-blur-2xl duration-300 transition-[width,height]',
                        isExpanded ? 'w-[94vw] sm:w-[700px]' : 'w-[92vw] sm:w-[430px]',
                        isMinimized ? 'h-auto' : isExpanded ? 'h-[84vh] max-h-[84vh]' : 'h-[610px] max-h-[82vh]'
                    )}
                >
                    {/* Header */}
                    <div className="relative flex shrink-0 items-center justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-4 py-3.5 text-white select-none">
                        <div className="pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-12 left-10 h-24 w-24 rounded-full bg-fuchsia-400/20 blur-2xl" />

                        <div className="relative flex items-center gap-3">
                            <div className="relative">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
                                    <Bot className="h-5.5 w-5.5 text-white" />
                                </div>
                                <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-indigo-600">
                                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
                                </span>
                            </div>
                            <div>
                                <h3 className="flex items-center gap-1.5 text-sm leading-tight font-semibold">
                                    Fixy
                                    <span className="text-[10.5px] font-medium bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                                        Copilot FixSale
                                    </span>
                                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                </h3>
                                <p className="mt-0.5 flex items-center gap-1 text-[11px] leading-tight text-white/80">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                                    En línea · Asistente interno sin costo
                                </p>
                            </div>
                        </div>

                        <div className="relative flex items-center gap-0.5">
                            <button
                                id="assistant-clear"
                                onClick={clearChat}
                                title="Reiniciar chat"
                                aria-label="Reiniciar chat"
                                className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </button>
                            <button
                                id="assistant-expand"
                                onClick={() => {
                                    setIsExpanded((value) => !value);
                                    setIsMinimized(false);
                                }}
                                title={isExpanded ? 'Reducir ventana' : 'Ampliar ventana'}
                                aria-label={isExpanded ? 'Reducir ventana' : 'Ampliar ventana'}
                                className="hidden rounded-xl p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white sm:block"
                            >
                                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </button>
                            <button
                                id="assistant-minimize"
                                onClick={() => setIsMinimized(!isMinimized)}
                                title={isMinimized ? 'Expandir' : 'Minimizar'}
                                aria-label={isMinimized ? 'Expandir' : 'Minimizar'}
                                className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                            >
                                <ChevronDown className={cn('h-4 w-4 transition-transform', isMinimized && 'rotate-180')} />
                            </button>
                            <button
                                id="assistant-close"
                                onClick={() => setIsOpen(false)}
                                title="Cerrar"
                                aria-label="Cerrar"
                                className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Cuerpo del Chat */}
                    {!isMinimized && (
                        <>
                            <div
                                id="assistant-messages"
                                className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-muted/40 via-background to-background px-4 py-4 [scrollbar-width:thin]"
                            >
                                {messages.map((msg) => {
                                    const isUser = msg.sender === 'user';
                                    const tone = isUser ? 'default' : toneFor(msg.type);
                                    const toneStyle = TONE_STYLES[tone];

                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                'group animate-in fade-in slide-in-from-bottom-2 flex gap-2.5 duration-300',
                                                isUser ? 'flex-row-reverse' : 'flex-row'
                                            )}
                                        >
                                            {/* Avatar */}
                                            <div
                                                className={cn(
                                                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm',
                                                    isUser
                                                        ? 'bg-secondary text-secondary-foreground ring-1 ring-border'
                                                        : 'bg-gradient-to-br from-blue-600 to-violet-600 text-white'
                                                )}
                                            >
                                                {isUser ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-4 w-4" />}
                                            </div>

                                            <div className={cn('flex min-w-0 flex-col', bubbleMax, isUser ? 'items-end' : 'items-start')}>
                                                <div className="flex items-start gap-1.5">
                                                    <div
                                                        className={cn(
                                                            'rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-sm',
                                                            isUser
                                                                ? 'rounded-tr-md bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-indigo-500/20'
                                                                : cn(
                                                                      'rounded-tl-md border border-border/70 bg-card text-foreground/90',
                                                                      toneStyle.bar
                                                                  )
                                                        )}
                                                    >
                                                        {!isUser && tone !== 'default' && (
                                                            <div
                                                                className={cn(
                                                                    'mb-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                                    toneStyle.badge
                                                                )}
                                                            >
                                                                {tone === 'success' && <CheckCircle2 className="h-3 w-3" />}
                                                                {tone === 'warning' && <AlertTriangle className="h-3 w-3" />}
                                                                {tone === 'error' && <XCircle className="h-3 w-3" />}
                                                                {tone === 'danger' && <Trash2 className="h-3 w-3" />}
                                                                {toneStyle.label}
                                                            </div>
                                                        )}

                                                        {isUser ? (
                                                            <p className="break-words whitespace-pre-line">{msg.text}</p>
                                                        ) : msg.id === 'welcome' ? (
                                                            <div className="space-y-3.5">
                                                                {/* Hero Header */}
                                                                <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-background p-3 shadow-xs">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/30">
                                                                            <Sparkles className="h-5 w-5 text-amber-300" />
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-[12.5px] font-bold text-foreground flex items-center gap-1.5">
                                                                                ¡Bienvenido a Fixy Copilot!
                                                                                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                                    Activo
                                                                                </span>
                                                                            </h4>
                                                                            <p className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">
                                                                                Tu asistente para órdenes de taller, precios al instante, caja chica y clientes.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Cuadrícula de 4 Módulos Operativos */}
                                                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                                    {/* Taller */}
                                                                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-2.5 space-y-1.5">
                                                                        <div className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                                                                            <Wrench className="h-3 w-3" />
                                                                            <span>Taller & Servicio</span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1 text-[10px]">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setInput('crear orden ');
                                                                                    setSuggestionsDismissed(true);
                                                                                    inputRef.current?.focus();
                                                                                }}
                                                                                className="text-left text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                                            >
                                                                                ➕ Crear orden
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSendMessage('resumen taller')}
                                                                                className="text-left text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                                            >
                                                                                📊 Resumen taller
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSendMessage('ordenes listas')}
                                                                                className="text-left text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                                            >
                                                                                ✅ Listos para entrega
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Precios & Stock */}
                                                                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-1.5">
                                                                        <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                                                                            <Tag className="h-3 w-3" />
                                                                            <span>Precios & Stock</span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1 text-[10px]">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setInput('precio ');
                                                                                    setSuggestionsDismissed(true);
                                                                                    inputRef.current?.focus();
                                                                                }}
                                                                                className="text-left text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                                            >
                                                                                🔍 Consultar precio
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSendMessage('alertas de stock')}
                                                                                className="text-left text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                                            >
                                                                                ⚠️ Stock bajo
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setInput('cotizar ');
                                                                                    setSuggestionsDismissed(true);
                                                                                    inputRef.current?.focus();
                                                                                }}
                                                                                className="text-left text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                                            >
                                                                                💡 Cotizar repuesto
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Caja & Finanzas */}
                                                                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 space-y-1.5">
                                                                        <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                                                                            <Wallet className="h-3 w-3" />
                                                                            <span>Caja & Ventas</span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1 text-[10px]">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSendMessage('ventas hoy')}
                                                                                className="text-left text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                                            >
                                                                                📈 Ventas hoy
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSendMessage('estado de caja')}
                                                                                className="text-left text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                                            >
                                                                                💰 Estado de caja
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSendMessage('metas de venta')}
                                                                                className="text-left text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                                            >
                                                                                🎯 Metas de venta
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Clientes & Cobros */}
                                                                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-2.5 space-y-1.5">
                                                                        <div className="flex items-center gap-1 font-bold text-violet-600 dark:text-violet-400 text-[11px]">
                                                                            <UserPlus className="h-3 w-3" />
                                                                            <span>Clientes & Deudas</span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1 text-[10px]">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSendMessage('deudas pendientes')}
                                                                                className="text-left text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                                            >
                                                                                💳 Deudores
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSendMessage('clientes')}
                                                                                className="text-left text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                                            >
                                                                                👥 Clientes
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSendMessage('ayuda')}
                                                                                className="text-left text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                                            >
                                                                                ❓ Comandos
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <MessageContent text={msg.text} />
                                                        )}

                                                        {/* Tarjeta de Orden Detallada con Stepper Visual */}
                                                        {msg.order && (
                                                            <div className="mt-3 space-y-2.5 rounded-2xl border border-border/70 bg-gradient-to-b from-muted/50 to-muted/20 p-3 text-[11px] shadow-sm">
                                                                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[13px] font-extrabold text-primary tracking-wide">
                                                                            #{msg.order.numero_orden}
                                                                        </span>
                                                                        {msg.order.cliente_id && (
                                                                            <span
                                                                                className={cn(
                                                                                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-semibold',
                                                                                    msg.order.cliente_es_nuevo
                                                                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                                                        : 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                                                                                )}
                                                                            >
                                                                                {msg.order.cliente_es_nuevo ? (
                                                                                    <UserPlus className="h-3 w-3" />
                                                                                ) : (
                                                                                    <Link2 className="h-3 w-3" />
                                                                                )}
                                                                                {msg.order.cliente_es_nuevo
                                                                                    ? `Nuevo · #${msg.order.cliente_id}`
                                                                                    : `Vinculado · #${msg.order.cliente_id}`}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span
                                                                        className={cn(
                                                                            'rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-xs',
                                                                            orderStatusClass(msg.order.estado_clave)
                                                                        )}
                                                                    >
                                                                        {msg.order.estado_label}
                                                                    </span>
                                                                </div>

                                                                {/* Stepper visual de etapas de reparación */}
                                                                <div className="py-1">
                                                                    <div className="flex items-center justify-between relative px-2">
                                                                        <div className="absolute top-1/2 left-3 right-3 -translate-y-1/2 h-0.5 bg-border/60 -z-0" />
                                                                        {ORDER_STEPS.map((s) => {
                                                                            const currentStep = getOrderStep(msg.order.estado_clave);
                                                                            const isDone = s.step < currentStep;
                                                                            const isCurrent = s.step === currentStep;

                                                                            return (
                                                                                <div key={s.step} className="relative z-10 flex flex-col items-center gap-1">
                                                                                    <div
                                                                                        className={cn(
                                                                                            'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-all shadow-xs',
                                                                                            isDone
                                                                                                ? 'bg-emerald-600 text-white'
                                                                                                : isCurrent
                                                                                                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 font-black'
                                                                                                  : 'bg-muted border border-border/80 text-muted-foreground'
                                                                                        )}
                                                                                    >
                                                                                        {isDone ? <Check className="h-3 w-3 stroke-[3]" /> : s.step}
                                                                                    </div>
                                                                                    <span
                                                                                        className={cn(
                                                                                            'text-[8.5px] font-semibold tracking-tight',
                                                                                            isCurrent ? 'text-primary font-bold' : isDone ? 'text-foreground/80' : 'text-muted-foreground/60'
                                                                                        )}
                                                                                    >
                                                                                        {s.label}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 rounded-xl bg-background/80 border border-border/50 p-2.5 text-muted-foreground">
                                                                    <div><span className="font-semibold text-foreground">👤 Cliente:</span> {msg.order.cliente_nombre}</div>
                                                                    <div><span className="font-semibold text-foreground">📞 Tel:</span> {msg.order.cliente_telefono}</div>
                                                                    <div className="col-span-2"><span className="font-semibold text-foreground">📱 Dispositivo:</span> {msg.order.equipo}</div>
                                                                    <div><span className="font-semibold text-foreground">👨‍🔧 Técnico:</span> {msg.order.tecnico}</div>
                                                                    <div><span className="font-semibold text-foreground">💰 Saldo:</span> <span className="font-bold text-foreground">{msg.order.saldo_restante}</span></div>
                                                                </div>

                                                                {msg.order.falla && (
                                                                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2 text-[10.5px]">
                                                                        <span className="font-bold text-amber-700 dark:text-amber-400">⚠️ Falla:</span> {msg.order.falla}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Tarjeta de Orden Eliminada */}
                                                        {msg.deleted_order && (
                                                            <div className="mt-3 space-y-1.5 rounded-xl border border-red-500/30 bg-red-500/5 p-2.5 text-[11px]">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[13px] font-bold text-red-700 line-through decoration-2 dark:text-red-300">
                                                                        #{msg.deleted_order.numero_orden}
                                                                    </span>
                                                                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-300">
                                                                        <Trash2 className="h-3 w-3" /> Eliminada
                                                                    </span>
                                                                </div>
                                                                <div className="text-muted-foreground line-through">👤 {msg.deleted_order.cliente}</div>
                                                                <div className="text-muted-foreground line-through">📱 {msg.deleted_order.equipo}</div>
                                                            </div>
                                                        )}

                                                        {/* Tarjeta de Resumen del Taller */}
                                                        {msg.summary && (
                                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                                {[
                                                                    { value: msg.summary.recibidas_hoy, label: 'Nuevas hoy', color: 'blue' },
                                                                    { value: msg.summary.listo_para_retiro, label: 'Listos retiro', color: 'emerald' },
                                                                    { value: msg.summary.en_reparacion, label: 'En reparación', color: 'amber' },
                                                                    { value: msg.summary.total_activas, label: 'Total activas', color: 'indigo' },
                                                                ].map((stat) => (
                                                                    <div
                                                                        key={stat.label}
                                                                        className={cn(
                                                                            'rounded-xl border p-2.5 text-center',
                                                                            stat.color === 'blue' && 'border-blue-500/20 bg-blue-500/10',
                                                                            stat.color === 'emerald' && 'border-emerald-500/20 bg-emerald-500/10',
                                                                            stat.color === 'amber' && 'border-amber-500/20 bg-amber-500/10',
                                                                            stat.color === 'indigo' && 'border-indigo-500/20 bg-indigo-500/10'
                                                                        )}
                                                                    >
                                                                        <div
                                                                            className={cn(
                                                                                'text-lg leading-none font-bold',
                                                                                stat.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                                                                                stat.color === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
                                                                                stat.color === 'amber' && 'text-amber-600 dark:text-amber-400',
                                                                                stat.color === 'indigo' && 'text-indigo-600 dark:text-indigo-400'
                                                                            )}
                                                                        >
                                                                            {stat.value}
                                                                        </div>
                                                                        <div className="mt-1 text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
                                                                            {stat.label}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Tarjeta de Ventas de Hoy */}
                                                        {msg.today_sales && (
                                                            <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/5 p-3 space-y-2.5 shadow-sm">
                                                                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                                                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                        📈 Ventas y Facturación de Hoy
                                                                    </span>
                                                                    <span className="text-[10px] text-muted-foreground font-medium">
                                                                        {msg.today_sales.fecha}
                                                                    </span>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-2 text-center">
                                                                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2">
                                                                        <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                                                                            {msg.today_sales.total_formateado}
                                                                        </div>
                                                                        <div className="text-[9px] uppercase font-bold text-muted-foreground mt-0.5">Total Facturado</div>
                                                                    </div>
                                                                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2">
                                                                        <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                                                                            {msg.today_sales.cantidad}
                                                                        </div>
                                                                        <div className="text-[9px] uppercase font-bold text-muted-foreground mt-0.5">Tickets Cobrados</div>
                                                                    </div>
                                                                </div>

                                                                {msg.today_sales.desglose && msg.today_sales.desglose.length > 0 && (
                                                                    <div className="space-y-1 pt-1 border-t border-border/30">
                                                                        <div className="text-[9.5px] font-bold text-muted-foreground uppercase">Métodos de Pago:</div>
                                                                        <div className="grid grid-cols-2 gap-1.5">
                                                                            {msg.today_sales.desglose.map((m: any, i: number) => (
                                                                                <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-2 py-1 text-[10.5px]">
                                                                                    <span className="text-muted-foreground font-medium">{m.metodo}</span>
                                                                                    <span className="font-bold text-foreground">{m.formateado}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Tarjeta de Cotización / Presupuesto Rápido */}
                                                        {msg.quote && (
                                                            <div className="mt-3 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-background to-purple-500/5 p-3 space-y-2.5 shadow-sm">
                                                                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                                                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 dark:text-indigo-400">
                                                                        💡 Presupuesto Estimado
                                                                    </span>
                                                                    <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                                                        {msg.quote.query}
                                                                    </span>
                                                                </div>

                                                                <div className="space-y-1.5 text-[11px]">
                                                                    {msg.quote.repuesto_nombre && (
                                                                        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-2.5 py-1.5">
                                                                            <div>
                                                                                <div className="font-semibold text-foreground">🛠️ Repuesto: {msg.quote.repuesto_nombre}</div>
                                                                                {msg.quote.repuesto_stock_badge && (
                                                                                    <div className="text-[10px] text-muted-foreground">{stripMarkdown(msg.quote.repuesto_stock_badge)}</div>
                                                                                )}
                                                                            </div>
                                                                            <span className="font-bold text-foreground">{msg.quote.repuesto_precio}</span>
                                                                        </div>
                                                                    )}

                                                                    {msg.quote.servicio_nombre && (
                                                                        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-2.5 py-1.5">
                                                                            <div>
                                                                                <div className="font-semibold text-foreground">⚙️ Mano de obra: {msg.quote.servicio_nombre}</div>
                                                                                <div className="text-[10px] text-muted-foreground">Instalación y garantía de taller</div>
                                                                            </div>
                                                                            <span className="font-bold text-foreground">{msg.quote.servicio_precio}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center justify-between rounded-xl bg-indigo-600/10 border border-indigo-500/20 px-3 py-2 text-indigo-900 dark:text-indigo-200">
                                                                    <span className="text-[11.5px] font-bold">Total al Cliente:</span>
                                                                    <span className="text-[15px] font-extrabold text-indigo-600 dark:text-indigo-400">
                                                                        {msg.quote.total_formateado}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Tarjeta Destacada de Verificación de Precio */}
                                                        {msg.price_card && (
                                                            <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-background p-3.5 space-y-3 shadow-md shadow-emerald-500/5">
                                                                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                                                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                        <Tag className="h-3.5 w-3.5" />
                                                                        Precio Verificado
                                                                    </span>
                                                                    <span
                                                                        className={cn(
                                                                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold border shadow-xs',
                                                                            msg.price_card.disponible
                                                                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                                                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                                                                        )}
                                                                    >
                                                                        {msg.price_card.disponible ? '🟢 En Stock' : '🔴 Agotado'}
                                                                    </span>
                                                                </div>

                                                                <div>
                                                                    <div className="text-[13.5px] font-extrabold text-foreground tracking-tight leading-snug">
                                                                        {msg.price_card.nombre}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1 text-[10.5px] text-muted-foreground flex-wrap">
                                                                        {msg.price_card.sku && (
                                                                            <span>
                                                                                SKU: <code className="font-mono text-foreground/80 bg-muted/60 px-1 py-0.5 rounded">{msg.price_card.sku}</code>
                                                                            </span>
                                                                        )}
                                                                        {msg.price_card.categoria && (
                                                                            <span>· 📁 {msg.price_card.categoria}</span>
                                                                        )}
                                                                        <span>
                                                                            · {msg.price_card.tipo === 'repuesto' ? '🛠️ Repuesto de taller' : '📦 Producto comercial'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Barra de estado de disponibilidad */}
                                                                <div className="rounded-xl border border-border/50 bg-background/80 p-2.5 flex items-center justify-between gap-3">
                                                                    <div className="text-[11px]">
                                                                        <div className="text-muted-foreground text-[10px]">Disponibilidad:</div>
                                                                        <div className="font-bold text-foreground">
                                                                            {msg.price_card.disponible ? (
                                                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                                                    {msg.price_card.stock_badge || 'Existencia en inventario'}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-rose-600 dark:text-rose-400">Sin existencias</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-[10px] font-medium text-muted-foreground uppercase">Precio Venta</div>
                                                                        <div className="text-[19px] font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                                                                            {msg.price_card.precio_formateado}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Tarjetas Interactivas de Productos / Repuestos / Servicios */}
                                                        {msg.items && msg.items.length > 0 && (
                                                            <div className="mt-3 space-y-2">
                                                                <div className="text-[10.5px] font-semibold text-muted-foreground flex items-center justify-between px-0.5">
                                                                    <span>Tarjetas interactivas ({msg.items.length})</span>
                                                                    <span className="text-[9.5px] text-muted-foreground/70">Acciones con 1 clic</span>
                                                                </div>
                                                                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                                                                    {msg.items.map((item: any, idx: number) => {
                                                                        const isRepuesto = item.tipo === 'repuesto';
                                                                        const isServicio = item.tipo === 'servicio';
                                                                        const isAgotado = item.stock_status === 'out_of_stock' || (item.usa_inventario && item.stock <= 0);
                                                                        const isBajo = item.stock_status === 'low';

                                                                        return (
                                                                            <div
                                                                                key={item.id || idx}
                                                                                className="rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/60 p-2.5 transition-all text-[11px]"
                                                                            >
                                                                                <div className="flex items-start justify-between gap-1.5 mb-1">
                                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                                        <span
                                                                                            className={cn(
                                                                                                'rounded-full px-2 py-0.5 text-[9.5px] font-bold',
                                                                                                isRepuesto && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
                                                                                                isServicio && 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/20',
                                                                                                !isRepuesto && !isServicio && 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                                                                                            )}
                                                                                        >
                                                                                            {isRepuesto ? '🛠️ Repuesto' : isServicio ? '⚙️ Servicio' : '📦 Producto'}
                                                                                        </span>
                                                                                        {item.categoria && (
                                                                                            <span className="rounded-full bg-background px-2 py-0.5 text-[9.5px] text-muted-foreground border border-border/40 font-medium">
                                                                                                📁 {item.categoria}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <span className="font-bold text-[12px] text-foreground shrink-0">
                                                                                        {item.precio}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="font-medium text-[11.5px] text-foreground/95 mb-1.5">
                                                                                    {item.nombre}
                                                                                    {item.sku && <span className="ml-1 text-[10px] text-muted-foreground font-mono">({item.sku})</span>}
                                                                                </div>

                                                                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30">
                                                                                    <div>
                                                                                        {isServicio ? (
                                                                                            <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                                                                                                🛠️ Mano de obra técnica
                                                                                            </span>
                                                                                        ) : isAgotado ? (
                                                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                                                                                🔴 Agotado (0 uds)
                                                                                            </span>
                                                                                        ) : isBajo ? (
                                                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                                                                ⚠️ Stock bajo ({item.stock} uds)
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                                                🟢 {item.stock} uds disponibles
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    <div className="flex items-center gap-1">
                                                                                        {!isServicio && (
                                                                                            <>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleSendMessage(`kardex ${item.sku || item.nombre}`)}
                                                                                                    className="px-2 py-0.5 rounded-md bg-background hover:bg-primary/10 border border-border/60 hover:border-primary/40 text-[10px] font-medium text-foreground transition-colors"
                                                                                                    title="Ver movimientos en Kardex"
                                                                                                >
                                                                                                    📊 Kardex
                                                                                                </button>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => {
                                                                                                        setInput(`sumar 1 stock ${item.sku || item.nombre}`);
                                                                                                        setSuggestionsDismissed(true);
                                                                                                        inputRef.current?.focus();
                                                                                                    }}
                                                                                                    className="px-2 py-0.5 rounded-md bg-background hover:bg-emerald-500/10 border border-border/60 hover:border-emerald-500/40 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 transition-colors"
                                                                                                    title="Agregar stock"
                                                                                                >
                                                                                                    ➕ +1
                                                                                                </button>
                                                                                            </>
                                                                                        )}
                                                                                        {isServicio && (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleSendMessage(`cotizar ${item.nombre}`)}
                                                                                                className="px-2 py-0.5 rounded-md bg-background hover:bg-violet-500/10 border border-border/60 hover:border-violet-500/40 text-[10px] font-medium text-violet-700 dark:text-violet-300 transition-colors"
                                                                                            >
                                                                                                💡 Cotizar
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Botones de Acciones Rápidas */}
                                                        {msg.quick_actions && msg.quick_actions.length > 0 && (
                                                            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/40 pt-2.5">
                                                                {msg.quick_actions.map((qa, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        onClick={() => handleQuickAction(qa)}
                                                                        disabled={loading && !qa.url}
                                                                        className={cn(
                                                                            'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all hover:-translate-y-px hover:shadow-md active:translate-y-0 active:scale-95 disabled:opacity-50',
                                                                            qa.variant === 'success'
                                                                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                                                : qa.variant === 'primary'
                                                                                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                                                  : qa.variant === 'warning'
                                                                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                                                                    : qa.variant === 'danger'
                                                                                      ? 'bg-red-600 text-white shadow-sm shadow-red-600/30 hover:bg-red-700'
                                                                                      : 'border border-border/70 bg-background text-foreground/80 hover:border-primary/60 hover:text-primary'
                                                                        )}
                                                                    >
                                                                        {qa.label}
                                                                        {qa.url && qa.type === 'link' && !qa.label.includes('↗') && (
                                                                            <ExternalLink className="h-3 w-3 opacity-70" />
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Copiar respuesta */}
                                                    {!isUser && (
                                                        <button
                                                            onClick={() => copyMessage(msg)}
                                                            title="Copiar respuesta"
                                                            aria-label="Copiar respuesta"
                                                            className="mt-1 rounded-lg p-1.5 text-muted-foreground/60 opacity-0 transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100"
                                                        >
                                                            {copiedId === msg.id ? (
                                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                                <span className="mt-1 px-1 text-[10px] text-muted-foreground/70">{msg.timestamp}</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Indicador de IA procesando consulta */}
                                {loading && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 flex gap-2.5 duration-200">
                                        <div className="relative mt-0.5 flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30">
                                            <Bot className="h-4 w-4 animate-pulse" />
                                            <span className="absolute -inset-0.5 -z-10 animate-ping rounded-2xl bg-indigo-500/40 [animation-duration:2s]" />
                                        </div>
                                        <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-md border border-border/80 bg-card/90 px-4 py-3 shadow-sm backdrop-blur-md">
                                            <div className="flex items-center gap-1.5">
                                                {[0, 150, 300].map((delay) => (
                                                    <span
                                                        key={delay}
                                                        className="h-2 w-2 animate-bounce rounded-full bg-gradient-to-br from-blue-500 to-violet-600 shadow-xs shadow-indigo-500/50"
                                                        style={{ animationDelay: `${delay}ms`, animationDuration: '900ms' }}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[11.5px] font-medium text-muted-foreground animate-pulse">
                                                Fixy está consultando el sistema…
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Categorías de comandos */}
                            <div className="shrink-0 border-t border-border/50 bg-muted/30">
                                <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {COMMAND_CATEGORIES.map((category) => {
                                        const active = activeCategory === category.id;
                                        return (
                                            <button
                                                key={category.id}
                                                id={`assistant-category-${category.id}`}
                                                onClick={() => setActiveCategory(active ? null : category.id)}
                                                aria-pressed={active}
                                                className={cn(
                                                    'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all',
                                                    active
                                                        ? 'border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                                                        : 'border-border/60 bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                                )}
                                            >
                                                <span>{category.emoji}</span>
                                                {category.label}
                                                <ChevronRight className={cn('h-3 w-3 transition-transform', active && 'rotate-90')} />
                                            </button>
                                        );
                                    })}
                                    <button
                                        id="assistant-help"
                                        onClick={() => handleSendMessage('ayuda')}
                                        title="Ver todos los comandos"
                                        aria-label="Ver todos los comandos"
                                        className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground"
                                    >
                                        <HelpCircle className="h-3.5 w-3.5" />
                                        Ayuda
                                    </button>
                                </div>

                                {activeCategory && (
                                    <div className="animate-in fade-in slide-in-from-bottom-1 flex flex-wrap gap-1.5 px-3 pb-2.5 duration-200">
                                        {categoryCommands.map((command) => (
                                            <button
                                                key={`${command.category}-${command.label}`}
                                                onClick={() => applyCommand(command)}
                                                title={command.hint}
                                                className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground/80 transition-all hover:-translate-y-px hover:border-primary/60 hover:text-primary hover:shadow-sm active:scale-95"
                                            >
                                                {command.label}
                                                {command.prefill && <CornerDownLeft className="h-3 w-3 opacity-50" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Formulario de entrada */}
                            <div className="relative shrink-0 border-t border-border bg-card/80">
                                {/* Autocompletado */}
                                {suggestions.length > 0 && (
                                    <ul
                                        role="listbox"
                                        id="assistant-suggestions"
                                        className="animate-in fade-in slide-in-from-bottom-1 absolute right-3 bottom-full left-3 z-10 mb-2 overflow-hidden rounded-2xl border border-border/70 bg-popover/95 shadow-xl backdrop-blur-xl duration-150"
                                    >
                                        {suggestions.map((command, index) => (
                                            <li key={`${command.category}-${command.label}`} role="option" aria-selected={index === suggestIndex}>
                                                <button
                                                    type="button"
                                                    onMouseDown={(event) => {
                                                        event.preventDefault();
                                                        applyCommand(command);
                                                    }}
                                                    onMouseEnter={() => setSuggestIndex(index)}
                                                    className={cn(
                                                        'flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors',
                                                        index === suggestIndex ? 'bg-primary/10' : 'hover:bg-muted/60'
                                                    )}
                                                >
                                                    <span className="min-w-0">
                                                        <span className="block truncate text-[12px] font-semibold text-foreground">
                                                            {command.label}
                                                        </span>
                                                        <span className="block truncate text-[10.5px] text-muted-foreground">
                                                            {command.hint}
                                                        </span>
                                                    </span>
                                                    {index === suggestIndex && (
                                                        <span className="hidden shrink-0 rounded-md border border-border/70 bg-background px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground sm:block">
                                                            Tab
                                                        </span>
                                                    )}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }}
                                    className="flex items-center gap-2 p-3"
                                >
                                    <div className="relative flex-1">
                                        <input
                                            id="assistant-input"
                                            ref={inputRef}
                                            type="text"
                                            value={input}
                                            onChange={(e) => handleInputChange(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            autoComplete="off"
                                            placeholder={
                                                isListening
                                                    ? 'Escuchando tu voz... Habla ahora'
                                                    : "Ej: 'orden 1', 'precio pantalla', 'ventas hoy', 'caja'"
                                            }
                                            disabled={loading}
                                            className={cn(
                                                'w-full rounded-2xl border border-input bg-muted/40 px-3.5 py-2.5 text-xs transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none',
                                                isListening
                                                    ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 pr-14'
                                                    : 'pr-3.5'
                                            )}
                                        />
                                        {isListening && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                                {[3, 6, 8, 5, 7].map((h, i) => (
                                                    <span
                                                        key={i}
                                                        className="w-0.5 rounded-full bg-rose-500 animate-pulse"
                                                        style={{
                                                            height: `${h * 2}px`,
                                                            animationDuration: `${0.3 + i * 0.15}s`,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {speechSupported && (
                                        <button
                                            id="assistant-mic"
                                            type="button"
                                            onClick={toggleSpeech}
                                            title={isListening ? 'Detener dictado' : 'Hablar por micrófono'}
                                            aria-label={isListening ? 'Detener dictado' : 'Hablar por micrófono'}
                                            className={cn(
                                                'rounded-2xl p-2.5 transition-all',
                                                isListening
                                                    ? 'animate-pulse bg-rose-500 text-white shadow-md shadow-rose-500/30'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            )}
                                        >
                                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                        </button>
                                    )}

                                    <button
                                        id="assistant-send"
                                        type="submit"
                                        disabled={loading || !input.trim()}
                                        aria-label="Enviar"
                                        className="rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 p-2.5 text-white shadow-md shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </button>
                                </form>

                                <p className="hidden px-4 pb-2 text-[10px] text-muted-foreground/70 sm:block">
                                    <kbd className="rounded border border-border/70 bg-background px-1 font-sans">↑</kbd>{' '}
                                    <kbd className="rounded border border-border/70 bg-background px-1 font-sans">↓</kbd> historial ·{' '}
                                    <kbd className="rounded border border-border/70 bg-background px-1 font-sans">Tab</kbd> autocompletar ·{' '}
                                    <kbd className="rounded border border-border/70 bg-background px-1 font-sans">Esc</kbd> cerrar sugerencias
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Botón Flotante Principal con Ambient Glow */}
            {!isOpen && (
                <button
                    id="assistant-launcher"
                    onClick={() => {
                        setIsOpen(true);
                        setIsMinimized(false);
                    }}
                    className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-2.5 text-white shadow-[0_12px_32px_-6px_rgba(79,70,229,0.55)] ring-1 ring-white/20 transition-all duration-300 hover:scale-105 hover:shadow-[0_16px_40px_-4px_rgba(79,70,229,0.7)] active:scale-95"
                    title="Abrir Fixy · Copilot FixSale"
                    aria-label="Abrir Fixy · Copilot FixSale"
                >
                    <span className="absolute -inset-1 -z-10 animate-pulse rounded-full bg-gradient-to-r from-blue-600 to-violet-600 opacity-40 blur-md group-hover:opacity-75 transition duration-500" />
                    <div className="relative flex h-7.5 w-7.5 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-xs">
                        <Bot className="h-4.5 w-4.5 text-white transition-transform group-hover:rotate-12" />
                        <Sparkles className="absolute -top-1 -right-1 h-3 w-3 animate-pulse text-amber-300" />
                    </div>
                    <div className="flex flex-col text-left leading-tight">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold tracking-wide">Fixy</span>
                            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[8.5px] font-semibold text-white/95">
                                Copilot
                            </span>
                        </div>
                        <span className="text-[9.5px] text-white/80 font-medium">Asistente Operativo</span>
                    </div>
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-indigo-900" />
                    </span>
                </button>
            )}
        </div>
    );
}
