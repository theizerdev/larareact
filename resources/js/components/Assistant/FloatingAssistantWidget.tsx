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

type MessageTone = 'default' | 'success' | 'warning' | 'error';

const STORAGE_MESSAGES = 'fixsale_assistant_chat';
const STORAGE_HISTORY = 'fixsale_assistant_history';
const MAX_HISTORY = 30;

const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const WELCOME_ACTIONS: QuickAction[] = [
    { label: '📊 Resumen Taller', action: 'get_summary' },
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
    if (['not_found', 'unknown', 'need_brand', 'client_exists', 'info', 'cash_closed'].includes(type)) return 'warning';
    if (type.endsWith('_created') || ['stock_adjusted', 'whatsapp_sent', 'status_updated', 'updated', 'cash_opened', 'credit_payment'].includes(type)) {
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
                                                                {toneStyle.label}
                                                            </div>
                                                        )}

                                                        {isUser ? (
                                                            <p className="break-words whitespace-pre-line">{msg.text}</p>
                                                        ) : (
                                                            <MessageContent text={msg.text} />
                                                        )}

                                                        {/* Tarjeta de Orden Detallada */}
                                                        {msg.order && (
                                                            <div className="mt-3 space-y-2 rounded-xl border border-border/60 bg-muted/40 p-2.5 text-[11px]">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[13px] font-bold text-primary">
                                                                        #{msg.order.numero_orden}
                                                                    </span>
                                                                    <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
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
                                                                    <div className="rounded-lg border border-border/40 bg-background/70 p-1.5 text-[10.5px]">
                                                                        <span className="font-semibold">Falla:</span> {msg.order.falla}
                                                                    </div>
                                                                )}
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

                                {/* Indicador de escritura */}
                                {loading && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 flex gap-2.5 duration-200">
                                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-sm">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                        <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border/70 bg-card px-4 py-3 shadow-sm">
                                            {[0, 150, 300].map((delay) => (
                                                <span
                                                    key={delay}
                                                    className="h-2 w-2 animate-bounce rounded-full bg-gradient-to-br from-blue-500 to-violet-500"
                                                    style={{ animationDelay: `${delay}ms`, animationDuration: '900ms' }}
                                                />
                                            ))}
                                            <span className="ml-1 text-[11px] text-muted-foreground">Consultando sistema…</span>
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
                                                ? '🎙️ Escuchando tu voz...'
                                                : "Ej: 'orden 1', 'crear cliente Juan 0412...', 'meta de ventas'"
                                        }
                                        disabled={loading}
                                        className={cn(
                                            'flex-1 rounded-2xl border border-input bg-muted/40 px-3.5 py-2.5 text-xs transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none',
                                            isListening && 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                                        )}
                                    />

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

            {/* Botón Flotante Principal */}
            {!isOpen && (
                <button
                    id="assistant-launcher"
                    onClick={() => {
                        setIsOpen(true);
                        setIsMinimized(false);
                    }}
                    className="group animate-in fade-in zoom-in-90 relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-3 text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/50 active:scale-95"
                    title="Abrir Fixy · Copilot FixSale"
                    aria-label="Abrir Fixy · Copilot FixSale"
                >
                    <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-indigo-500/30 [animation-duration:2.5s]" />
                    <div className="relative">
                        <Bot className="h-5 w-5 text-white transition-transform group-hover:rotate-12" />
                        <Sparkles className="absolute -top-1.5 -right-1.5 h-3 w-3 animate-pulse text-amber-300" />
                    </div>
                    <div className="flex flex-col text-left leading-tight">
                        <span className="text-xs font-bold tracking-wide">Fixy</span>
                        <span className="text-[9.5px] text-white/80 font-medium">Copilot FixSale</span>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white/40" />
                </button>
            )}
        </div>
    );
}
