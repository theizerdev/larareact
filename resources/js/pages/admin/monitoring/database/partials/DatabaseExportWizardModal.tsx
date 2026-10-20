import React, { useState, useMemo, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTranslate } from '@/hooks/use-translate';
import {
    Database,
    Sliders,
    Layers,
    Lock,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Download,
    FileArchive,
    FileText,
    Eye,
    EyeOff,
    Search,
    Check,
    ArrowRight,
    ArrowLeft,
    HardDrive,
    Sparkles,
    Loader2,
    RefreshCw,
} from 'lucide-react';

interface TableInfo {
    name: string;
    rows: number;
    size_mb: number;
}

interface DatabaseExportWizardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tables: TableInfo[];
    totalSizeMb: number;
    totalRows: number;
}

type ExportMode = 'full' | 'structure' | 'data';

export default function DatabaseExportWizardModal({
    open,
    onOpenChange,
    tables = [],
    totalSizeMb,
    totalRows,
}: DatabaseExportWizardModalProps) {
    const { __ } = useTranslate();
    const { auth } = usePage<any>().props;

    // Wizard Step: 1 = Configuración, 2 = Tablas, 3 = Seguridad / Contraseña, 4 = Progreso & Descarga
    const [currentStep, setCurrentStep] = useState<number>(1);

    // Paso 1: Configuración
    const [exportMode, setExportMode] = useState<ExportMode>('full');
    const [compress, setCompress] = useState<boolean>(true);
    const [dropTables, setDropTables] = useState<boolean>(true);
    const [disableFk, setDisableFk] = useState<boolean>(true);
    const [addComments, setAddComments] = useState<boolean>(true);
    const [selectionType, setSelectionType] = useState<'all' | 'custom'>('all');

    // Paso 2: Selección de Tablas
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [tableSearch, setTableSearch] = useState<string>('');

    // Paso 3: Seguridad
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isVerifyingPassword, setIsVerifyingPassword] = useState<boolean>(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isPasswordVerified, setIsPasswordVerified] = useState<boolean>(false);

    // Paso 4: Progreso y Exportación
    const [progress, setProgress] = useState<number>(0);
    const [progressStatus, setProgressStatus] = useState<string>('');
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [generatedFile, setGeneratedFile] = useState<{
        filename: string;
        sizeFormatted: string;
        blobUrl: string | null;
    } | null>(null);

    // Estado local para tablas dinámicas
    const [localTables, setLocalTables] = useState<TableInfo[]>(tables || []);
    const [localTotalSizeMb, setLocalTotalSizeMb] = useState<number>(totalSizeMb || 0);
    const [localTotalRows, setLocalTotalRows] = useState<number>(totalRows || 0);
    const [isLoadingTables, setIsLoadingTables] = useState<boolean>(false);

    // Sincronizar desde props cuando cambien
    useEffect(() => {
        if (tables && tables.length > 0) {
            setLocalTables(tables);
            setLocalTotalSizeMb(totalSizeMb);
            setLocalTotalRows(totalRows);
            setSelectedTables(tables.map((t) => t.name));
        }
    }, [tables, totalSizeMb, totalRows]);

    const effectiveTables = localTables.length > 0 ? localTables : tables;
    const effectiveTotalSizeMb = localTables.length > 0 ? localTotalSizeMb : totalSizeMb;
    const effectiveTotalRows = localTables.length > 0 ? localTotalRows : totalRows;

    // Recargar tablas directamente del backend mediante la ruta /admin/monitoring/database/tables
    const reloadTables = () => {
        setIsLoadingTables(true);
        fetch('/admin/monitoring/database/tables')
            .then((res) => {
                if (!res.ok) throw new Error('Error al consultar tablas');
                return res.json();
            })
            .then((data) => {
                if (data.tables && Array.isArray(data.tables)) {
                    setLocalTables(data.tables);
                    setLocalTotalSizeMb(data.total_size_mb ?? 0);
                    setLocalTotalRows(data.total_rows ?? 0);
                    setSelectedTables(data.tables.map((t: TableInfo) => t.name));
                }
            })
            .catch((err) => {
                console.error('Error cargando tablas de la base de datos:', err);
            })
            .finally(() => {
                setIsLoadingTables(false);
            });
    };

    // Al abrir el modal, si no hay tablas cargadas en memoria, invocar reloadTables automáticamente
    useEffect(() => {
        if (open && effectiveTables.length === 0) {
            reloadTables();
        }
    }, [open, effectiveTables.length]);

    // Resetear formulario al abrir o cerrar
    useEffect(() => {
        if (open) {
            setCurrentStep(1);
            setPassword('');
            setPasswordError(null);
            setIsPasswordVerified(false);
            setProgress(0);
            setProgressStatus('');
            setIsExporting(false);
            setExportError(null);
            setGeneratedFile(null);
            if (effectiveTables.length > 0) {
                setSelectedTables(effectiveTables.map((t) => t.name));
            }
        }
    }, [open]);

    // Tablas filtradas por el buscador del Paso 2
    const filteredTables = useMemo(() => {
        if (!tableSearch.trim()) return effectiveTables;
        const query = tableSearch.toLowerCase().trim();
        return effectiveTables.filter((t) => t.name.toLowerCase().includes(query));
    }, [effectiveTables, tableSearch]);

    // Estadísticas de las tablas seleccionadas
    const selectedStats = useMemo(() => {
        const selectedMap = new Set(selectedTables);
        let rows = 0;
        let size = 0;
        effectiveTables.forEach((t) => {
            if (selectedMap.has(t.name)) {
                rows += t.rows;
                size += t.size_mb;
            }
        });
        return {
            count: selectedTables.length,
            rows,
            sizeMb: Number(size.toFixed(2)),
        };
    }, [effectiveTables, selectedTables]);

    // Toggle individual de tabla
    const handleToggleTable = (tableName: string) => {
        setSelectedTables((prev) => {
            if (prev.includes(tableName)) {
                return prev.filter((t) => t !== tableName);
            } else {
                return [...prev, tableName];
            }
        });
    };

    // Seleccionar todas las tablas
    const handleSelectAll = () => {
        setSelectedTables(effectiveTables.map((t) => t.name));
    };

    // Deseleccionar todas
    const handleDeselectAll = () => {
        setSelectedTables([]);
    };

    // Seleccionar solo tablas que contienen filas (> 0)
    const handleSelectWithDataOnly = () => {
        setSelectedTables(effectiveTables.filter((t) => t.rows > 0).map((t) => t.name));
    };

    // Paso 3: Verificación de Contraseña
    const handleVerifyPassword = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!password.trim()) {
            setPasswordError(__('Por favor ingrese su contraseña para continuar.'));
            return;
        }

        setIsVerifyingPassword(true);
        setPasswordError(null);

        try {
            const res = await fetch('/admin/monitoring/database/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (res.ok && data.valid) {
                setIsPasswordVerified(true);
                // Transición fluida al paso 4
                setTimeout(() => {
                    setCurrentStep(4);
                    startExportProcess();
                }, 400);
            } else {
                setPasswordError(data.message || __('La contraseña ingresada es incorrecta.'));
            }
        } catch (err: any) {
            setPasswordError(__('Error de comunicación al validar contraseña.'));
        } finally {
            setIsVerifyingPassword(false);
        }
    };

    // Paso 4: Ejecución de la exportación con barra de 0 a 100%
    const startExportProcess = async () => {
        setIsExporting(true);
        setProgress(5);
        setProgressStatus(__('Inicializando conexión y preparando parámetros de volcado...'));
        setExportError(null);
        setGeneratedFile(null);

        // Animación progresiva simulada mientras el servidor genera el archivo
        let currentP = 5;
        const progressInterval = setInterval(() => {
            currentP += Math.floor(Math.random() * 8) + 4;
            if (currentP > 88) {
                currentP = 88;
                setProgressStatus(__('Finalizando compresión y preparando archivo de descarga...'));
            } else if (currentP > 60) {
                setProgressStatus(__('Volcando registros, transacciones e índices de las tablas...'));
            } else if (currentP > 30) {
                setProgressStatus(__('Extrayendo esquemas DDL y estructura de las tablas seleccionadas...'));
            } else if (currentP > 15) {
                setProgressStatus(__('Verificando tablas e integridad de datos...'));
            }
            setProgress(currentP);
        }, 220);

        try {
            const res = await fetch('/admin/monitoring/database/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, application/octet-stream',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    password,
                    tables: selectedTables,
                    mode: exportMode,
                    compress,
                    drop_tables: dropTables,
                    disable_fk: disableFk,
                    add_comments: addComments,
                }),
            });

            clearInterval(progressInterval);

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || __('Error en el servidor al exportar la base de datos.'));
            }

            // Obtener nombre del archivo del header Content-Disposition
            let filename = `backup_database_${new Date().toISOString().slice(0, 10)}.sql${compress ? '.gz' : ''}`;
            const disposition = res.headers.get('Content-Disposition');
            if (disposition && disposition.includes('filename=')) {
                const match = disposition.match(/filename="?([^";]+)"?/);
                if (match && match[1]) {
                    filename = match[1];
                }
            }

            // Descargar el archivo Blob
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            // Calcular tamaño legible
            const sizeBytes = blob.size;
            let sizeFormatted = `${sizeBytes} B`;
            if (sizeBytes > 1024 * 1024) {
                sizeFormatted = `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
            } else if (sizeBytes > 1024) {
                sizeFormatted = `${(sizeBytes / 1024).toFixed(2)} KB`;
            }

            setProgress(100);
            setProgressStatus(__('¡Exportación completada exitosamente!'));
            setGeneratedFile({
                filename,
                sizeFormatted,
                blobUrl,
            });

            // Disparar descarga automática en el navegador
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err: any) {
            clearInterval(progressInterval);
            setIsExporting(false);
            setExportError(err.message || __('Ocurrió un error inesperado al procesar la exportación.'));
        } finally {
            setIsExporting(false);
        }
    };

    // Descargar nuevamente si el usuario lo solicita
    const handleDownloadAgain = () => {
        if (generatedFile?.blobUrl) {
            const link = document.createElement('a');
            link.href = generatedFile.blobUrl;
            link.download = generatedFile.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const steps = [
        { id: 1, title: __('Configuración'), desc: __('Modo y formato'), icon: Sliders },
        { id: 2, title: __('Tablas'), desc: __('Selección a exportar'), icon: Layers },
        { id: 3, title: __('Seguridad'), desc: __('Confirmar clave'), icon: Lock },
        { id: 4, title: __('Exportación'), desc: __('Progreso 0-100%'), icon: Download },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[96vw] max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col p-0 overflow-hidden border shadow-2xl">
                {/* Header Institucional del Wizard */}
                <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                <Database className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight">
                                    {__('Asistente de Exportación de Base de Datos')}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    {__('Cree respaldos estructurados, seguros y comprimidos de sus tablas institucionales.')}
                                </DialogDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 font-mono text-xs px-2.5 py-1">
                            <HardDrive className="h-3.5 w-3.5 text-indigo-500" />
                            {effectiveTotalSizeMb} MB • {effectiveTables.length} {__('tablas')}
                        </Badge>
                    </div>

                    {/* Barra de Pasos (1 al 4) */}
                    <div className="grid grid-cols-4 gap-2 pt-4">
                        {steps.map((step) => {
                            const IconComponent = step.icon;
                            const isActive = currentStep === step.id;
                            const isPast = currentStep > step.id;
                            return (
                                <div
                                    key={step.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                        isActive
                                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-500'
                                            : isPast
                                            ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400'
                                            : 'border-border/60 bg-card text-muted-foreground opacity-60'
                                    }`}
                                >
                                    <div
                                        className={`size-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : isPast
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {isPast ? <Check className="size-3.5 stroke-[3]" /> : step.id}
                                    </div>
                                    <div className="min-w-0 hidden sm:block">
                                        <p className="text-xs font-semibold truncate leading-tight">{step.title}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DialogHeader>

                {/* Contenido Dinámico según el Paso Actual */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* ======================================================== */}
                    {/* PASO 1: VISUALIZACIÓN DE TABLAS Y CONFIGURACIÓN COMPLETA */}
                    {/* ======================================================== */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in-50 duration-200">
                            {/* Resumen Global */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3.5 rounded-xl border bg-card flex flex-col justify-between">
                                    <span className="text-xs text-muted-foreground font-medium">{__('Total Tablas')}</span>
                                    <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
                                        {isLoadingTables ? <Loader2 className="h-5 w-5 animate-spin" /> : effectiveTables.length}
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-xl border bg-card flex flex-col justify-between">
                                    <span className="text-xs text-muted-foreground font-medium">{__('Total Filas')}</span>
                                    <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
                                        {isLoadingTables ? <Loader2 className="h-5 w-5 animate-spin" /> : effectiveTotalRows.toLocaleString()}
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-xl border bg-card flex flex-col justify-between">
                                    <span className="text-xs text-muted-foreground font-medium">{__('Tamaño Físico')}</span>
                                    <div className="text-2xl font-bold tracking-tight text-indigo-600 mt-1">
                                        {isLoadingTables ? <Loader2 className="h-5 w-5 animate-spin" /> : `${effectiveTotalSizeMb} MB`}
                                    </div>
                                </div>
                            </div>

                            {/* Modo de Exportación */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {__('1. Tipo de Contenido a Exportar')}
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <Card
                                        onClick={() => setExportMode('full')}
                                        className={`cursor-pointer transition-all border-2 ${
                                            exportMode === 'full'
                                                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm'
                                                : 'hover:border-border/80 border-border/50'
                                        }`}
                                    >
                                        <CardContent className="p-4 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="default" className="bg-emerald-600 text-[10px]">
                                                    {__('Recomendado')}
                                                </Badge>
                                                {exportMode === 'full' && <CheckCircle2 className="size-4 text-indigo-600" />}
                                            </div>
                                            <h4 className="font-semibold text-sm">{__('Completo (DDL + Datos)')}</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {__('Exporta tanto la estructura de tablas como todos los registros existentes.')}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        onClick={() => setExportMode('structure')}
                                        className={`cursor-pointer transition-all border-2 ${
                                            exportMode === 'structure'
                                                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm'
                                                : 'hover:border-border/80 border-border/50'
                                        }`}
                                    >
                                        <CardContent className="p-4 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {__('Solo Esquema')}
                                                </Badge>
                                                {exportMode === 'structure' && <CheckCircle2 className="size-4 text-indigo-600" />}
                                            </div>
                                            <h4 className="font-semibold text-sm">{__('Solo Estructura')}</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {__('Genera únicamente las sentencias CREATE TABLE y esquemas DDL.')}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        onClick={() => setExportMode('data')}
                                        className={`cursor-pointer transition-all border-2 ${
                                            exportMode === 'data'
                                                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm'
                                                : 'hover:border-border/80 border-border/50'
                                        }`}
                                    >
                                        <CardContent className="p-4 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {__('Solo Registros')}
                                                </Badge>
                                                {exportMode === 'data' && <CheckCircle2 className="size-4 text-indigo-600" />}
                                            </div>
                                            <h4 className="font-semibold text-sm">{__('Solo Datos')}</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {__('Genera las sentencias INSERT sin modificar las tablas ya creadas.')}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Formato y Compresión */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {__('2. Formato de Compresión')}
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div
                                        onClick={() => setCompress(true)}
                                        className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                                            compress
                                                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20'
                                                : 'hover:border-border/80 border-border/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
                                                <FileArchive className="size-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm">{__('Gzip Comprimido (.sql.gz)')}</span>
                                                    <Badge variant="default" className="text-[9px] py-0 px-1 bg-emerald-600">
                                                        -85% {__('peso')}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{__('Descarga rápida y optimizada para la nube.')}</p>
                                            </div>
                                        </div>
                                        {compress && <CheckCircle2 className="size-4 text-indigo-600 shrink-0" />}
                                    </div>

                                    <div
                                        onClick={() => setCompress(false)}
                                        className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                                            !compress
                                                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20'
                                                : 'hover:border-border/80 border-border/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                <FileText className="size-5" />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-sm">{__('SQL Plano (.sql)')}</span>
                                                <p className="text-xs text-muted-foreground">{__('Texto legible sin compresión.')}</p>
                                            </div>
                                        </div>
                                        {!compress && <CheckCircle2 className="size-4 text-indigo-600 shrink-0" />}
                                    </div>
                                </div>
                            </div>

                            {/* Opciones Avanzadas */}
                            <div className="space-y-3 pt-2 border-t">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {__('3. Opciones de Integridad y Compatibilidad')}
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/10">
                                        <div className="space-y-0.5 pr-2">
                                            <Label htmlFor="drop_tables" className="text-xs font-semibold cursor-pointer">
                                                {__('DROP TABLE IF EXISTS')}
                                            </Label>
                                            <p className="text-[11px] text-muted-foreground">
                                                {__('Recrea tablas al restaurar.')}
                                            </p>
                                        </div>
                                        <Switch id="drop_tables" checked={dropTables} onCheckedChange={setDropTables} />
                                    </div>

                                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/10">
                                        <div className="space-y-0.5 pr-2">
                                            <Label htmlFor="disable_fk" className="text-xs font-semibold cursor-pointer">
                                                {__('Deshabilitar FOREIGN_KEY_CHECKS')}
                                            </Label>
                                            <p className="text-[11px] text-muted-foreground">
                                                {__('Evita bloqueos de llaves foráneas.')}
                                            </p>
                                        </div>
                                        <Switch id="disable_fk" checked={disableFk} onCheckedChange={setDisableFk} />
                                    </div>

                                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/10">
                                        <div className="space-y-0.5 pr-2">
                                            <Label htmlFor="add_comments" className="text-xs font-semibold cursor-pointer">
                                                {__('Metadatos en Cabecera')}
                                            </Label>
                                            <p className="text-[11px] text-muted-foreground">
                                                {__('Fecha, hora y versión de MySQL.')}
                                            </p>
                                        </div>
                                        <Switch id="add_comments" checked={addComments} onCheckedChange={setAddComments} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* PASO 2: VISUALIZACIÓN DE TABLAS A EXPORTAR               */}
                    {/* ======================================================== */}
                    {currentStep === 2 && (
                        <div className="space-y-4 animate-in fade-in-50 duration-200">
                            {/* Toolbar de Búsqueda y Selección Rápida */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={__('Buscar tabla por nombre...')}
                                        value={tableSearch}
                                        onChange={(e) => setTableSearch(e.target.value)}
                                        className="pl-9 text-xs"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSelectAll}
                                        className="text-xs h-9"
                                    >
                                        {__('Todas')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSelectWithDataOnly}
                                        className="text-xs h-9"
                                    >
                                        {__('Solo con datos')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDeselectAll}
                                        className="text-xs h-9 text-destructive hover:bg-destructive/10"
                                    >
                                        {__('Deseleccionar')}
                                    </Button>
                                </div>
                            </div>

                            {/* Resumen flotante de selección */}
                            <div className="p-3 rounded-xl bg-muted/40 border flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="font-semibold">
                                        {selectedStats.count} / {effectiveTables.length} {__('tablas')}
                                    </Badge>
                                    <span className="text-muted-foreground">•</span>
                                    <span>~{selectedStats.rows.toLocaleString()} {__('filas estimadas')}</span>
                                </div>
                                <div className="font-bold text-indigo-600 dark:text-indigo-400">
                                    ~{selectedStats.sizeMb} MB {__('estimados')}
                                </div>
                            </div>

                            {/* Lista de Tablas con Checkboxes en Grilla de 2 Columnas para pantalla XL */}
                            <div className="border rounded-xl p-3 max-h-[440px] overflow-y-auto bg-card">
                                {isLoadingTables ? (
                                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                        <p className="text-xs font-medium">{__('Consultando catálogo de tablas del motor MySQL...')}</p>
                                    </div>
                                ) : filteredTables.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                        <Database className="h-8 w-8 text-muted-foreground/50" />
                                        <p className="text-xs">{__('No se encontraron tablas disponibles.')}</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={reloadTables}
                                            className="gap-2 text-xs"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                            {__('Reintentar carga de tablas')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                        {filteredTables.map((table) => {
                                            const isChecked = selectedTables.includes(table.name);
                                            return (
                                                <div
                                                    key={table.name}
                                                    onClick={() => handleToggleTable(table.name)}
                                                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                                                        isChecked ? 'bg-indigo-50/40 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800 shadow-xs' : 'hover:bg-muted/40 border-border/60'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={() => handleToggleTable(table.name)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <span className="font-mono text-xs font-semibold text-foreground truncate" title={table.name}>
                                                            {table.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <Badge variant="outline" className="text-[10px] tabular-nums font-mono py-0 px-1.5">
                                                            {table.rows.toLocaleString()} {__('filas')}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-[10px] tabular-nums font-mono py-0 px-1.5 text-indigo-600 dark:text-indigo-300">
                                                            {table.size_mb.toFixed(2)} MB
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {selectedTables.length === 0 && (
                                <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5">
                                    <AlertCircle className="size-4" />
                                    {__('Debe seleccionar al menos una tabla para continuar con la exportación.')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* PASO 3: CONFIRMACIÓN DE SEGURIDAD Y CONTRASEÑA           */}
                    {/* ======================================================== */}
                    {currentStep === 3 && (
                        <div className="space-y-6 max-w-lg mx-auto py-2 animate-in fade-in-50 duration-200">
                            {/* Alerta de Seguridad */}
                            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs">
                                <ShieldCheck className="size-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">{__('Verificación de Seguridad Requerida')}</p>
                                    <p className="mt-1 text-amber-800 dark:text-amber-300 leading-relaxed">
                                        {__('La base de datos institucional contiene datos confidenciales y estratégicos. Para autorizar la exportación, confirme su identidad ingresando su contraseña de acceso actual.')}
                                    </p>
                                </div>
                            </div>

                            {/* Tarjeta del Usuario en Sesión */}
                            <div className="p-3.5 rounded-xl border bg-card flex items-center gap-3.5">
                                <Avatar className="size-11 border">
                                    <AvatarFallback className="bg-indigo-600 text-white font-bold text-sm">
                                        {auth?.user?.name?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm truncate">{auth?.user?.name || __('Usuario Administrador')}</p>
                                    <p className="text-xs text-muted-foreground truncate">{auth?.user?.email || ''}</p>
                                </div>
                            </div>

                            {/* Formulario de Contraseña */}
                            <form onSubmit={handleVerifyPassword} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="auth_password" className="text-xs font-semibold uppercase tracking-wider">
                                        {__('Contraseña del Usuario')}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="auth_password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                setPasswordError(null);
                                            }}
                                            placeholder={__('Ingrese su contraseña actual...')}
                                            className={`pr-10 ${passwordError ? 'border-destructive ring-1 ring-destructive' : ''}`}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {passwordError && (
                                        <p className="text-xs text-destructive font-medium flex items-center gap-1.5 mt-1">
                                            <AlertCircle className="size-3.5" />
                                            {passwordError}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={!password.trim() || isVerifyingPassword}
                                    className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                >
                                    {isVerifyingPassword ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            {__('Verificando credenciales...')}
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="size-4" />
                                            {__('Autorizar y Continuar a Exportación')}
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* PASO 4: BARRA DE PROGRESO DE 0 A 100% Y DESCARGA         */}
                    {/* ======================================================== */}
                    {currentStep === 4 && (
                        <div className="space-y-6 max-w-lg mx-auto py-4 text-center animate-in fade-in-50 duration-200">
                            {/* Progreso en Ejecución */}
                            {isExporting && (
                                <div className="space-y-5">
                                    <div className="relative mx-auto size-20 rounded-full border-4 border-indigo-100 dark:border-indigo-950/40 flex items-center justify-center bg-indigo-50/50 dark:bg-indigo-900/20">
                                        <HardDrive className="size-9 text-indigo-600 animate-pulse" />
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold tracking-tight">
                                            {__('Exportando Base de Datos...')}
                                        </h3>
                                        <p className="text-xs text-muted-foreground min-h-[20px]">
                                            {progressStatus}
                                        </p>
                                    </div>

                                    {/* Barra de 0 a 100% */}
                                    <div className="space-y-1.5">
                                        <Progress value={progress} className="h-3" />
                                        <div className="flex justify-between text-[11px] font-mono font-semibold text-muted-foreground">
                                            <span>{progress}%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error durante la exportación */}
                            {exportError && (
                                <div className="space-y-4 p-5 rounded-2xl border border-destructive/30 bg-destructive/5 text-center">
                                    <div className="size-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
                                        <AlertCircle className="size-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm text-destructive">{__('Error en la Exportación')}</h4>
                                        <p className="text-xs text-muted-foreground">{exportError}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={startExportProcess}
                                        className="gap-2 text-xs"
                                    >
                                        <ArrowRight className="size-3.5" />
                                        {__('Reintentar Exportación')}
                                    </Button>
                                </div>
                            )}

                            {/* Éxito y Descarga Final (100%) */}
                            {!isExporting && generatedFile && (
                                <div className="space-y-5">
                                    <div className="relative mx-auto size-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shadow-inner">
                                        <CheckCircle2 className="size-10 stroke-[2.2]" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
                                            <Sparkles className="size-5 text-amber-500" />
                                            {__('¡Base de Datos Exportada con Éxito!')}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {__('El archivo de respaldo fue generado y su descarga inició automáticamente.')}
                                        </p>
                                    </div>

                                    {/* Tarjeta del Archivo Generado */}
                                    <div className="p-4 rounded-xl border bg-card text-left space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                                                {compress ? <FileArchive className="size-6" /> : <FileText className="size-6" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-mono text-xs font-bold text-foreground truncate" title={generatedFile.filename}>
                                                    {generatedFile.filename}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                                    <span>{selectedTables.length} {__('tablas')}</span>
                                                    <span>•</span>
                                                    <span className="font-semibold text-emerald-600">{generatedFile.sizeFormatted}</span>
                                                    <span>•</span>
                                                    <span>{compress ? 'GZIP' : 'SQL'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleDownloadAgain}
                                            className="w-full sm:w-auto gap-2 text-xs"
                                        >
                                            <Download className="size-4" />
                                            {__('Descargar archivo nuevamente')}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => onOpenChange(false)}
                                            className="w-full sm:w-auto text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            {__('Finalizar y Cerrar')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer de Navegación entre Pasos */}
                <div className="p-4 border-t bg-muted/20 flex items-center justify-between gap-3">
                    <div>
                        {currentStep > 1 && currentStep < 4 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentStep((prev) => prev - 1)}
                                className="gap-1.5 text-xs"
                            >
                                <ArrowLeft className="size-3.5" />
                                {__('Atrás')}
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {currentStep === 1 && (
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setCurrentStep(2)}
                                className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {__('Continuar a Selección de Tablas')}
                                <ArrowRight className="size-3.5" />
                            </Button>
                        )}

                        {currentStep === 2 && (
                            <Button
                                type="button"
                                size="sm"
                                disabled={selectedTables.length === 0}
                                onClick={() => setCurrentStep(3)}
                                className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {__('Continuar a Verificación')}
                                <ArrowRight className="size-3.5" />
                            </Button>
                        )}

                        {currentStep === 4 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                className="text-xs"
                            >
                                {__('Cerrar')}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
