import { router } from '@inertiajs/react';
import {
    CheckCircle2,
    Cpu,
    FileSpreadsheet,
    Layers,
    Loader2,
    MapPin,
    RefreshCw,
    Sparkles,
    Upload,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { notifyError, notifySuccess } from '@/utils/notifications';

type ImportScope = 'ambos' | 'ubicaciones' | 'biometricos';

interface PreviewStats {
    total: number;
    nuevos: number;
    actualizar: number;
}

interface PreviewResponse {
    success: boolean;
    message?: string;
    sheets_detected?: {
        ubicaciones?: string;
        biometricos?: string;
    };
    ubicaciones: {
        records: any[];
        stats: PreviewStats;
    };
    biometricos: {
        records: any[];
        stats: PreviewStats;
    };
}

interface EquiposUbicacionesImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultScope?: ImportScope;
}

export default function EquiposUbicacionesImportModal({
    open,
    onOpenChange,
    defaultScope = 'ambos',
}: EquiposUbicacionesImportModalProps) {
    const [scope, setScope] = useState<ImportScope>(defaultScope);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [preview, setPreview] = useState<PreviewResponse | null>(null);
    const [activePreviewTab, setActivePreviewTab] = useState<'ubicaciones' | 'biometricos'>('ubicaciones');

    const handleReset = () => {
        setSelectedFile(null);
        setPreview(null);
        setAnalyzing(false);
        setImporting(false);
    };

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen) {
            handleReset();
        }
        onOpenChange(nextOpen);
    };

    const handleAnalyzeFile = async (fileToAnalyze?: File, scopeToUse?: ImportScope) => {
        const file = fileToAnalyze || selectedFile;
        const currentScope = scopeToUse || scope;

        if (!file) {
            notifyError('Por favor selecciona un archivo Excel (.xlsx).');
            return;
        }

        setAnalyzing(true);
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const formData = new FormData();
            formData.append('file', file);
            formData.append('scope', currentScope);

            const res = await fetch('/admin/asistencia/equipos-ubicaciones/importar/preview', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: formData,
            });

            const json: PreviewResponse = await res.json();
            if (!res.ok || !json.success) {
                notifyError(json.message || 'No se pudo analizar el archivo Excel.');
                setPreview(null);
                return;
            }

            setPreview(json);
            if (json.ubicaciones.stats.total > 0) {
                setActivePreviewTab('ubicaciones');
            } else if (json.biometricos.stats.total > 0) {
                setActivePreviewTab('biometricos');
            }
        } catch {
            notifyError('Ocurrió un error al procesar la vista previa del archivo Excel.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleExecuteImport = async () => {
        if (!selectedFile) return;

        setImporting(true);
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('scope', scope);

            const res = await fetch('/admin/asistencia/equipos-ubicaciones/importar', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: formData,
            });

            const json = await res.json();
            if (!res.ok || !json.success) {
                notifyError(json.message || 'Error durante la importación masiva.');
                return;
            }

            notifySuccess(json.message || 'Importación completada exitosamente.');
            handleClose(false);
            router.reload();
        } catch {
            notifyError('Ocurrió un error de red al ejecutar la importación.');
        } finally {
            setImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-[95vw] sm:max-w-[95vw] lg:max-w-[1100px] max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2.5 text-xl">
                        <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                        Importación Masiva: Equipos Biométricos & Ubicaciones
                    </DialogTitle>
                    <DialogDescription>
                        Sube el <strong>Archivo maestro de Equipos &amp; Ubicaciones.xlsx</strong>. El sistema detectará automáticamente la{' '}
                        <strong>Pestaña 2 (Biométricos setup)</strong> y la <strong>Pestaña 3 (Ubicaciones (2))</strong>, separará los registros hacia cada módulo y los vinculará por su número de localidad (<code>Núm.</code>).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Selector de Modo de Separación */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            1. Selecciona el alcance de importación
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setScope('ambos');
                                    if (selectedFile) handleAnalyzeFile(selectedFile, 'ambos');
                                }}
                                className={cn(
                                    'flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all cursor-pointer',
                                    scope === 'ambos'
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'border-border hover:bg-muted/40'
                                )}
                            >
                                <div className="flex items-center gap-2 font-semibold text-sm">
                                    <Layers className="h-4 w-4 text-primary" />
                                    Ambas Pestañas (Separación Automática)
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Importa y separa simultáneamente <strong>Ubicaciones (2)</strong> y <strong>Biométricos setup</strong>, enlazándolos por <code>Núm.</code>
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setScope('ubicaciones');
                                    if (selectedFile) handleAnalyzeFile(selectedFile, 'ubicaciones');
                                }}
                                className={cn(
                                    'flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all cursor-pointer',
                                    scope === 'ubicaciones'
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'border-border hover:bg-muted/40'
                                )}
                            >
                                <div className="flex items-center gap-2 font-semibold text-sm">
                                    <MapPin className="h-4 w-4 text-indigo-600" />
                                    Solo Pestaña 3: Ubicaciones (2)
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Procesa únicamente el catálogo de plantas, direcciones, estados, ciudades y legacy.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setScope('biometricos');
                                    if (selectedFile) handleAnalyzeFile(selectedFile, 'biometricos');
                                }}
                                className={cn(
                                    'flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all cursor-pointer',
                                    scope === 'biometricos'
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'border-border hover:bg-muted/40'
                                )}
                            >
                                <div className="flex items-center gap-2 font-semibold text-sm">
                                    <Cpu className="h-4 w-4 text-emerald-600" />
                                    Solo Pestaña 2: Biométricos setup
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Procesa únicamente el inventario de equipos actuales y nuevos biométricos.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Zona de Carga de Archivo */}
                    <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-muted/20 p-5">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                    <Upload className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">
                                        {selectedFile ? selectedFile.name : 'Selecciona el Archivo Maestro (.xlsx)'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedFile
                                            ? `Tamaño: ${(selectedFile.size / 1024).toFixed(1)} KB`
                                            : 'Soporta el archivo original "Archivo maestro de Equipos & Ubicaciones.xlsx" sin necesidad de dividirlo.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 cursor-pointer transition">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    {selectedFile ? 'Cambiar archivo' : 'Elegir archivo .xlsx'}
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0] || null;
                                            setSelectedFile(f);
                                            if (f) {
                                                handleAnalyzeFile(f, scope);
                                            }
                                        }}
                                    />
                                </label>

                                {selectedFile && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={analyzing}
                                        onClick={() => handleAnalyzeFile(selectedFile, scope)}
                                    >
                                        {analyzing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Estado de Carga */}
                    {analyzing && (
                        <div className="flex items-center justify-center gap-3 rounded-xl border bg-muted/30 p-8 text-sm text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            Analizando hojas del archivo Excel y separando registros por módulo...
                        </div>
                    )}

                    {/* Vista Previa de Datos Separados */}
                    {preview && !analyzing && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Resumen Módulo Ubicaciones */}
                                <div
                                    onClick={() => preview.ubicaciones.stats.total > 0 && setActivePreviewTab('ubicaciones')}
                                    className={cn(
                                        'rounded-xl border p-4 transition cursor-pointer',
                                        activePreviewTab === 'ubicaciones'
                                            ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                                            : 'border-border bg-card hover:bg-muted/30'
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 font-semibold text-sm">
                                            <MapPin className="h-4 w-4 text-indigo-600" />
                                            Módulo 1: Ubicaciones de Plantas
                                        </div>
                                        {preview.sheets_detected?.ubicaciones && (
                                            <Badge variant="outline" className="text-[11px]">
                                                Hoja: {preview.sheets_detected.ubicaciones}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                        <div className="rounded-lg bg-background p-2 border">
                                            <p className="text-lg font-bold">{preview.ubicaciones.stats.total}</p>
                                            <p className="text-[11px] text-muted-foreground">Detectadas</p>
                                        </div>
                                        <div className="rounded-lg bg-emerald-500/10 p-2 border border-emerald-500/20">
                                            <p className="text-lg font-bold text-emerald-600">{preview.ubicaciones.stats.nuevos}</p>
                                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Nuevas</p>
                                        </div>
                                        <div className="rounded-lg bg-amber-500/10 p-2 border border-amber-500/20">
                                            <p className="text-lg font-bold text-amber-600">{preview.ubicaciones.stats.actualizar}</p>
                                            <p className="text-[11px] text-amber-700 dark:text-amber-400">Actualizar</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Resumen Módulo Biométricos Setup */}
                                <div
                                    onClick={() => preview.biometricos.stats.total > 0 && setActivePreviewTab('biometricos')}
                                    className={cn(
                                        'rounded-xl border p-4 transition cursor-pointer',
                                        activePreviewTab === 'biometricos'
                                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                                            : 'border-border bg-card hover:bg-muted/30'
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 font-semibold text-sm">
                                            <Cpu className="h-4 w-4 text-emerald-600" />
                                            Módulo 2: Biométricos Setup
                                        </div>
                                        {preview.sheets_detected?.biometricos && (
                                            <Badge variant="outline" className="text-[11px]">
                                                Hoja: {preview.sheets_detected.biometricos}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                        <div className="rounded-lg bg-background p-2 border">
                                            <p className="text-lg font-bold">{preview.biometricos.stats.total}</p>
                                            <p className="text-[11px] text-muted-foreground">Detectados</p>
                                        </div>
                                        <div className="rounded-lg bg-emerald-500/10 p-2 border border-emerald-500/20">
                                            <p className="text-lg font-bold text-emerald-600">{preview.biometricos.stats.nuevos}</p>
                                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Nuevos</p>
                                        </div>
                                        <div className="rounded-lg bg-amber-500/10 p-2 border border-amber-500/20">
                                            <p className="text-lg font-bold text-amber-600">{preview.biometricos.stats.actualizar}</p>
                                            <p className="text-[11px] text-amber-700 dark:text-amber-400">Actualizar</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla de Vista Previa según la pestaña activa */}
                            <div className="rounded-xl border overflow-hidden">
                                <div className="flex items-center justify-between bg-muted/50 px-4 py-2.5 border-b">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActivePreviewTab('ubicaciones')}
                                            className={cn(
                                                'px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer',
                                                activePreviewTab === 'ubicaciones'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:bg-muted'
                                            )}
                                        >
                                            Vista Previa Ubicaciones ({preview.ubicaciones.stats.total})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActivePreviewTab('biometricos')}
                                            className={cn(
                                                'px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer',
                                                activePreviewTab === 'biometricos'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:bg-muted'
                                            )}
                                        >
                                            Vista Previa Biométricos Setup ({preview.biometricos.stats.total})
                                        </button>
                                    </div>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                        Separación automática lista
                                    </span>
                                </div>

                                <div className="max-h-[280px] overflow-y-auto">
                                    {activePreviewTab === 'ubicaciones' ? (
                                        <table className="w-full text-xs">
                                            <thead className="bg-muted/30 sticky top-0 border-b">
                                                <tr className="text-left text-muted-foreground">
                                                    <th className="p-2.5 font-semibold">Núm.</th>
                                                    <th className="p-2.5 font-semibold">Planta</th>
                                                    <th className="p-2.5 font-semibold">Estado / Ciudad</th>
                                                    <th className="p-2.5 font-semibold">Legacy</th>
                                                    <th className="p-2.5 font-semibold">Dirección</th>
                                                    <th className="p-2.5 font-semibold text-right">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {preview.ubicaciones.records.slice(0, 60).map((row, i) => (
                                                    <tr key={i} className="hover:bg-muted/20">
                                                        <td className="p-2.5 font-mono font-semibold">{row.numero_localidad ?? '—'}</td>
                                                        <td className="p-2.5 font-medium">{row.planta}</td>
                                                        <td className="p-2.5 text-muted-foreground">
                                                            {[row.ciudad, row.estado].filter(Boolean).join(', ') || '—'}
                                                        </td>
                                                        <td className="p-2.5">
                                                            {row.legacy ? (
                                                                <Badge variant="outline" className="text-[10px]">
                                                                    {row.legacy}
                                                                </Badge>
                                                            ) : (
                                                                '—'
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 max-w-[260px] truncate text-muted-foreground" title={row.direccion || ''}>
                                                            {row.direccion || '—'}
                                                        </td>
                                                        <td className="p-2.5 text-right">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    'text-[10px]',
                                                                    row.action === 'create'
                                                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                                                                        : 'border-amber-500/30 bg-amber-500/10 text-amber-600'
                                                                )}
                                                            >
                                                                {row.action === 'create' ? 'Nuevo' : 'Actualizar'}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="w-full text-xs">
                                            <thead className="bg-muted/30 sticky top-0 border-b">
                                                <tr className="text-left text-muted-foreground">
                                                    <th className="p-2.5 font-semibold">Núm.</th>
                                                    <th className="p-2.5 font-semibold">Localidad</th>
                                                    <th className="p-2.5 font-semibold">Ubicación Física</th>
                                                    <th className="p-2.5 font-semibold">Equipo Actual (Serie / IP)</th>
                                                    <th className="p-2.5 font-semibold">Nuevo Biométrico (Serie / IP)</th>
                                                    <th className="p-2.5 font-semibold text-right">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {preview.biometricos.records.slice(0, 60).map((row, i) => (
                                                    <tr key={i} className="hover:bg-muted/20">
                                                        <td className="p-2.5 font-mono font-semibold">{row.numero_localidad ?? '—'}</td>
                                                        <td className="p-2.5 font-medium">{row.localidad_nombre}</td>
                                                        <td className="p-2.5">{row.ubicacion_fisica || '—'}</td>
                                                        <td className="p-2.5 font-mono text-[11px]">
                                                            {[row.actual_no_serie, row.actual_ip].filter(Boolean).join(' • ') || '—'}
                                                        </td>
                                                        <td className="p-2.5 font-mono text-[11px]">
                                                            {[row.nuevo_no_serie, row.nuevo_ip].filter(Boolean).join(' • ') || 'Pendiente'}
                                                        </td>
                                                        <td className="p-2.5 text-right">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    'text-[10px]',
                                                                    row.action === 'create'
                                                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                                                                        : 'border-amber-500/30 bg-amber-500/10 text-amber-600'
                                                                )}
                                                            >
                                                                {row.action === 'create' ? 'Nuevo' : 'Actualizar'}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        disabled={!preview || importing || analyzing}
                        onClick={handleExecuteImport}
                        className="gap-2"
                    >
                        {importing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Importando y separando datos...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Confirmar e Importar Datos
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

