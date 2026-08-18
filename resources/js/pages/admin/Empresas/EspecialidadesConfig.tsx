import { Head, useForm } from '@inertiajs/react';
import {
    Stethoscope,
    Eye,
    Smile,
    PawPrint,
    Heart,
    Check,
    Star,
    Save,
    Building2,
    Sparkles,
    Search,
    CheckSquare,
    Square,
    FileText,
    Clock,
    DollarSign,
    Layers,
    Info,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PlantillaCampo {
    id: string;
    label: string;
    type: string;
    required?: boolean;
    options?: string[];
    fields?: { id: string; label: string; type: string }[];
}

interface Plantilla {
    id: number;
    nombre: string;
    descripcion: string | null;
    estructura_json: PlantillaCampo[];
}

interface Especialidad {
    id: number;
    nombre: string;
    slug: string;
    codigo: string | null;
    icono: string | null;
    color: string | null;
    descripcion: string | null;
    costo_consulta_sugerido: string;
    duracion_consulta_minutos: number;
    plantillas?: Plantilla[];
}

interface RamaMedica {
    id: number;
    nombre: string;
    slug: string;
    icono: string | null;
    descripcion: string | null;
    especialidades: Especialidad[];
}

interface Empresa {
    id: number;
    razon_social: string;
    nombre_comercial: string | null;
}

interface Props {
    empresa: Empresa;
    ramas: RamaMedica[];
    especialidadesSeleccionadas: number[];
    principalId: number | null;
}

interface FormData {
    especialidades: number[];
    especialidad_principal_id: number | null;
}

export default function EspecialidadesConfig({
    empresa,
    ramas,
    especialidadesSeleccionadas = [],
    principalId = null,
}: Props) {
    const [selectedBranch, setSelectedBranch] = useState<string>(ramas[0]?.slug || 'medicina-humana');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [previewEspecialidad, setPreviewEspecialidad] = useState<Especialidad | null>(null);

    const { data, setData, put, processing, isDirty } = useForm<FormData>({
        especialidades: especialidadesSeleccionadas,
        especialidad_principal_id: principalId || (especialidadesSeleccionadas[0] ?? null),
    });

    useEffect(() => {
        setData({
            especialidades: especialidadesSeleccionadas,
            especialidad_principal_id: principalId || (especialidadesSeleccionadas[0] ?? null),
        });
    }, [especialidadesSeleccionadas, principalId]);

    // Todas las especialidades aplanadas para búsqueda global
    const todasLasEspecialidades = useMemo(() => {
        return ramas.flatMap((r) => r.especialidades);
    }, [ramas]);

    const especialidadPrincipalObjeto = useMemo(() => {
        return todasLasEspecialidades.find((e) => e.id === data.especialidad_principal_id);
    }, [todasLasEspecialidades, data.especialidad_principal_id]);

    const toggleEspecialidad = (id: number) => {
        const current = [...data.especialidades];
        const index = current.indexOf(id);

        if (index > -1) {
            const updated = current.filter((item) => item !== id);
            const newPrincipal =
                data.especialidad_principal_id === id ? updated[0] || null : data.especialidad_principal_id;
            setData({
                especialidades: updated,
                especialidad_principal_id: newPrincipal,
            });
        } else {
            const updated = [...current, id];
            const newPrincipal = data.especialidad_principal_id || id;
            setData({
                especialidades: updated,
                especialidad_principal_id: newPrincipal,
            });
        }
    };

    const toggleRamaCompleta = (rama: RamaMedica) => {
        const idsRama = rama.especialidades.map((e) => e.id);
        const todasSeleccionadas = idsRama.every((id) => data.especialidades.includes(id));

        if (todasSeleccionadas) {
            // Deseleccionar todas de esta rama
            const updated = data.especialidades.filter((id) => !idsRama.includes(id));
            const newPrincipal = updated.includes(data.especialidad_principal_id || -1)
                ? data.especialidad_principal_id
                : updated[0] || null;
            setData({
                especialidades: updated,
                especialidad_principal_id: newPrincipal,
            });
        } else {
            // Seleccionar todas de esta rama
            const setUnico = new Set([...data.especialidades, ...idsRama]);
            const updated = Array.from(setUnico);
            const newPrincipal = data.especialidad_principal_id || updated[0] || null;
            setData({
                especialidades: updated,
                especialidad_principal_id: newPrincipal,
            });
        }
    };

    const setPrincipal = (id: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        if (!data.especialidades.includes(id)) {
            setData({
                especialidades: [...data.especialidades, id],
                especialidad_principal_id: id,
            });
        } else {
            setData('especialidad_principal_id', id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/empresas/${empresa.id}/especialidades`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Configuración adaptativa guardada con éxito.');
            },
            onError: () => {
                toast.error('Ocurrió un problema al guardar la configuración.');
            },
        });
    };

    const getBranchIcon = (iconName: string | null) => {
        switch (iconName) {
            case 'Stethoscope':
                return <Stethoscope className="size-5" />;
            case 'Eye':
                return <Eye className="size-5" />;
            case 'Smile':
                return <Smile className="size-5" />;
            case 'PawPrint':
                return <PawPrint className="size-5" />;
            case 'Heart':
                return <Heart className="size-5" />;
            default:
                return <Stethoscope className="size-5" />;
        }
    };

    const breadcrumbs = [
        { title: 'Empresas', href: '/admin/empresas' },
        { title: empresa.razon_social, href: `/admin/empresas/${empresa.id}/especialidades` },
        { title: 'Configuración Adaptativa de Especialidades', href: '#' },
    ];

    return (
        <>
            <Head title={`Configuración Adaptativa - ${empresa.razon_social}`} />

            <div className="space-y-6 pb-12">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    title="Configuración Adaptativa de Rama Médica y Especialidades"
                    description={`Personaliza el ecosistema clínico de ${empresa.razon_social}. El sistema adaptará automáticamente los formularios, expedientes, odontogramas y recetas según las especialidades activas.`}
                    icon={<Sparkles className="size-6 text-white" />}
                />

                {/* Tarjetas de Resumen Superior */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary/20 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                                Total Especialidades Activas
                                <Layers className="size-4 text-primary" />
                            </CardDescription>
                            <CardTitle className="text-3xl font-extrabold text-foreground flex items-baseline gap-2">
                                {data.especialidades.length}
                                <span className="text-xs font-normal text-muted-foreground">
                                    de {todasLasEspecialidades.length} disponibles
                                </span>
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/20 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                                Especialidad Principal
                                <Star className="size-4 text-amber-500 fill-amber-500" />
                            </CardDescription>
                            <CardTitle className="text-lg font-bold text-foreground truncate">
                                {especialidadPrincipalObjeto ? (
                                    <span className="flex items-center gap-2">
                                        <span
                                            className="size-2.5 rounded-full"
                                            style={{ backgroundColor: especialidadPrincipalObjeto.color || '#f59e0b' }}
                                        />
                                        {especialidadPrincipalObjeto.nombre}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground text-sm font-normal">No seleccionada</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-500/10 via-card to-card border-emerald-500/20 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                                Estado de Adaptación
                                <Sparkles className="size-4 text-emerald-500" />
                            </CardDescription>
                            <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                                    Plantillas Automáticas Listas
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-none bg-card shadow-xs">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b-0">

                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                                    <Building2 className="size-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">
                                        {empresa.razon_social}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Selecciona las especialidades médicas para activar sus plantillas dinámicas de expediente.
                                    </CardDescription>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Buscar especialidad..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 h-9 text-xs border-muted/60"
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                <Button type="submit" disabled={processing} className="gap-2 shrink-0">
                                    <Save className="size-4" />
                                    {processing ? 'Guardando...' : 'Guardar Configuración'}
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <Tabs value={selectedBranch} onValueChange={setSelectedBranch} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1.5 bg-muted/60 rounded-xl gap-1">
                                    {ramas.map((rama) => (
                                        <TabsTrigger
                                            key={rama.slug}
                                            value={rama.slug}
                                            className="flex items-center gap-2 py-2.5 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                        >
                                            {getBranchIcon(rama.icono)}
                                            <span className="truncate">{rama.nombre}</span>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {ramas.map((rama) => {
                                    const especialidadesFiltradas = rama.especialidades.filter((esp) => {
                                        if (!searchTerm) return true;
                                        const term = searchTerm.toLowerCase();
                                        return (
                                            esp.nombre.toLowerCase().includes(term) ||
                                            (esp.codigo && esp.codigo.toLowerCase().includes(term)) ||
                                            (esp.descripcion && esp.descripcion.toLowerCase().includes(term))
                                        );
                                    });

                                    const idsRama = rama.especialidades.map((e) => e.id);
                                    const todasSeleccionadas = idsRama.every((id) => data.especialidades.includes(id));

                                    return (
                                        <TabsContent key={rama.slug} value={rama.slug} className="mt-6 space-y-4">
                                            <div className="p-4 rounded-2xl bg-muted/20 border-0 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                                                        {getBranchIcon(rama.icono)}
                                                        {rama.nombre}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {rama.descripcion}
                                                    </p>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => toggleRamaCompleta(rama)}
                                                    className="h-8 text-xs gap-1.5 shrink-0 bg-background border-muted/60"
                                                >
                                                    {todasSeleccionadas ? (
                                                        <>
                                                            <Square className="size-3.5" />
                                                            Deseleccionar todas ({rama.especialidades.length})
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckSquare className="size-3.5" />
                                                            Seleccionar todas ({rama.especialidades.length})
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            {especialidadesFiltradas.length === 0 ? (
                                                <div className="py-12 text-center text-muted-foreground text-sm">
                                                    No se encontraron especialidades que coincidan con &quot;{searchTerm}&quot;.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                                    {especialidadesFiltradas.map((esp) => {
                                                        const isSelected = data.especialidades.includes(esp.id);
                                                        const isPrincipal = data.especialidad_principal_id === esp.id;

                                                        return (
                                                            <div
                                                                key={esp.id}
                                                                className={`group relative rounded-3xl border p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden ${
                                                                    isSelected
                                                                        ? 'border-primary/60 bg-gradient-to-br from-primary/10 via-primary/5 to-card shadow-md ring-2 ring-primary/20 scale-[1.01]'
                                                                        : 'border-muted/30 bg-card hover:border-primary/40 hover:shadow-md'
                                                                }`}
                                                                onClick={() => toggleEspecialidad(esp.id)}
                                                            >

                                                                {/* Indicador de Selección / Principal */}
                                                                {isPrincipal && (
                                                                    <div className="absolute -right-12 top-4 bg-amber-500 text-white text-[9px] font-extrabold uppercase px-12 py-0.5 rotate-45 shadow-sm">
                                                                        Principal
                                                                    </div>
                                                                )}

                                                                <div className="space-y-3">
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <div
                                                                                className="size-10 rounded-2xl flex items-center justify-center text-white shadow-md font-bold text-sm shrink-0"
                                                                                style={{ backgroundColor: esp.color || '#3b82f6' }}
                                                                            >
                                                                                {esp.nombre.substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-extrabold text-sm text-foreground block leading-tight group-hover:text-primary transition-colors">
                                                                                    {esp.nombre}
                                                                                </span>
                                                                                {esp.codigo && (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="text-[10px] px-2 py-0 mt-1 font-mono text-muted-foreground bg-muted/30"
                                                                                    >
                                                                                        {esp.codigo}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div
                                                                            className={`size-6 rounded-xl flex items-center justify-center border-2 transition-all shrink-0 ${
                                                                                isSelected
                                                                                    ? 'bg-primary border-primary text-primary-foreground shadow-md scale-105'
                                                                                    : 'border-muted-foreground/30 bg-background group-hover:border-primary/50'
                                                                            }`}
                                                                        >
                                                                            {isSelected && <Check className="size-4 stroke-[3]" />}
                                                                        </div>
                                                                    </div>

                                                                    {esp.descripcion && (
                                                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                                                                            {esp.descripcion}
                                                                        </p>
                                                                    )}

                                                                    {/* Atributos: Duración y Costo */}
                                                                    <div className="flex items-center gap-2 pt-1">
                                                                        <Badge variant="secondary" className="text-[10px] font-semibold gap-1 bg-muted/60">
                                                                            <Clock className="size-3 text-primary" />
                                                                            {esp.duracion_consulta_minutos} min
                                                                        </Badge>
                                                                        <Badge variant="secondary" className="text-[10px] font-semibold gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                                                                            <DollarSign className="size-3 text-emerald-500" />
                                                                            ${esp.costo_consulta_sugerido}
                                                                        </Badge>
                                                                    </div>
                                                                </div>

                                                                {/* Footer con Botones de Acción */}
                                                                <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                                                                    <a
                                                                        href={`/admin/plantillas-preconsulta?especialidad_id=${esp.id}`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="inline-flex items-center gap-1.5 h-8 text-xs px-3 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/15 hover:bg-emerald-500/25 rounded-xl transition-all border border-emerald-500/30 shadow-xs hover:scale-105"
                                                                        title="Configurar Cuestionario de Pre-Consulta"
                                                                    >
                                                                        <FileText className="size-3.5 text-emerald-600" />
                                                                        Pre-Consulta
                                                                    </a>

                                                                    <div className="flex items-center gap-1.5">
                                                                        {esp.plantillas && esp.plantillas.length > 0 && (
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="h-8 text-xs px-2.5 text-muted-foreground hover:text-foreground gap-1 rounded-xl"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setPreviewEspecialidad(esp);
                                                                                }}
                                                                                title="Ver plantilla médica pre-cargada"
                                                                            >
                                                                                <FileText className="size-3.5" />
                                                                                Ficha
                                                                            </Button>
                                                                        )}

                                                                        {isSelected && (
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                variant={isPrincipal ? 'default' : 'outline'}
                                                                                className={`h-8 text-xs gap-1 px-3 rounded-xl transition-all ${
                                                                                    isPrincipal
                                                                                        ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 font-bold shadow-sm'
                                                                                        : 'hover:border-amber-500/50 hover:text-amber-600'
                                                                                }`}
                                                                                onClick={(e) => setPrincipal(esp.id, e)}
                                                                            >
                                                                                <Star
                                                                                    className={`size-3.5 ${
                                                                                        isPrincipal ? 'fill-white' : ''
                                                                                    }`}
                                                                                />
                                                                                {isPrincipal ? 'Principal' : 'Marcar Principal'}
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                            )}
                                        </TabsContent>
                                    );
                                })}
                            </Tabs>
                        </CardContent>
                    </Card>
                </form>
            </div>

            {/* Modal de Vista Previa de Plantilla de Expediente */}
            <Dialog open={!!previewEspecialidad} onOpenChange={() => setPreviewEspecialidad(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <FileText className="size-5 text-primary" />
                            Plantilla de Consulta - {previewEspecialidad?.nombre}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Campos y secciones pre-configuradas que se cargarán automáticamente al atender una consulta de {previewEspecialidad?.nombre}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {previewEspecialidad?.plantillas && previewEspecialidad.plantillas.length > 0 ? (
                            previewEspecialidad.plantillas.map((p) => (
                                <div key={p.id} className="space-y-3">
                                    <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                                        <p className="font-semibold text-xs text-foreground">{p.nombre}</p>
                                        {p.descripcion && (
                                            <p className="text-[11px] text-muted-foreground mt-0.5">{p.descripcion}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                        {p.estructura_json?.map((campo) => (
                                            <div
                                                key={campo.id}
                                                className="p-3 rounded-lg border border-border/60 bg-card text-xs space-y-1.5"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-foreground">{campo.label}</span>
                                                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                                        {campo.type}
                                                    </Badge>
                                                </div>

                                                {campo.options && (
                                                    <div className="flex flex-wrap gap-1 pt-1">
                                                        {campo.options.map((opt) => (
                                                            <Badge key={opt} variant="secondary" className="text-[10px] font-normal">
                                                                {opt}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}

                                                {campo.fields && (
                                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/30">
                                                        {campo.fields.map((sub) => (
                                                            <div key={sub.id} className="p-1.5 rounded bg-muted/40 text-[11px]">
                                                                <span className="text-muted-foreground">{sub.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-xs text-muted-foreground">
                                No hay campos personalizados en esta plantilla.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
