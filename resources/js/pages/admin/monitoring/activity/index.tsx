import { Head, router } from '@inertiajs/react';
import {
    Activity, Download, Trash2, Search, Filter, Eye, RefreshCw,
    PlusCircle, Edit3, User, Globe,
    Laptop, Copy, Calendar, RotateCcw,
    Server, Layers, Clock, Check, LogIn, LogOut, ShieldAlert, KeyRound
} from 'lucide-react';
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInitials } from '@/hooks/use-initials';
import { useTranslate } from '@/hooks/use-translate';

interface ChangeItem {
    key: string;
    label: string;
    old: string;
    new: string;
}

interface Causer {
    id: number;
    name: string;
    email: string;
}

interface UserAgentParsed {
    os: string;
    browser: string;
    device: string;
}

interface ActivityItem {
    id: number;
    log_name: string;
    description: string;
    event: string;
    subject_type: string | null;
    subject_type_translated: string;
    subject_id: number | null;
    causer: Causer | null;
    ip_address: string | null;
    user_agent: string | null;
    user_agent_parsed: UserAgentParsed;
    url: string | null;
    method: string | null;
    tabla: string | null;
    identificador: string | null;
    batch_uuid: string | null;
    changes: ChangeItem[];
    raw_properties: Record<string, any>;
    created_at: string;
    created_at_formatted: string;
    created_at_human: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface PageProps {
    activities: PaginatedData<ActivityItem>;
    stats: {
        total: number;
        today: number;
        created: number;
        updated: number;
        deleted: number;
    };
    filters: {
        search?: string;
        event?: string;
        log_name?: string;
        subject_type?: string;
        user_id?: string;
        date_from?: string;
        date_to?: string;
    };
    availableEvents: string[];
    availableLogNames: string[];
    availableSubjectTypes: { value: string; full: string; label: string }[];
    availableUsers: { id: number; name: string; email: string }[];
}

export default function ActivityMonitoring({
    activities,
    stats,
    filters,
    availableEvents,
    availableSubjectTypes,
    availableUsers,
}: PageProps) {
    const getInitials = useInitials();
    const { __ } = useTranslate();

    // Local Filter States
    const [search, setSearch] = useState(filters.search || '');
    const [eventFilter, setEventFilter] = useState(filters.event || 'all');
    const [logNameFilter] = useState(filters.log_name || 'all');
    const [subjectTypeFilter, setSubjectTypeFilter] = useState(filters.subject_type || 'all');
    const [userFilter, setUserFilter] = useState(filters.user_id || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    // Modal Inspection State
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
    const [copiedJson, setCopiedJson] = useState(false);

    // Apply Filter Request
    const handleApplyFilters = () => {
        router.get(
            '/admin/monitoring/activity',
            {
                search: search || undefined,
                event: eventFilter !== 'all' ? eventFilter : undefined,
                log_name: logNameFilter !== 'all' ? logNameFilter : undefined,
                subject_type: subjectTypeFilter !== 'all' ? subjectTypeFilter : undefined,
                user_id: userFilter !== 'all' ? userFilter : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Quick filter click on KPI card
    const handleQuickFilter = (selectedEvent: string) => {
        setEventFilter(selectedEvent);
        router.get(
            '/admin/monitoring/activity',
            {
                search: search || undefined,
                event: selectedEvent !== 'all' ? selectedEvent : undefined,
                log_name: logNameFilter !== 'all' ? logNameFilter : undefined,
                subject_type: subjectTypeFilter !== 'all' ? subjectTypeFilter : undefined,
                user_id: userFilter !== 'all' ? userFilter : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Reset Filters
    const handleResetFilters = () => {
        setSearch('');
        setEventFilter('all');
        setSubjectTypeFilter('all');
        setUserFilter('all');
        setDateFrom('');
        setDateTo('');

        router.get('/admin/monitoring/activity', {}, { preserveState: true, preserveScroll: true });
    };

    // Clear All Activity Logs
    const handleClearLogs = () => {
        Swal.fire({
            title: __('Are you sure?'),
            text: __('This action will permanently delete all activity log records from the system.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: __('Yes, clear activity log'),
            cancelButtonText: __('Cancel'),
            customClass: {
                confirmButton: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete('/admin/monitoring/activity/clear', {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire(__('Logs Cleared'), __('All system activity records were deleted successfully.'), 'success');
                    },
                });
            }
        });
    };

    // Export CSV with current filters
    const handleExportCsv = () => {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (eventFilter !== 'all') queryParams.set('event', eventFilter);
        if (dateFrom) queryParams.set('date_from', dateFrom);
        if (dateTo) queryParams.set('date_to', dateTo);

        window.open(`/admin/monitoring/activity/export?${queryParams.toString()}`);
    };

    // Visual Styling for Event Badges
    const getEventBadge = (event: string) => {
        const evt = event.toLowerCase();

        switch (evt) {
            case 'created':
            case 'creación':
            case 'creado':
                return {
                    label: __('Created'),
                    variant: 'outline' as const,
                    icon: <PlusCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
                    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 font-bold',
                    rowBg: 'border-l-4 border-l-emerald-500 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors',
                };
            case 'updated':
            case 'actualización':
            case 'actualizado':
                return {
                    label: __('Updated'),
                    variant: 'outline' as const,
                    icon: <Edit3 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />,
                    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 font-bold',
                    rowBg: 'border-l-4 border-l-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors',
                };
            case 'deleted':
            case 'eliminación':
            case 'eliminado':
                return {
                    label: __('Deleted'),
                    variant: 'destructive' as const,
                    icon: <Trash2 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />,
                    className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 font-bold',
                    rowBg: 'border-l-4 border-l-rose-500 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors',
                };
            case 'restored':
            case 'restaurado':
                return {
                    label: __('Restored'),
                    variant: 'outline' as const,
                    icon: <RotateCcw className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />,
                    className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900/50 font-bold',
                    rowBg: 'border-l-4 border-l-purple-500 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors',
                };
            case 'login':
            case 'inicio de sesión':
                return {
                    label: __('Login'),
                    variant: 'outline' as const,
                    icon: <LogIn className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
                    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 font-bold',
                    rowBg: 'border-l-4 border-l-emerald-500 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors',
                };
            case 'logout':
            case 'cierre de sesión':
                return {
                    label: __('Logout'),
                    variant: 'outline' as const,
                    icon: <LogOut className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />,
                    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 font-bold',
                    rowBg: 'border-l-4 border-l-amber-500 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors',
                };
            case 'failed_login':
            case 'intento fallido':
                return {
                    label: __('Failed Login'),
                    variant: 'destructive' as const,
                    icon: <ShieldAlert className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />,
                    className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 font-bold',
                    rowBg: 'border-l-4 border-l-rose-500 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors',
                };
            case 'lockout':
            case 'bloqueo':
                return {
                    label: __('Lockout'),
                    variant: 'destructive' as const,
                    icon: <ShieldAlert className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />,
                    className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 font-bold',
                    rowBg: 'border-l-4 border-l-rose-500 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors',
                };
            case 'password_reset':
            case 'restablecimiento':
                return {
                    label: __('Password Reset'),
                    variant: 'outline' as const,
                    icon: <KeyRound className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />,
                    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 font-bold',
                    rowBg: 'border-l-4 border-l-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors',
                };
            default:
                return {
                    label: event.toUpperCase(),
                    variant: 'secondary' as const,
                    icon: <Activity className="h-3.5 w-3.5 text-slate-500 shrink-0" />,
                    className: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300 font-bold',
                    rowBg: 'border-l-4 border-l-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors',
                };
        }
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Monitoring'), href: '#' },
        { title: __('System Activity Logs'), href: '/admin/monitoring/activity' },
    ];

    const copyRawProperties = () => {
        if (selectedActivity) {
            navigator.clipboard.writeText(JSON.stringify(selectedActivity.raw_properties, null, 2));
            setCopiedJson(true);
            setTimeout(() => setCopiedJson(false), 2000);
            Swal.fire({
                title: __('Copied!'),
                text: __('Properties JSON copied to clipboard.'),
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
            });
        }
    };

    const totalLogsVal = stats.total || 1;
    const createdPct = Math.min(100, Math.round((stats.created / totalLogsVal) * 100));
    const updatedPct = Math.min(100, Math.round((stats.updated / totalLogsVal) * 100));
    const deletedPct = Math.min(100, Math.round((stats.deleted / totalLogsVal) * 100));
    const todayPct = Math.min(100, Math.round((stats.today / totalLogsVal) * 100));

    return (
        <>
            <Head title={__('System Activity Logs')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Page Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Activity className="h-8 w-8 text-indigo-600" />
                            {__('System Activity Monitoring')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Audit system actions, model changes, user operations, and historical activity logs.')}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0 self-start md:self-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-slate-200 hover:bg-slate-50"
                            onClick={() => router.reload({ preserveScroll: true })}
                        >
                            <RefreshCw className="h-4 w-4" />
                            {__('Refresh')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-slate-200 hover:bg-slate-50"
                            onClick={handleExportCsv}
                        >
                            <Download className="h-4 w-4" />
                            {__('Export CSV')}
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={handleClearLogs}
                        >
                            <Trash2 className="h-4 w-4" />
                            {__('Clear Activity')}
                        </Button>
                    </div>
                </div>

                {/* Enhanced Interactive KPI Cards Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Total Activity */}
                    <Card
                        className={`shadow-sm border-l-4 border-l-sky-500 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                            eventFilter === 'all' ? 'ring-2 ring-sky-500/60 bg-sky-50/20 dark:bg-sky-950/20' : 'bg-card'
                        }`}
                        onClick={() => handleQuickFilter('all')}
                        title={__('Click to filter all events')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                {__('Total Logs')}
                                {eventFilter === 'all' && <Check className="h-3.5 w-3.5 text-sky-600" />}
                            </CardTitle>
                            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/20">
                                <Activity className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-2xl font-extrabold tracking-tight">{stats.total.toLocaleString()}</div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{__('Recorded actions')}</span>
                                <span className="font-mono text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold px-1.5 py-0.5 rounded">100%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-sky-500 h-full rounded-full w-full" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Today's Activity */}
                    <Card className="shadow-sm border-l-4 border-l-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-md bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{__('Today')}</CardTitle>
                            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
                                <Calendar className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-2xl font-extrabold tracking-tight">{stats.today.toLocaleString()}</div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{__('Actions last 24h')}</span>
                                <span className="font-mono text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                                    {todayPct}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${todayPct}%` }} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Created */}
                    <Card
                        className={`shadow-sm border-l-4 border-l-emerald-500 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                            eventFilter === 'created' ? 'ring-2 ring-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/20' : 'bg-card'
                        }`}
                        onClick={() => handleQuickFilter('created')}
                        title={__('Click to filter created events')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                {__('Created')}
                                {eventFilter === 'created' && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                            </CardTitle>
                            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                                <PlusCircle className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{stats.created.toLocaleString()}</div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{__('New records')}</span>
                                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                                    {createdPct}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${createdPct}%` }} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Updated */}
                    <Card
                        className={`shadow-sm border-l-4 border-l-indigo-500 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                            eventFilter === 'updated' ? 'ring-2 ring-indigo-500/60 bg-indigo-50/20 dark:bg-indigo-950/20' : 'bg-card'
                        }`}
                        onClick={() => handleQuickFilter('updated')}
                        title={__('Click to filter updated events')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                {__('Updated')}
                                {eventFilter === 'updated' && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                            </CardTitle>
                            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20">
                                <Edit3 className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-2xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">{stats.updated.toLocaleString()}</div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{__('Modified records')}</span>
                                <span className="font-mono text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded">
                                    {updatedPct}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${updatedPct}%` }} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Deleted */}
                    <Card
                        className={`shadow-sm border-l-4 border-l-rose-500 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                            eventFilter === 'deleted' ? 'ring-2 ring-rose-500/60 bg-rose-50/20 dark:bg-rose-950/20' : 'bg-card'
                        }`}
                        onClick={() => handleQuickFilter('deleted')}
                        title={__('Click to filter deleted events')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                {__('Deleted')}
                                {eventFilter === 'deleted' && <Check className="h-3.5 w-3.5 text-rose-600" />}
                            </CardTitle>
                            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20">
                                <Trash2 className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-2xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">{stats.deleted.toLocaleString()}</div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{__('Removed records')}</span>
                                <span className="font-mono text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold px-1.5 py-0.5 rounded">
                                    {deletedPct}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${deletedPct}%` }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Section */}
                <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Search Input */}
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Search className="h-3.5 w-3.5" />
                                    {__('Search Keyword')}
                                </span>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={__('Search description, user, IP...')}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                                        className="pl-9 bg-slate-50/50 dark:bg-slate-950/20 text-xs h-9"
                                    />
                                </div>
                            </div>

                            {/* Event Filter */}
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Filter className="h-3.5 w-3.5" />
                                    {__('Event Type')}
                                </span>
                                <Select value={eventFilter} onValueChange={setEventFilter}>
                                    <SelectTrigger className="bg-slate-50/50 dark:bg-slate-950/20 text-xs h-9">
                                        <SelectValue placeholder={__('All Events')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{__('All Events')}</SelectItem>
                                        <SelectItem value="created">{__('Created')}</SelectItem>
                                        <SelectItem value="updated">{__('Updated')}</SelectItem>
                                        <SelectItem value="deleted">{__('Deleted')}</SelectItem>
                                        <SelectItem value="login">{__('Login')}</SelectItem>
                                        <SelectItem value="logout">{__('Logout')}</SelectItem>
                                        <SelectItem value="failed_login">{__('Failed Login')}</SelectItem>
                                        <SelectItem value="restored">{__('Restored')}</SelectItem>
                                        {availableEvents
                                            .filter((e) => !['created', 'updated', 'deleted', 'restored', 'login', 'logout', 'failed_login'].includes(e.toLowerCase()))
                                            .map((e) => (
                                                <SelectItem key={e} value={e}>
                                                    {e.toUpperCase()}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Subject / Model Filter */}
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Layers className="h-3.5 w-3.5" />
                                    {__('Entity / Model')}
                                </span>
                                <Select value={subjectTypeFilter} onValueChange={setSubjectTypeFilter}>
                                    <SelectTrigger className="bg-slate-50/50 dark:bg-slate-950/20 text-xs h-9">
                                        <SelectValue placeholder={__('All Models')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{__('All Models')}</SelectItem>
                                        {availableSubjectTypes.map((st) => (
                                            <SelectItem key={st.value} value={st.value}>
                                                {st.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* User / Causer Filter */}
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    {__('User / Actor')}
                                </span>
                                <Select value={userFilter} onValueChange={setUserFilter}>
                                    <SelectTrigger className="bg-slate-50/50 dark:bg-slate-950/20 text-xs h-9">
                                        <SelectValue placeholder={__('All Users')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{__('All Users')}</SelectItem>
                                        {availableUsers.map((u) => (
                                            <SelectItem key={u.id} value={u.id.toString()}>
                                                {u.name} ({u.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Date Range & Action Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2 border-t">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="space-y-1">
                                    <span className="text-[11px] font-semibold text-slate-500">{__('From Date')}</span>
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="h-8 text-xs bg-slate-50/50 dark:bg-slate-950/20"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] font-semibold text-slate-500">{__('To Date')}</span>
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="h-8 text-xs bg-slate-50/50 dark:bg-slate-950/20"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <Button size="sm" onClick={handleApplyFilters} className="h-8 gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Filter className="h-3.5 w-3.5" />
                                    {__('Filter Results')}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleResetFilters} className="h-8 text-xs text-muted-foreground">
                                    {__('Reset Filters')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Activity Table */}
                <Card className="shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                                    <TableRow>
                                        <TableHead className="w-44 text-xs font-bold uppercase tracking-wider">{__('Timestamp')}</TableHead>
                                        <TableHead className="w-56 text-xs font-bold uppercase tracking-wider">{__('Actor / User')}</TableHead>
                                        <TableHead className="w-36 text-xs font-bold uppercase tracking-wider">{__('Action')}</TableHead>
                                        <TableHead className="w-44 text-xs font-bold uppercase tracking-wider">{__('Entity / Model')}</TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider">{__('Description Detail')}</TableHead>
                                        <TableHead className="w-36 text-xs font-bold uppercase tracking-wider">{__('IP & Device')}</TableHead>
                                        <TableHead className="w-16 text-right text-xs font-bold uppercase tracking-wider pr-4">{__('Inspect')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activities.data.map((act) => {
                                        const badgeStyle = getEventBadge(act.event);

                                        return (
                                            <TableRow
                                                key={act.id}
                                                className={`group cursor-pointer border-b text-xs ${badgeStyle.rowBg}`}
                                                onClick={() => setSelectedActivity(act)}
                                            >
                                                {/* Timestamp */}
                                                <TableCell className="py-3 font-medium">
                                                    <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 font-semibold">
                                                        {act.created_at_formatted.split(' ')[0]}
                                                    </div>
                                                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                                                        {act.created_at_formatted.split(' ')[1]}
                                                    </div>
                                                    <span className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-mono">
                                                        {act.created_at_human}
                                                    </span>
                                                </TableCell>

                                                {/* Actor / User */}
                                                <TableCell className="py-3">
                                                    {act.causer ? (
                                                        <div className="flex items-center gap-2.5">
                                                            <Avatar className="h-8 w-8 shrink-0">
                                                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                                                    {getInitials(act.causer.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[140px]" title={act.causer.name}>
                                                                    {act.causer.name}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={act.causer.email}>
                                                                    {act.causer.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-900 border-slate-200">
                                                            <Server className="h-3 w-3 mr-1 text-slate-400" />
                                                            {__('System / Guest')}
                                                        </Badge>
                                                    )}
                                                </TableCell>

                                                {/* Event Badge */}
                                                <TableCell className="py-3">
                                                    <Badge variant={badgeStyle.variant} className={`text-[10px] px-2 py-0.5 uppercase tracking-wider inline-flex items-center gap-1 ${badgeStyle.className}`}>
                                                        {badgeStyle.icon}
                                                        {badgeStyle.label}
                                                    </Badge>
                                                </TableCell>

                                                {/* Subject Entity */}
                                                <TableCell className="py-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <Badge variant="outline" className="text-[10px] font-semibold w-fit bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
                                                            {act.subject_type_translated}
                                                        </Badge>
                                                        {act.subject_id && (
                                                            <span className="text-[10px] font-mono text-muted-foreground pl-0.5">
                                                                ID: #{act.subject_id}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Description Detail */}
                                                <TableCell className="py-3 max-w-xs">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={act.description}>
                                                            {act.description}
                                                        </span>
                                                        {act.identificador && (
                                                            <span className="text-[10px] font-mono text-slate-500 line-clamp-1">
                                                                {act.identificador}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* IP & Device */}
                                                <TableCell className="py-3 font-mono text-[10.5px]">
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-700 dark:text-slate-300 font-semibold">
                                                            {act.ip_address || 'N/A'}
                                                        </span>
                                                        {act.user_agent_parsed && (
                                                            <span className="text-[9.5px] text-muted-foreground truncate max-w-[110px]" title={`${act.user_agent_parsed.os} / ${act.user_agent_parsed.browser}`}>
                                                                {act.user_agent_parsed.os} • {act.user_agent_parsed.browser}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="py-3 text-right pr-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedActivity(act);
                                                        }}
                                                        className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                                        title={__('Inspect Details')}
                                                    >
                                                        <Eye className="h-4 w-4 text-indigo-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    {activities.data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground select-none">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Activity className="h-8 w-8 text-slate-300" />
                                                    <span className="font-semibold">{__('No activity log records found.')}</span>
                                                    <span className="text-xs">{__('Try adjusting your search query or filter parameters.')}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Bar */}
                        {activities.total > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-slate-50/50 dark:bg-slate-900/30">
                                <div className="text-xs text-muted-foreground">
                                    {__('Showing')} <span className="font-semibold text-slate-900 dark:text-slate-100">{activities.from || 0}</span> {__('to')} <span className="font-semibold text-slate-900 dark:text-slate-100">{activities.to || 0}</span> {__('of')} <span className="font-semibold text-slate-900 dark:text-slate-100">{activities.total}</span> {__('entries')}
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {activities.links.map((link, idx) => {
                                        if (!link.url && link.label.includes('Previous')) {
                                            return (
                                                <Button key={idx} variant="outline" size="sm" disabled className="h-7 text-xs px-2.5">
                                                    {__('Previous')}
                                                </Button>
                                            );
                                        }
                                        if (!link.url && link.label.includes('Next')) {
                                            return (
                                                <Button key={idx} variant="outline" size="sm" disabled className="h-7 text-xs px-2.5">
                                                    {__('Next')}
                                                </Button>
                                            );
                                        }
                                        if (!link.url) return null;

                                        const cleanLabel = link.label
                                            .replace('&laquo; Previous', __('Previous'))
                                            .replace('Next &raquo;', __('Next'));

                                        return (
                                            <Button
                                                key={idx}
                                                variant={link.active ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => router.get(link.url!, {}, { preserveState: true, preserveScroll: true })}
                                                className={`h-7 text-xs ${link.active ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold' : 'px-2.5'}`}
                                            >
                                                {cleanLabel}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Inspection Modal Dialog matching Logs & Queues Dialog Content style */}
            <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
                <DialogContent className="sm:max-w-6xl md:max-w-7xl w-[94vw] max-h-[94vh] overflow-y-auto p-0 gap-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
                    {selectedActivity && (
                        <>
                            {/* Dialog Banner */}
                            <div className="p-6 sm:p-8 border-b relative overflow-hidden bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-950/20">
                                <div className="relative flex flex-col gap-3">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <span className="text-xs font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-indigo-600" />
                                            {__('Activity Record Inspection')} #{selectedActivity.id}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={getEventBadge(selectedActivity.event).variant} className={`uppercase text-xs font-extrabold px-3 py-1 tracking-wider ${getEventBadge(selectedActivity.event).className}`}>
                                                {getEventBadge(selectedActivity.event).label}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs font-mono px-3 py-1 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                                                Log: {selectedActivity.log_name}
                                            </Badge>
                                        </div>
                                    </div>

                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
                                        {selectedActivity.description}
                                    </h2>

                                    <div className="flex items-center gap-6 text-xs sm:text-sm text-muted-foreground flex-wrap font-mono pt-2">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            <span>{selectedActivity.created_at_formatted}</span>
                                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">({selectedActivity.created_at_human})</span>
                                        </div>
                                        {selectedActivity.ip_address && (
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-slate-400" />
                                                <span>IP: {selectedActivity.ip_address}</span>
                                            </div>
                                        )}
                                        {selectedActivity.method && (
                                            <Badge variant="secondary" className="text-xs font-bold uppercase px-2 py-0.5">
                                                {selectedActivity.method}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tabs System */}
                            <Tabs defaultValue="changes" className="w-full flex flex-col">
                                <div className="px-6 sm:px-8 border-b bg-slate-50/50 dark:bg-slate-900/10">
                                    <TabsList className="h-12 bg-transparent p-0 gap-8 border-b-0">
                                        <TabsTrigger
                                            value="changes"
                                            className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 dark:data-[state=active]:border-indigo-400 bg-transparent px-1 pb-2 pt-2 text-sm sm:text-base font-semibold text-muted-foreground data-[state=active]:text-slate-950 dark:data-[state=active]:text-slate-50 hover:text-slate-800 dark:hover:text-slate-200 transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                            {__('Field Changes')}
                                            {selectedActivity.changes.length > 0 && (
                                                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 rounded-full">
                                                    {selectedActivity.changes.length}
                                                </span>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="json"
                                            className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 dark:data-[state=active]:border-indigo-400 bg-transparent px-1 pb-2 pt-2 text-sm sm:text-base font-semibold text-muted-foreground data-[state=active]:text-slate-950 dark:data-[state=active]:text-slate-50 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
                                        >
                                            {__('Properties JSON')}
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="audit"
                                            className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 dark:data-[state=active]:border-indigo-400 bg-transparent px-1 pb-2 pt-2 text-sm sm:text-base font-semibold text-muted-foreground data-[state=active]:text-slate-950 dark:data-[state=active]:text-slate-50 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
                                        >
                                            {__('Actor & Context')}
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* Changes Tab Content */}
                                <TabsContent value="changes" className="p-6 sm:p-8 focus-visible:outline-none space-y-4">
                                    {selectedActivity.changes.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                {__('Field Level Comparison (Before vs After)')}
                                            </div>

                                            <div className="divide-y border rounded-xl overflow-hidden shadow-sm max-h-[60vh] overflow-y-auto">
                                                {selectedActivity.changes.map((change, idx) => (
                                                    <div key={idx} className="p-5 bg-white dark:bg-slate-900 flex flex-col lg:flex-row lg:items-start justify-between gap-4 text-sm">
                                                        <div className="lg:w-1/4 space-y-1 shrink-0">
                                                            <span className="font-bold text-slate-900 dark:text-slate-100 block text-base">
                                                                {change.label}
                                                            </span>
                                                            <span className="font-mono text-xs text-slate-400 block">
                                                                {change.key}
                                                            </span>
                                                        </div>

                                                        <div className="lg:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs sm:text-sm">
                                                            {/* Old Value */}
                                                            <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/50 text-rose-950 dark:text-rose-200 space-y-1.5">
                                                                <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-rose-600 dark:text-rose-400 block">
                                                                    {__('Old Value')}
                                                                </span>
                                                                <div className="break-all font-semibold select-text leading-relaxed whitespace-pre-wrap">
                                                                    {change.old}
                                                                </div>
                                                            </div>

                                                            {/* New Value */}
                                                            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-200 space-y-1.5">
                                                                <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400 block">
                                                                    {__('New Value')}
                                                                </span>
                                                                <div className="break-all font-semibold select-text leading-relaxed whitespace-pre-wrap">
                                                                    {change.new}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-14 text-muted-foreground text-sm space-y-3">
                                            <p className="font-bold text-base text-slate-700 dark:text-slate-300">{__('No individual field changes detected for this record.')}</p>
                                            <p className="text-xs max-w-md mx-auto">{__('This event may be a creation, deletion, or custom action without trackable dirty attributes.')}</p>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* JSON Properties Tab Content */}
                                <TabsContent value="json" className="p-6 sm:p-8 focus-visible:outline-none space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            {__('Raw Activity Properties')}
                                        </span>
                                        <Button size="sm" variant="outline" onClick={copyRawProperties} className="h-8 text-xs gap-2 border-slate-200">
                                            <Copy className="h-4 w-4" />
                                            {copiedJson ? __('Copied!') : __('Copy JSON')}
                                        </Button>
                                    </div>

                                    <div className="font-mono text-xs sm:text-sm bg-slate-950 text-slate-100 p-6 rounded-2xl overflow-x-auto max-h-[60vh] select-all border border-slate-800 leading-relaxed shadow-inner">
                                        <pre>{JSON.stringify(selectedActivity.raw_properties, null, 2)}</pre>
                                    </div>
                                </TabsContent>

                                {/* Actor & Context Tab Content */}
                                <TabsContent value="audit" className="p-6 sm:p-8 focus-visible:outline-none space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Actor / Causer Details */}
                                        <div className="p-5 border rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <User className="h-4 w-4 text-indigo-600" />
                                                {__('Actor / Responsible')}
                                            </span>

                                            {selectedActivity.causer ? (
                                                <div className="flex items-center gap-4 pt-1">
                                                    <Avatar className="h-12 w-12 shrink-0">
                                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
                                                            {getInitials(selectedActivity.causer.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-1 min-w-0">
                                                        <p className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                                                            {selectedActivity.causer.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground font-mono truncate">
                                                            {selectedActivity.causer.email}
                                                        </p>
                                                        <Badge variant="outline" className="text-[10px] font-mono mt-1">
                                                            User ID: #{selectedActivity.causer.id}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="pt-2 space-y-1">
                                                    <Badge variant="secondary" className="text-xs font-semibold">
                                                        {__('System / Guest')}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground italic">
                                                        {__('Action performed automatically by System / Guest.')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Target Entity Details */}
                                        <div className="p-5 border rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Layers className="h-4 w-4 text-indigo-600" />
                                                {__('Target Entity')}
                                            </span>

                                            <div className="space-y-2.5 pt-1 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">{__('Entity Class:')}</span>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {selectedActivity.subject_type_translated}
                                                    </Badge>
                                                </div>
                                                {selectedActivity.subject_id && (
                                                    <div className="flex items-center justify-between font-mono">
                                                        <span className="text-muted-foreground">{__('Record ID:')}</span>
                                                        <span className="font-bold text-sm">#{selectedActivity.subject_id}</span>
                                                    </div>
                                                )}
                                                {selectedActivity.tabla && (
                                                    <div className="flex items-center justify-between font-mono">
                                                        <span className="text-muted-foreground">{__('Database Table:')}</span>
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedActivity.tabla}</span>
                                                    </div>
                                                )}
                                                {selectedActivity.batch_uuid && (
                                                    <div className="flex items-center justify-between font-mono">
                                                        <span className="text-muted-foreground">{__('Batch UUID:')}</span>
                                                        <span className="text-[11px] text-slate-500 truncate max-w-[140px]">{selectedActivity.batch_uuid}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Request Metadata */}
                                        <div className="p-5 border rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 space-y-4 font-mono text-xs">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Laptop className="h-4 w-4 text-indigo-600" />
                                                {__('Request Environment')}
                                            </span>

                                            <div className="space-y-3 pt-1">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">{__('IP Address')}</span>
                                                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                                        {selectedActivity.ip_address || '-'}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">{__('HTTP Method & URL')}</span>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 break-all text-xs">
                                                        {selectedActivity.method ? `[${selectedActivity.method}] ` : ''}
                                                        {selectedActivity.url || '-'}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">{__('User Agent')}</span>
                                                    <span className="text-slate-600 dark:text-slate-400 break-all text-[11px] block leading-relaxed">
                                                        {selectedActivity.user_agent || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
