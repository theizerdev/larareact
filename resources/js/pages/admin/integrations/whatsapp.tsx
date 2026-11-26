import { Head } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    Building2,
    Check,
    CheckCheck,
    CheckCircle2,
    Clock,
    Copy,
    Cpu,
    Edit2,
    FileText,
    Flame,
    Hash,
    Inbox,
    Keyboard,
    Loader2,
    Megaphone,
    MessageSquare,
    Pause,
    Phone,
    Play,
    Plus,
    Power,
    QrCode,
    Radio,
    RefreshCw,
    RotateCw,
    Save,
    Search,
    Send,
    Settings2,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Store,
    Terminal,
    Trash2,
    Users,
    WifiOff,
    Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import type { PaisPhoneOption } from '@/pages/admin/Empresas/Partials/PhoneInputGroup';

// ── TIPOS ────────────────────────────────────────────────────────────────

interface LiveStatus {
    instanceName?: string;
    status?: string;
    isConnected: boolean;
    connectionState: string;
    qrCode: string | null;
    qrDataUrl?: string | null;
    qrExpiresIn?: number | null;
    phoneNumber?: string | null;
    pushName?: string | null;
    currentlyTypingTo?: string | null;
    queuePaused?: boolean;
    pauseReason?: string | null;
    lastError?: string | null;
    hasSavedSession?: boolean;
    engine?: string;
    user?: {
        id: string | null;
        name?: string | null;
    } | null;
    userJid?: string | null;
    _error?: string;
}

interface QueueStats {
    sentToday: number;
    sentThisHour: number;
    dailyLimit: number;
    effectiveDailyLimit: number;
    hourlyLimit: number;
    remaining: number;
    queued: number;
    failedToday: number;
    warmupMode: boolean;
    warmupDay: number;
    workingHoursEnabled: boolean;
    workingHoursStart: string;
    workingHoursEnd: string;
    withinWorkingHours: boolean;
    simulateTyping: boolean;
    typingMinSec: number;
    typingMaxSec: number;
    delayMinSec: number;
    delayMaxSec: number;
    batchSize: number;
    batchPauseSec: number;
    verifyNumber: boolean;
    queuePaused: boolean;
    pauseReason?: string | null;
    consecutiveFailures: number;
    circuitBreakerActive: boolean;
    proxyUrl: string;
    safetyScore: number;
    safetyTips: string[];
}

interface SucursalInstanceSummary {
    id: number;
    sucursal_id: number;
    nombre: string;
    telefono?: string | null;
    whatsapp_instance: string;
    whatsapp_phone?: string | null;
    push_name?: string | null;
    whatsapp_status: string;
    connection_state: string;
    is_connected: boolean;
    whatsapp_active: boolean;
    sent_today: number;
    effective_daily_limit: number;
    sent_this_hour: number;
    hourly_limit: number;
    queued: number;
    queue_paused: boolean;
    safety_score: number;
    currently_typing_to?: string | null;
    has_saved_session: boolean;
}

interface WhatsAppTemplateItem {
    id: number;
    empresa_id: number;
    nombre: string;
    categoria: string;
    contenido: string;
    variables: string[] | null;
    activo: boolean;
}

interface WhatsAppMessageItem {
    id: number;
    message_id?: string | null;
    recipient_phone: string;
    recipient_name?: string | null;
    message_content: string;
    status: string;
    direction: 'inbound' | 'outbound';
    sent_at?: string | null;
    delivered_at?: string | null;
    read_at?: string | null;
    error_message?: string | null;
    retry_count: number;
    created_at: string;
}

interface BroadcastRecipient {
    id: number;
    type: 'cliente' | 'empleado' | 'user';
    name: string;
    email?: string | null;
    phone: string;
    formatted_phone: string;
    is_valid_phone: boolean;
    sucursal: string;
    role: string;
}

interface DiagnosticData {
    success: boolean;
    online: boolean;
    api_url: string;
    engine?: string;
    instance: string;
    target_name?: string;
    socket_state: string;
    thread_alive: boolean;
    phone_number?: string | null;
    push_name?: string | null;
    latency_ms: number;
    memory_usage?: string;
    session_size_kb?: number;
    active_instances_count?: number;
    uptime_seconds?: number;
    webhook_url?: string | null;
    worker_running?: boolean;
    error?: string;
}

interface WalletSummary {
    is_unlimited?: boolean;
    balance_usd: number;
    free_quota: number;
    free_used: number;
    free_remaining: number;
    paid_remaining_messages: number;
    total_remaining_messages: number;
    unit_cost_usd: number;
    min_purchase_messages: number;
    packages: number[];
    billing_enabled: boolean;
    payment_methods?: { id: string; label: string }[];
}

interface PageProps {
    empresa_id: number;
    empresa_nombre: string;
    wallet_summary?: WalletSummary;
    sucursales: SucursalInstanceSummary[];
    active_sucursal_id: number | null;
    target_name: string;
    whatsapp_api_url: string;
    whatsapp_instance: string;
    whatsapp_active: boolean;
    whatsapp_phone: string | null;
    whatsapp_status: string | null;
    whatsapp_rate_limit: number;
    whatsapp_hourly_limit?: number;
    whatsapp_warmup_mode?: boolean;
    whatsapp_working_hours_enabled?: boolean;
    whatsapp_working_hours_start?: string;
    whatsapp_working_hours_end?: string;
    whatsapp_simulate_typing?: boolean;
    whatsapp_typing_min_sec?: number;
    whatsapp_typing_max_sec?: number;
    whatsapp_delay_min_sec?: number;
    whatsapp_delay_max_sec?: number;
    whatsapp_batch_size?: number;
    whatsapp_batch_pause_sec?: number;
    whatsapp_verify_number?: boolean;
    whatsapp_proxy_url?: string;
    live_status: LiveStatus | null;
    queue_stats: QueueStats | null;
    templates: WhatsAppTemplateItem[];
    paises: PaisPhoneOption[];
    is_superadmin?: boolean;
}

// ── CONSTANTES DE FIXSALE ────────────────────────────────────────────────

const TEMPLATE_CATEGORIES: Record<string, { label: string; color: string }> = {
    reparacion: {
        label: 'Reparaciones / Taller',
        color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
    },
    ventas: {
        label: 'Ventas & Facturación',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    },
    cobranza: {
        label: 'Créditos & Cobranzas',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    },
    promocion: {
        label: 'Promociones & Fidelización',
        color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25',
    },
    general: {
        label: 'General / Avisos',
        color: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/25',
    },
};

const WARMUP_STAGES = [
    { label: 'Días 1–2', limit: 20, minDay: 1, maxDay: 2 },
    { label: 'Días 3–4', limit: 40, minDay: 3, maxDay: 4 },
    { label: 'Días 5–7', limit: 80, minDay: 5, maxDay: 7 },
    { label: 'Días 8–14', limit: 150, minDay: 8, maxDay: 14 },
    { label: 'Día 15+', limit: null, minDay: 15, maxDay: 9999 },
];

// Helper CSRF para fetch contra Laravel
function getCsrfHeaders(): Record<string, string> {
    const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    const xsrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };
    if (metaToken) headers['X-CSRF-TOKEN'] = metaToken;
    if (xsrfToken) headers['X-XSRF-TOKEN'] = xsrfToken;
    return headers;
}

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────

