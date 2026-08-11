import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { 
    Clock, 
    Calendar, 
    LogIn, 
    LogOut, 
    Utensils, 
    Coffee 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Paginated } from '@/types/app';
import Pagination from '@/components/pagination';

interface Marcaje {
    id: number;
    empleado_id: number;
    tipo_marcaje: 'entrada' | 'salida_comida' | 'entrada_comida' | 'salida';
    fecha_hora: string;
    origen: string;
    fotografia_path?: string | null;
    observaciones?: string | null;
    empleado: {
        id: number;
        nombres: string;
        apellidos: string;
        documento_identidad: string;
        departamento?: { nombre: string };
        cargo?: { nombre: string };
    };
    sucursal?: { nombre: string };
}

interface Props {
    marcajes: Paginated<Marcaje>;
    filters: {
        search?: string;
        tipo_marcaje?: string;
        fecha_inicio?: string;
        fecha_fin?: string;
        perPage?: number;
    };
}

export default function AsistenciaBitacoraIndex({ marcajes, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [tipoMarcaje, setTipoMarcaje] = useState(filters.tipo_marcaje || 'todos');
    const [fechaInicio, setFechaInicio] = useState(filters.fecha_inicio || '');
    const [fechaFin, setFechaFin] = useState(filters.fecha_fin || '');

    const handleFilter = () => {
        router.get('/admin/asistencia/bitacora', {
            search,
            tipo_marcaje: tipoMarcaje !== 'todos' ? tipoMarcaje : undefined,
            fecha_inicio: fechaInicio || undefined,
            fecha_fin: fechaFin || undefined,
        }, { preserveState: true });
    };

    const getBadgeStyle = (tipo: string) => {
        switch (tipo) {
            case 'entrada':
                return { label: 'Entrada', icon: LogIn, class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' };
            case 'salida_comida':
                return { label: 'Salida Comida', icon: Utensils, class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' };
            case 'entrada_comida':
                return { label: 'Regreso Comida', icon: Coffee, class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
            case 'salida':
                return { label: 'Salida Final', icon: LogOut, class: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' };
            default:
                return { label: tipo, icon: Clock, class: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
        }
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Bitácora de Marcajes', href: '/admin/asistencia/bitacora' },
    ];

    return (
        <>
            <Head title="Bitácora de Marcajes - Reloj Checador" />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* ModuleHeader Estándar */}
                <ModuleHeader
                    icon={<Calendar className="h-6 w-6 text-white" />}
                    title="Bitácora de Marcajes"
                    description="Historial y auditoría de eventos de entradas, salidas y descansos en tiempo real."
                    colorClassName="bg-indigo-600"
                />

                {/* FilterBar Estándar */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4 w-full">
                        <FilterField label="Búsqueda">
                            <Input
                                placeholder="Buscar por empleado o documento..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full sm:w-64"
                            />
                        </FilterField>

                        <FilterField label="Tipo de Marcaje">
                            <Select value={tipoMarcaje} onValueChange={setTipoMarcaje}>
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder="Tipo de Marcaje" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los eventos</SelectItem>
                                    <SelectItem value="entrada">Entradas</SelectItem>
                                    <SelectItem value="salida_comida">Salida Comida</SelectItem>
                                    <SelectItem value="entrada_comida">Regreso Comida</SelectItem>
                                    <SelectItem value="salida">Salidas Finales</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Fecha Inicio">
                            <Input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="w-full sm:w-40"
                            />
                        </FilterField>

                        <FilterField label="Fecha Fin">
                            <Input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="w-full sm:w-40"
                            />
                        </FilterField>

                        <Button onClick={handleFilter}>
                            Filtrar
                        </Button>
                    </div>
                </FilterBar>

                {/* Tabla Estándar */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-base font-semibold">
                            Registros Auditados
                        </CardTitle>
                        <Badge variant="outline">
                            Total: {marcajes.total || marcajes.data.length}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-y">
                                    <tr>
                                        <th className="px-4 py-3">Empleado</th>
                                        <th className="px-4 py-3">Tipo de Marcaje</th>
                                        <th className="px-4 py-3">Fecha y Hora</th>
                                        <th className="px-4 py-3">Origen</th>
                                        <th className="px-4 py-3">Sucursal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {marcajes.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                No se encontraron marcajes en la bitácora.
                                            </td>
                                        </tr>
                                    ) : (
                                        marcajes.data.map((m) => {
                                            const badge = getBadgeStyle(m.tipo_marcaje);
                                            const IconComp = badge.icon;
                                            return (
                                                <tr key={m.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold">{m.empleado.nombres} {m.empleado.apellidos}</div>
                                                        <div className="text-xs text-muted-foreground">Doc: {m.empleado.documento_identidad} • {m.empleado.departamento?.nombre || 'General'}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge className={`flex items-center gap-1.5 w-fit ${badge.class}`}>
                                                            <IconComp className="w-3.5 h-3.5" />
                                                            <span>{badge.label}</span>
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono">
                                                        {m.fecha_hora}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className="capitalize">
                                                            {m.origen}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {m.sucursal?.nombre || 'Matriz'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Paginación */}
                {marcajes.links && <Pagination paginatedData={marcajes} />}
            </div>
        </>
    );
}
