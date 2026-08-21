import { Head, router } from '@inertiajs/react';
import { Shield, Laptop, Smartphone, Globe, Trash2, Key, HelpCircle, MapPin } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInitials } from '@/hooks/use-initials';
import { useTranslate } from '@/hooks/use-translate';

interface SessionItem {
    id: string;
    user_id: number | null;
    user_name: string;
    user_email: string | null;
    ip_address: string;
    location: string;
    os: string;
    browser: string;
    device: string;
    last_active: string;
    is_current_device: boolean;
}

interface PageProps {
    sessions: SessionItem[];
}

// Sub-componente para resolver la ubicación IP de forma asíncrona y segura (sin bloquear el backend)
const IpLocation: React.FC<{ ip: string; defaultLocation: string }> = ({ ip, defaultLocation }) => {
    const [location, setLocation] = useState(defaultLocation);

    useEffect(() => {
        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            return;
        }

        // Consultar API de geolocalización IP gratuita
        fetch(`https://ipapi.co/${ip}/json/`)
            .then((res) => res.json())
            .then((data) => {
                if (data.city && data.country_name) {
                    setLocation(`${data.city}, ${data.country_name} ${data.country_code === 'US' ? '🇺🇸' : data.country_code === 'ES' ? '🇪🇸' : data.country_code === 'VE' ? '🇻🇪' : '🌐'}`);
                }
            })
            .catch(() => {
                // Fallback silencioso a la ubicación por defecto en caso de error o límite de cuota
            });
    }, [ip]);

    return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {location}
        </span>
    );
};

export default function SessionMonitoring({ sessions }: PageProps) {
    const getInitials = useInitials();
    const { __ } = useTranslate();

    const handleRevokeSession = (sessionId: string) => {
        Swal.fire({
            title: __('Are you sure?'),
            text: __('This device session will be logged out immediately.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: __('Yes, log out'),
            cancelButtonText: __('Cancel'),
            customClass: {
                confirmButton: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/monitoring/sessions/${sessionId}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire(__('Session revoked'), __('The device has been disconnected.'), 'success');
                    }
                });
            }
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Monitoring'), href: '#' },
        { title: __('User Sessions'), href: '/admin/monitoring/sessions' }
    ];

    return (
        <>
            <Head title={__('User Sessions')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Shield className="h-8 w-8 text-indigo-600" />
                            {__('User Sessions Monitoring')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Manage and monitor active devices and locations with access to the platform.')}
                        </p>
                    </div>
                </div>

                {/* Info Card al estilo Jetstream */}
                <Card className="shadow-sm border-l-4 border-l-indigo-600">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Key className="h-5 w-5 text-indigo-500" />
                            {__('Account Security')}
                        </CardTitle>
                        <CardDescription>
                            {__('If necessary, you may log out of your other browser sessions across all of your devices. If you suspect an unauthorized access, you should change your password immediately.')}
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Lista de Sesiones */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>{__('Active Sessions')} ({sessions.length})</CardTitle>
                        <CardDescription>{__('A list of browsers and operating systems connected recently.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{__('User')}</TableHead>
                                    <TableHead>{__('Device / Browser')}</TableHead>
                                    <TableHead>{__('IP Address')}</TableHead>
                                    <TableHead>{__('Location')}</TableHead>
                                    <TableHead>{__('Last Activity')}</TableHead>
                                    <TableHead className="text-right">{__('Action')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.map((session) => (
                                    <TableRow key={session.id} className={session.is_current_device ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}>
                                        {/* Usuario */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                                        {getInitials(session.user_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-sm">{session.user_name}</p>
                                                    <p className="text-xs text-muted-foreground">{session.user_email || __('Not available')}</p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Dispositivo / Browser */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {session.device === 'Mobile' ? (
                                                    <Smartphone className="h-5 w-5 text-slate-500 shrink-0" />
                                                ) : (
                                                    <Laptop className="h-5 w-5 text-slate-500 shrink-0" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {session.browser} en {session.os}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {session.device}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* IP */}
                                        <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">
                                            {session.ip_address}
                                        </TableCell>

                                        {/* Ubicación */}
                                        <TableCell>
                                            <IpLocation ip={session.ip_address} defaultLocation={session.location} />
                                        </TableCell>

                                        {/* Última Actividad */}
                                        <TableCell>
                                            {session.is_current_device ? (
                                                <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-[10px] px-1.5 py-0">
                                                    {__('Current Device')}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">{session.last_active}</span>
                                            )}
                                        </TableCell>

                                        {/* Acciones */}
                                        <TableCell className="text-right">
                                            {!session.is_current_device ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                    onClick={() => handleRevokeSession(session.id)}
                                                    title={__('Log out remotely')}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic px-2">{__('Active')}</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
