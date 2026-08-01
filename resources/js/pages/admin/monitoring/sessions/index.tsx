import { Head, router } from '@inertiajs/react';
import { Shield, Laptop, Smartphone, Globe, Trash2, Key, MapPin, Search, Activity, MonitorCheck, Radio } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInitials } from '@/hooks/use-initials';
import { useTranslate } from '@/hooks/use-translate';

interface SessionItem {
    id: string;
    user_id: number | null;
    user_name: string;
    user_email: string | null;
    ip_address: string;
    latitude?: number | null;
    longitude?: number | null;
    os: string;
    browser: string;
    device: string;
    last_active: string;
    is_current_device: boolean;
}

interface PageProps {
    sessions: SessionItem[];
}

const IpLocation: React.FC<{ ip: string; lat?: number | null; lng?: number | null }> = ({ ip, lat, lng }) => {
    const [location, setLocation] = useState<string>('Buscando ubicación...');

    useEffect(() => {
        if (lat && lng) {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`, {
                headers: { 'User-Agent': 'ServitecApp/1.0' },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.address) {
                        const city = data.address.city || data.address.town || data.address.village || data.address.state || 'Ubicación GPS';
                        const country = data.address.country || '';
                        setLocation(`${city}, ${country}`);
                    } else if (data.display_name) {
                        setLocation(data.display_name.split(',')[0]);
                    }
                })
                .catch(() => {
                    setLocation(`${lat.toFixed(3)}, ${lng.toFixed(3)}`);
                });
            return;
        }

        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            setLocation('Localhost (Entorno Local)');
            return;
        }

        fetch(`https://ipapi.co/${ip}/json/`)
            .then((res) => res.json())
            .then((data) => {
                if (data.city && data.country_name) {
                    setLocation(`${data.city}, ${data.country_name}`);
                } else {
                    setLocation('Ubicación Desconocida');
                }
            })
            .catch(() => setLocation('Ubicación Desconocida'));
    }, [ip, lat, lng]);

    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            {location}
        </span>
    );
};

export default function SessionMonitoring({ sessions }: PageProps) {
    const getInitials = useInitials();
    const { __ } = useTranslate();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSessions = sessions.filter(s =>
        s.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.user_email && s.user_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.ip_address.includes(searchQuery) ||
        s.browser.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.os.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRevokeSession = (sessionId: string) => {
        Swal.fire({
            title: __('¿Cerrar sesión remota?'),
            text: __('El dispositivo seleccionado perderá acceso inmediatamente y requerirá iniciar sesión de nuevo.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: __('Sí, cerrar sesión'),
            cancelButtonText: __('Cancelar'),
            customClass: {
                confirmButton: 'bg-rose-600 text-white hover:bg-rose-700 font-bold px-4 py-2 rounded-lg',
                cancelButton: 'bg-slate-200 text-slate-800 hover:bg-slate-300 font-medium px-4 py-2 rounded-lg ml-2',
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/monitoring/sessions/${sessionId}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire(__('Sesión revocada'), __('El dispositivo ha sido desconectado correctamente.'), 'success');
                    }
                });
            }
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Seguridad'), href: '#' },
        { title: __('Sesiones Activas'), href: '/admin/monitoring/sessions' }
    ];

    const mobileCount = sessions.filter(s => s.device === 'Mobile').length;
    const desktopCount = sessions.length - mobileCount;

    return (
        <>
            <Head title={__('Control de Sesiones de Usuario')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Banner Principal de Encabezado */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-lg">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 text-indigo-300">
                                    <Shield className="h-6 w-6" />
                                </span>
                                <h1 className="text-2xl font-black tracking-tight">{__('Monitoreo de Sesiones de Usuario')}</h1>
                            </div>
                            <p className="text-sm text-indigo-200/80 max-w-xl">
                                {__('Supervisa y gestiona en tiempo real todos los dispositivos y conexiones activas asociadas a la empresa.')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Métricas Estadísticas (Neutral Cards con iconos en contenedor de color) */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                                <Radio className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{__('Sesiones Conectadas')}</p>
                                <p className="text-2xl font-black">{sessions.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                                <MonitorCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{__('Escritorio')}</p>
                                <p className="text-2xl font-black">{desktopCount}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                                <Smartphone className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{__('Dispositivos Móviles')}</p>
                                <p className="text-2xl font-black">{mobileCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabla y Filtros */}
                <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
                    <CardHeader className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <CardTitle className="text-lg font-bold">{__('Dispositivos y Conexiones Activas')}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">{__('Listado de conexiones actuales en el sistema')}</CardDescription>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={__('Buscar por usuario, IP, navegador...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                <TableRow>
                                    <TableHead className="font-bold text-xs">{__('Usuario')}</TableHead>
                                    <TableHead className="font-bold text-xs">{__('Dispositivo / Sistema')}</TableHead>
                                    <TableHead className="font-bold text-xs">{__('Dirección IP')}</TableHead>
                                    <TableHead className="font-bold text-xs">{__('Ubicación Geográfica')}</TableHead>
                                    <TableHead className="font-bold text-xs">{__('Última Actividad')}</TableHead>
                                    <TableHead className="text-right font-bold text-xs">{__('Acción')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSessions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                                            {__('No se encontraron conexiones activas.')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSessions.map((session) => (
                                        <TableRow key={session.id} className={session.is_current_device ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border border-indigo-200 dark:border-indigo-900">
                                                        <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                                                            {getInitials(session.user_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-bold text-xs text-foreground">{session.user_name}</p>
                                                        <p className="text-[11px] text-muted-foreground">{session.user_email || __('Sin email')}</p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                        {session.device === 'Mobile' ? (
                                                            <Smartphone className="h-4 w-4" />
                                                        ) : (
                                                            <Laptop className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground">
                                                            {session.browser} ({session.os})
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground capitalize">
                                                            {session.device}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <span className="font-mono text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                                                    {session.ip_address}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                <IpLocation ip={session.ip_address} lat={session.latitude} lng={session.longitude} />
                                            </TableCell>

                                            <TableCell>
                                                {session.is_current_device ? (
                                                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm">
                                                        {__('Dispositivo Actual')}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground font-medium">{session.last_active}</span>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                {!session.is_current_device ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 text-xs font-semibold"
                                                        onClick={() => handleRevokeSession(session.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        <span>{__('Cerrar Sesión')}</span>
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2">{__('En Línea')}</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
