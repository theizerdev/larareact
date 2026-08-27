import { Head, useForm, router } from '@inertiajs/react';
import {
    Settings2, MessageSquare, QrCode, RefreshCw, Power, Send, Key,
    Database, AlertTriangle, CheckCircle2, Copy, Check, Activity, Phone,
    Shield, Clock, Sparkles, UserCheck, Flame, ListOrdered, CheckCircle,
    XCircle, HelpCircle, Server, Radio, ShieldCheck, ArrowRight, ExternalLink,
    Zap, Globe, Terminal, Layers, FileText, Plus, Trash2, Edit3, Search,
    Eye, CheckCheck, AlertCircle, HeartHandshake, Wifi, WifiOff, Heart,
    BarChart3, Inbox, RotateCw, Play, Filter, ArrowUpRight, Users, Megaphone,
    CheckSquare, Square, Volume2
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import type { PaisPhoneOption } from '@/pages/admin/Empresas/Partials/PhoneInputGroup';
import PhoneInputGroup from '@/pages/admin/Empresas/Partials/PhoneInputGroup';

interface LiveStatus {
    isConnected: boolean;
    connectionState: string;
    qrCode: string | null;
    qrDataUrl?: string | null;
    token?: string | null;
    user: {
        id: string;
        name?: string;
    } | null;
    userJid?: string | null;
    lastSeen: string | null;
    reconnectAttempts: number;
    _error?: string;
}

interface QueueStats {
    totalQueued?: number;
    queued?: number;
    sentToday?: number;
    dailyLimit?: number;
    warmupMode?: boolean;
    rateLimitPerMin?: number;
    workingHoursEnabled?: boolean;
    workingHoursStart?: string;
    workingHoursEnd?: string;
    proxyUrl?: string;
    [key: string]: any;
}

interface WhatsAppTemplateItem {
    id: number;
    empresa_id: number;
    nombre: string;
    categoria: string;
    contenido: string;
    variables: string[] | null;
    activo: boolean;
    created_at?: string;
    updated_at?: string;
}

interface WhatsAppMessageItem {
    id: number;
    message_id?: string | null;
    recipient_phone: string;
    recipient_name?: string | null;
    message_content: string;
    variables?: Record<string, any> | null;
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
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
    type: 'user' | 'pastor';
    name: string;
    email?: string;
    phone: string;
    formatted_phone: string;
    is_valid_phone: boolean;
    zonas: string;
    distritos: string;
    role: string;
    codigo?: string;
}

interface PageProps {
    empresa_id: number;
    empresa_nombre: string;
    whatsapp_api_key: string | null;
    whatsapp_api_url: string;
    whatsapp_instance?: string;
    whatsapp_rate_limit: number;
    whatsapp_warmup_mode?: boolean;
    whatsapp_working_hours_enabled?: boolean;
    whatsapp_working_hours_start?: string;
    whatsapp_working_hours_end?: string;
    whatsapp_proxy_url?: string;
    whatsapp_active: boolean;
    whatsapp_phone: string | null;
    whatsapp_status: string | null;
    live_status: LiveStatus | null;
    queue_stats?: QueueStats | null;
    templates?: WhatsAppTemplateItem[];
    paises: PaisPhoneOption[];
}

export default function WhatsAppIntegration({
    empresa_id,
    empresa_nombre,
    whatsapp_api_key,
    whatsapp_api_url,
    whatsapp_instance = '',
    whatsapp_rate_limit,
    whatsapp_warmup_mode = true,
    whatsapp_working_hours_enabled = true,
    whatsapp_working_hours_start = '08:00',
    whatsapp_working_hours_end = '20:00',
    whatsapp_proxy_url = '',
    whatsapp_active,
    whatsapp_phone,
    whatsapp_status,
    live_status,
    queue_stats,
    templates = [],
    paises
}: PageProps) {
    const { __ } = useTranslate();
    const [copiedToken, setCopiedToken] = useState(false);
    const [copiedWebhook, setCopiedWebhook] = useState(false);
    const [liveStatusState, setLiveStatusState] = useState<LiveStatus | null>(live_status);
    const [queueStatsState, setQueueStatsState] = useState<QueueStats | null>(queue_stats || null);
    const [isPolling, setIsPolling] = useState(false);
    const [sendingMsg, setSendingMsg] = useState(false);
    const [checkingNumber, setCheckingNumber] = useState(false);
    const [numberCheckResult, setNumberCheckResult] = useState<{ checked: boolean; exists?: boolean; jid?: string; error?: string } | null>(null);
    const [previewingSpintax, setPreviewingSpintax] = useState(false);
    const [spintaxPreviews, setSpintaxPreviews] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('connection');

    // Estado del Módulo de Diagnóstico / Heartbeat
    const [diagnosticOpen, setDiagnosticOpen] = useState(false);
    const [diagnosticLoading, setDiagnosticLoading] = useState(false);
    const [diagnosticData, setDiagnosticData] = useState<any>(null);

    // Estado del Módulo de Plantillas
    const [templatesList, setTemplatesList] = useState<WhatsAppTemplateItem[]>(templates);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplateItem | null>(null);
    const [templateCategoryFilter, setTemplateCategoryFilter] = useState('all');
    const [templateFormData, setTemplateFormData] = useState({
        nombre: '',
        categoria: 'pastoral',
        contenido: '',
        variables: [] as string[],
        activo: true,
    });
    const [savingTemplate, setSavingTemplate] = useState(false);

    // Estado del Módulo de Historial y Logs
    const [messagesData, setMessagesData] = useState<{
        data: WhatsAppMessageItem[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    } | null>(null);
    const [messagesStats, setMessagesStats] = useState({
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalFailed: 0,
        deliveryRate: 100,
        readRate: 0,
    });
    const [historySearch, setHistorySearch] = useState('');
    const [historyStatus, setHistoryStatus] = useState('all');
    const [historyPage, setHistoryPage] = useState(1);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessageItem | null>(null);
    const [retryingId, setRetryingId] = useState<number | null>(null);

    // Estado del Módulo de Difusión Masiva (Broadcast)
    const [broadcastTarget, setBroadcastTarget] = useState<'presbiteros' | 'pastores' | 'usuarios'>('presbiteros');
    const [broadcastZona, setBroadcastZona] = useState<string>('all');
    const [broadcastRecipients, setBroadcastRecipients] = useState<BroadcastRecipient[]>([]);
    const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>([]);
    const [broadcastLoading, setBroadcastLoading] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastDelaySeconds, setBroadcastDelaySeconds] = useState(15);
    const [broadcastSending, setBroadcastSending] = useState(false);
    const [broadcastFilterSearch, setBroadcastFilterSearch] = useState('');

    const webhookUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/webhooks/whatsapp`
        : '/webhooks/whatsapp';

    // Formulario de configuración principal
    const configForm = useForm({
        whatsapp_api_url: whatsapp_api_url,
        whatsapp_instance: whatsapp_instance || `empresa_${empresa_id}`,
        whatsapp_api_key: whatsapp_api_key || '',
        whatsapp_active: whatsapp_active,
        whatsapp_rate_limit: whatsapp_rate_limit,
    });

    // Formulario de parámetros Anti-Baneo
    const antiBanForm = useForm({
        dailyLimit: queueStatsState?.dailyLimit ?? whatsapp_rate_limit ?? 300,
        warmupMode: queueStatsState?.warmupMode ?? whatsapp_warmup_mode ?? true,
        workingHoursEnabled: queueStatsState?.workingHoursEnabled ?? whatsapp_working_hours_enabled ?? true,
        workingHoursStart: queueStatsState?.workingHoursStart ?? whatsapp_working_hours_start ?? '08:00',
        workingHoursEnd: queueStatsState?.workingHoursEnd ?? whatsapp_working_hours_end ?? '20:00',
        proxyUrl: queueStatsState?.proxyUrl ?? whatsapp_proxy_url ?? '',
    });

    // País por defecto para el sandbox (Venezuela +58 o primer país de la lista)
    const defaultCountryId = useMemo(() => {
        const ve = paises?.find(p => p.codigo_telefonico === '+58' || p.codigo_iso2 === 'VE');
        return ve ? String(ve.id) : (paises?.[0] ? String(paises[0].id) : '');
    }, [paises]);

    // Formulario de mensaje de prueba con Spintax
    const [testMessage, setTestMessage] = useState({
        paisId: '',
        phoneNumber: '',
        message: '{Hola|Buen día|Qué tal} {{nombre}}, {te confirmamos que|te notificamos que} tu solicitud en {{empresa}} está lista. Código: {{random}}.',
        useSync: false,
    });

    useEffect(() => {
        if (!testMessage.paisId && defaultCountryId) {
            setTestMessage(prev => ({ ...prev, paisId: defaultCountryId }));
        }
    }, [defaultCountryId]);

    // Determinar si la hora actual está dentro del horario laboral configurado
    const isWithinWorkingHours = useMemo(() => {
        if (!antiBanForm.data.workingHoursEnabled) return true;
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = (antiBanForm.data.workingHoursStart || '08:00').split(':').map(Number);
        const [endH, endM] = (antiBanForm.data.workingHoursEnd || '20:00').split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;
        return currentMins >= startMins && currentMins <= endMins;
    }, [antiBanForm.data.workingHoursEnabled, antiBanForm.data.workingHoursStart, antiBanForm.data.workingHoursEnd]);

    // Polling del estado de WhatsApp y Estadísticas de cola
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        const shouldPoll = whatsapp_active;

        if (shouldPoll) {
            setIsPolling(true);
            intervalId = setInterval(async () => {
                try {
                    const response = await fetch('/admin/integrations/whatsapp/status');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            setLiveStatusState(data.status);
                            if (data.queue_stats) {
                                setQueueStatsState(data.queue_stats);
                            }

                            if (data.status?.isConnected && !liveStatusState?.isConnected) {
                                Swal.fire({
                                    title: __('Connected!'),
                                    text: __('WhatsApp has been successfully linked.'),
                                    icon: 'success',
                                    timer: 3000,
                                    showConfirmButton: false,
                                });
                            }
                        }
                    }

                    const queueRes = await fetch('/admin/integrations/whatsapp/queue-stats');
                    if (queueRes.ok) {
                        const queueData = await queueRes.json();
                        if (queueData.success && queueData.stats) {
                            setQueueStatsState(queueData.stats);
                        }
                    }
                } catch (error) {
                    console.error('Error polling status:', error);
                }
            }, 3500);
        } else {
            setIsPolling(false);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [whatsapp_active, liveStatusState?.isConnected]);

    // Cargar historial de mensajes al entrar a la pestaña o al filtrar
    const fetchMessages = async (page = 1, search = historySearch, status = historyStatus) => {
        setHistoryLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                search: search || '',
                status: status || 'all',
            });
            const res = await fetch(`/admin/integrations/whatsapp/messages?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setMessagesData(data.messages);
                    if (data.stats) {
                        setMessagesStats(data.stats);
                    }
                }
            }
        } catch (e) {
            console.error('Error fetching WhatsApp messages:', e);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchMessages(historyPage, historySearch, historyStatus);
        }
    }, [activeTab, historyPage, historyStatus]);

    // Cargar destinatarios para Difusión Masiva
    const fetchBroadcastRecipients = async (target = broadcastTarget, zona = broadcastZona) => {
        setBroadcastLoading(true);
        try {
            const params = new URLSearchParams({
                target,
                zona: zona || 'all',
            });
            const res = await fetch(`/admin/integrations/whatsapp/broadcast/recipients?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setBroadcastRecipients(data.recipients || []);
                    const validIds = (data.recipients || [])
                        .filter((r: BroadcastRecipient) => r.is_valid_phone)
                        .map((r: BroadcastRecipient) => r.id);
                    setSelectedRecipientIds(validIds);
                }
            }
        } catch (e) {
            console.error('Error fetching broadcast recipients:', e);
        } finally {
            setBroadcastLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'broadcast') {
            fetchBroadcastRecipients(broadcastTarget, broadcastZona);
        }
    }, [activeTab, broadcastTarget, broadcastZona]);

    const toggleRecipient = (id: number) => {
        setSelectedRecipientIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleAllRecipients = () => {
        const validRecipients = broadcastRecipients.filter(r => r.is_valid_phone);
        if (selectedRecipientIds.length === validRecipients.length) {
            setSelectedRecipientIds([]);
        } else {
            setSelectedRecipientIds(validRecipients.map(r => r.id));
        }
    };

    const handleInsertBroadcastVariable = (varName: string) => {
        const tag = `{{${varName}}}`;
        setBroadcastMessage(prev => prev + tag);
    };

    const handleSelectBroadcastTemplate = (templateContent: string) => {
        setBroadcastMessage(templateContent);
        Swal.fire({
            title: __('Template Loaded'),
            text: __('Broadcast content updated from template.'),
            icon: 'info',
            timer: 1500,
            showConfirmButton: false,
        });
    };

    const handleDispatchBroadcast = async () => {
        if (selectedRecipientIds.length === 0) {
            Swal.fire({
                title: __('No Recipients Selected'),
                text: __('Please select at least one recipient with a valid phone number.'),
                icon: 'warning',
            });
            return;
        }

        if (!broadcastMessage.trim()) {
            Swal.fire({
                title: __('Empty Message'),
                text: __('Please compose a message or choose a template before sending.'),
                icon: 'warning',
            });
            return;
        }

        const targetLabel = broadcastTarget === 'presbiteros'
            ? __('Presbyters')
            : broadcastTarget === 'pastores'
            ? __('Pastors')
            : __('Users');

        const result = await Swal.fire({
            title: __('Dispatch Broadcast Campaign?'),
            html: `
                <div class="text-left text-sm space-y-2">
                    <p><b>${__('Target Audience:')}</b> ${targetLabel}</p>
                    <p><b>${__('Recipients Count:')}</b> <span class="text-emerald-600 font-bold">${selectedRecipientIds.length} ${__('recipients')}</span></p>
                    <p><b>${__('Safety Delay:')}</b> ${broadcastDelaySeconds} ${__('seconds between messages')}</p>
                    <p class="text-xs text-muted-foreground mt-2">${__('Messages will be queued and sent safely with Spintax variation to protect the WhatsApp line.')}</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: __('Yes, Dispatch Broadcast'),
            cancelButtonText: __('Cancel'),
            confirmButtonColor: '#059669',
        });

        if (!result.isConfirmed) return;

        setBroadcastSending(true);
        try {
            const res = await fetch('/admin/integrations/whatsapp/broadcast/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    target_type: broadcastTarget,
                    recipient_ids: selectedRecipientIds,
                    message_content: broadcastMessage,
                    delay_seconds: broadcastDelaySeconds,
                }),
            });

            const data = await res.json();

            if (data.success) {
                Swal.fire({
                    title: __('Broadcast Enqueued!'),
                    text: data.message || __('The broadcast messages have been successfully added to the dispatch queue.'),
                    icon: 'success',
                    showConfirmButton: true,
                    confirmButtonText: __('View History & Logs'),
                }).then((r) => {
                    if (r.isConfirmed) {
                        setActiveTab('history');
                        fetchMessages(1, '', 'all');
                    }
                });
            } else {
                Swal.fire({
                    title: __('Broadcast Error'),
                    text: data.error || __('Failed to dispatch broadcast.'),
                    icon: 'error',
                });
            }
        } catch (e) {
            Swal.fire({
                title: __('Error'),
                text: __('Network error attempting to send broadcast.'),
                icon: 'error',
            });
        } finally {
            setBroadcastSending(false);
        }
    };

    // Ejecutar diagnóstico en vivo
    const handleRunDiagnostic = async () => {
        setDiagnosticOpen(true);
        setDiagnosticLoading(true);
        try {
            const res = await fetch('/admin/integrations/whatsapp/diagnostic');
            if (res.ok) {
                const data = await res.json();
                setDiagnosticData(data);
            }
        } catch (e) {
            console.error('Error running diagnostic:', e);
        } finally {
            setDiagnosticLoading(false);
        }
    };

    // Reintentar mensaje fallido
    const handleRetryMessage = async (id: number) => {
        setRetryingId(id);
        try {
            const res = await fetch(`/admin/integrations/whatsapp/messages/${id}/retry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({
                    title: __('Message Re-sent'),
                    text: __('The message has been re-queued for transmission.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
                fetchMessages(historyPage, historySearch, historyStatus);
            } else {
                Swal.fire({
                    title: __('Retry Failed'),
                    text: data.error || __('Could not send message.'),
                    icon: 'error',
                });
            }
        } catch (e) {
            Swal.fire({
                title: __('Error'),
                text: __('Failed to communicate with server.'),
                icon: 'error',
            });
        } finally {
            setRetryingId(null);
        }
    };

    // Gestor de Plantillas
    const handleOpenCreateTemplate = () => {
        setEditingTemplate(null);
        setTemplateFormData({
            nombre: '',
            categoria: 'pastoral',
            contenido: '',
            variables: [],
            activo: true,
        });
        setTemplateModalOpen(true);
    };

    const handleOpenEditTemplate = (t: WhatsAppTemplateItem) => {
        setEditingTemplate(t);
        setTemplateFormData({
            nombre: t.nombre,
            categoria: t.categoria,
            contenido: t.contenido,
            variables: t.variables || [],
            activo: t.activo,
        });
        setTemplateModalOpen(true);
    };

    const handleInsertVariableInTemplate = (varName: string) => {
        const tag = `{{${varName}}}`;
        setTemplateFormData(prev => ({
            ...prev,
            contenido: prev.contenido + tag,
            variables: prev.variables.includes(varName) ? prev.variables : [...prev.variables, varName],
        }));
    };

    const handleSaveTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        setSavingTemplate(true);

        const url = editingTemplate
            ? `/admin/integrations/whatsapp/templates/${editingTemplate.id}`
            : '/admin/integrations/whatsapp/templates';
        
        const method = editingTemplate ? 'put' : 'post';

        router[method](url, templateFormData, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setTemplateModalOpen(false);
                Swal.fire({
                    title: __('Template Saved'),
                    text: __('WhatsApp template successfully stored.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
            onFinish: () => setSavingTemplate(false),
        });
    };

    const handleDeleteTemplate = (id: number) => {
        Swal.fire({
            title: __('Delete Template?'),
            text: __('This action cannot be undone.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: __('Yes, delete'),
            cancelButtonText: __('Cancel'),
            confirmButtonColor: '#e11d48',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/integrations/whatsapp/templates/${id}`, {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: __('Deleted'),
                            text: __('Template removed successfully.'),
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                });
            }
        });
    };

    const handleUseTemplateInSandbox = (t: WhatsAppTemplateItem) => {
        setTestMessage(prev => ({
            ...prev,
            message: t.contenido,
        }));
        setActiveTab('dispatcher');
        Swal.fire({
            title: __('Template Loaded'),
            text: __('Template loaded into the testing sandbox.'),
            icon: 'info',
            timer: 1500,
            showConfirmButton: false,
        });
    };

    const filteredTemplates = useMemo(() => {
        if (templateCategoryFilter === 'all') return templates;
        return templates.filter(t => t.categoria === templateCategoryFilter);
    }, [templates, templateCategoryFilter]);

    const handleSaveConfig = (e: React.FormEvent) => {
        e.preventDefault();
        configForm.put('/admin/integrations/whatsapp/update', {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Settings Saved'),
                    text: __('WhatsApp configuration has been successfully updated.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
        });
    };

    const handleSaveAntiBan = (e: React.FormEvent) => {
        e.preventDefault();
        antiBanForm.post('/admin/integrations/whatsapp/antiban', {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Anti-Ban Updated'),
                    text: __('Anti-ban limits and schedule settings saved successfully.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
        });
    };

    const handleGenerateToken = () => {
        Swal.fire({
            title: __('Are you sure?'),
            text: __('Generating a new token will invalidate the current one.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: __('Yes, generate new token'),
            cancelButtonText: __('Cancel'),
            confirmButtonColor: '#e11d48',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post('/admin/integrations/whatsapp/generate-token', {}, {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: (page) => {
                        const newKey = (page.props as any).whatsapp_api_key;
                        if (newKey) {
                            configForm.setData('whatsapp_api_key', newKey);
                        }
                        Swal.fire({
                            title: __('Token Generated'),
                            text: __('A new API key has been created for your company.'),
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    }
                });
            }
        });
    };

    const handleSyncCompany = () => {
        Swal.fire({
            title: __('Synchronize Company?'),
            text: __('This will sync the company information and token with the WhatsApp server database.'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: __('Yes, synchronize'),
            cancelButtonText: __('Cancel'),
        }).then((result) => {
            if (result.isConfirmed) {
                router.post('/admin/integrations/whatsapp/sync', {}, {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: __('Synchronized'),
                            text: __('Company synchronized with WhatsApp server.'),
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    }
                });
            }
        });
    };

    const handleDisconnect = () => {
        Swal.fire({
            title: __('Disconnect WhatsApp Session?'),
            text: __('You will need to scan the QR code again to link this instance.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: __('Yes, Disconnect'),
            cancelButtonText: __('Cancel'),
            confirmButtonColor: '#e11d48',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post('/admin/integrations/whatsapp/disconnect', {}, {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        setLiveStatusState(prev => prev ? { ...prev, isConnected: false, connectionState: 'disconnected', user: null, userJid: null } : null);
                        Swal.fire({
                            title: __('Disconnected'),
                            text: __('WhatsApp session has been closed.'),
                            icon: 'info',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    }
                });
            }
        });
    };

    const handleReconnect = () => {
        router.post('/admin/integrations/whatsapp/reconnect', {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Reconnecting...'),
                    text: __('Requesting session renewal from WhatsApp server.'),
                    icon: 'info',
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        });
    };

    const getFullPhoneNumber = () => {
        const pais = paises?.find(p => String(p.id) === String(testMessage.paisId));
        const rawDigits = testMessage.phoneNumber.replace(/\D/g, '');
        if (!rawDigits) return '';

        let nationalDigits = rawDigits;
        if (nationalDigits.startsWith('0')) {
            nationalDigits = nationalDigits.substring(1);
        }

        if (pais?.codigo_telefonico === '+58' || pais?.codigo_iso2 === 'VE') {
            if (nationalDigits.startsWith('58') && nationalDigits.length === 12) {
                return nationalDigits;
            }
            return `58${nationalDigits}`;
        }

        const dialCode = pais?.codigo_telefonico?.replace('+', '') || '';
        if (dialCode && nationalDigits.startsWith(dialCode)) {
            return nationalDigits;
        }

        return dialCode ? `${dialCode}${nationalDigits}` : nationalDigits;
    };

    const handleCheckNumber = async () => {
        const fullPhone = getFullPhoneNumber();
        if (!fullPhone) {
            Swal.fire({
                title: __('Validation'),
                text: __('Please enter a valid phone number with area code.'),
                icon: 'warning',
            });
            return;
        }

        setCheckingNumber(true);
        setNumberCheckResult(null);

        try {
            const response = await fetch('/admin/integrations/whatsapp/check-number', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ phone: fullPhone }),
            });

            const data = await response.json();

            if (data.success && data.result) {
                const isRegistered = Boolean(data.result.exists);
                setNumberCheckResult({
                    checked: true,
                    exists: isRegistered,
                    jid: data.result.jid,
                });

                if (isRegistered) {
                    Swal.fire({
                        title: __('Valid WhatsApp Number!'),
                        text: `${__('Number')} +${fullPhone} ${__('is registered and ready to receive messages.')}`,
                        icon: 'success',
                        timer: 3000,
                        showConfirmButton: false,
                    });
                } else {
                    Swal.fire({
                        title: __('Number Not Found'),
                        text: `${__('The phone number')} +${fullPhone} ${__('does NOT have an active WhatsApp account. Sending messages may penalize your reputation.')}`,
                        icon: 'warning',
                        confirmButtonText: __('Understand'),
                    });
                }
            } else {
                setNumberCheckResult({
                    checked: true,
                    exists: false,
                    error: data.error || __('Verification failed'),
                });
            }
        } catch (error) {
            setNumberCheckResult({
                checked: true,
                exists: false,
                error: __('Communication error with WhatsApp API'),
            });
        } finally {
            setCheckingNumber(false);
        }
    };

    const handlePreviewSpintax = async () => {
        if (!testMessage.message.trim()) return;

        setPreviewingSpintax(true);
        try {
            const response = await fetch('/admin/integrations/whatsapp/preview-spintax', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    text: testMessage.message,
                    count: 4,
                    variables: {
                        nombre: 'Pastor David Morales',
                        empresa: empresa_nombre,
                        random: String(Math.floor(1000 + Math.random() * 9000)),
                    },
                }),
            });

            const data = await response.json();
            if (data.success && Array.isArray(data.variations)) {
                setSpintaxPreviews(data.variations);
            }
        } catch (error) {
            console.error('Error previewing spintax:', error);
        } finally {
            setPreviewingSpintax(false);
        }
    };

    const handleSendTestMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullPhone = getFullPhoneNumber();

        if (!fullPhone) {
            Swal.fire({
                title: __('Validation'),
                text: __('Please select a country code and enter a recipient phone number.'),
                icon: 'warning',
            });
            return;
        }

        setSendingMsg(true);
        try {
            const response = await fetch('/admin/integrations/whatsapp/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    phone: fullPhone,
                    message: testMessage.message,
                    sync: testMessage.useSync,
                    variables: {
                        nombre: 'Pastor David Morales',
                        empresa: empresa_nombre,
                        random: String(Math.floor(1000 + Math.random() * 9000)),
                    },
                }),
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    title: __('Message Sent!'),
                    text: __('The WhatsApp message has been successfully dispatched or queued.'),
                    icon: 'success',
                    timer: 2500,
                    showConfirmButton: false,
                });
                if (activeTab === 'history') {
                    fetchMessages(historyPage, historySearch, historyStatus);
                }
            } else {
                Swal.fire({
                    title: __('Send Error'),
                    text: data.error || __('Could not deliver the message. Check WhatsApp connection.'),
                    icon: 'error',
                });
            }
        } catch (error) {
            Swal.fire({
                title: __('Error'),
                text: __('Network error attempting to contact WhatsApp server.'),
                icon: 'error',
            });
        } finally {
            setSendingMsg(false);
        }
    };

    const copyTokenToClipboard = () => {
        if (configForm.data.whatsapp_api_key) {
            navigator.clipboard.writeText(configForm.data.whatsapp_api_key);
            setCopiedToken(true);
            setTimeout(() => setCopiedToken(false), 2000);
        }
    };

    const copyWebhookToClipboard = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopiedWebhook(true);
        setTimeout(() => setCopiedWebhook(false), 2000);
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Settings'), href: '#' },
        { title: __('Integrations'), href: '/admin/integrations' },
        { title: __('WhatsApp'), href: '/admin/integrations/whatsapp' }
    ];

    const isConnected = Boolean(liveStatusState?.isConnected);
    const isConnecting = liveStatusState?.connectionState === 'connecting';
    const isQrReady = liveStatusState?.connectionState === 'qr_ready' || liveStatusState?.status === 'qr' || Boolean(liveStatusState?.qrCode || liveStatusState?.qrDataUrl);
    const isServiceUnavailable = liveStatusState?._error === 'service_unavailable';

    const sentTodayCount = queueStatsState?.sentToday ?? 0;
    const dailyLimitCount = queueStatsState?.dailyLimit ?? antiBanForm.data.dailyLimit ?? 300;
    const quotaPercentage = Math.min(100, Math.round((sentTodayCount / (dailyLimitCount || 1)) * 100));

    const getConnectionStateLabel = (state?: string | null, connectedFallback = false) => {
        if (state) {
            switch (state.toLowerCase()) {
                case 'connected':
                case 'open':
                    return __('Connected');
                case 'connecting':
                    return __('Connecting...');
                case 'qr_ready':
                case 'qr':
                    return __('Waiting Scan');
                case 'disconnected':
                case 'close':
                    return __('Disconnected');
                case 'idle':
                    return __('Inactive');
                default:
                    return __(state);
            }
        }
        return connectedFallback ? __('Connected') : __('Disconnected');
    };

    return (
        <>
            <Head title={__('WhatsApp Integration')} />
            <div className="space-y-6 w-full pb-10">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Module Header */}
                <ModuleHeader
                    icon={<MessageSquare className="h-6 w-6 text-white" />}
                    title={__('WhatsApp API Module')}
                    description={`${__('Multi-Instance Baileys Engine for')} ${empresa_nombre}`}
                    colorClassName="bg-emerald-600"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="bg-black/20 text-white border-white/20 font-mono text-xs">
                            {configForm.data.whatsapp_instance}
                        </Badge>
                        
                        <Badge className={`gap-1.5 text-xs ${
                            isConnected
                                ? 'bg-emerald-500 hover:bg-emerald-500 text-white'
                                : isConnecting || isQrReady
                                ? 'bg-amber-500 hover:bg-amber-500 text-white'
                                : 'bg-rose-500 hover:bg-rose-500 text-white'
                        }`}>
                            <span className={`h-2 w-2 rounded-full ${
                                isConnected
                                    ? 'bg-white animate-pulse'
                                    : isConnecting || isQrReady
                                    ? 'bg-white animate-ping'
                                    : 'bg-white'
                            }`} />
                            {isConnected ? __('Connected') : isQrReady ? __('Waiting Scan') : isConnecting ? __('Connecting...') : __('Disconnected')}
                        </Badge>

                        {/* Botón de Diagnóstico / Heartbeat */}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRunDiagnostic}
                            className="h-8 bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs gap-1.5"
                        >
                            <Heart className="h-3.5 w-3.5 text-rose-300 fill-rose-300" />
                            {__('Health Diagnostic')}
                        </Button>

                        {isConnected && (
                            <div className="flex gap-2 ml-1">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleReconnect}
                                    className="h-8 bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs gap-1.5"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    {__('Reset Session')}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleDisconnect}
                                    className="h-8 bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5"
                                >
                                    <Power className="h-3.5 w-3.5" />
                                    {__('Disconnect')}
                                </Button>
                            </div>
                        )}
                    </div>
                </ModuleHeader>

                {/* Alerta de Desconexión (Heartbeat Alert) */}
                {whatsapp_active && !isConnected && (
                    <Card className="border-amber-400/80 bg-amber-500/10 dark:bg-amber-950/20 backdrop-blur-sm shadow-sm">
                        <CardContent className="flex items-center justify-between p-4 flex-wrap gap-3">
                            <div className="flex items-start gap-3">
                                <WifiOff className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-amber-900 dark:text-amber-300 text-sm">
                                        {__('WhatsApp Session Disconnected')}
                                    </h4>
                                    <p className="text-xs text-amber-800 dark:text-amber-400/90 mt-0.5">
                                        {__('Your WhatsApp line is not active. Outbound messages will not dispatch until reconnected.')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => setActiveTab('connection')}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 h-8"
                            >
                                <QrCode className="h-3.5 w-3.5" />
                                {__('Link / Scan QR Now')}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Server Offline Alert Banner */}
                {isServiceUnavailable && (
                    <Card className="border-rose-400/60 bg-rose-500/10 dark:bg-rose-950/20 backdrop-blur-sm shadow-sm">
                        <CardContent className="flex items-start gap-3.5 p-4">
                            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-rose-800 dark:text-rose-300">{__('WhatsApp Server Offline')}</h3>
                                <p className="text-sm text-rose-700 dark:text-rose-400/90 mt-1">
                                    {__('The WhatsApp API service at')} <code className="font-mono text-xs font-semibold px-1 py-0.5 bg-rose-100 dark:bg-rose-900/50 rounded">{whatsapp_api_url}</code> {__('is currently unreachable. Please make sure the Node.js service is running.')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Enhanced Shadcn Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Socket State */}
                    <Card className="p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Socket State')}
                            </span>
                            <div className={`p-2 rounded-xl ${
                                isConnected
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : isConnecting || isQrReady
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                                <Activity className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                    {getConnectionStateLabel(liveStatusState?.connectionState, isConnected)}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                                <Phone className="h-3 w-3 text-emerald-500" />
                                {liveStatusState?.userJid ? `+${liveStatusState.userJid.split('@')[0]}` : (whatsapp_phone ? `+${whatsapp_phone}` : __('No linked phone'))}
                            </p>
                        </div>
                    </Card>

                    {/* Card 2: 24H Daily Quota */}
                    <Card className="p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('24H Daily Limit')}
                            </span>
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Flame className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                                    {sentTodayCount}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">
                                    / {dailyLimitCount} {__('messages')}
                                </span>
                            </div>
                            <Progress value={quotaPercentage} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>{__('Remaining:')} {Math.max(0, dailyLimitCount - sentTodayCount)}</span>
                                <span>{dailyLimitCount} {__('max')}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Card 3: Outbound Queue */}
                    <Card className="p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Pending in Queue')}
                            </span>
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <ListOrdered className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                                    {queueStatsState?.queued ?? queueStatsState?.totalQueued ?? 0}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">
                                    {__('in queue')}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Shield className="h-3 w-3 text-indigo-500" />
                                {__('Anti-Ban Jitter: 20-40s')}
                            </p>
                        </div>
                    </Card>

                    {/* Card 4: Anti-Ban Schedule */}
                    <Card className="p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Anti-Ban Schedule')}
                            </span>
                            <div className={`p-2 rounded-xl ${
                                isWithinWorkingHours
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}>
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                                    {antiBanForm.data.workingHoursStart || '08:00'} - {antiBanForm.data.workingHoursEnd || '20:00'}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${isWithinWorkingHours ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {isWithinWorkingHours ? __('Safe Window Open') : __('Paused (Night Silence)')}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Main Tabbed Interface */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 h-auto p-1.5 bg-slate-100/80 dark:bg-slate-900/80 rounded-xl gap-1">
                        <TabsTrigger value="connection" className="py-2.5 gap-1.5 text-xs md:text-sm font-medium rounded-lg">
                            <QrCode className="h-4 w-4" />
                            {__('Connection & QR')}
                        </TabsTrigger>
                        <TabsTrigger value="broadcast" className="py-2.5 gap-1.5 text-xs md:text-sm font-semibold rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Megaphone className="h-4 w-4" />
                            {__('Mass Broadcast')}
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="py-2.5 gap-1.5 text-xs md:text-sm font-medium rounded-lg">
                            <FileText className="h-4 w-4" />
                            {__('Templates')}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="py-2.5 gap-1.5 text-xs md:text-sm font-medium rounded-lg">
                            <Inbox className="h-4 w-4" />
                            {__('History & Logs')}
                        </TabsTrigger>
                        <TabsTrigger value="antiban" className="py-2.5 gap-1.5 text-xs md:text-sm font-medium rounded-lg">
                            <Shield className="h-4 w-4" />
                            {__('Anti-Ban Policies')}
                        </TabsTrigger>
                        <TabsTrigger value="dispatcher" className="py-2.5 gap-1.5 text-xs md:text-sm font-medium rounded-lg">
                            <Send className="h-4 w-4" />
                            {__('Test & Spintax')}
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="py-2.5 gap-1.5 text-xs md:text-sm font-medium rounded-lg">
                            <Settings2 className="h-4 w-4" />
                            {__('Server & Webhook')}
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: CONNECTION & QR CODE */}
                    <TabsContent value="connection" className="space-y-6">
                        <div className="grid md:grid-cols-12 gap-6">
                            {/* Visual QR / Connected Device Card */}
                            <div className="md:col-span-7">
                                <Card className="shadow-sm h-full flex flex-col justify-between">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Radio className="h-5 w-5 text-emerald-600" />
                                            {__('WhatsApp Device Linking')}
                                        </CardTitle>
                                        <CardDescription>
                                            {__('Scan QR Code with your mobile phone or inspect active session details.')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center justify-center min-h-[320px] text-center p-6">
                                        {!whatsapp_active ? (
                                            <div className="space-y-3 max-w-sm">
                                                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                                                    <Power className="h-8 w-8" />
                                                </div>
                                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{__('Integration Disabled')}</h3>
                                                <p className="text-xs text-muted-foreground">{__('Enable WhatsApp in the Server Settings tab to start the engine.')}</p>
                                                <Button size="sm" onClick={() => setActiveTab('settings')} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                                    <Settings2 className="h-4 w-4" />
                                                    {__('Go to Settings')}
                                                </Button>
                                            </div>
                                        ) : isConnected ? (
                                            <div className="space-y-4 max-w-sm">
                                                <div className="relative">
                                                    <div className="h-24 w-24 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
                                                        <CheckCircle2 className="h-12 w-12" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{__('WhatsApp Connected & Synced')}</h3>
                                                    <p className="text-xs text-muted-foreground mt-1">{__('Your phone is currently paired and processing messages through the engine.')}</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                                                    <div><strong>{__('JID:')}</strong> {liveStatusState?.userJid || `${whatsapp_phone}@s.whatsapp.net`}</div>
                                                    <div><strong>{__('Instance:')}</strong> {configForm.data.whatsapp_instance}</div>
                                                </div>
                                            </div>
                                        ) : isQrReady && (liveStatusState?.qrDataUrl || liveStatusState?.qrCode) ? (
                                            <div className="space-y-4 flex flex-col items-center">
                                                <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-slate-200 inline-block">
                                                    <img
                                                        src={liveStatusState.qrDataUrl || `data:image/png;base64,${liveStatusState.qrCode}`}
                                                        alt="WhatsApp QR Code"
                                                        className="w-56 h-56 object-contain rounded-lg"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 gap-1.5 animate-pulse">
                                                        <Clock className="h-3 w-3" />
                                                        {__('QR Code Active - Scan from WhatsApp App')}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">{__('Auto-refreshes every 20 seconds. Keep this screen open.')}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                                    <QrCode className="h-8 w-8" />
                                                </div>
                                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{__('Initializing Session...')}</h3>
                                                <p className="text-xs text-muted-foreground">{__('Requesting QR code from Baileys engine...')}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-3 flex justify-between items-center text-xs text-muted-foreground">
                                        <span>{__('Engine:')} Baileys Multi-Instance</span>
                                        <span>{__('Status:')} <strong className="text-slate-700 dark:text-slate-300">{getConnectionStateLabel(liveStatusState?.connectionState, isConnected)}</strong></span>
                                    </CardFooter>
                                </Card>
                            </div>

                            {/* Quick Instructions Card */}
                            <div className="md:col-span-5">
                                <Card className="shadow-sm h-full flex flex-col justify-between">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <HelpCircle className="h-5 w-5 text-indigo-600" />
                                            {__('How to Pair WhatsApp')}
                                        </CardTitle>
                                        <CardDescription>
                                            {__('Follow these simple steps on your mobile phone.')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-xs">
                                        <div className="space-y-3">
                                            <div className="flex gap-3 items-start p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
                                                <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">{__('Open WhatsApp on your Phone')}</h4>
                                                    <p className="text-muted-foreground mt-0.5">{__('Tap Menu (Android) or Settings (iOS).')}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 items-start p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
                                                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">{__('Select Linked Devices')}</h4>
                                                    <p className="text-muted-foreground mt-0.5">{__('Go to Linked Devices > Link a Device and scan the QR code before the 30-second expiry timeout.')}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 items-start p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
                                                <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">{__('Session Persists Automatically')}</h4>
                                                    <p className="text-muted-foreground mt-0.5">{__('Once linked, auth credentials persist in local storage. Disconnecting from your phone clears the link.')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-3 flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">{__('Need technical assistance?')}</span>
                                        <a href="/docs" target="_blank" className="text-emerald-600 hover:underline flex items-center gap-1 font-medium">
                                            {__('API Docs')} <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB: DIFUSIÓN MASIVA / BROADCAST */}
                    <TabsContent value="broadcast" className="space-y-6">
                        <div className="grid lg:grid-cols-12 gap-6">
                            {/* COLUMNA IZQUIERDA: 1. AUDIENCIA Y SELECCIÓN (7 COLS) */}
                            <div className="lg:col-span-7 space-y-6">
                                <Card className="shadow-sm border-indigo-200/60 dark:border-indigo-900/40">
                                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Megaphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                {__('1. Target Audience & Recipients')}
                                            </CardTitle>
                                            <CardDescription>
                                                {__('Select the group and filter recipients for this broadcast.')}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-mono text-xs w-fit">
                                            {selectedRecipientIds.length} / {broadcastRecipients.length} {__('Selected')}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Selectores de Audiencia y Zona */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">{__('Target Group')}</Label>
                                                <Select
                                                    value={broadcastTarget}
                                                    onValueChange={(val: any) => setBroadcastTarget(val)}
                                                >
                                                    <SelectTrigger className="text-xs h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="presbiteros">
                                                            <div className="flex items-center gap-2">
                                                                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                                                                <span>{__('Presbyters (Role: Presbítero)')}</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="pastores">
                                                            <div className="flex items-center gap-2">
                                                                <Users className="h-3.5 w-3.5 text-emerald-600" />
                                                                <span>{__('All Active Pastors')}</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="usuarios">
                                                            <div className="flex items-center gap-2">
                                                                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                                                                <span>{__('All System Users')}</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">{__('Filter by Zone')}</Label>
                                                <Select
                                                    value={broadcastZona}
                                                    onValueChange={setBroadcastZona}
                                                >
                                                    <SelectTrigger className="text-xs h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">{__('All Zones (National)')}</SelectItem>
                                                        {Array.from({ length: 15 }, (_, i) => String(i + 1)).map(z => (
                                                            <SelectItem key={z} value={z}>{__('Zone')} {z}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Barra de Búsqueda y Botón de Selección Masiva */}
                                        <div className="flex items-center justify-between gap-3 pt-2">
                                            <div className="relative flex-1">
                                                <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                                                <Input
                                                    placeholder={__('Search recipient by name, phone...')}
                                                    value={broadcastFilterSearch}
                                                    onChange={e => setBroadcastFilterSearch(e.target.value)}
                                                    className="pl-9 text-xs h-9"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={toggleAllRecipients}
                                                className="text-xs h-9 gap-1.5 shrink-0"
                                            >
                                                {selectedRecipientIds.length === broadcastRecipients.filter(r => r.is_valid_phone).length && selectedRecipientIds.length > 0 ? (
                                                    <>
                                                        <CheckSquare className="h-4 w-4 text-indigo-600" />
                                                        {__('Deselect All')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Square className="h-4 w-4" />
                                                        {__('Select All')}
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Tabla de Destinatarios */}
                                        <div className="border rounded-xl max-h-[380px] overflow-y-auto overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50 dark:bg-slate-900/50 text-xs">
                                                        <TableHead className="w-10 text-center">#</TableHead>
                                                        <TableHead>{__('Recipient')}</TableHead>
                                                        <TableHead>{__('Phone')}</TableHead>
                                                        <TableHead>{__('Zone / District')}</TableHead>
                                                        <TableHead>{__('Status')}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {broadcastLoading ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                                                                <RefreshCw className="h-4 w-4 animate-spin inline mr-2 text-indigo-600" />
                                                                {__('Loading audience list...')}
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : broadcastRecipients.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                                                                {__('No recipients found matching current filters.')}
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        broadcastRecipients
                                                            .filter(r => {
                                                                if (!broadcastFilterSearch) return true;
                                                                const q = broadcastFilterSearch.toLowerCase();
                                                                return r.name.toLowerCase().includes(q) ||
                                                                       r.phone.includes(q) ||
                                                                       (r.zonas && r.zonas.toLowerCase().includes(q));
                                                            })
                                                            .map((recipient) => {
                                                                const isSelected = selectedRecipientIds.includes(recipient.id);
                                                                return (
                                                                    <TableRow
                                                                        key={`${recipient.type}-${recipient.id}`}
                                                                        className={`text-xs cursor-pointer transition-colors ${
                                                                            isSelected
                                                                                ? 'bg-indigo-50/50 dark:bg-indigo-950/20'
                                                                                : recipient.is_valid_phone
                                                                                ? 'hover:bg-slate-50/80 dark:hover:bg-slate-900/40'
                                                                                : 'opacity-50'
                                                                        }`}
                                                                        onClick={() => {
                                                                            if (recipient.is_valid_phone) {
                                                                                toggleRecipient(recipient.id);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <TableCell className="text-center">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isSelected}
                                                                                disabled={!recipient.is_valid_phone}
                                                                                onChange={() => toggleRecipient(recipient.id)}
                                                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                                                {recipient.name}
                                                                            </div>
                                                                            <div className="text-[11px] text-muted-foreground">
                                                                                {recipient.role}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="font-mono text-xs">
                                                                            {recipient.phone ? (
                                                                                <span>+{recipient.formatted_phone || recipient.phone}</span>
                                                                            ) : (
                                                                                <span className="text-rose-500 font-sans italic">{__('No phone registered')}</span>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="text-xs">
                                                                                <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-900">
                                                                                    {recipient.zonas}
                                                                                </Badge>
                                                                            </div>
                                                                            {recipient.distritos && recipient.distritos !== __('Unassigned') && (
                                                                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                                                                    {recipient.distritos}
                                                                                </div>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {recipient.is_valid_phone ? (
                                                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px] gap-1">
                                                                                    <Check className="h-3 w-3" /> {__('Valid')}
                                                                                </Badge>
                                                                            ) : (
                                                                                <Badge className="bg-rose-500/10 text-rose-600 border-rose-200 text-[10px]">
                                                                                    {__('Invalid Phone')}
                                                                                </Badge>
                                                                            )}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* COLUMNA DERECHA: 2. MENSAJE, SPINTAX Y DESPACHO (5 COLS) */}
                            <div className="lg:col-span-5 space-y-6">
                                <Card className="shadow-sm border-indigo-200/60 dark:border-indigo-900/40 flex flex-col justify-between">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Send className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                            {__('2. Message & Spintax Content')}
                                        </CardTitle>
                                        <CardDescription>
                                            {__('Compose broadcast with Spintax options and dynamic tags.')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Cargar Plantilla Oficial */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">{__('Load Official Template')}</Label>
                                            <Select onValueChange={handleSelectBroadcastTemplate}>
                                                <SelectTrigger className="text-xs h-9">
                                                    <SelectValue placeholder={__('Select a template to load...')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {templatesList.map(t => (
                                                        <SelectItem key={t.id} value={t.contenido}>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-[10px] uppercase font-mono">{t.categoria}</Badge>
                                                                <span>{t.nombre}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Insertar Variables Rápidas */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">{__('Insert Dynamic Variables')}</Label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['nombre', 'zonas', 'distritos', 'empresa', 'fecha', 'hora', 'random'].map(v => (
                                                    <Button
                                                        key={v}
                                                        type="button"
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => handleInsertBroadcastVariable(v)}
                                                        className="h-6 px-2 text-[11px] font-mono bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                                                    >
                                                        + {`{{${v}}}`}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Editor de Texto del Comunicado */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-semibold">{__('Message Body (Spintax Supported)')}</Label>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {__('Use {option1|option2}')}
                                                </span>
                                            </div>
                                            <Textarea
                                                rows={7}
                                                placeholder={__('Write pastoral circular or load an official template...')}
                                                value={broadcastMessage}
                                                onChange={e => setBroadcastMessage(e.target.value)}
                                                className="text-xs font-sans resize-y leading-relaxed"
                                            />
                                        </div>

                                        {/* Parámetros de Seguridad Anti-Baneo */}
                                        <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4 text-emerald-600" />
                                                    <span className="text-xs font-semibold">{__('Anti-Ban Safety Delay')}</span>
                                                </div>
                                                <span className="text-xs font-mono font-bold text-emerald-600">
                                                    {broadcastDelaySeconds}s {__('delay')}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-snug">
                                                {__('Estimated total broadcast time:')}{' '}
                                                <b className="text-slate-800 dark:text-slate-200">
                                                    {Math.ceil((selectedRecipientIds.length * broadcastDelaySeconds) / 60)} {__('minutes')}
                                                </b>
                                            </p>
                                        </div>

                                        {/* Vista Previa de Muestra */}
                                        {broadcastRecipients.length > 0 && broadcastMessage && (
                                            <div className="p-3 border rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1.5">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                                                    {__('Sample Preview for')} {broadcastRecipients[0]?.name}:
                                                </div>
                                                <div className="text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-black/30 p-2.5 rounded-lg whitespace-pre-line border border-emerald-200/50 font-sans">
                                                    {broadcastMessage
                                                        .replace(/\{\{nombre\}\}/g, broadcastRecipients[0]?.name || '')
                                                        .replace(/\{\{zonas\}\}/g, broadcastRecipients[0]?.zonas || '')
                                                        .replace(/\{\{distritos\}\}/g, broadcastRecipients[0]?.distritos || '')
                                                        .replace(/\{\{empresa\}\}/g, empresa_nombre || 'MMM Venezuela')
                                                        .replace(/\{\{fecha\}\}/g, new Date().toLocaleDateString())
                                                        .replace(/\{\{random\}\}/g, 'A7B8C9')}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="pt-2 border-t">
                                        <Button
                                            type="button"
                                            size="lg"
                                            onClick={handleDispatchBroadcast}
                                            disabled={broadcastSending || selectedRecipientIds.length === 0 || !broadcastMessage.trim()}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 text-sm shadow-md"
                                        >
                                            {broadcastSending ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                    {__('Enqueuing Campaign...')}
                                                </>
                                            ) : (
                                                <>
                                                    <Radio className="h-4 w-4" />
                                                    {__('Launch Safe Broadcast')} ({selectedRecipientIds.length})
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 2: PLANTILLAS RÁPIDAS CON SPINTAX */}
                    <TabsContent value="templates" className="space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-emerald-600" />
                                        {__('Message Templates with Spintax')}
                                    </CardTitle>
                                    <CardDescription>
                                        {__('Create and manage reusable templates for pastoral notifications, calls, and announcements.')}
                                    </CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={handleOpenCreateTemplate}
                                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                                >
                                    <Plus className="h-4 w-4" />
                                    {__('New Template')}
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Filtros por Categoría */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {[
                                        { id: 'all', label: __('All') },
                                        { id: 'pastoral', label: __('Pastoral') },
                                        { id: 'convocatorias', label: __('Calls') },
                                        { id: 'avisos', label: __('Announcements') },
                                        { id: 'general', label: __('General') },
                                    ].map(cat => (
                                        <Button
                                            key={cat.id}
                                            size="sm"
                                            variant={templateCategoryFilter === cat.id ? 'default' : 'outline'}
                                            onClick={() => setTemplateCategoryFilter(cat.id)}
                                            className="h-8 text-xs rounded-lg"
                                        >
                                            {cat.label}
                                        </Button>
                                    ))}
                                </div>

                                {/* Lista de Plantillas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    {filteredTemplates.length === 0 ? (
                                        <div className="col-span-2 text-center py-10 border rounded-xl bg-slate-50/50 dark:bg-slate-900/20 text-muted-foreground text-sm space-y-2">
                                            <FileText className="h-8 w-8 mx-auto text-slate-400" />
                                            <p>{__('No templates registered in this category.')}</p>
                                        </div>
                                    ) : (
                                        filteredTemplates.map(t => (
                                            <Card key={t.id} className="p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 border">
                                                <div className="space-y-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t.nombre}</h4>
                                                            <Badge variant="outline" className="text-[10px] uppercase font-mono mt-1">
                                                                {__(t.categoria)}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleOpenEditTemplate(t)}
                                                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                                                            >
                                                                <Edit3 className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteTemplate(t.id)}
                                                                className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg line-clamp-3">
                                                        {t.contenido}
                                                    </p>

                                                    {Array.isArray(t.variables) && t.variables.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 items-center text-[10px] text-muted-foreground pt-1">
                                                            <span>{__('Variables:')}</span>
                                                            {t.variables.map((v, i) => (
                                                                <Badge key={i} variant="secondary" className="font-mono text-[9px] py-0 px-1">
                                                                    {`{{${v}}}`}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-2 border-t flex justify-end">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleUseTemplateInSandbox(t)}
                                                        className="text-xs h-8 gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                                    >
                                                        <Send className="h-3.5 w-3.5" />
                                                        {__('Use in Sandbox')}
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: HISTORIAL Y LOGS DE MENSAJES */}
                    <TabsContent value="history" className="space-y-6">
                        {/* Mini-Cards de Métricas de Entrega */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="p-3.5 shadow-sm space-y-1">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase">{__('Total Outbound')}</span>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{messagesStats.totalSent}</div>
                            </Card>
                            <Card className="p-3.5 shadow-sm space-y-1">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase">{__('Delivery Rate')}</span>
                                <div className="text-2xl font-bold text-emerald-600">{messagesStats.deliveryRate}%</div>
                            </Card>
                            <Card className="p-3.5 shadow-sm space-y-1">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase">{__('Read Rate')}</span>
                                <div className="text-2xl font-bold text-blue-600">{messagesStats.readRate}%</div>
                            </Card>
                            <Card className="p-3.5 shadow-sm space-y-1">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase">{__('Failed')}</span>
                                <div className="text-2xl font-bold text-rose-600">{messagesStats.totalFailed}</div>
                            </Card>
                        </div>

                        {/* Tabla de Mensajes */}
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Inbox className="h-5 w-5 text-indigo-600" />
                                        {__('Message & Delivery Registry')}
                                    </CardTitle>
                                    <CardDescription>
                                        {__('Live log of sent and received messages with read confirmation.')}
                                    </CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => fetchMessages(historyPage, historySearch, historyStatus)}
                                    disabled={historyLoading}
                                    className="gap-1.5 text-xs h-8"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
                                    {__('Refresh')}
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Barra de Búsqueda y Filtros */}
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <div className="relative flex-1 w-full">
                                        <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                                        <Input
                                            placeholder={__('Search by phone or message...')}
                                            value={historySearch}
                                            onChange={(e) => setHistorySearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && fetchMessages(1, historySearch, historyStatus)}
                                            className="pl-9 text-xs"
                                        />
                                    </div>
                                    <Select value={historyStatus} onValueChange={(v) => { setHistoryStatus(v); setHistoryPage(1); }}>
                                        <SelectTrigger className="w-full sm:w-40 text-xs h-9">
                                            <SelectValue placeholder={__('Status')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{__('All Statuses')}</SelectItem>
                                            <SelectItem value="delivered">{__('Delivered')}</SelectItem>
                                            <SelectItem value="read">{__('Read')}</SelectItem>
                                            <SelectItem value="sent">{__('Sent')}</SelectItem>
                                            <SelectItem value="failed">{__('Failed')}</SelectItem>
                                            <SelectItem value="pending">{__('Pending')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Tabla */}
                                <div className="border rounded-xl overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 dark:bg-slate-900/50 text-xs">
                                                <TableHead>{__('Recipient')}</TableHead>
                                                <TableHead>{__('Message')}</TableHead>
                                                <TableHead>{__('Direction')}</TableHead>
                                                <TableHead>{__('Status')}</TableHead>
                                                <TableHead>{__('Date')}</TableHead>
                                                <TableHead className="text-right">{__('Actions')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!messagesData || messagesData.data.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                                                        {historyLoading ? __('Loading messages...') : __('No messages found with selected filters.')}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                messagesData.data.map(m => (
                                                    <TableRow key={m.id} className="text-xs">
                                                        <TableCell className="font-mono font-semibold">
                                                            +{m.recipient_phone}
                                                        </TableCell>
                                                        <TableCell className="max-w-[240px] truncate text-slate-600 dark:text-slate-300">
                                                            {m.message_content}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`text-[10px] ${m.direction === 'inbound' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700'}`}>
                                                                {m.direction === 'inbound' ? __('Inbound') : __('Outbound')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {m.status === 'read' && (
                                                                <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 gap-1 text-[10px]">
                                                                    <CheckCheck className="h-3 w-3" /> {__('Read')}
                                                                </Badge>
                                                            )}
                                                            {m.status === 'delivered' && (
                                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1 text-[10px]">
                                                                    <CheckCheck className="h-3 w-3" /> {__('Delivered')}
                                                                </Badge>
                                                            )}
                                                            {m.status === 'sent' && (
                                                                <Badge className="bg-slate-500/10 text-slate-600 border-slate-200 gap-1 text-[10px]">
                                                                    <Check className="h-3 w-3" /> {__('Sent')}
                                                                </Badge>
                                                            )}
                                                            {m.status === 'failed' && (
                                                                <Badge className="bg-rose-500/10 text-rose-600 border-rose-200 gap-1 text-[10px]">
                                                                    <AlertCircle className="h-3 w-3" /> {__('Failed')}
                                                                </Badge>
                                                            )}
                                                            {m.status === 'pending' && (
                                                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1 text-[10px]">
                                                                    <Clock className="h-3 w-3" /> {__('Pending')}
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                                            {new Date(m.created_at).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => setSelectedMessage(m)}
                                                                    className="h-7 w-7 p-0"
                                                                >
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </Button>
                                                                {m.status === 'failed' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleRetryMessage(m.id)}
                                                                        disabled={retryingId === m.id}
                                                                        className="h-7 text-[11px] gap-1 text-rose-600 hover:text-rose-700 px-2"
                                                                    >
                                                                        <RotateCw className={`h-3 w-3 ${retryingId === m.id ? 'animate-spin' : ''}`} />
                                                                        {__('Retry')}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Paginación */}
                                {messagesData && messagesData.last_page > 1 && (
                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                                        <span>
                                            {__('Page')} {messagesData.current_page} {__('of')} {messagesData.last_page} ({messagesData.total} {__('messages')})
                                        </span>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={messagesData.current_page <= 1}
                                                onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                                                className="h-7 text-xs"
                                            >
                                                {__('Previous')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={messagesData.current_page >= messagesData.last_page}
                                                onClick={() => setHistoryPage(prev => prev + 1)}
                                                className="h-7 text-xs"
                                            >
                                                {__('Next')}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 4: ANTI-BAN POLICIES & WORKING HOURS */}
                    <TabsContent value="antiban" className="space-y-6">
                        <div className="grid md:grid-cols-12 gap-6">
                            <div className="md:col-span-8">
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-amber-600" />
                                            {__('Anti-Ban Protection & Messaging Policies')}
                                        </CardTitle>
                                        <CardDescription>
                                            {__('Adjust safety throttle limits, warm-up pacing, and nocturnal silence to prevent Meta phone bans.')}
                                        </CardDescription>
                                    </CardHeader>
                                    <form onSubmit={handleSaveAntiBan}>
                                        <CardContent className="space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Warmup Mode Toggle */}
                                                <div className="p-4 border rounded-xl bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="font-semibold text-sm flex items-center gap-1.5">
                                                            <Flame className="h-4 w-4 text-amber-500" />
                                                            {__('Warm-Up Mode')}
                                                        </Label>
                                                        <Switch
                                                            checked={antiBanForm.data.warmupMode}
                                                            onCheckedChange={(c) => antiBanForm.setData('warmupMode', c)}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {__('Automatically throttles messages with dynamic intervals (20-40s) for newly connected phone lines.')}
                                                    </p>
                                                </div>

                                                {/* Daily Message Limit Input */}
                                                <div className="p-4 border rounded-xl bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
                                                    <Label htmlFor="dailyLimit" className="font-semibold text-sm block">
                                                        {__('Daily Message Limit')}
                                                    </Label>
                                                    <Input
                                                        id="dailyLimit"
                                                        type="number"
                                                        min="10"
                                                        max="20000"
                                                        value={antiBanForm.data.dailyLimit}
                                                        onChange={(e) => antiBanForm.setData('dailyLimit', parseInt(e.target.value) || 100)}
                                                        className="bg-white dark:bg-slate-950 font-mono"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        {__('Recommended: 30 for week 1, 80 for week 2, 200+ for mature lines.')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Working Hours Timeframe */}
                                            <div className="p-4 border rounded-xl bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="font-semibold text-sm flex items-center gap-1.5">
                                                        <Clock className="h-4 w-4 text-indigo-500" />
                                                        {__('Working Hours & Night Silence (Auto-Pause)')}
                                                    </Label>
                                                    <Switch
                                                        checked={antiBanForm.data.workingHoursEnabled}
                                                        onCheckedChange={(c) => antiBanForm.setData('workingHoursEnabled', c)}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {__('Queued messages during off-hours will safely pause and automatically resume the following morning.')}
                                                </p>
                                                <div className="grid grid-cols-2 gap-4 pt-1">
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground block mb-1">{__('Start Time')}</Label>
                                                        <Input
                                                            type="time"
                                                            value={antiBanForm.data.workingHoursStart}
                                                            onChange={(e) => antiBanForm.setData('workingHoursStart', e.target.value)}
                                                            className="bg-white dark:bg-slate-950"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground block mb-1">{__('End Time')}</Label>
                                                        <Input
                                                            type="time"
                                                            value={antiBanForm.data.workingHoursEnd}
                                                            onChange={(e) => antiBanForm.setData('workingHoursEnd', e.target.value)}
                                                            className="bg-white dark:bg-slate-950"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dedicated Proxy (Optional) */}
                                            <div className="p-4 border rounded-xl bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
                                                <Label htmlFor="proxyUrl" className="font-semibold text-sm flex items-center gap-1.5">
                                                    <Globe className="h-4 w-4 text-emerald-500" />
                                                    {__('Dedicated Proxy HTTP / SOCKS5 (Optional)')}
                                                </Label>
                                                <Input
                                                    id="proxyUrl"
                                                    placeholder="http://user:password@proxy-ip:port"
                                                    value={antiBanForm.data.proxyUrl}
                                                    onChange={(e) => antiBanForm.setData('proxyUrl', e.target.value)}
                                                    className="font-mono text-xs bg-white dark:bg-slate-950"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    {__('Route this specific WhatsApp instance through a fixed residential proxy IP.')}
                                                </p>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex justify-end">
                                            <Button type="submit" disabled={antiBanForm.processing} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                                                <Shield className="h-4 w-4" />
                                                {__('Save Anti-Ban Policies')}
                                            </Button>
                                        </CardFooter>
                                    </form>
                                </Card>
                            </div>

                            {/* Anti-Ban Rules Sidebar */}
                            <div className="md:col-span-4 space-y-6">
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                            {__('Anti-Ban Safety Checklist')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-xs">
                                        <div className="flex gap-2 items-start">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <span><strong>{__('Use Spintax Always:')}</strong> {__('Rotate greetings and words so each message has a unique fingerprint.')}</span>
                                        </div>
                                        <div className="flex gap-2 items-start">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <span><strong>{__('Verify Numbers First:')}</strong> {__('Check if the recipient exists on WhatsApp before sending cold broadcasts.')}</span>
                                        </div>
                                        <div className="flex gap-2 items-start">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <span><strong>{__('Honor Opt-Outs:')}</strong> {__('Our webhook automatically registers unsubscriptions when users reply "STOP".')}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 5: TESTING SANDBOX & SPINTAX */}
                    <TabsContent value="dispatcher" className="space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Send className="h-5 w-5 text-emerald-600" />
                                    {__('Testing Sandbox & Spintax Simulator')}
                                </CardTitle>
                                <CardDescription>
                                    {__('Test message delivery with automatic number verification (+58) and live Spintax variations.')}
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSendTestMessage}>
                                <CardContent className="space-y-6">
                                    {/* Selector rápido de plantillas */}
                                    {templates.length > 0 && (
                                        <div className="p-3 border rounded-xl bg-slate-50/70 dark:bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-emerald-600" />
                                                <span className="text-xs font-semibold">{__('Load from Template:')}</span>
                                            </div>
                                            <Select onValueChange={(val) => {
                                                const t = templates.find(item => String(item.id) === val);
                                                if (t) setTestMessage(prev => ({ ...prev, message: t.contenido }));
                                            }}>
                                                <SelectTrigger className="w-full sm:w-72 text-xs h-8 bg-white dark:bg-slate-950">
                                                    <SelectValue placeholder={__('Select a template...')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {templates.map(t => (
                                                        <SelectItem key={t.id} value={String(t.id)}>
                                                            {t.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Phone selector with Country Code */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold">{__('Recipient WhatsApp Number')}</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCheckNumber}
                                                disabled={checkingNumber || !testMessage.phoneNumber}
                                                className="h-7 text-xs gap-1.5"
                                            >
                                                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                                                {checkingNumber ? __('Verifying...') : __('Verify WhatsApp Number')}
                                            </Button>
                                        </div>

                                        <PhoneInputGroup
                                            paises={paises}
                                            selectedPaisId={testMessage.paisId}
                                            phoneNumber={testMessage.phoneNumber}
                                            onPaisChange={(val) => setTestMessage(prev => ({ ...prev, paisId: val }))}
                                            onPhoneNumberChange={(val) => setTestMessage(prev => ({ ...prev, phoneNumber: val }))}
                                        />

                                        {numberCheckResult && (
                                            <div className="pt-1">
                                                {numberCheckResult.exists ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:text-emerald-400 gap-1 text-xs">
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                        {__('Number verified on WhatsApp!')} ({numberCheckResult.jid})
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-400 gap-1 text-xs">
                                                        <AlertTriangle className="h-3.5 w-3.5" />
                                                        {numberCheckResult.error || __('Warning: Number NOT found on WhatsApp. Meta will penalize sending to invalid numbers.')}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Textarea with Spintax Simulator */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="test_msg" className="text-sm font-semibold">
                                                {__('Message Template (Spintax Supported)')}
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handlePreviewSpintax}
                                                disabled={previewingSpintax || !testMessage.message}
                                                className="h-7 text-xs gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                            >
                                                <Sparkles className="h-3.5 w-3.5" />
                                                {previewingSpintax ? __('Generating...') : __('Preview Spintax Variations')}
                                            </Button>
                                        </div>

                                        <Textarea
                                            id="test_msg"
                                            rows={3}
                                            value={testMessage.message}
                                            onChange={(e) => setTestMessage(prev => ({ ...prev, message: e.target.value }))}
                                            className="font-mono text-xs"
                                        />
                                        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                            <span>{__('Spintax Syntax:')} <code className="text-emerald-600 font-bold">{'{Hola|Buen día|Saludos}'}</code></span>
                                            <span>• {__('Variables:')} <code className="text-blue-600 font-bold">{'{{nombre}}'}</code>, <code className="text-blue-600 font-bold">{'{{empresa}}'}</code>, <code className="text-blue-600 font-bold">{'{{random}}'}</code></span>
                                        </div>

                                        {/* Spintax Interactive Variations Output */}
                                        {spintaxPreviews.length > 0 && (
                                            <div className="p-4 border rounded-xl bg-amber-50/40 dark:bg-amber-950/20 space-y-2.5 mt-3">
                                                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block flex items-center gap-1.5">
                                                    <Sparkles className="h-3.5 w-3.5" />
                                                    {__('Spintax Permutation Samples:')}
                                                </span>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {spintaxPreviews.map((variation, idx) => (
                                                        <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border text-xs text-slate-800 dark:text-slate-200 shadow-sm">
                                                            <span className="text-amber-600 font-bold mr-1.5">#{idx + 1}:</span>
                                                            {variation}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-2.5">
                                        <Switch
                                            id="use_sync"
                                            checked={testMessage.useSync}
                                            onCheckedChange={(checked) => setTestMessage(prev => ({ ...prev, useSync: checked }))}
                                        />
                                        <Label htmlFor="use_sync" className="text-xs text-muted-foreground cursor-pointer">
                                            {__('Immediate Sync Dispatch (Bypass Queue)')}
                                        </Label>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={sendingMsg || !isConnected}
                                        className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                                    >
                                        <Send className={`h-4 w-4 ${sendingMsg ? 'animate-pulse' : ''}`} />
                                        {__('Send Protected Message')}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>

                    {/* TAB 6: SERVER SETTINGS & WEBHOOKS */}
                    <TabsContent value="settings" className="space-y-6">
                        <div className="grid md:grid-cols-12 gap-6">
                            {/* Server credentials & tokens */}
                            <div className="md:col-span-7">
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Server className="h-5 w-5 text-emerald-600" />
                                            {__('Server & Multi-Instance Configuration')}
                                        </CardTitle>
                                        <CardDescription>
                                            {__('Endpoint routing and company authentication credentials.')}
                                        </CardDescription>
                                    </CardHeader>
                                    <form onSubmit={handleSaveConfig}>
                                        <CardContent className="space-y-4">
                                            {/* Enable Switch */}
                                            <div className="flex items-center justify-between p-3.5 border rounded-xl bg-slate-50/70 dark:bg-slate-900/40">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-semibold">{__('Enable WhatsApp Integration')}</Label>
                                                    <p className="text-xs text-muted-foreground">{__('Enable automated template sending.')}</p>
                                                </div>
                                                <Switch
                                                    checked={configForm.data.whatsapp_active}
                                                    onCheckedChange={(checked) => configForm.setData('whatsapp_active', checked)}
                                                />
                                            </div>

                                            {/* Connection IP / API URL */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="whatsapp_api_url">{__('Connection IP / API URL')}</Label>
                                                <Input
                                                    id="whatsapp_api_url"
                                                    placeholder="http://localhost:3000"
                                                    value={configForm.data.whatsapp_api_url}
                                                    onChange={(e) => configForm.setData('whatsapp_api_url', e.target.value)}
                                                    className="font-mono text-sm"
                                                />
                                            </div>

                                            {/* Instance Name */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="whatsapp_instance">{__('WhatsApp Instance Name')}</Label>
                                                <Input
                                                    id="whatsapp_instance"
                                                    placeholder="empresa_1"
                                                    value={configForm.data.whatsapp_instance}
                                                    onChange={(e) => configForm.setData('whatsapp_instance', e.target.value)}
                                                    className="font-mono text-sm"
                                                />
                                            </div>

                                            {/* Company Token */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="whatsapp_api_key">{__('Company API Token (x-api-key)')}</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="whatsapp_api_key"
                                                        type="text"
                                                        value={configForm.data.whatsapp_api_key}
                                                        onChange={(e) => configForm.setData('whatsapp_api_key', e.target.value)}
                                                        className="font-mono text-sm"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={copyTokenToClipboard}
                                                        disabled={!configForm.data.whatsapp_api_key}
                                                        className="shrink-0"
                                                    >
                                                        {copiedToken ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex flex-col sm:flex-row justify-between gap-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleGenerateToken}
                                                    className="gap-1.5 text-xs text-slate-700 dark:text-slate-200"
                                                >
                                                    <Key className="h-3.5 w-3.5" />
                                                    {__('Generate Token')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleSyncCompany}
                                                    disabled={!whatsapp_api_key}
                                                    className="gap-1.5 text-xs text-slate-700 hover:text-emerald-700 dark:text-slate-200"
                                                >
                                                    <Database className="h-3.5 w-3.5" />
                                                    {__('Sync Company')}
                                                </Button>
                                            </div>

                                            <Button type="submit" disabled={configForm.processing} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                                <RefreshCw className={`h-4 w-4 ${configForm.processing ? 'animate-spin' : ''}`} />
                                                {__('Save Settings')}
                                            </Button>
                                        </CardFooter>
                                    </form>
                                </Card>
                            </div>

                            {/* Webhook Endpoint Info Card */}
                            <div className="md:col-span-5 space-y-6">
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Terminal className="h-5 w-5 text-indigo-600" />
                                            {__('Inbound Webhook Endpoint')}
                                        </CardTitle>
                                        <CardDescription>
                                            {__('Receives opt-out unsubscriptions and incoming user replies.')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-xs">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">{__('Webhook URL (Auto-Registered)')}</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    readOnly
                                                    value={webhookUrl}
                                                    className="font-mono text-xs bg-slate-50 dark:bg-slate-900 select-all"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={copyWebhookToClipboard}
                                                    className="shrink-0"
                                                >
                                                    {copiedWebhook ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="p-3.5 border rounded-xl bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">{__('Listening Events:')}</span>
                                            <div className="space-y-1.5 text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Badge variant="outline" className="font-mono text-[10px] bg-white dark:bg-slate-950">contact.opt_out</Badge>
                                                    <span>{__('Handles STOP / BAJA unsubscriptions.')}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Badge variant="outline" className="font-mono text-[10px] bg-white dark:bg-slate-950">message.received</Badge>
                                                    <span>{__('Handles incoming user messages & interactive bot replies.')}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Badge variant="outline" className="font-mono text-[10px] bg-white dark:bg-slate-950">message.ack / status</Badge>
                                                    <span>{__('Updates delivery and blue ticks read receipts.')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* MODAL 1: Diagnóstico en Vivo (Heartbeat) */}
            <Dialog open={diagnosticOpen} onOpenChange={setDiagnosticOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                            {__('WhatsApp Health Diagnostic')}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Real-time latency check and Baileys engine status test.')}
                        </DialogDescription>
                    </DialogHeader>

                    {diagnosticLoading ? (
                        <div className="py-8 text-center space-y-3">
                            <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
                            <p className="text-xs text-muted-foreground">{__('Executing server ping...')}</p>
                        </div>
                    ) : diagnosticData ? (
                        <div className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                                    <span className="text-[10px] text-muted-foreground block uppercase">{__('Network Latency')}</span>
                                    <span className="text-lg font-bold text-emerald-600 font-mono">{diagnosticData.latencyMs} ms</span>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                                    <span className="text-[10px] text-muted-foreground block uppercase">{__('Socket State')}</span>
                                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {getConnectionStateLabel(diagnosticData.status?.connectionState, Boolean(diagnosticData.status?.isConnected))}
                                    </span>
                                </div>
                            </div>

                            {diagnosticData.health && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-1.5 font-mono text-[11px]">
                                    <div><strong>{__('Node.js:')}</strong> {diagnosticData.health.system?.nodeVersion} ({diagnosticData.health.system?.platform})</div>
                                    <div><strong>{__('RSS Memory:')}</strong> {diagnosticData.health.system?.memoryUsageMb?.rss} MB</div>
                                    <div><strong>{__('Database:')}</strong> {diagnosticData.health.database?.status} ({diagnosticData.health.database?.latencyMs} ms)</div>
                                </div>
                            )}

                            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span>{__('The WhatsApp engine is healthy and responding optimally.')}</span>
                            </div>
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button size="sm" variant="outline" onClick={() => setDiagnosticOpen(false)}>
                            {__('Close')}
                        </Button>
                        <Button size="sm" onClick={handleRunDiagnostic} disabled={diagnosticLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {__('Re-test')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL 2: Crear / Editar Plantilla */}
            <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base flex items-center gap-2">
                            <FileText className="h-5 w-5 text-emerald-600" />
                            {editingTemplate ? __('Edit Template') : __('New WhatsApp Template')}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Define a reusable template with Spintax options and dynamic variables.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
                        <div className="space-y-1.5">
                            <Label htmlFor="tpl_name">{__('Template Name')}</Label>
                            <Input
                                id="tpl_name"
                                required
                                placeholder={__('e.g. Pastoral Assembly Call')}
                                value={templateFormData.nombre}
                                onChange={(e) => setTemplateFormData(prev => ({ ...prev, nombre: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="tpl_cat">{__('Category')}</Label>
                            <Select
                                value={templateFormData.categoria}
                                onValueChange={(val) => setTemplateFormData(prev => ({ ...prev, categoria: val }))}
                            >
                                <SelectTrigger id="tpl_cat">
                                    <SelectValue placeholder={__('Select category')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pastoral">{__('Pastoral')}</SelectItem>
                                    <SelectItem value="convocatorias">{__('Calls')}</SelectItem>
                                    <SelectItem value="avisos">{__('Announcements')}</SelectItem>
                                    <SelectItem value="general">{__('General')}</SelectItem>
                                    <SelectItem value="seguridad">{__('Security')}</SelectItem>
                                    <SelectItem value="asistencia">{__('Attendance')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="tpl_content">{__('Template Content (Spintax Supported)')}</Label>
                                <span className="text-[10px] text-muted-foreground">{__('Use {option1|option2}')}</span>
                            </div>
                            <Textarea
                                id="tpl_content"
                                required
                                rows={4}
                                placeholder="{Estimado|Apreciado} {{nombre}}, le notificamos..."
                                value={templateFormData.contenido}
                                onChange={(e) => setTemplateFormData(prev => ({ ...prev, contenido: e.target.value }))}
                                className="font-mono text-xs"
                            />
                        </div>

                        {/* Insertador de Variables */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">{__('Insert Quick Variables:')}</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {['nombre', 'iglesia', 'zona', 'fecha', 'hora', 'lugar', 'empresa', 'random'].map(varName => (
                                    <Button
                                        key={varName}
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleInsertVariableInTemplate(varName)}
                                        className="h-6 text-[10px] font-mono px-2 bg-slate-50 dark:bg-slate-900 hover:bg-emerald-50 text-slate-700 dark:text-slate-300"
                                    >
                                        + {`{{${varName}}}`}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="pt-3">
                            <Button type="button" size="sm" variant="outline" onClick={() => setTemplateModalOpen(false)}>
                                {__('Cancel')}
                            </Button>
                            <Button type="submit" size="sm" disabled={savingTemplate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {savingTemplate ? __('Saving...') : __('Save Template')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 3: Detalle de Mensaje del Historial */}
            <Dialog open={Boolean(selectedMessage)} onOpenChange={(open) => !open && setSelectedMessage(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base flex items-center gap-2">
                            <Inbox className="h-5 w-5 text-indigo-600" />
                            {__('Message Details')}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedMessage && (
                        <div className="space-y-3 text-xs">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-1.5 font-mono">
                                <div><strong>{__('Recipient:')}</strong> +{selectedMessage.recipient_phone}</div>
                                <div><strong>{__('Message ID:')}</strong> {selectedMessage.message_id || 'N/A'}</div>
                                <div><strong>{__('Status:')}</strong> <span className="capitalize">{__(selectedMessage.status)}</span></div>
                                <div><strong>{__('Sent Date:')}</strong> {new Date(selectedMessage.created_at).toLocaleString()}</div>
                                {selectedMessage.read_at && <div><strong>{__('Read Date:')}</strong> {new Date(selectedMessage.read_at).toLocaleString()}</div>}
                                <div><strong>{__('Retry Count:')}</strong> {selectedMessage.retry_count}</div>
                            </div>

                            <div className="space-y-1">
                                <Label className="font-semibold">{__('Dispatched Content:')}</Label>
                                <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                                    {selectedMessage.message_content}
                                </div>
                            </div>

                            {selectedMessage.error_message && (
                                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 rounded-xl text-rose-700 dark:text-rose-400">
                                    <strong>{__('Error:')}</strong> {selectedMessage.error_message}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button size="sm" variant="outline" onClick={() => setSelectedMessage(null)}>
                            {__('Close')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}