export default function WhatsAppIntegration({
    empresa_nombre,
    wallet_summary,
    sucursales: initialSucursales = [],
    active_sucursal_id: initialSucursalId = null,
    whatsapp_api_url: initialApiUrl,
    whatsapp_instance: initialInstanceName,
    whatsapp_active: initialWhatsappActive,
    whatsapp_rate_limit = 200,
    whatsapp_hourly_limit = 25,
    whatsapp_warmup_mode = true,
    whatsapp_working_hours_enabled = true,
    whatsapp_working_hours_start = '08:00',
    whatsapp_working_hours_end = '20:00',
    whatsapp_simulate_typing = true,
    whatsapp_typing_min_sec = 2.0,
    whatsapp_typing_max_sec = 6.0,
    whatsapp_delay_min_sec = 8,
    whatsapp_delay_max_sec = 20,
    whatsapp_batch_size = 10,
    whatsapp_batch_pause_sec = 60,
    whatsapp_verify_number = true,
    whatsapp_proxy_url = '',
    live_status: initialLiveStatus,
    queue_stats: initialQueueStats,
    templates: initialTemplates = [],
    paises = [],
    is_superadmin = false,
}: PageProps) {
    const { __ } = useTranslate();

    const [activeTab, setActiveTab] = useState('connection');

    // Estado multi-instancia por sucursal
    const [instances, setInstances] = useState<SucursalInstanceSummary[]>(initialSucursales);
    const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(
        initialSucursalId ?? initialSucursales[0]?.id ?? null
    );

    // Estado en vivo de la sucursal seleccionada
    const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(initialLiveStatus);
    const [queueStats, setQueueStats] = useState<QueueStats | null>(initialQueueStats);
    const [branchActive, setBranchActive] = useState<boolean>(initialWhatsappActive);
    const [instanceSlugInput, setInstanceSlugInput] = useState<string>(initialInstanceName || '');
    const [apiUrlInput, setApiUrlInput] = useState<string>(initialApiUrl || 'http://127.0.0.1:3001');
    const [topupOpen, setTopupOpen] = useState(false);
    const minPurchaseMessages = Math.max(100, wallet_summary?.min_purchase_messages ?? 100);
    const unitCostUsd = wallet_summary?.unit_cost_usd ?? 0.005;
    const [topupMessages, setTopupMessages] = useState<number>(minPurchaseMessages);
    const activePaymentMethods = wallet_summary?.payment_methods?.length
        ? wallet_summary.payment_methods
        : [{ id: 'transferencia', label: 'Transferencia / SPEI' }];
    const [topupMethod, setTopupMethod] = useState<string>(activePaymentMethods[0].id);
    const [topupReference, setTopupReference] = useState<string>('');
    const [topupNotes, setTopupNotes] = useState<string>('');
    const [topupSubmitting, setTopupSubmitting] = useState<boolean>(false);

    const handleTopupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (topupMessages < minPurchaseMessages) {
            toast.error(`La compra mínima es de ${minPurchaseMessages} mensajes.`);
            return;
        }
        setTopupSubmitting(true);
        try {
            const res = await fetch('/admin/monitoring/subscription/whatsapp-topup', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    mensajes: topupMessages,
                    metodo_pago: topupMethod,
                    referencia_pago: topupReference,
                    notas: topupNotes,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || 'Solicitud de recarga registrada.');
                setTopupOpen(false);
                setTopupReference('');
                setTopupNotes('');
            } else {
                toast.error(data.message || data.error || 'No se pudo registrar la recarga.');
            }
        } catch {
            toast.error('Error de conexión al solicitar recarga.');
        } finally {
            setTopupSubmitting(false);
        }
    };
    const [savingInstanceConfig, setSavingInstanceConfig] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [switchingBranch, setSwitchingBranch] = useState(false);
    const prevConnectedRef = useRef<boolean>(Boolean(initialLiveStatus?.isConnected));

    // Vinculación: QR vs Código de 8 dígitos
    const [linkMode, setLinkMode] = useState<'qr' | 'phone'>('qr');
    const [pairPhoneInput, setPairPhoneInput] = useState('');
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [pairLoading, setPairLoading] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    // Probador en vivo & Verificador
    const defaultCountryDial = useMemo(() => {
        const ve = paises.find((p) => p.codigo_iso2 === 'VE' || p.codigo_telefonico === '+58');
        return ve?.codigo_telefonico || paises[0]?.codigo_telefonico || '+58';
    }, [paises]);

    const [testCountryCode, setTestCountryCode] = useState<string>(defaultCountryDial);
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState(
        `{Hola|Buen día|Saludos} *{{cliente}}*, mensaje de prueba enviado desde la línea oficial de *{{sucursal}}* en *${empresa_nombre}*. ✅`
    );
    const [testSimulateTyping, setTestSimulateTyping] = useState(true);
    const [testUseQueue, setTestUseQueue] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);
    const [testPreviews, setTestPreviews] = useState<string[]>([]);
    const [checkLoading, setCheckLoading] = useState(false);
    const [checkResult, setCheckResult] = useState<{
        exists: boolean;
        phone: string;
        verified_live?: boolean;
        verified_name?: string | null;
        reason?: string | null;
    } | null>(null);

    // Formulario Anti-Baneo por sucursal
    const [abDailyLimit, setAbDailyLimit] = useState(initialQueueStats?.dailyLimit ?? whatsapp_rate_limit);
    const [abHourlyLimit, setAbHourlyLimit] = useState(initialQueueStats?.hourlyLimit ?? whatsapp_hourly_limit);
    const [abWarmupMode, setAbWarmupMode] = useState(initialQueueStats?.warmupMode ?? whatsapp_warmup_mode);
    const [abWorkingHoursEnabled, setAbWorkingHoursEnabled] = useState(
        initialQueueStats?.workingHoursEnabled ?? whatsapp_working_hours_enabled
    );
    const [abWorkingHoursStart, setAbWorkingHoursStart] = useState(
        initialQueueStats?.workingHoursStart ?? whatsapp_working_hours_start
    );
    const [abWorkingHoursEnd, setAbWorkingHoursEnd] = useState(
        initialQueueStats?.workingHoursEnd ?? whatsapp_working_hours_end
    );
    const [abSimulateTyping, setAbSimulateTyping] = useState(
        initialQueueStats?.simulateTyping ?? whatsapp_simulate_typing
    );
    const [abTypingMinSec, setAbTypingMinSec] = useState(initialQueueStats?.typingMinSec ?? whatsapp_typing_min_sec);
    const [abTypingMaxSec, setAbTypingMaxSec] = useState(initialQueueStats?.typingMaxSec ?? whatsapp_typing_max_sec);
    const [abDelayMinSec, setAbDelayMinSec] = useState(initialQueueStats?.delayMinSec ?? whatsapp_delay_min_sec);
    const [abDelayMaxSec, setAbDelayMaxSec] = useState(initialQueueStats?.delayMaxSec ?? whatsapp_delay_max_sec);
    const [abBatchSize, setAbBatchSize] = useState(initialQueueStats?.batchSize ?? whatsapp_batch_size);
    const [abBatchPauseSec, setAbBatchPauseSec] = useState(
        initialQueueStats?.batchPauseSec ?? whatsapp_batch_pause_sec
    );
    const [abVerifyNumber, setAbVerifyNumber] = useState(initialQueueStats?.verifyNumber ?? whatsapp_verify_number);
    const [abProxyUrl, setAbProxyUrl] = useState(initialQueueStats?.proxyUrl ?? whatsapp_proxy_url);
    const [savingAntiBan, setSavingAntiBan] = useState(false);

    // Difusión Segura (Fixsale: Clientes, Empleados, Usuarios)
    const [bcTarget, setBcTarget] = useState<'clientes' | 'empleados' | 'usuarios'>('clientes');
    const [bcOnlyBranch, setBcOnlyBranch] = useState<boolean>(true);
    const [bcRecipients, setBcRecipients] = useState<BroadcastRecipient[]>([]);
    const [bcSelectedIds, setBcSelectedIds] = useState<number[]>([]);
    const [bcSearch, setBcSearch] = useState('');
    const [bcMessage, setBcMessage] = useState(
        '{Hola|Buen día|Estimado/a} *{cliente}*, te {saludamos|escribimos} desde *{sucursal}* de *{empresa}* para informarte sobre nuestras novedades y servicio técnico.'
    );
    const [bcPreviews, setBcPreviews] = useState<string[]>([]);
    const [bcLoadingRecipients, setBcLoadingRecipients] = useState(false);
    const [bcDispatching, setBcDispatching] = useState(false);

    // Plantillas CRUD
    const [templates, setTemplates] = useState<WhatsAppTemplateItem[]>(initialTemplates);
    const [tplCategoryFilter, setTplCategoryFilter] = useState<string>('all');
    const [tplDialogOpen, setTplDialogOpen] = useState(false);
    const [editingTpl, setEditingTpl] = useState<WhatsAppTemplateItem | null>(null);
    const [tplNombre, setTplNombre] = useState('');
    const [tplCategoria, setTplCategoria] = useState('reparacion');
    const [tplContenido, setTplContenido] = useState('');
    const [tplActivo, setTplActivo] = useState(true);
    const [tplPreviews, setTplPreviews] = useState<string[]>([]);
    const [savingTpl, setSavingTpl] = useState(false);

    // Bitácora & Cola
    const [messagesData, setMessagesData] = useState<{
        data: WhatsAppMessageItem[];
        current_page: number;
        last_page: number;
        total: number;
    } | null>(null);
    const [messagesStats, setMessagesStats] = useState({
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalFailed: 0,
        totalQueued: 0,
        deliveryRate: 100,
        readRate: 0,
    });
    const [msgPage, setMsgPage] = useState(1);
    const [msgSearch, setMsgSearch] = useState('');
    const [msgStatusFilter, setMsgStatusFilter] = useState('all');
    const [msgDirectionFilter, setMsgDirectionFilter] = useState('all');
    const [msgAllBranches, setMsgAllBranches] = useState(false);
    const [msgLoading, setMsgLoading] = useState(false);
    const [retryingId, setRetryingId] = useState<number | null>(null);

    // Modal Diagnóstico
    const [diagOpen, setDiagOpen] = useState(false);
    const [diagLoading, setDiagLoading] = useState(false);
    const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);

    const selectedInstance = useMemo(
        () => instances.find((i) => i.id === selectedSucursalId) || instances[0] || null,
        [instances, selectedSucursalId]
    );

    const syncAntiBanForm = useCallback((qs: QueueStats | null) => {
        if (!qs) return;
        setAbDailyLimit(qs.dailyLimit ?? 200);
        setAbHourlyLimit(qs.hourlyLimit ?? 25);
        setAbWarmupMode(Boolean(qs.warmupMode));
        setAbWorkingHoursEnabled(Boolean(qs.workingHoursEnabled));
        setAbWorkingHoursStart((qs.workingHoursStart || '08:00').slice(0, 5));
        setAbWorkingHoursEnd((qs.workingHoursEnd || '20:00').slice(0, 5));
        setAbSimulateTyping(Boolean(qs.simulateTyping));
        setAbTypingMinSec(Number(qs.typingMinSec ?? 2.0));
        setAbTypingMaxSec(Number(qs.typingMaxSec ?? 6.0));
        setAbDelayMinSec(Number(qs.delayMinSec ?? 8));
        setAbDelayMaxSec(Number(qs.delayMaxSec ?? 20));
        setAbBatchSize(Number(qs.batchSize ?? 10));
        setAbBatchPauseSec(Number(qs.batchPauseSec ?? 60));
        setAbVerifyNumber(Boolean(qs.verifyNumber));
        setAbProxyUrl(qs.proxyUrl || '');
    }, []);

    // Cargar resumen en vivo de todas las sucursales
    const loadInstances = useCallback(async () => {
        try {
            const res = await fetch('/admin/integrations/whatsapp/instances', {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.instances)) {
                    setInstances(data.instances);
                }
            }
        } catch {
            // silencioso
        }
    }, []);

    // Cargar estado y estadísticas de la sucursal seleccionada
    const loadSelectedBranchData = useCallback(
        async (sucursalId: number | null, syncForm = false) => {
            if (!sucursalId) return;
            try {
                const res = await fetch(`/admin/integrations/whatsapp/status?sucursal_id=${sucursalId}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        const newStatus: LiveStatus | null = data.status || null;
                        setLiveStatus(newStatus);
                        if (typeof data.whatsapp_active === 'boolean') {
                            setBranchActive(data.whatsapp_active);
                        }
                        if (data.instance_name) {
                            setInstanceSlugInput(data.instance_name);
                        }
                        if (data.queue_stats) {
                            setQueueStats(data.queue_stats);
                            if (syncForm) {
                                syncAntiBanForm(data.queue_stats);
                            }
                        }

                        const nowConn = Boolean(newStatus?.isConnected);
                        if (nowConn && !prevConnectedRef.current) {
                            toast.success(
                                `¡WhatsApp vinculado exitosamente! (+${newStatus?.phoneNumber || data.whatsapp_phone || ''})`
                            );
                            setPairingCode(null);
                            loadInstances();
                        }
                        prevConnectedRef.current = nowConn;
                    }
                }
            } catch {
                // silencioso
            }
        },
        [syncAntiBanForm, loadInstances]
    );

    // Cargar historial de mensajes
    const loadMessages = useCallback(
        async (
            page = msgPage,
            search = msgSearch,
            statusFilter = msgStatusFilter,
            direction = msgDirectionFilter,
            allBranches = msgAllBranches
        ) => {
            setMsgLoading(true);
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    per_page: '12',
                    search: search || '',
                    status: statusFilter || 'all',
                    direction: direction || 'all',
                    all_branches: allBranches ? '1' : '0',
                });
                if (selectedSucursalId) {
                    params.set('sucursal_id', String(selectedSucursalId));
                }
                const res = await fetch(`/admin/integrations/whatsapp/messages?${params.toString()}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setMessagesData(data.messages);
                        if (data.stats) setMessagesStats(data.stats);
                    }
                }
            } catch {
                // silencioso
            } finally {
                setMsgLoading(false);
            }
        },
        [msgPage, msgSearch, msgStatusFilter, msgDirectionFilter, msgAllBranches, selectedSucursalId]
    );

    // Cargar destinatarios de difusión
    const loadBroadcastRecipients = useCallback(
        async (target = bcTarget, onlyBranch = bcOnlyBranch) => {
            setBcLoadingRecipients(true);
            try {
                const params = new URLSearchParams({
                    target,
                    only_branch: onlyBranch ? '1' : '0',
                });
                if (selectedSucursalId) params.set('sucursal_id', String(selectedSucursalId));
                const res = await fetch(`/admin/integrations/whatsapp/broadcast/recipients?${params.toString()}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setBcRecipients(data.recipients || []);
                        setBcSelectedIds([]);
                    }
                }
            } catch {
                toast.error('Error cargando contactos de difusión');
            } finally {
                setBcLoadingRecipients(false);
            }
        },
        [bcTarget, bcOnlyBranch, selectedSucursalId]
    );

    // Cambiar de sucursal desde las tarjetas superiores
    const handleSelectBranch = async (sucursalId: number) => {
        if (sucursalId === selectedSucursalId) return;
        setSwitchingBranch(true);
        setSelectedSucursalId(sucursalId);
        setPairingCode(null);
        setCheckResult(null);
        setMsgPage(1);

        // Actualizar query param en URL sin recargar página
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('sucursal_id', String(sucursalId));
            window.history.replaceState({}, '', url.toString());
        } catch {
            // ignorar
        }

        const branchObj = instances.find((i) => i.id === sucursalId);
        if (branchObj) {
            setBranchActive(branchObj.whatsapp_active);
            setInstanceSlugInput(branchObj.whatsapp_instance);
            prevConnectedRef.current = branchObj.is_connected;
        }

        await loadSelectedBranchData(sucursalId, true);
        setSwitchingBranch(false);
    };

    // Polling inteligente en vivo (2.5s mientras espera QR/conexión/cola, 10s en reposo)
    useEffect(() => {
        const st = liveStatus?.connectionState?.toUpperCase() || '';
        const fastMode =
            st === 'QR_READY' ||
            st === 'CONNECTING' ||
            st === 'RECONNECTING' ||
            (queueStats?.queued ?? 0) > 0 ||
            Boolean(liveStatus?.currentlyTypingTo) ||
            Boolean(pairingCode);

        const interval = setInterval(() => {
            loadSelectedBranchData(selectedSucursalId, false);
            loadInstances();
            if (activeTab === 'logs' || (queueStats?.queued ?? 0) > 0) {
                loadMessages(msgPage, msgSearch, msgStatusFilter, msgDirectionFilter, msgAllBranches);
            }
        }, fastMode ? 2500 : 10000);

        return () => clearInterval(interval);
    }, [
        liveStatus?.connectionState,
        liveStatus?.currentlyTypingTo,
        queueStats?.queued,
        pairingCode,
        activeTab,
        selectedSucursalId,
        msgPage,
        msgSearch,
        msgStatusFilter,
        msgDirectionFilter,
        msgAllBranches,
        loadSelectedBranchData,
        loadInstances,
        loadMessages,
    ]);

    // Cargar destinatarios cuando se abre la pestaña Difusión o cambia sucursal/audiencia
    useEffect(() => {
        if (activeTab === 'broadcast') {
            loadBroadcastRecipients(bcTarget, bcOnlyBranch);
        }
    }, [activeTab, bcTarget, bcOnlyBranch, selectedSucursalId, loadBroadcastRecipients]);

    // Cargar bitácora cuando se abre la pestaña Cola & Bitácora o cambian filtros
    useEffect(() => {
        if (activeTab === 'logs') {
            loadMessages(msgPage, msgSearch, msgStatusFilter, msgDirectionFilter, msgAllBranches);
        }
    }, [activeTab, msgPage, msgSearch, msgStatusFilter, msgDirectionFilter, msgAllBranches, selectedSucursalId, loadMessages]);

    // ── ACCIONES DE CONEXIÓN POR SUCURSAL ───────────────────────────────

    const handleConnect = async () => {
        setLoadingAction(true);
        setPairingCode(null);
        try {
            const res = await fetch('/admin/integrations/whatsapp/connect', {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: JSON.stringify({ sucursal_id: selectedSucursalId }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setBranchActive(true);
                if (data.status) setLiveStatus(data.status);
                await loadInstances();
                if (data.status?.isConnected) {
                    toast.success(`Sucursal conectada (+${data.status.phoneNumber || ''})`);
                } else if (data.status?.qrDataUrl) {
                    toast.success('Código QR generado. Escanéalo con tu teléfono.');
                } else {
                    toast.info('Iniciando sesión de WhatsApp...');
                }
            } else {
                toast.error(data.error || 'No se pudo iniciar la instancia de WhatsApp.');
            }
        } catch {
            toast.error('Error de comunicación con el servidor.');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleReconnect = async () => {
        setLoadingAction(true);
        setPairingCode(null);
        try {
            const res = await fetch('/admin/integrations/whatsapp/reconnect', {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: JSON.stringify({ sucursal_id: selectedSucursalId, clear_session: true }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (data.status) setLiveStatus(data.status);
                await loadInstances();
                toast.success('Sesión reiniciada. Nuevo código QR listo.');
            } else {
                toast.error(data.error || 'No se pudo regenerar la sesión.');
            }
        } catch {
            toast.error('Error intentando reiniciar la sesión.');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleDisconnect = async () => {
        const confirm = await Swal.fire({
            title: '¿Desvincular línea de esta sucursal?',
            text: `Se cerrará la sesión de WhatsApp de "${selectedInstance?.nombre || 'esta sucursal'}" y deberás escanear el QR nuevamente para volver a vincularla.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, desvincular',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#e11d48',
        });
        if (!confirm.isConfirmed) return;

        setLoadingAction(true);
        setPairingCode(null);
        try {
            const res = await fetch('/admin/integrations/whatsapp/disconnect', {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: JSON.stringify({ sucursal_id: selectedSucursalId }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setLiveStatus(data.status || { isConnected: false, connectionState: 'DISCONNECTED', qrCode: null });
                prevConnectedRef.current = false;
                await loadInstances();
                toast.success(data.message || 'Sesión desvinculada correctamente.');
            } else {
                toast.error(data.error || 'No se pudo desvincular la instancia.');
            }
        } catch {
            toast.error('Error comunicando con el servidor.');
        } finally {
            setLoadingAction(false);
        }
    };

    const handlePairPhone = async () => {
        if (!pairPhoneInput.trim()) {
            toast.error('Ingresa el número de WhatsApp con código de país (ej. +584121234567)');
            return;
        }
        setPairLoading(true);
        setPairingCode(null);
        try {
            const res = await fetch('/admin/integrations/whatsapp/pair', {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: JSON.stringify({
                    sucursal_id: selectedSucursalId,
                    phone: pairPhoneInput.trim(),
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (data.already_connected) {
                    toast.success('Esta sucursal ya tiene WhatsApp conectado.');
                    loadSelectedBranchData(selectedSucursalId, false);
                } else if (data.pairing_code) {
                    setPairingCode(data.pairing_code);
                    toast.success('Código de 8 dígitos generado. Ingrésalo en WhatsApp → Dispositivos vinculados.');
                }
            } else {
                toast.error(data.error || 'No se pudo generar el código de emparejamiento.');
            }
        } catch {
            toast.error('Error conectando con el servicio de WhatsApp.');
        } finally {
            setPairLoading(false);
        }
    };

    const handleCopyPairingCode = () => {
        if (!pairingCode) return;
        navigator.clipboard.writeText(pairingCode);
        setCopiedCode(true);
        toast.success('Código copiado al portapapeles');
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleToggleBranchActive = async (nextActive: boolean) => {
        setBranchActive(nextActive);
        try {
            const res = await fetch('/admin/integrations/whatsapp/toggle-active', {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: JSON.stringify({ sucursal_id: selectedSucursalId, active: nextActive }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message);
                loadInstances();
                loadSelectedBranchData(selectedSucursalId, false);
            } else {
                setBranchActive(!nextActive);
                toast.error(data.error || 'No se pudo actualizar el estado.');
            }
        } catch {
            setBranchActive(!nextActive);
            toast.error('Error al actualizar el estado de la sucursal.');
        }
    };

    const handleSaveInstanceConfig = async () => {
        setSavingInstanceConfig(true);
        try {
            const res = await fetch('/admin/integrations/whatsapp/update', {
                method: 'PUT',
                headers: getCsrfHeaders(),
                body: JSON.stringify({
                    sucursal_id: selectedSucursalId,
                    whatsapp_instance: instanceSlugInput.trim(),
                    whatsapp_active: branchActive,
                    ...(is_superadmin ? { whatsapp_api_url: apiUrlInput.trim() } : {}),
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || 'Configuración de instancia actualizada.');
                if (data.whatsapp_instance) setInstanceSlugInput(data.whatsapp_instance);
                loadInstances();
                loadSelectedBranchData(selectedSucursalId, false);
            } else {
                toast.error(data.error || data.message || 'No se pudo guardar la configuración.');
            }
        } catch {
            toast.error('Error guardando configuración de la instancia.');
        } finally {
            setSavingInstanceConfig(false);
        }
    };

    // ── VERIFICADOR & ENVÍO DE PRUEBA ───────────────────────────────────

    const buildFullTestPhone = () => {
        const raw = testPhone.replace(/\D/g, '');
        if (!raw) return '';
        const cleanDigits = raw.startsWith('0') ? raw.slice(1) : raw;
        const prefix = testCountryCode.replace(/\D/g, '');
        if (prefix && cleanDigits.startsWith(prefix) && cleanDigits.length >= 11) {
            return cleanDigits;
        }
        return prefix ? `${prefix}${cleanDigits}` : cleanDigits;
    };

    const handleCheckNumber = async () => {
        const fullPhone = buildFullTestPhone();
        if (!fullPhone) {
            toast.error('Ingresa un número telefónico para verificar.');
            return;
        }
        setCheckLoading(true);
        setCheckResult(null);
        try {
            const res = await fetch('/admin/integrations/whatsapp/check-number', {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: JSON.stringify({
                    sucursal_id: selectedSucursalId,
                    phone: fullPhone,
                }),
            });
            const data = await res.json();
            const r = data.result || data.data;
            if (res.ok && data.success && r) {
                setCheckResult({
                    exists: Boolean(r.exists),
                    phone: r.phone || r.formattedPhone || fullPhone,
                    verified_live: Boolean(r.verified_live),
                    verified_name: r.verified_name || null,
                    reason: r.reason || null,
                });
                if (r.exists) {
                    toast.success(`+${r.phone || fullPhone} tiene WhatsApp activo`);
                } else {
                    toast.warning(`+${r.phone || fullPhone} NO está registrado en WhatsApp`);
                }
            } else {
                toast.error(data.error || 'No se pudo verificar el número.');
            }
        } catch {
            toast.error('Error al contactar con el motor de WhatsApp.');
        } finally {
            setCheckLoading(false);
        }
    };

    const handleSendTest = async () => {
        const fullPhone = buildFullTestPhone();
        if (!fullPhone || !testMessage.trim()) {
            toast.error('Completa el número destino y el mensaje de prueba.');
            return;
        }
        setSendingTest(true);
        try {
            const res = await fetch('/admin/integrations/whatsapp/send-message', {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: JSON.stringify({
                    sucursal_id: selectedSucursalId,
                    to: fullPhone,
                    message: testMessage,
                    sync: !testUseQueue,
                    simulate_typing: testSimulateTyping,
                    verify_number: abVerifyNumber,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || 'Mensaje despachado correctamente.');
                loadSelectedBranchData(selectedSucursalId, false);
                loadInstances();
                if (activeTab === 'logs') {
                    loadMessages(1, msgSearch, msgStatusFilter, msgDirectionFilter, msgAllBranches);
                }
            } else {
                toast.error(data.error || 'No se pudo enviar el mensaje de prueba.');
            }
        } catch {
            toast.error('Error de red al enviar el mensaje.');
        } finally {
            setSendingTest(false);
        }
    };

    // ── POLÍTICAS ANTI-BANEO Y CONTROL DE COLA ──────────────────────────

    const handleSaveAntiBan = async () => {
        setSavingAntiBan(true);
        try {
            const res = await fetch('/admin/integrations/whatsapp/antiban', {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: JSON.stringify({
                    sucursal_id: selectedSucursalId,
                    dailyLimit: abDailyLimit,
                    hourlyLimit: abHourlyLimit,
                    warmupMode: abWarmupMode,
                    workingHoursEnabled: abWorkingHoursEnabled,
                    workingHoursStart: abWorkingHoursStart,
                    workingHoursEnd: abWorkingHoursEnd,
                    simulateTyping: abSimulateTyping,
                    typingMinSec: abTypingMinSec,
                    typingMaxSec: abTypingMaxSec,
                    delayMinSec: abDelayMinSec,
                    delayMaxSec: abDelayMaxSec,
                    batchSize: abBatchSize,
                    batchPauseSec: abBatchPauseSec,
                    verifyNumber: abVerifyNumber,
                    proxyUrl: abProxyUrl.trim(),
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || 'Políticas Anti-Baneo guardadas.');
                if (data.stats) setQueueStats(data.stats);
                loadInstances();
            } else {
                toast.error(data.error || 'Error guardando políticas Anti-Baneo.');
            }
        } catch {
            toast.error('Error de red al guardar políticas Anti-Baneo.');
        } finally {
            setSavingAntiBan(false);
        }
    };

    const handleToggleQueuePause = async () => {
        const nextPaused = !(queueStats?.queuePaused || liveStatus?.queuePaused);
        try {
            const res = await fetch('/admin/integrations/whatsapp/queue/toggle', {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: JSON.stringify({
                    sucursal_id: selectedSucursalId,
                    paused: nextPaused,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message);
                if (data.stats) setQueueStats(data.stats);
                loadSelectedBranchData(selectedSucursalId, false);
                loadInstances();
            } else {
                toast.error(data.error || 'Error cambiando el estado de la cola.');
            }
        } catch {
            toast.error('Error de red cambiando estado de la cola.');
        }
    };

    const handleClearQueue = async () => {
        const confirm = await Swal.fire({
            title: '¿Cancelar cola pendiente?',
            text: `Se cancelarán todos los mensajes en cola de "${selectedInstance?.nombre || 'esta sucursal'}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, cancelar cola',
            cancelButtonText: 'Volver',
            confirmButtonColor: '#e11d48',
        });
        if (!confirm.isConfirmed) return;

        try {
            const res = await fetch('/admin/integrations/whatsapp/queue/clear', {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: JSON.stringify({ sucursal_id: selectedSucursalId }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || 'Cola vaciada.');
                loadSelectedBranchData(selectedSucursalId, false);
                loadInstances();
                loadMessages(1, msgSearch, msgStatusFilter, msgDirectionFilter, msgAllBranches);
            }
        } catch {
            toast.error('Error vaciando la cola.');
        }
    };

    // ── SPINTAX PREVIEW ─────────────────────────────────────────────────

    const handlePreviewSpintax = async (text: string, target: 'test' | 'broadcast' | 'template') => {
        if (!text.trim()) return;
        try {
            const res = await fetch('/admin/integrations/whatsapp/preview-spintax', {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: JSON.stringify({
                    sucursal_id: selectedSucursalId,
                    text,
                    count: 3,
                }),
            });
            const data = await res.json();
            const vars: string[] = data.variations || data.data?.variations || [];
            if (target === 'test') setTestPreviews(vars);
            else if (target === 'broadcast') setBcPreviews(vars);
            else setTplPreviews(vars);
        } catch {
            toast.error('No se pudo previsualizar Spintax.');
        }
    };

    // ── DIFUSIÓN SEGURA ─────────────────────────────────────────────────

    const filteredRecipients = useMemo(() => {
        const q = bcSearch.trim().toLowerCase();
        if (!q) return bcRecipients;
        return bcRecipients.filter(
            (r) =>
                r.name.toLowerCase().includes(q) ||
                r.phone.toLowerCase().includes(q) ||
                r.sucursal.toLowerCase().includes(q)
        );
    }, [bcRecipients, bcSearch]);

    const validFilteredIds = useMemo(
        () => filteredRecipients.filter((r) => r.is_valid_phone).map((r) => r.id),
        [filteredRecipients]
    );

    const toggleSelectAllValid = (checked: boolean) => {
        setBcSelectedIds(checked ? validFilteredIds : []);
    };

    const toggleRecipient = (id: number) => {
        setBcSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const estimatedBroadcastMinutes = useMemo(() => {
        const count = bcSelectedIds.length;
        if (count === 0) return 0;
        const avgDelay = (abDelayMinSec + abDelayMaxSec) / 2;
        const avgTyping = abSimulateTyping ? (abTypingMinSec + abTypingMaxSec) / 2 : 0;
        const batches = Math.floor(count / Math.max(2, abBatchSize));
        const totalSec = count * (avgDelay + avgTyping) + batches * abBatchPauseSec;
        return Math.max(1, Math.ceil(totalSec / 60));
    }, [bcSelectedIds.length, abDelayMinSec, abDelayMaxSec, abSimulateTyping, abTypingMinSec, abTypingMaxSec, abBatchSize, abBatchPauseSec]);

    const handleDispatchBroadcast = async () => {
        if (bcSelectedIds.length === 0) {
            toast.error('Selecciona al menos un destinatario con teléfono válido.');
            return;
        }
        if (!bcMessage.trim()) {
            toast.error('Escribe el mensaje a encolar.');
            return;
        }

        const confirm = await Swal.fire({
            title: '¿Encolar difusión segura?',
            html: `<div class="text-left text-sm space-y-1.5">
                <p><b>Sucursal emisora:</b> ${selectedInstance?.nombre || 'Sucursal'}</p>
                <p><b>Destinatarios:</b> <span class="font-bold text-emerald-600">${bcSelectedIds.length} contacto(s)</span></p>
                <p><b>Duración estimada:</b> ~${estimatedBroadcastMinutes} min (con retardos humanos y pausas por lote)</p>
            </div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, encolar difusión',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#059669',
        });
        if (!confirm.isConfirmed) return;

        setBcDispatching(true);
        try {
            const res = await fetch('/admin/integrations/whatsapp/broadcast/send', {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: JSON.stringify({
                    sucursal_id: selectedSucursalId,
                    target_type: bcTarget,
                    recipient_ids: bcSelectedIds,
                    message_content: bcMessage,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || 'Difusión encolada correctamente.');
                setBcSelectedIds([]);
                setActiveTab('logs');
                await loadSelectedBranchData(selectedSucursalId, false);
                await loadInstances();
                await loadMessages(1, '', 'all', 'all', false);
            } else {
                toast.error(data.error || 'Error al encolar la difusión.');
            }
        } catch {
            toast.error('Error de red al encolar la difusión.');
        } finally {
            setBcDispatching(false);
        }
    };

    // ── PLANTILLAS CRUD ─────────────────────────────────────────────────

    const filteredTemplates = useMemo(() => {
        if (tplCategoryFilter === 'all') return templates;
        return templates.filter((t) => t.categoria === tplCategoryFilter);
    }, [templates, tplCategoryFilter]);

    const openNewTemplate = () => {
        setEditingTpl(null);
        setTplNombre('');
        setTplCategoria('reparacion');
        setTplContenido(
            '{Hola|Buen día} *{cliente}*, te {informamos|confirmamos} desde *{sucursal}* que tu equipo ({equipo}) de la orden *{orden}* ya se encuentra listo para retirar. ✅'
        );
        setTplActivo(true);
        setTplPreviews([]);
        setTplDialogOpen(true);
    };

    const openEditTemplate = (tpl: WhatsAppTemplateItem) => {
        setEditingTpl(tpl);
        setTplNombre(tpl.nombre);
        setTplCategoria(tpl.categoria || 'general');
        setTplContenido(tpl.contenido);
        setTplActivo(tpl.activo);
        setTplPreviews([]);
        setTplDialogOpen(true);
    };

    const handleSaveTemplate = async () => {
        if (!tplNombre.trim() || !tplContenido.trim()) {
            toast.error('Nombre y contenido son obligatorios.');
            return;
        }
        setSavingTpl(true);
        try {
            const url = editingTpl
                ? `/admin/integrations/whatsapp/templates/${editingTpl.id}`
                : '/admin/integrations/whatsapp/templates';
            const method = editingTpl ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: getCsrfHeaders(),
                body: JSON.stringify({
                    nombre: tplNombre.trim(),
                    categoria: tplCategoria,
                    contenido: tplContenido,
                    activo: tplActivo,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (editingTpl && data.template) {
                    setTemplates((prev) => prev.map((t) => (t.id === editingTpl.id ? data.template : t)));
                } else if (data.template) {
                    setTemplates((prev) => [data.template, ...prev]);
                }
                toast.success(data.message || 'Plantilla guardada.');
                setTplDialogOpen(false);
            } else {
                toast.error(data.error || 'No se pudo guardar la plantilla.');
            }
        } catch {
            toast.error('Error guardando plantilla.');
        } finally {
            setSavingTpl(false);
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        const confirm = await Swal.fire({
            title: '¿Eliminar plantilla?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#e11d48',
        });
        if (!confirm.isConfirmed) return;

        try {
            const res = await fetch(`/admin/integrations/whatsapp/templates/${id}`, {
                method: 'DELETE',
                headers: getCsrfHeaders(),
            });
            if (res.ok) {
                setTemplates((prev) => prev.filter((t) => t.id !== id));
                toast.success('Plantilla eliminada.');
            }
        } catch {
            toast.error('No se pudo eliminar la plantilla.');
        }
    };

    const handleRetryMessage = async (id: number) => {
        setRetryingId(id);
        try {
            const res = await fetch(`/admin/integrations/whatsapp/messages/${id}/retry`, {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: JSON.stringify({ sucursal_id: selectedSucursalId }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || 'Mensaje reenviado.');
                loadMessages(msgPage, msgSearch, msgStatusFilter, msgDirectionFilter, msgAllBranches);
                loadSelectedBranchData(selectedSucursalId, false);
            } else {
                toast.error(data.error || 'Fallo al reintentar.');
            }
        } catch {
            toast.error('Error de red al reintentar.');
        } finally {
            setRetryingId(null);
        }
    };

    // ── DIAGNÓSTICO DEL MOTOR PYTHON ────────────────────────────────────

    const handleRunDiagnostic = async () => {
        setDiagOpen(true);
        setDiagLoading(true);
        setDiagnostic(null);
        try {
            const res = await fetch(
                `/admin/integrations/whatsapp/diagnostic?sucursal_id=${selectedSucursalId || ''}`,
                { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
            );
            if (res.ok) {
                const data = await res.json();
                setDiagnostic(data);
            }
        } catch {
            toast.error('Error ejecutando diagnóstico del servicio de WhatsApp.');
        } finally {
            setDiagLoading(false);
        }
    };

    // ── HELPERS VISUALES ────────────────────────────────────────────────

    const connState = (liveStatus?.connectionState || 'DISCONNECTED').toUpperCase();
    const isServiceUnavailable = liveStatus?._error === 'service_unavailable';
    const isConnected = Boolean(liveStatus?.isConnected) || connState === 'CONNECTED';
    const isQrReady = !isConnected && (connState === 'QR_READY' || Boolean(liveStatus?.qrDataUrl || liveStatus?.qrCode));
    const isConnecting = !isConnected && (connState === 'CONNECTING' || connState === 'RECONNECTING');
    const isReconnecting = !isConnected && connState === 'RECONNECTING';
    const isBannedCooldown = connState === 'BANNED_COOLDOWN';
    const isPaused = Boolean(queueStats?.queuePaused || liveStatus?.queuePaused);

    const safetyScore = queueStats?.safetyScore ?? 100;
    const dailyPct = queueStats
        ? Math.min(100, Math.round((queueStats.sentToday / Math.max(1, queueStats.effectiveDailyLimit)) * 100))
        : 0;
    const hourlyPct = queueStats
        ? Math.min(100, Math.round((queueStats.sentThisHour / Math.max(1, queueStats.hourlyLimit)) * 100))
        : 0;

    const renderStateBadge = (state: string, compact = false) => {
        switch ((state || '').toUpperCase()) {
            case 'CONNECTED':
            case 'OPEN':
                return (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1.5 font-semibold">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        {compact ? 'En línea' : 'Conectado'}
                    </Badge>
                );
            case 'QR_READY':
            case 'QR':
                return (
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 gap-1.5 font-semibold">
                        <QrCode className="size-3" />
                        Esperando QR
                    </Badge>
                );
            case 'RECONNECTING':
                return (
                    <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 gap-1.5 font-semibold">
                        <Loader2 className="size-3 animate-spin" />
                        Reconectando
                    </Badge>
                );
            case 'CONNECTING':
                return (
                    <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 gap-1.5 font-semibold">
                        <Loader2 className="size-3 animate-spin" />
                        Conectando
                    </Badge>
                );
            case 'BANNED_COOLDOWN':
                return (
                    <Badge variant="destructive" className="gap-1.5 font-semibold">
                        <ShieldAlert className="size-3" />
                        Pausa Anti-Ban
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="text-muted-foreground gap-1.5 font-medium">
                        <WifiOff className="size-3" />
                        Desconectado
                    </Badge>
                );
        }
    };

    const renderMsgStatus = (status: string) => {
        switch (status) {
            case 'read':
                return (
                    <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 gap-1 text-[11px]">
                        <CheckCheck className="size-3" /> Leído
                    </Badge>
                );
            case 'delivered':
                return (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1 text-[11px]">
                        <CheckCheck className="size-3" /> Entregado
                    </Badge>
                );
            case 'sent':
                return (
                    <Badge className="bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 gap-1 text-[11px]">
                        <Check className="size-3" /> Enviado
                    </Badge>
                );
            case 'sending':
                return (
                    <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 gap-1 text-[11px]">
                        <Keyboard className="size-3 animate-pulse" /> Escribiendo...
                    </Badge>
                );
            case 'queued':
            case 'pending':
                return (
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 gap-1 text-[11px]">
                        <Clock className="size-3" /> En cola
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge variant="outline" className="text-muted-foreground text-[11px]">
                        Cancelado
                    </Badge>
                );
            default:
                return (
                    <Badge variant="destructive" className="gap-1 text-[11px]">
                        <AlertTriangle className="size-3" /> Fallido
                    </Badge>
                );
        }
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Integrations'), href: '/admin/integrations' },
        { title: 'WhatsApp Multi-Sucursal', href: '/admin/integrations/whatsapp' },
    ];

    const connectedBranchesCount = instances.filter((i) => i.is_connected).length;

    return (
        <>
            <Head title="WhatsApp Multi-Sucursal" />
            <div className="space-y-5 w-full pb-10">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* ── ENCABEZADO PRINCIPAL ── */}
                <ModuleHeader
                    icon={<MessageSquare className="size-6 text-white" />}
                    title="Centro de WhatsApp Multi-Sucursal"
                    description={`Servicio de mensajería para ${empresa_nombre} · 1 línea independiente por sucursal.`}
                    colorClassName="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-800 shadow-sm"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        {isServiceUnavailable ? (
                            <Badge className="bg-rose-500/90 hover:bg-rose-500 text-white border-white/25 gap-1.5 px-2.5 py-1 text-xs">
                                <WifiOff className="size-3.5" />
                                Servicio Offline
                            </Badge>
                        ) : (
                            <Badge className="bg-white/15 hover:bg-white/20 text-white border-white/25 gap-1.5 px-2.5 py-1 text-xs">
                                <Cpu className="size-3.5" />
                                Servicio Activo · {connectedBranchesCount}/{instances.length || 1} en línea
                            </Badge>
                        )}
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleRunDiagnostic}
                            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 gap-1.5 h-8 text-xs"
                        >
                            <Activity className="size-3.5" />
                            <span className="hidden sm:inline">Diagnóstico</span>
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                                loadInstances();
                                loadSelectedBranchData(selectedSucursalId, false);
                                toast.info('Estado sincronizado con el servicio de WhatsApp');
                            }}
                            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 h-8 px-2.5"
                            title="Sincronizar estado"
                        >
                            <RefreshCw className="size-3.5" />
                        </Button>
                    </div>
                </ModuleHeader>

                {/* ── ALERTA SERVICIO OFFLINE ── */}
                {isServiceUnavailable && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
                        <div className="flex items-start gap-3">
                            <Terminal className="size-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
                                    El servicio de WhatsApp está detenido
                                </p>
                                <p className="text-xs text-rose-800/90 dark:text-rose-300/90">
                                    No se detectó respuesta del servicio de mensajería. Verifica que el servicio esté activo o contacta a soporte técnico.
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                loadInstances();
                                loadSelectedBranchData(selectedSucursalId, true);
                            }}
                            className="border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 gap-1.5 shrink-0"
                        >
                            <RefreshCw className="size-3.5" />
                            Reintentar
                        </Button>
                    </div>
                )}

                {/* ── SELECTOR MULTI-INSTANCIA POR SUCURSAL ── */}
                <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <Building2 className="size-3.5 text-emerald-600" />
                            <span>Instancias por Sucursal ({instances.length || 1})</span>
                            {switchingBranch && <Loader2 className="size-3.5 animate-spin text-primary" />}
                        </div>
                        {liveStatus?.currentlyTypingTo && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1.5 animate-pulse">
                                <Keyboard className="size-3.5" />
                                Escribiendo a +{liveStatus.currentlyTypingTo}...
                            </Badge>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {instances.map((inst) => {
                            const isSelected = inst.id === selectedSucursalId;
                            const pct = Math.min(
                                100,
                                Math.round((inst.sent_today / Math.max(1, inst.effective_daily_limit)) * 100)
                            );
                            return (
                                <button
                                    key={inst.id}
                                    type="button"
                                    onClick={() => handleSelectBranch(inst.id)}
                                    className={cn(
                                        'text-left rounded-xl border p-3.5 transition-all cursor-pointer bg-card hover:border-emerald-500/50',
                                        isSelected
                                            ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                                            : 'border-border/80 hover:bg-muted/30',
                                        !inst.whatsapp_active && 'opacity-75'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <Store className="size-3.5 text-emerald-600 shrink-0" />
                                                <p className="text-sm font-bold text-foreground truncate">{inst.nombre}</p>
                                            </div>
                                            <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
                                                {inst.whatsapp_phone ? `+${inst.whatsapp_phone}` : inst.whatsapp_instance}
                                            </p>
                                        </div>
                                        {renderStateBadge(inst.connection_state, true)}
                                    </div>

                                    <div className="mt-3 space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                            <span>
                                                Hoy: <strong>{inst.sent_today}</strong>/{inst.effective_daily_limit}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                {!inst.whatsapp_active && (
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                                        Inactiva
                                                    </span>
                                                )}
                                                {inst.queued > 0 && (
                                                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                                        {inst.queued} cola
                                                    </span>
                                                )}
                                                {inst.queue_paused && <Pause className="size-3 text-rose-500" />}
                                            </span>
                                        </div>
                                        <Progress value={pct} className="h-1.5" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── ALERTA CIRCUIT BREAKER / PAUSA ── */}
                {(isPaused || isBannedCooldown) && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-foreground">
                                    {isBannedCooldown
                                        ? `Circuit Breaker Anti-Ban Activado (${selectedInstance?.nombre})`
                                        : `Cola de Envíos en Pausa (${selectedInstance?.nombre})`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {queueStats?.pauseReason ||
                                        liveStatus?.pauseReason ||
                                        'Los envíos en cola están retenidos para proteger la línea de esta sucursal.'}
                                </p>
                            </div>
                        </div>
                        <Button size="sm" onClick={handleToggleQueuePause} className="gap-1.5 shrink-0">
                            <Play className="size-3.5" />
                            Reanudar Cola
                        </Button>
                    </div>
                )}

                {/* ── BANNER DE SALDO Y CUPO DE MENSAJERÍA ── */}
                {wallet_summary && wallet_summary.billing_enabled && (
                    wallet_summary.is_unlimited ? (
                        <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <Badge className="bg-emerald-600 text-white">Super Administrador</Badge>
                                <span className="text-xs sm:text-sm font-semibold text-foreground">
                                    Mensajería WhatsApp ilimitada (sin límite de envíos ni cobro por mensaje).
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Cupo Gratis del Ciclo
                                    </p>
                                    <p className="text-base font-black text-foreground">
                                        {wallet_summary.free_remaining} / {wallet_summary.free_quota} disponibles
                                    </p>
                                </div>
                                <div className="h-8 w-px bg-border hidden sm:block" />
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Saldo Prepago (${unitCostUsd.toFixed(3)} USD/msg)
                                    </p>
                                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                        ${wallet_summary.balance_usd.toFixed(4)} USD{' '}
                                        <span className="text-xs font-medium text-muted-foreground">
                                            (~{wallet_summary.paid_remaining_messages} mensajes)
                                        </span>
                                    </p>
                                </div>
                                {wallet_summary.total_remaining_messages <= 10 && (
                                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px]">
                                        Saldo bajo: compra al menos {minPurchaseMessages} mensajes
                                    </Badge>
                                )}
                            </div>
                            <Button
                                size="sm"
                                onClick={() => setTopupOpen(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shrink-0"
                            >
                                Comprar Mensajes (Mín. {minPurchaseMessages})
                            </Button>
                        </div>
                    )
                )}

                {/* ── 4 KPIs EN TIEMPO REAL DE LA SUCURSAL ACTIVA ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <Card className="border-border/80">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Sucursal: {selectedInstance?.nombre || '—'}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={branchActive}
                                        onCheckedChange={handleToggleBranchActive}
                                        title="Activar/Desactivar WhatsApp en esta sucursal"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-base font-bold text-foreground truncate font-mono">
                                    {liveStatus?.phoneNumber
                                        ? `+${liveStatus.phoneNumber}`
                                        : selectedInstance?.whatsapp_phone
                                        ? `+${selectedInstance.whatsapp_phone}`
                                        : instanceSlugInput || '—'}
                                </span>
                                {renderStateBadge(connState, true)}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                                {liveStatus?.pushName
                                    ? `Perfil: ${liveStatus.pushName}`
                                    : branchActive
                                    ? 'Sesión aislada cifrada'
                                    : 'Integración pausada para esta sucursal'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Cuota Diaria / Horaria</span>
                                <Flame className="size-4 text-amber-500" />
                            </div>
                            <div className="flex items-baseline justify-between">
                                <span className="text-xl font-black text-foreground">
                                    {queueStats?.sentToday ?? 0}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {' '}
                                        / {queueStats?.effectiveDailyLimit ?? abDailyLimit}
                                    </span>
                                </span>
                                {(queueStats?.warmupMode ?? abWarmupMode) && (
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400"
                                    >
                                        Warm-up Día {queueStats?.warmupDay ?? 1}
                                    </Badge>
                                )}
                            </div>
                            <Progress value={dailyPct} className="h-1.5" />
                            <p className="text-[11px] text-muted-foreground">
                                Última hora:{' '}
                                <strong>
                                    {queueStats?.sentThisHour ?? 0}/{queueStats?.hourlyLimit ?? abHourlyLimit}
                                </strong>{' '}
                                ({hourlyPct}%)
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Control de Cola</span>
                                <Clock className="size-4 text-sky-500" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-black text-foreground">
                                    {queueStats?.queued ?? 0} en cola
                                </span>
                                <Button
                                    size="sm"
                                    variant={isPaused ? 'default' : 'outline'}
                                    onClick={handleToggleQueuePause}
                                    className="h-7 px-2.5 text-xs gap-1"
                                >
                                    {isPaused ? <Play className="size-3" /> : <Pause className="size-3" />}
                                    {isPaused ? 'Reanudar' : 'Pausar'}
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                <span
                                    className={cn(
                                        'size-2 rounded-full shrink-0',
                                        (queueStats?.withinWorkingHours ?? true) ? 'bg-emerald-500' : 'bg-amber-500'
                                    )}
                                />
                                {(queueStats?.workingHoursEnabled ?? abWorkingHoursEnabled)
                                    ? (queueStats?.withinWorkingHours ?? true)
                                        ? `En horario laboral (${queueStats?.workingHoursStart || abWorkingHoursStart}–${queueStats?.workingHoursEnd || abWorkingHoursEnd})`
                                        : `Fuera de horario (retiene hasta ${queueStats?.workingHoursStart || abWorkingHoursStart})`
                                    : 'Despacho habilitado 24/7'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Escudo Anti-Baneo</span>
                                <ShieldCheck
                                    className={cn(
                                        'size-4',
                                        safetyScore >= 80
                                            ? 'text-emerald-500'
                                            : safetyScore >= 50
                                            ? 'text-amber-500'
                                            : 'text-rose-500'
                                    )}
                                />
                            </div>
                            <div className="flex items-baseline justify-between">
                                <span className="text-xl font-black text-foreground">{safetyScore}%</span>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'text-[10px]',
                                        safetyScore >= 80
                                            ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                                            : safetyScore >= 50
                                            ? 'border-amber-500/40 text-amber-600 dark:text-amber-400'
                                            : 'border-rose-500/40 text-rose-600 dark:text-rose-400'
                                    )}
                                >
                                    {safetyScore >= 80 ? 'Blindaje Alto' : safetyScore >= 50 ? 'Moderado' : 'Riesgo Alto'}
                                </Badge>
                            </div>
                            <Progress value={safetyScore} className="h-1.5" />
                            <p className="text-[11px] text-muted-foreground truncate">
                                {(queueStats?.simulateTyping ?? abSimulateTyping)
                                    ? `Typing (${queueStats?.typingMinSec ?? abTypingMinSec}–${queueStats?.typingMaxSec ?? abTypingMaxSec}s) · Delay ${queueStats?.delayMinSec ?? abDelayMinSec}–${queueStats?.delayMaxSec ?? abDelayMaxSec}s`
                                    : 'Activa Typing y Warm-up para mayor blindaje'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── PESTAÑAS PRINCIPALES ── */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="w-full justify-start overflow-x-auto bg-muted/60 p-1 h-auto flex-wrap sm:flex-nowrap">
                        <TabsTrigger value="connection" className="gap-1.5 text-xs py-2 cursor-pointer">
                            <QrCode className="size-3.5" />
                            <span>Instancia & Conexión</span>
                        </TabsTrigger>
                        <TabsTrigger value="antiban" className="gap-1.5 text-xs py-2 cursor-pointer">
                            <Shield className="size-3.5" />
                            <span>Seguridad Anti-Baneo</span>
                        </TabsTrigger>
                        <TabsTrigger value="broadcast" className="gap-1.5 text-xs py-2 cursor-pointer">
                            <Megaphone className="size-3.5" />
                            <span>Difusión Segura</span>
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="gap-1.5 text-xs py-2 cursor-pointer">
                            <FileText className="size-3.5" />
                            <span>Plantillas & Spintax</span>
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="gap-1.5 text-xs py-2 cursor-pointer">
                            <Inbox className="size-3.5" />
                            <span>Cola & Bitácora</span>
                            {(queueStats?.queued ?? 0) > 0 && (
                                <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-amber-500 text-white">
                                    {queueStats?.queued}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* TAB 1: INSTANCIA, VINCULACIÓN DIRECTA & PRUEBAS EN VIVO */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <TabsContent value="connection" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* Tarjeta Izquierda: Vinculación QR / Código de 8 Dígitos */}
                            <Card className="lg:col-span-6 border-border/80 flex flex-col justify-between">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Smartphone className="size-4 text-emerald-600" />
                                                Vincular: {selectedInstance?.nombre || 'Sucursal'}
                                            </CardTitle>
                                            <CardDescription className="text-xs mt-0.5">
                                                Sesión Multi-Dispositivo aislada para esta sucursal.
                                            </CardDescription>
                                        </div>
                                        {renderStateBadge(connState)}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4 flex-1">
                                    {isConnected ? (
                                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-3">
                                            <div className="mx-auto size-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                                                <CheckCircle2 className="size-8 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground">
                                                    WhatsApp Conectado
                                                </h3>
                                                <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                                                    +{liveStatus?.phoneNumber || selectedInstance?.whatsapp_phone || 'Línea vinculada'}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {liveStatus?.pushName && (
                                                        <>
                                                            Cuenta: <strong>{liveStatus.pushName}</strong> ·{' '}
                                                        </>
                                                    )}
                                                    Instancia:{' '}
                                                    <span className="font-mono font-medium">
                                                        {liveStatus?.instanceName || instanceSlugInput}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleReconnect}
                                                    disabled={loadingAction}
                                                    className="gap-1.5"
                                                >
                                                    <RotateCw className="size-3.5" />
                                                    Cambiar Línea
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={handleDisconnect}
                                                    disabled={loadingAction}
                                                    className="gap-1.5"
                                                >
                                                    <Power className="size-3.5" />
                                                    Desvincular Sesión
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Selector de método de emparejamiento */}
                                            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted/50 border border-border/70">
                                                <button
                                                    type="button"
                                                    onClick={() => setLinkMode('qr')}
                                                    className={cn(
                                                        'flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition cursor-pointer',
                                                        linkMode === 'qr'
                                                            ? 'bg-card text-foreground shadow-xs border border-border/80'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    )}
                                                >
                                                    <QrCode className="size-3.5" />
                                                    Código QR
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLinkMode('phone')}
                                                    className={cn(
                                                        'flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition cursor-pointer',
                                                        linkMode === 'phone'
                                                            ? 'bg-card text-foreground shadow-xs border border-border/80'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    )}
                                                >
                                                    <Hash className="size-3.5" />
                                                    Código de 8 Dígitos
                                                </button>
                                            </div>

                                            {linkMode === 'qr' ? (
                                                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-5 min-h-[270px] space-y-4">
                                                    {isQrReady && (liveStatus?.qrDataUrl || liveStatus?.qrCode) ? (
                                                        <>
                                                            <div className="bg-white p-3 rounded-xl shadow-md border border-slate-200">
                                                                <img
                                                                    src={liveStatus.qrDataUrl || liveStatus.qrCode || ''}
                                                                    alt="Código QR WhatsApp"
                                                                    className="size-52 object-contain"
                                                                />
                                                            </div>
                                                            <div className="text-center space-y-1">
                                                                <p className="text-xs font-semibold text-foreground">
                                                                    WhatsApp → Dispositivos vinculados → Vincular dispositivo
                                                                </p>
                                                                {typeof liveStatus.qrExpiresIn === 'number' && (
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        Actualización automática · Expira en aprox.{' '}
                                                                        <strong className="text-amber-600 dark:text-amber-400">
                                                                            {liveStatus.qrExpiresIn}s
                                                                        </strong>
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={handleReconnect}
                                                                    disabled={loadingAction}
                                                                    className="gap-1.5 text-xs"
                                                                >
                                                                    <RotateCw className="size-3.5" />
                                                                    Regenerar QR
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={handleDisconnect}
                                                                    disabled={loadingAction}
                                                                    className="text-xs text-muted-foreground"
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : isConnecting || loadingAction ? (
                                                        <div className="text-center space-y-3 py-8">
                                                            <Loader2 className="size-10 animate-spin text-emerald-600 mx-auto" />
                                                            <div>
                                                                <p className="text-sm font-semibold text-foreground">
                                                                    {isReconnecting
                                                                        ? 'Restaurando sesión de WhatsApp automáticamente...'
                                                                        : 'Negociando sesión cifrada con WhatsApp...'}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {isReconnecting
                                                                        ? 'Reconectando el socket cifrado de esta sucursal.'
                                                                        : 'Generando código QR desde el servicio de WhatsApp.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center space-y-4 py-6 max-w-xs">
                                                            <div className="mx-auto size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                                                <QrCode className="size-7 text-emerald-600" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-bold text-foreground">
                                                                    Sucursal sin vincular
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Genera un código QR exclusivo para{' '}
                                                                    <strong>{selectedInstance?.nombre}</strong> sin APIs externas.
                                                                </p>
                                                            </div>
                                                            <Button
                                                                onClick={handleConnect}
                                                                disabled={loadingAction || isServiceUnavailable}
                                                                className="gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            >
                                                                <Zap className="size-4" />
                                                                Iniciar Instancia y Generar QR
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-4">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-foreground">
                                                            Vincular sin Cámara (Código de 8 dígitos)
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Ingresa el número de WhatsApp de{' '}
                                                            <strong>{selectedInstance?.nombre}</strong> con código de país.
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Input
                                                            value={pairPhoneInput}
                                                            onChange={(e) => setPairPhoneInput(e.target.value)}
                                                            placeholder="Ej: +584121234567"
                                                            className="h-10 text-xs font-mono"
                                                        />
                                                        <Button
                                                            onClick={handlePairPhone}
                                                            disabled={pairLoading || isServiceUnavailable}
                                                            className="gap-1.5 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        >
                                                            {pairLoading ? (
                                                                <Loader2 className="size-4 animate-spin" />
                                                            ) : (
                                                                <Hash className="size-4" />
                                                            )}
                                                            Generar Código
                                                        </Button>
                                                    </div>

                                                    {pairingCode && (
                                                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-center space-y-2">
                                                            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                                                                Código de Vinculación WhatsApp
                                                            </p>
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className="text-2xl font-mono font-black tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
                                                                    {pairingCode}
                                                                </span>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={handleCopyPairingCode}
                                                                >
                                                                    {copiedCode ? (
                                                                        <Check className="size-4 text-emerald-500" />
                                                                    ) : (
                                                                        <Copy className="size-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                En tu móvil: WhatsApp → Dispositivos vinculados → Vincular con número de teléfono
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {liveStatus?.lastError && (
                                                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                                                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                                                    <span>{liveStatus.lastError}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Identificador de instancia de la sucursal */}
                                    <Separator />
                                    <div className="space-y-2.5 pt-1">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                            <Settings2 className="size-3.5" />
                                            <span>Identificador de Instancia ({selectedInstance?.nombre})</span>
                                        </div>
                                        <div className={cn('grid gap-2', is_superadmin ? 'sm:grid-cols-2' : 'grid-cols-1')}>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">
                                                    ID de Instancia SQLite
                                                </Label>
                                                <Input
                                                    value={instanceSlugInput}
                                                    onChange={(e) => setInstanceSlugInput(e.target.value)}
                                                    className="h-8 text-xs font-mono"
                                                    placeholder="sucursal_1"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleSaveInstanceConfig}
                                                disabled={savingInstanceConfig}
                                                className="h-7 text-xs gap-1.5"
                                            >
                                                {savingInstanceConfig ? (
                                                    <Loader2 className="size-3 animate-spin" />
                                                ) : (
                                                    <Save className="size-3" />
                                                )}
                                                Guardar Instancia
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tarjeta Derecha: Probador en Vivo & Verificador */}
                            <Card className="lg:col-span-6 border-border/80">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Send className="size-4 text-emerald-600" />
                                        Probador en Vivo & Verificador WhatsApp
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Verifica si un cliente tiene WhatsApp activo y prueba Spintax + simulación real de escritura desde{' '}
                                        <strong>{selectedInstance?.nombre}</strong>.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Número Destino</Label>
                                        <div className="flex gap-2">
                                            {paises.length > 0 && (
                                                <Select value={testCountryCode} onValueChange={setTestCountryCode}>
                                                    <SelectTrigger className="w-[105px] h-10 text-xs font-mono shrink-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {paises
                                                            .filter(
                                                                (p, idx, arr) =>
                                                                    Boolean(p.codigo_telefonico) &&
                                                                    arr.findIndex(
                                                                        (x) =>
                                                                            x.codigo_telefonico ===
                                                                            p.codigo_telefonico
                                                                    ) === idx
                                                            )
                                                            .map((p) => {
                                                                const dialCode = p.codigo_telefonico ?? '+58';
                                                                return (
                                                                    <SelectItem
                                                                        key={p.id}
                                                                        value={dialCode}
                                                                        className="text-xs font-mono"
                                                                    >
                                                                        {p.codigo_iso2} {dialCode}
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            <div className="relative flex-1">
                                                <Phone className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                                <Input
                                                    value={testPhone}
                                                    onChange={(e) => {
                                                        setTestPhone(e.target.value);
                                                        setCheckResult(null);
                                                    }}
                                                    placeholder="4121234567"
                                                    className="pl-9 h-10 text-xs font-mono"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleCheckNumber}
                                                disabled={checkLoading || !testPhone.trim() || isServiceUnavailable}
                                                className="gap-1.5 text-xs shrink-0 h-10"
                                            >
                                                {checkLoading ? (
                                                    <Loader2 className="size-3.5 animate-spin" />
                                                ) : (
                                                    <ShieldCheck className="size-3.5" />
                                                )}
                                                Verificar
                                            </Button>
                                        </div>

                                        {checkResult && (
                                            <div
                                                className={cn(
                                                    'rounded-lg border px-3 py-2 text-xs flex items-center justify-between gap-2',
                                                    checkResult.exists
                                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                        : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                                                )}
                                            >
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    {checkResult.exists ? (
                                                        <CheckCircle2 className="size-3.5" />
                                                    ) : (
                                                        <AlertTriangle className="size-3.5" />
                                                    )}
                                                    +{checkResult.phone}:{' '}
                                                    {checkResult.exists
                                                        ? 'Cuenta activa en WhatsApp'
                                                        : 'No registrado en WhatsApp'}
                                                    {checkResult.verified_name ? ` (${checkResult.verified_name})` : ''}
                                                </span>
                                                <Badge variant="outline" className="text-[10px]">
                                                    {checkResult.verified_live ? 'Consulta en vivo' : 'Solo formato'}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <Label className="text-xs font-semibold">
                                                Mensaje de Prueba (Spintax {'{a|b}'})
                                            </Label>
                                            <div className="flex items-center gap-1">
                                                {['{{cliente}}', '{{sucursal}}', '{Hola|Buen día}'].map((chip) => (
                                                    <button
                                                        key={chip}
                                                        type="button"
                                                        onClick={() =>
                                                            setTestMessage((prev) => `${prev} ${chip}`.trim())
                                                        }
                                                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted hover:bg-emerald-500/15 hover:text-emerald-600 transition cursor-pointer"
                                                    >
                                                        +{chip}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <Textarea
                                            rows={4}
                                            value={testMessage}
                                            onChange={(e) => setTestMessage(e.target.value)}
                                            className="text-xs resize-none"
                                        />
                                        <div className="flex items-center justify-between">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handlePreviewSpintax(testMessage, 'test')}
                                                className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                                            >
                                                <Sparkles className="size-3.5" />
                                                Probar Variaciones Spintax
                                            </Button>
                                            <span className="text-[11px] text-muted-foreground">
                                                {testMessage.length} caracteres
                                            </span>
                                        </div>
                                        {testPreviews.length > 0 && (
                                            <div className="space-y-1 rounded-lg border border-border/70 bg-muted/20 p-2.5">
                                                {testPreviews.map((v, idx) => (
                                                    <p
                                                        key={idx}
                                                        className="text-[11px] text-muted-foreground border-b last:border-0 border-border/50 pb-1 last:pb-0"
                                                    >
                                                        <strong className="text-emerald-600 mr-1">#{idx + 1}</strong>
                                                        {v}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div className="flex items-center justify-between rounded-lg border border-border/70 p-3 bg-muted/20">
                                            <div className="space-y-0.5 pr-2">
                                                <Label className="text-xs font-semibold flex items-center gap-1.5">
                                                    <Keyboard className="size-3.5 text-emerald-600" />
                                                    Simular "Escribiendo..."
                                                </Label>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Envía presencia real antes del texto
                                                </p>
                                            </div>
                                            <Switch
                                                checked={testSimulateTyping}
                                                onCheckedChange={setTestSimulateTyping}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg border border-border/70 p-3 bg-muted/20">
                                            <div className="space-y-0.5 pr-2">
                                                <Label className="text-xs font-semibold flex items-center gap-1.5">
                                                    <Clock className="size-3.5 text-amber-500" />
                                                    Enviar vía Cola
                                                </Label>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Aplica horario y retardo del worker
                                                </p>
                                            </div>
                                            <Switch checked={testUseQueue} onCheckedChange={setTestUseQueue} />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleSendTest}
                                        disabled={sendingTest || !isConnected}
                                        className="w-full h-10 gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {sendingTest ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                {testSimulateTyping && !testUseQueue
                                                    ? 'Simulando "Escribiendo..." y enviando...'
                                                    : 'Despachando...'}
                                            </>
                                        ) : (
                                            <>
                                                <Send className="size-4" />
                                                {testUseQueue
                                                    ? 'Encolar Mensaje de Prueba'
                                                    : 'Enviar Prueba con Simulación Real'}
                                            </>
                                        )}
                                    </Button>

                                    {!isConnected && (
                                        <p className="text-[11px] text-center text-muted-foreground">
                                            Vincula la línea de <strong>{selectedInstance?.nombre}</strong> con QR o código de 8 dígitos para habilitar los envíos.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* TAB 2: SEGURIDAD ANTI-BANEO POR SUCURSAL                */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <TabsContent value="antiban" className="space-y-4">
                        <Card className="border-border/80">
                            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        className={cn(
                                            'size-14 rounded-2xl flex flex-col items-center justify-center font-black text-lg border shrink-0',
                                            safetyScore >= 80
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                : safetyScore >= 50
                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                        )}
                                    >
                                        {safetyScore}%
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-foreground">
                                            Índice de Protección Anti-Baneo · {selectedInstance?.nombre}
                                        </h3>
                                        {queueStats?.safetyTips && queueStats.safetyTips.length > 0 ? (
                                            <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                                                {queueStats.safetyTips.slice(0, 3).map((tip, idx) => (
                                                    <li key={idx}>{tip}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                Todas las capas de protección humana están configuradas de forma óptima para esta sucursal.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    onClick={handleSaveAntiBan}
                                    disabled={savingAntiBan}
                                    className="gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {savingAntiBan ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <ShieldCheck className="size-4" />
                                    )}
                                    Guardar Políticas ({selectedInstance?.nombre})
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* 1. Simulación Humana */}
                            <Card className="border-border/80">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Keyboard className="size-4 text-emerald-600" />
                                        Simulación de Comportamiento Humano ("Escribiendo...")
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Emite presencia real <code>composing</code> proporcional a la longitud del texto antes de enviarlo.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border border-border/70 p-3 bg-muted/20">
                                        <div>
                                            <Label className="text-xs font-semibold">
                                                Simular "Escribiendo..." en cada envío
                                            </Label>
                                            <p className="text-[11px] text-muted-foreground">
                                                Abre presencia online, muestra indicador de escritura y pausa antes de despachar.
                                            </p>
                                        </div>
                                        <Switch checked={abSimulateTyping} onCheckedChange={setAbSimulateTyping} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Duración mínima (seg)</Label>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                min={1}
                                                max={15}
                                                disabled={!abSimulateTyping}
                                                value={abTypingMinSec}
                                                onChange={(e) => setAbTypingMinSec(Number(e.target.value))}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Duración máxima (seg)</Label>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                min={1.5}
                                                max={25}
                                                disabled={!abSimulateTyping}
                                                value={abTypingMaxSec}
                                                onChange={(e) => setAbTypingMaxSec(Number(e.target.value))}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between rounded-lg border border-border/70 p-3 bg-muted/20">
                                        <div>
                                            <Label className="text-xs font-semibold">
                                                Verificar número en WhatsApp antes de enviar
                                            </Label>
                                            <p className="text-[11px] text-muted-foreground">
                                                Consulta <code>is_on_whatsapp</code> con caché de 10 min para evitar rebotes a líneas inexistentes.
                                            </p>
                                        </div>
                                        <Switch checked={abVerifyNumber} onCheckedChange={setAbVerifyNumber} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 2. Control de Cuotas, Retardos y Lotes */}
                            <Card className="border-border/80">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Zap className="size-4 text-amber-500" />
                                        Control de Cuotas, Retardos & Pausas de Enfriamiento
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        El worker asíncrono aplica retardos gaussianos aleatorios y descansos por lote para esta sucursal.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Límite diario máximo</Label>
                                            <Input
                                                type="number"
                                                min={10}
                                                max={5000}
                                                value={abDailyLimit}
                                                onChange={(e) => setAbDailyLimit(Number(e.target.value))}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Límite por hora</Label>
                                            <Input
                                                type="number"
                                                min={5}
                                                max={500}
                                                value={abHourlyLimit}
                                                onChange={(e) => setAbHourlyLimit(Number(e.target.value))}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Retardo mín. entre envíos (seg)</Label>
                                            <Input
                                                type="number"
                                                min={2}
                                                max={120}
                                                value={abDelayMinSec}
                                                onChange={(e) => setAbDelayMinSec(Number(e.target.value))}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Retardo máx. entre envíos (seg)</Label>
                                            <Input
                                                type="number"
                                                min={3}
                                                max={240}
                                                value={abDelayMaxSec}
                                                onChange={(e) => setAbDelayMaxSec(Number(e.target.value))}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Tamaño de lote (mensajes)</Label>
                                            <Input
                                                type="number"
                                                min={2}
                                                max={100}
                                                value={abBatchSize}
                                                onChange={(e) => setAbBatchSize(Number(e.target.value))}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Pausa de enfriamiento (seg)</Label>
                                            <Input
                                                type="number"
                                                min={10}
                                                max={600}
                                                value={abBatchPauseSec}
                                                onChange={(e) => setAbBatchPauseSec(Number(e.target.value))}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 3. Modo Calentamiento (Warm-up) */}
                            <Card className="border-border/80">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Flame className="size-4 text-orange-500" />
                                        Modo Calentamiento (Warm-up Progresivo)
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Escala progresivamente el límite diario según la antigüedad de la línea de esta sucursal.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border border-border/70 p-3 bg-muted/20">
                                        <div>
                                            <Label className="text-xs font-semibold">Activar Warm-up Progresivo</Label>
                                            <p className="text-[11px] text-muted-foreground">
                                                Día actual de esta línea: <strong>Día {queueStats?.warmupDay ?? 1}</strong> ·
                                                Límite hoy: <strong>{queueStats?.effectiveDailyLimit ?? 20} msgs</strong>
                                            </p>
                                        </div>
                                        <Switch checked={abWarmupMode} onCheckedChange={setAbWarmupMode} />
                                    </div>

                                    <div className="grid grid-cols-5 gap-1.5">
                                        {WARMUP_STAGES.map((st) => {
                                            const day = queueStats?.warmupDay ?? 1;
                                            const active = abWarmupMode && day >= st.minDay && day <= st.maxDay;
                                            return (
                                                <div
                                                    key={st.label}
                                                    className={cn(
                                                        'rounded-lg border p-2 text-center transition',
                                                        active
                                                            ? 'border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                            : 'border-border/70 bg-muted/20 text-muted-foreground'
                                                    )}
                                                >
                                                    <p className="text-[10px] font-semibold">{st.label}</p>
                                                    <p className="text-xs font-black mt-0.5">
                                                        {st.limit ? Math.min(st.limit, abDailyLimit) : abDailyLimit}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 4. Ventana Horaria & Proxy por Sucursal */}
                            <Card className="border-border/80">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Clock className="size-4 text-sky-500" />
                                        Ventana Horaria Laboral & Proxy Dedicado
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Retiene automáticamente mensajes fuera de horario y permite aislar la IP de cada sucursal.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border border-border/70 p-3 bg-muted/20">
                                        <div>
                                            <Label className="text-xs font-semibold">
                                                Restringir despachos en cola a horario laboral
                                            </Label>
                                            <p className="text-[11px] text-muted-foreground">
                                                Evita enviar mensajes de madrugada y reduce reportes de spam.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={abWorkingHoursEnabled}
                                            onCheckedChange={setAbWorkingHoursEnabled}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Hora de inicio</Label>
                                            <Input
                                                type="time"
                                                disabled={!abWorkingHoursEnabled}
                                                value={abWorkingHoursStart}
                                                onChange={(e) => setAbWorkingHoursStart(e.target.value)}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Hora de cierre</Label>
                                            <Input
                                                type="time"
                                                disabled={!abWorkingHoursEnabled}
                                                value={abWorkingHoursEnd}
                                                onChange={(e) => setAbWorkingHoursEnd(e.target.value)}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">
                                            Proxy SOCKS5 / HTTP Residencial para esta Sucursal (Opcional)
                                        </Label>
                                        <Input
                                            value={abProxyUrl}
                                            onChange={(e) => setAbProxyUrl(e.target.value)}
                                            placeholder="socks5://usuario:clave@host:1080"
                                            className="h-9 text-xs font-mono"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Recomendado si gestionas muchas sucursales desde el mismo servidor para aislar su reputación IP.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* TAB 3: DIFUSIÓN SEGURA EN COLA ANTI-BANEO (FIXSALE)     */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <TabsContent value="broadcast" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* Selector de Destinatarios */}
                            <Card className="lg:col-span-5 border-border/80 flex flex-col">
                                <CardHeader className="pb-3 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Users className="size-4 text-emerald-600" />
                                            Destinatarios ({bcSelectedIds.length} seleccionados)
                                        </CardTitle>
                                        <Badge variant="outline" className="text-[10px]">
                                            {validFilteredIds.length} válidos
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Select
                                            value={bcTarget}
                                            onValueChange={(v) =>
                                                setBcTarget(v as 'clientes' | 'empleados' | 'usuarios')
                                            }
                                        >
                                            <SelectTrigger className="h-9 text-xs bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="clientes" className="text-xs">
                                                    Clientes
                                                </SelectItem>
                                                <SelectItem value="empleados" className="text-xs">
                                                    Empleados / Técnicos
                                                </SelectItem>
                                                <SelectItem value="usuarios" className="text-xs">
                                                    Usuarios del Sistema
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="relative">
                                            <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                                            <Input
                                                value={bcSearch}
                                                onChange={(e) => setBcSearch(e.target.value)}
                                                placeholder="Buscar..."
                                                className="pl-8 h-9 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 pt-1">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="only-branch-recipients"
                                                checked={bcOnlyBranch}
                                                onCheckedChange={(c) => setBcOnlyBranch(c === true)}
                                            />
                                            <Label
                                                htmlFor="only-branch-recipients"
                                                className="text-xs font-medium cursor-pointer"
                                            >
                                                Solo contactos de <strong>{selectedInstance?.nombre}</strong>
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="select-all-valid"
                                                checked={
                                                    validFilteredIds.length > 0 &&
                                                    bcSelectedIds.length === validFilteredIds.length
                                                }
                                                onCheckedChange={(c) => toggleSelectAllValid(c === true)}
                                            />
                                            <Label
                                                htmlFor="select-all-valid"
                                                className="text-xs font-medium cursor-pointer"
                                            >
                                                Seleccionar todos con teléfono válido ({validFilteredIds.length})
                                            </Label>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 overflow-y-auto max-h-[380px] space-y-1.5 pr-3">
                                    {bcLoadingRecipients ? (
                                        <div className="py-10 text-center text-xs text-muted-foreground">
                                            <Loader2 className="size-5 animate-spin mx-auto mb-2" />
                                            Cargando contactos...
                                        </div>
                                    ) : filteredRecipients.length === 0 ? (
                                        <div className="py-10 text-center text-xs text-muted-foreground">
                                            No se encontraron contactos con los filtros seleccionados.
                                        </div>
                                    ) : (
                                        filteredRecipients.map((r) => {
                                            const checked = bcSelectedIds.includes(r.id);
                                            return (
                                                <div
                                                    key={`${r.type}-${r.id}`}
                                                    onClick={() => r.is_valid_phone && toggleRecipient(r.id)}
                                                    className={cn(
                                                        'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition',
                                                        r.is_valid_phone
                                                            ? checked
                                                                ? 'border-emerald-600 bg-emerald-500/5 cursor-pointer'
                                                                : 'border-border/60 hover:bg-muted/40 cursor-pointer'
                                                            : 'border-border/40 opacity-50 cursor-not-allowed'
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <Checkbox
                                                            checked={checked}
                                                            disabled={!r.is_valid_phone}
                                                            onCheckedChange={() =>
                                                                r.is_valid_phone && toggleRecipient(r.id)
                                                            }
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-foreground truncate">
                                                                {r.name}
                                                            </p>
                                                            <p className="text-[11px] font-mono text-muted-foreground truncate">
                                                                {r.is_valid_phone
                                                                    ? r.formatted_phone
                                                                    : 'Sin teléfono válido'}{' '}
                                                                · {r.sucursal}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] shrink-0">
                                                        {r.role}
                                                    </Badge>
                                                </div>
                                            );
                                        })
                                    )}
                                </CardContent>
                            </Card>

                            {/* Redactor Spintax + Encolado Seguro */}
                            <Card className="lg:col-span-7 border-border/80">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Sparkles className="size-4 text-emerald-600" />
                                        Redactor con Spintax & Despacho Seguro ({selectedInstance?.nombre})
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Los mensajes se encolan en el worker de mensajería y salen uno a uno desde la línea de{' '}
                                        <strong>{selectedInstance?.nombre}</strong> con simulación de escritura y pausas aleatorias.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {templates.length > 0 && (
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Cargar desde Plantilla</Label>
                                            <Select
                                                onValueChange={(tplId) => {
                                                    const found = templates.find((t) => String(t.id) === tplId);
                                                    if (found) setBcMessage(found.contenido);
                                                }}
                                            >
                                                <SelectTrigger className="h-9 text-xs bg-background">
                                                    <SelectValue placeholder="Seleccionar una plantilla guardada..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {templates.map((t) => (
                                                        <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                                                            {t.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <Label className="text-xs font-semibold">Contenido del Mensaje</Label>
                                            <div className="flex flex-wrap items-center gap-1">
                                                {[
                                                    '{cliente}',
                                                    '{empresa}',
                                                    '{sucursal}',
                                                    '{Hola|Buen día|Saludos}',
                                                ].map((chip) => (
                                                    <button
                                                        key={chip}
                                                        type="button"
                                                        onClick={() =>
                                                            setBcMessage((prev) => `${prev} ${chip}`.trim())
                                                        }
                                                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted hover:bg-emerald-500/15 hover:text-emerald-600 transition cursor-pointer"
                                                    >
                                                        +{chip}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <Textarea
                                            rows={5}
                                            value={bcMessage}
                                            onChange={(e) => setBcMessage(e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handlePreviewSpintax(bcMessage, 'broadcast')}
                                            className="gap-1.5 text-xs"
                                        >
                                            <Sparkles className="size-3.5" />
                                            Probar Variaciones Spintax
                                        </Button>
                                        {bcPreviews.length > 0 && (
                                            <div className="space-y-1.5 rounded-lg border border-border/70 bg-muted/20 p-3">
                                                {bcPreviews.map((v, idx) => (
                                                    <p
                                                        key={idx}
                                                        className="text-xs text-muted-foreground border-b last:border-0 border-border/50 pb-1.5 last:pb-0"
                                                    >
                                                        <span className="font-bold text-emerald-600 mr-1.5">
                                                            #{idx + 1}
                                                        </span>
                                                        {v}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 text-xs space-y-1">
                                        <p className="font-bold text-foreground flex items-center gap-1.5">
                                            <ShieldCheck className="size-4 text-emerald-600" />
                                            Protección Activa para esta Difusión ({selectedInstance?.nombre})
                                        </p>
                                        <p className="text-muted-foreground">
                                            • Retardo aleatorio: <strong>{abDelayMinSec}–{abDelayMaxSec}s</strong> ·
                                            Pausa cada <strong>{abBatchSize}</strong> mensajes:{' '}
                                            <strong>{abBatchPauseSec}s</strong>
                                        </p>
                                        <p className="text-muted-foreground">
                                            • Simulación "Escribiendo...":{' '}
                                            <strong>{abSimulateTyping ? 'Activa' : 'Desactivada'}</strong> · Duración
                                            estimada para {bcSelectedIds.length} contacto(s):{' '}
                                            <strong>~{estimatedBroadcastMinutes} min</strong>
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleDispatchBroadcast}
                                        disabled={bcDispatching || bcSelectedIds.length === 0 || !isConnected}
                                        className="w-full h-10 gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {bcDispatching ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Megaphone className="size-4" />
                                        )}
                                        Encolar Difusión Segura ({bcSelectedIds.length} destinatarios)
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* TAB 4: PLANTILLAS & SPINTAX                             */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <TabsContent value="templates" className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-foreground">
                                    Biblioteca de Plantillas de FixSale
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Combina Spintax {'{Opción A|Opción B}'} y variables para órdenes de reparación, ventas, cobranzas y promociones.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={tplCategoryFilter} onValueChange={setTplCategoryFilter}>
                                    <SelectTrigger className="w-44 h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            Todas las categorías
                                        </SelectItem>
                                        {Object.entries(TEMPLATE_CATEGORIES).map(([key, meta]) => (
                                            <SelectItem key={key} value={key} className="text-xs">
                                                {meta.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    onClick={openNewTemplate}
                                    className="gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <Plus className="size-3.5" />
                                    Nueva Plantilla
                                </Button>
                            </div>
                        </div>

                        {filteredTemplates.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="py-12 text-center space-y-3">
                                    <FileText className="size-8 text-muted-foreground mx-auto" />
                                    <p className="text-sm font-semibold text-foreground">
                                        No hay plantillas registradas en esta categoría
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Crea plantillas con Spintax para notificar estados de reparación, recibos de venta o promociones.
                                    </p>
                                    <Button size="sm" onClick={openNewTemplate} className="gap-1.5">
                                        <Plus className="size-4" />
                                        Crear Primera Plantilla
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTemplates.map((tpl) => {
                                    const cat = TEMPLATE_CATEGORIES[tpl.categoria] || TEMPLATE_CATEGORIES.general;
                                    return (
                                        <Card
                                            key={tpl.id}
                                            className="border-border/80 flex flex-col justify-between"
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="space-y-1 min-w-0">
                                                        <CardTitle className="text-sm truncate">{tpl.nombre}</CardTitle>
                                                        <Badge variant="outline" className={cn('text-[10px]', cat.color)}>
                                                            {cat.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-7"
                                                            title="Probar en Sandbox"
                                                            onClick={() => {
                                                                setTestMessage(tpl.contenido);
                                                                setActiveTab('connection');
                                                                toast.info('Plantilla cargada en el probador en vivo.');
                                                            }}
                                                        >
                                                            <Send className="size-3.5 text-emerald-600" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-7"
                                                            onClick={() => openEditTemplate(tpl)}
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-7 text-rose-500 hover:text-rose-600"
                                                            onClick={() => handleDeleteTemplate(tpl.id)}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-1">
                                                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4 bg-muted/30 rounded-lg p-2.5 border border-border/50">
                                                    {tpl.contenido}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* TAB 5: COLA DE SALIDA & BITÁCORA DE MENSAJES            */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <TabsContent value="logs" className="space-y-4">
                        <Card className="border-border/80">
                            <CardHeader className="pb-3">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="relative w-52">
                                            <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                            <Input
                                                value={msgSearch}
                                                onChange={(e) => {
                                                    setMsgSearch(e.target.value);
                                                    setMsgPage(1);
                                                }}
                                                placeholder="Buscar teléfono o texto..."
                                                className="pl-8 h-9 text-xs"
                                            />
                                        </div>

                                        <Select
                                            value={msgStatusFilter}
                                            onValueChange={(v) => {
                                                setMsgStatusFilter(v);
                                                setMsgPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="w-40 h-9 text-xs bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all" className="text-xs">
                                                    Todos los estados
                                                </SelectItem>
                                                <SelectItem value="queued" className="text-xs">
                                                    En Cola / Enviando
                                                </SelectItem>
                                                <SelectItem value="sent" className="text-xs">
                                                    Enviados
                                                </SelectItem>
                                                <SelectItem value="delivered" className="text-xs">
                                                    Entregados (✓✓)
                                                </SelectItem>
                                                <SelectItem value="read" className="text-xs">
                                                    Leídos (✓✓ azul)
                                                </SelectItem>
                                                <SelectItem value="failed" className="text-xs">
                                                    Fallidos
                                                </SelectItem>
                                                <SelectItem value="cancelled" className="text-xs">
                                                    Cancelados
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select
                                            value={msgDirectionFilter}
                                            onValueChange={(v) => {
                                                setMsgDirectionFilter(v);
                                                setMsgPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="w-32 h-9 text-xs bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all" className="text-xs">
                                                    Dirección: Todas
                                                </SelectItem>
                                                <SelectItem value="outbound" className="text-xs">
                                                    Salientes
                                                </SelectItem>
                                                <SelectItem value="inbound" className="text-xs">
                                                    Entrantes
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="flex items-center gap-1.5 pl-1">
                                            <Checkbox
                                                id="all-branches-logs"
                                                checked={msgAllBranches}
                                                onCheckedChange={(c) => {
                                                    setMsgAllBranches(c === true);
                                                    setMsgPage(1);
                                                }}
                                            />
                                            <Label
                                                htmlFor="all-branches-logs"
                                                className="text-xs text-muted-foreground cursor-pointer"
                                            >
                                                Todas las sucursales
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mr-1">
                                            <span>
                                                Entrega: <strong>{messagesStats.deliveryRate}%</strong>
                                            </span>
                                            <span>·</span>
                                            <span>
                                                Lectura: <strong>{messagesStats.readRate}%</strong>
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={isPaused ? 'default' : 'outline'}
                                            onClick={handleToggleQueuePause}
                                            className="h-8 text-xs gap-1.5"
                                        >
                                            {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                                            {isPaused ? 'Reanudar' : 'Pausar'}
                                        </Button>
                                        {(queueStats?.queued ?? 0) > 0 && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleClearQueue}
                                                className="h-8 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10 gap-1.5"
                                            >
                                                <Trash2 className="size-3.5" />
                                                Cancelar Cola ({queueStats?.queued})
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                loadMessages(
                                                    msgPage,
                                                    msgSearch,
                                                    msgStatusFilter,
                                                    msgDirectionFilter,
                                                    msgAllBranches
                                                )
                                            }
                                            className="h-8 px-2"
                                        >
                                            <RefreshCw className={cn('size-3.5', msgLoading && 'animate-spin')} />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-y border-border/80 bg-muted/30 text-muted-foreground">
                                                <th className="text-left font-semibold py-2.5 px-4">Contacto</th>
                                                <th className="text-left font-semibold py-2.5 px-4">Flujo</th>
                                                <th className="text-left font-semibold py-2.5 px-4">Mensaje</th>
                                                <th className="text-left font-semibold py-2.5 px-4">Estado</th>
                                                <th className="text-left font-semibold py-2.5 px-4">Fecha</th>
                                                <th className="text-right font-semibold py-2.5 px-4">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60">
                                            {!messagesData || messagesData.data.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="py-10 text-center text-muted-foreground"
                                                    >
                                                        {msgLoading
                                                            ? 'Cargando bitácora...'
                                                            : 'No hay registros de mensajes con los filtros seleccionados.'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                messagesData.data.map((m) => (
                                                    <tr key={m.id} className="hover:bg-muted/20 transition">
                                                        <td className="py-3 px-4 align-top whitespace-nowrap">
                                                            <p className="font-semibold text-foreground">
                                                                {m.recipient_name || 'Contacto'}
                                                            </p>
                                                            <p className="text-[11px] font-mono text-muted-foreground">
                                                                +{m.recipient_phone.replace(/^\+/, '')}
                                                            </p>
                                                        </td>
                                                        <td className="py-3 px-4 align-top whitespace-nowrap">
                                                            {m.direction === 'inbound' ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-[10px] gap-1 text-sky-600 border-sky-500/30"
                                                                >
                                                                    <ArrowDownLeft className="size-3" /> Entrante
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-[10px] gap-1 text-emerald-600 border-emerald-500/30"
                                                                >
                                                                    <ArrowUpRight className="size-3" /> Saliente
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 align-top max-w-md">
                                                            <p className="text-foreground/90 line-clamp-2 whitespace-pre-wrap">
                                                                {m.message_content}
                                                            </p>
                                                            {m.error_message && (
                                                                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                                                                    <AlertTriangle className="size-3 shrink-0" />
                                                                    {m.error_message}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 align-top whitespace-nowrap">
                                                            {renderMsgStatus(m.status)}
                                                        </td>
                                                        <td className="py-3 px-4 align-top whitespace-nowrap text-muted-foreground">
                                                            {new Date(m.sent_at || m.created_at).toLocaleString()}
                                                        </td>
                                                        <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                                                            {m.direction === 'outbound' &&
                                                                (m.status === 'failed' || m.status === 'cancelled') && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        disabled={retryingId === m.id}
                                                                        onClick={() => handleRetryMessage(m.id)}
                                                                        className="h-7 px-2.5 text-[11px] gap-1"
                                                                    >
                                                                        {retryingId === m.id ? (
                                                                            <Loader2 className="size-3 animate-spin" />
                                                                        ) : (
                                                                            <RotateCw className="size-3" />
                                                                        )}
                                                                        Reintentar
                                                                    </Button>
                                                                )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {messagesData && messagesData.last_page > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-border/70 text-xs">
                                        <span className="text-muted-foreground">
                                            Página {messagesData.current_page} de {messagesData.last_page} (
                                            {messagesData.total} registros)
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={msgPage <= 1}
                                                onClick={() => setMsgPage((p) => Math.max(1, p - 1))}
                                                className="h-7 text-xs"
                                            >
                                                Anterior
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={msgPage >= messagesData.last_page}
                                                onClick={() => setMsgPage((p) => p + 1)}
                                                className="h-7 text-xs"
                                            >
                                                Siguiente
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* ── MODAL CREAR / EDITAR PLANTILLA ── */}
                <Dialog open={tplDialogOpen} onOpenChange={setTplDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingTpl ? 'Editar Plantilla' : 'Nueva Plantilla con Spintax'}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Usa variables como {'{cliente}'}, {'{sucursal}'}, {'{orden}'}, {'{equipo}'} combinadas con Spintax {'{Hola|Buen día}'}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Nombre *</Label>
                                    <Input
                                        value={tplNombre}
                                        onChange={(e) => setTplNombre(e.target.value)}
                                        placeholder="Ej: Equipo Listo para Entrega"
                                        className="h-9 text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Categoría</Label>
                                    <Select value={tplCategoria} onValueChange={setTplCategoria}>
                                        <SelectTrigger className="h-9 text-xs bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(TEMPLATE_CATEGORIES).map(([key, meta]) => (
                                                <SelectItem key={key} value={key} className="text-xs">
                                                    {meta.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center justify-between gap-1">
                                    <Label className="text-xs font-semibold">Contenido del Mensaje *</Label>
                                    <div className="flex flex-wrap gap-1">
                                        {['{cliente}', '{orden}', '{equipo}', '{sucursal}'].map((chip) => (
                                            <button
                                                key={chip}
                                                type="button"
                                                onClick={() => setTplContenido((prev) => `${prev} ${chip}`.trim())}
                                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted hover:bg-emerald-500/15 hover:text-emerald-600 cursor-pointer"
                                            >
                                                +{chip}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Textarea
                                    rows={5}
                                    value={tplContenido}
                                    onChange={(e) => setTplContenido(e.target.value)}
                                    className="text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePreviewSpintax(tplContenido, 'template')}
                                    className="text-xs gap-1.5"
                                >
                                    <Sparkles className="size-3.5" />
                                    Probar Spintax
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs">Activa</Label>
                                    <Switch checked={tplActivo} onCheckedChange={setTplActivo} />
                                </div>
                            </div>

                            {tplPreviews.length > 0 && (
                                <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1.5">
                                    {tplPreviews.map((v, i) => (
                                        <p key={i} className="text-xs text-muted-foreground">
                                            <strong className="text-emerald-600">#{i + 1}</strong> {v}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => setTplDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveTemplate}
                                disabled={savingTpl}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {savingTpl && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                                Guardar Plantilla
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── MODAL DIAGNÓSTICO DEL SERVICIO ── */}
                <Dialog open={diagOpen} onOpenChange={setDiagOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Cpu className="size-5 text-emerald-600" />
                                Diagnóstico del Servicio de WhatsApp
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Telemetría en tiempo real para{' '}
                                <strong>{selectedInstance?.nombre}</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        {diagLoading ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">
                                <Loader2 className="size-6 animate-spin mx-auto mb-2 text-emerald-600" />
                                Consultando estado interno del servicio...
                            </div>
                        ) : diagnostic ? (
                            <div className="space-y-2 text-xs">
                                {[
                                    ['Servicio', 'WhatsApp Multi-Sucursal'],
                                    ['Sucursal', diagnostic.target_name || selectedInstance?.nombre || '—'],
                                    ['Instancia SQLite', diagnostic.instance],
                                    ['Estado del Socket', diagnostic.socket_state],
                                    [
                                        'Hilo Nativo Activo',
                                        diagnostic.thread_alive ? 'Sí (Daemon Activo)' : 'Detenido',
                                    ],
                                    [
                                        'Línea Vinculada',
                                        diagnostic.phone_number ? `+${diagnostic.phone_number}` : 'Sin vincular',
                                    ],
                                    ['Latencia HTTP', `${diagnostic.latency_ms} ms`],
                                    ['Memoria RAM', diagnostic.memory_usage || 'N/D'],
                                    ['Sesión SQLite', `${diagnostic.session_size_kb ?? 0} KB`],
                                    ['Instancias Cargadas', String(diagnostic.active_instances_count ?? 1)],
                                    [
                                        'Worker Cola Anti-Ban',
                                        diagnostic.worker_running ? 'Activo' : 'Detenido',
                                    ],
                                ].map(([k, v]) => (
                                    <div
                                        key={k}
                                        className="flex items-center justify-between py-1.5 border-b border-border/60 last:border-0 gap-3"
                                    >
                                        <span className="text-muted-foreground">{k}</span>
                                        <span className="font-mono font-semibold text-foreground text-right truncate">
                                            {v}
                                        </span>
                                    </div>
                                ))}
                                {diagnostic.error && (
                                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-600 dark:text-rose-400">
                                        {diagnostic.error}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        <DialogFooter>
                            <Button size="sm" onClick={() => setDiagOpen(false)}>
                                Cerrar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── MODAL COMPRA DE MENSAJES WHATSAPP (MÍN. 100) ── */}
                <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Comprar Paquete de Mensajes WhatsApp</DialogTitle>
                            <DialogDescription className="text-xs">
                                Tarifa: <strong>${unitCostUsd.toFixed(4)} USD</strong> por mensaje enviado. Compra mínima:{' '}
                                <strong>{minPurchaseMessages} mensajes</strong> (${(minPurchaseMessages * unitCostUsd).toFixed(2)} USD).
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleTopupSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Paquetes rápidos</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(wallet_summary?.packages || [100, 500, 1000, 5000]).map((pkg) => (
                                        <Button
                                            key={pkg}
                                            type="button"
                                            size="sm"
                                            variant={topupMessages === pkg ? 'default' : 'outline'}
                                            onClick={() => setTopupMessages(pkg)}
                                            className="text-xs font-mono"
                                        >
                                            {pkg}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Cantidad de mensajes</Label>
                                    <Input
                                        type="number"
                                        min={minPurchaseMessages}
                                        value={topupMessages}
                                        onChange={(e) => setTopupMessages(Math.max(minPurchaseMessages, parseInt(e.target.value, 10) || minPurchaseMessages))}
                                        className="font-mono"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Total a pagar (USD)</Label>
                                    <div className="h-9 px-3 rounded-md border bg-muted/50 flex items-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        ${(topupMessages * unitCostUsd).toFixed(2)} USD
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Método de pago</Label>
                                    <Select value={topupMethod} onValueChange={setTopupMethod}>
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Selecciona método" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activePaymentMethods.map((m) => (
                                                <SelectItem key={m.id} value={m.id} className="text-xs">
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Referencia de pago</Label>
                                    <Input
                                        value={topupReference}
                                        onChange={(e) => setTopupReference(e.target.value)}
                                        placeholder="Folio o ID"
                                        className="text-xs"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Notas (opcional)</Label>
                                <Input
                                    value={topupNotes}
                                    onChange={(e) => setTopupNotes(e.target.value)}
                                    placeholder="Detalles adicionales..."
                                    className="text-xs"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" size="sm" onClick={() => setTopupOpen(false)} disabled={topupSubmitting}>
                                    Cancelar
                                </Button>
                                <Button type="submit" size="sm" disabled={topupSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {topupSubmitting ? 'Enviando...' : `Solicitar ${topupMessages} mensajes`}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
