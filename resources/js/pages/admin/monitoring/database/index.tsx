import { Head } from '@inertiajs/react';
import { Database, Activity, HardDrive, Hash, ShieldAlert, Cpu, RefreshCw, Layers, Download, Check, Eye, KeyRound, Loader2, ArrowRight, ArrowLeft, DatabaseZap, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';

interface TableInfo {
    name: string;
    rows: number;
    size_mb: number;
}

interface DbInfo {
    connection: string;
    driver: string;
    version: string;
    total_tables: number;
    total_size_mb: number;
    total_rows: number;
    tables: TableInfo[];
}

interface PageProps {
    dbInfo: DbInfo;
}

// COMPONENTE WIZARD EN MODAL DIALOG
const ExportWizardModal: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void; dbInfo: DbInfo }> = ({ open, onOpenChange, dbInfo }) => {
    const { __ } = useTranslate();
    const [step, setStep] = useState<number>(1);

    // Configuración Paso 1
    const [includeStructure, setIncludeStructure] = useState<boolean>(true);
    const [includeData, setIncludeData] = useState<boolean>(true);
    const [addDropTable, setAddDropTable] = useState<boolean>(true);
    const [ifNotExists, setIfNotExists] = useState<boolean>(true);

    // Datos Vista Previa Paso 2
    const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
    const [previewTables, setPreviewTables] = useState<any[]>([]);
    const [totalPreviewRows, setTotalPreviewRows] = useState<number>(0);

    // Contraseña Paso 3
    const [password, setPassword] = useState<string>('');
    const [verifyingPassword, setVerifyingPassword] = useState<boolean>(false);
    const [passwordError, setPasswordError] = useState<string>('');

    // Progreso Paso 4
    const [exportProgress, setExportProgress] = useState<number>(0);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [exportFinished, setExportFinished] = useState<boolean>(false);
    const [currentStepText, setCurrentStepText] = useState<string>('Iniciando proceso...');

    const handleNextToStep2 = () => {
        setLoadingPreview(true);
        setStep(2);
        fetch('/admin/monitoring/database/export/preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setPreviewTables(data.tables || []);
                setTotalPreviewRows(data.total_rows || 0);
            })
            .catch(() => {
                Swal.fire(__('Error'), __('No se pudo cargar la vista previa.'), 'error');
            })
            .finally(() => setLoadingPreview(false));
    };

    const handleVerifyPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setPasswordError(__('Ingresa tu contraseña para continuar.'));
            return;
        }

        setVerifyingPassword(true);
        setPasswordError('');

        fetch('/admin/monitoring/database/export/confirm-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
            },
            body: JSON.stringify({ password }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || __('Contraseña incorrecta'));
                }
                return res.json();
            })
            .then(() => {
                setStep(4);
                startProgressExport();
            })
            .catch((err) => {
                setPasswordError(err.message);
            })
            .finally(() => setVerifyingPassword(false));
    };

    const startProgressExport = () => {
        setIsExporting(true);
        setExportProgress(0);
        setExportFinished(false);

        let progress = 0;
        const interval = setInterval(() => {
            progress += 1;
            setExportProgress(progress);

            if (progress < 25) {
                setCurrentStepText(__('Preparando esquema y tablas de la empresa...'));
            } else if (progress < 60) {
                setCurrentStepText(__('Exportando registros e índices estructurados...'));
            } else if (progress < 90) {
                setCurrentStepText(__('Empaquetando sentencias SQL y verificando integridad...'));
            } else {
                setCurrentStepText(__('Finalizando archivo para descarga...'));
            }

            if (progress >= 100) {
                clearInterval(interval);
                setIsExporting(false);
                setExportFinished(true);
                triggerDownload();
            }
        }, 35);
    };

    const triggerDownload = () => {
        fetch('/admin/monitoring/database/export/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
            },
            body: JSON.stringify({
                password,
                include_structure: includeStructure,
                include_data: includeData,
                add_drop_table: addDropTable,
                if_not_exists: ifNotExists,
            }),
        })
            .then((res) => res.blob())
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup_empresa_${new Date().toISOString().slice(0, 10)}.sql`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);

                Swal.fire({
                    title: __('Exportación Exitosa'),
                    text: __('El archivo SQL de tu empresa ha sido generado y descargado correctamente.'),
                    icon: 'success',
                    confirmButtonText: __('Aceptar'),
                });
            })
            .catch(() => {
                Swal.fire(__('Error'), __('Ocurrió un problema al descargar el archivo SQL.'), 'error');
            });
    };

    const resetWizard = () => {
        setStep(1);
        setPassword('');
        setExportProgress(0);
        setExportFinished(false);
        setIsExporting(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl md:max-w-5xl w-[95vw] p-0 overflow-hidden rounded-2xl max-h-[90vh] flex flex-col">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-6 text-white flex items-center justify-between shrink-0">
                    <div className="space-y-0.5">
                        <DialogTitle className="text-xl font-extrabold text-white flex items-center gap-2">
                            <DatabaseZap className="h-6 w-6" />
                            {__('Exportar Base de Datos de la Empresa')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-blue-100">
                            {__('Genera un respaldo exclusivo con los datos de tu empresa.')}
                        </DialogDescription>
                    </div>
                </div>

                {/* Stepper de 4 Pasos */}
                <div className="p-4 border-b bg-slate-50/60 dark:bg-slate-900/40 shrink-0">
                    <div className="grid grid-cols-4 gap-2 text-center max-w-2xl mx-auto">
                        {[
                            { num: 1, label: __('Opciones') },
                            { num: 2, label: __('Vista previa') },
                            { num: 3, label: __('Confirmación') },
                            { num: 4, label: __('Progreso') },
                        ].map((s) => (
                            <div key={s.num} className="flex flex-col items-center">
                                <div
                                    className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                        step === s.num
                                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40 scale-105'
                                            : step > s.num
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                    }`}
                                >
                                    {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                                </div>
                                <span className={`text-[11px] font-semibold mt-1 ${step === s.num ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* PASO 1 */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-1 border-b pb-3">
                                <h3 className="font-bold text-base flex items-center gap-2">
                                    <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
                                    {__('Configuración de Exportación')}
                                </h3>
                                <p className="text-xs text-muted-foreground">{__('Selecciona la estructura y opciones para el respaldo.')}</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 border rounded-xl flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                    <Checkbox id="inc_struct" checked={includeStructure} onCheckedChange={(v) => setIncludeStructure(!!v)} className="mt-0.5" />
                                    <div>
                                        <Label htmlFor="inc_struct" className="font-bold text-sm cursor-pointer">{__('Incluir estructura')}</Label>
                                        <p className="text-xs text-muted-foreground mt-0.5">{__('CREATE TABLE statements completas.')}</p>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-xl flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                    <Checkbox id="inc_data" checked={includeData} onCheckedChange={(v) => setIncludeData(!!v)} className="mt-0.5" />
                                    <div>
                                        <Label htmlFor="inc_data" className="font-bold text-sm cursor-pointer">{__('Incluir datos')}</Label>
                                        <p className="text-xs text-muted-foreground mt-0.5">{__('INSERT statements con todos los registros.')}</p>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-xl flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                    <Checkbox id="drop_table" checked={addDropTable} onCheckedChange={(v) => setAddDropTable(!!v)} className="mt-0.5" />
                                    <div>
                                        <Label htmlFor="drop_table" className="font-bold text-sm cursor-pointer">{__('Agregar DROP TABLE')}</Label>
                                        <p className="text-xs text-muted-foreground mt-0.5">{__('Eliminar tablas antes de crearlas.')}</p>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-xl flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                    <Checkbox id="if_not_exists" checked={ifNotExists} onCheckedChange={(v) => setIfNotExists(!!v)} className="mt-0.5" />
                                    <div>
                                        <Label htmlFor="if_not_exists" className="font-bold text-sm cursor-pointer">{__('IF NOT EXISTS')}</Label>
                                        <p className="text-xs text-muted-foreground mt-0.5">{__('Crear solo si la tabla no existe.')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <span className="text-xs text-muted-foreground">
                                    {__('Se exportarán')} <b className="text-foreground">{dbInfo.total_tables}</b> {__('tablas de tu empresa.')}
                                </span>
                                <Button onClick={handleNextToStep2} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold text-xs px-5">
                                    <span>{__('Siguiente')}</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* PASO 2 */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-1 border-b pb-3 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-base flex items-center gap-2">
                                        <Eye className="h-5 w-5 text-indigo-500" />
                                        {__('Vista Previa de Datos')}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">{__('Inspecciona los registros pertenecientes a tu empresa.')}</p>
                                </div>
                                <Badge variant="secondary" className="font-mono text-xs px-3 py-1">
                                    {totalPreviewRows.toLocaleString()} {__('registros')}
                                </Badge>
                            </div>

                            {loadingPreview ? (
                                <div className="py-12 text-center space-y-3">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                                    <p className="text-xs font-semibold text-muted-foreground">{__('Cargando vista previa del respaldo...')}</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                                    {previewTables.map((t, idx) => (
                                        <div key={idx} className="border rounded-xl p-4 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                                    <Layers className="h-4 w-4" />
                                                    {t.table}
                                                </span>
                                                <Badge variant="outline" className="text-[11px] font-medium">
                                                    {t.rows_count} {__('filas')} {t.is_tenant_filtered && `(${__('Filtrado por Empresa')})`}
                                                </Badge>
                                            </div>

                                            {t.sample_records && t.sample_records.length > 0 ? (
                                                <div className="bg-white dark:bg-slate-900 rounded-lg border overflow-x-auto">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="bg-slate-100 dark:bg-slate-800/80 text-muted-foreground font-semibold border-b text-[11px]">
                                                            <tr>
                                                                {Object.keys(t.sample_records[0]).slice(0, 6).map((colKey) => (
                                                                    <th key={colKey} className="px-3 py-2 font-mono truncate max-w-[150px]">
                                                                        {colKey}
                                                                    </th>
                                                                ))}
                                                                {Object.keys(t.sample_records[0]).length > 6 && (
                                                                    <th className="px-3 py-2 text-slate-400 font-normal">
                                                                        +{Object.keys(t.sample_records[0]).length - 6} {__('más')}
                                                                    </th>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {t.sample_records.map((rec: Record<string, any>, rIdx: number) => (
                                                                <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                                                    {Object.keys(t.sample_records[0]).slice(0, 6).map((colKey) => {
                                                                        const val = rec[colKey];
                                                                        return (
                                                                            <td key={colKey} className="px-3 py-2 font-mono text-[11px] max-w-[180px] truncate">
                                                                                {val === null ? (
                                                                                    <span className="text-slate-400 italic text-[10px]">NULL</span>
                                                                                ) : typeof val === 'boolean' ? (
                                                                                    <Badge variant={val ? 'default' : 'outline'} className="text-[9px] px-1.5 py-0">
                                                                                        {val ? 'TRUE' : 'FALSE'}
                                                                                    </Badge>
                                                                                ) : typeof val === 'object' ? (
                                                                                    <span className="text-indigo-500 font-sans text-[10px]">[Objeto]</span>
                                                                                ) : (
                                                                                    String(val)
                                                                                )}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                    {Object.keys(t.sample_records[0]).length > 6 && (
                                                                        <td className="px-3 py-2 text-slate-400 text-[10px]">...</td>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-xs italic text-muted-foreground p-2">{__('Sin registros.')}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t">
                                <Button variant="outline" onClick={() => setStep(1)} className="gap-2 text-xs font-semibold px-4">
                                    <ArrowLeft className="h-4 w-4" />
                                    {__('Anterior')}
                                </Button>
                                <Button onClick={() => setStep(3)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold text-xs px-5">
                                    <span>{__('Siguiente')}</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* PASO 3 */}
                    {step === 3 && (
                        <form onSubmit={handleVerifyPassword} className="space-y-5 max-w-sm mx-auto py-2">
                            <div className="text-center space-y-1.5">
                                <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                                    <KeyRound className="h-5 w-5" />
                                </div>
                                <h3 className="font-bold text-base">{__('Verificación de Seguridad')}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {__('Confirma tu contraseña de usuario antes de iniciar la exportación.')}
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="pass_confirm" className="text-xs font-bold">{__('Contraseña Actual')}</Label>
                                <Input
                                    id="pass_confirm"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="text-sm"
                                    autoFocus
                                />
                                {passwordError && <p className="text-xs font-semibold text-rose-500 mt-1">{passwordError}</p>}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setStep(2)} className="gap-1.5 text-xs font-semibold">
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    {__('Anterior')}
                                </Button>
                                <Button type="submit" disabled={verifyingPassword} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold text-xs">
                                    {verifyingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    <span>{__('Confirmar y Exportar')}</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* PASO 4 */}
                    {step === 4 && (
                        <div className="space-y-6 max-w-md mx-auto py-4 text-center">
                            <div className="space-y-1.5">
                                {exportFinished ? (
                                    <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
                                        <ShieldCheck className="h-8 w-8" />
                                    </div>
                                ) : (
                                    <div className="h-14 w-14 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center mx-auto">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    </div>
                                )}

                                <h3 className="text-lg font-black">
                                    {exportFinished ? __('¡Exportación Finalizada!') : __('Generando Respaldo SQL')}
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium">{currentStepText}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <span>{__('Progreso de Exportación')}</span>
                                    <span className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">{exportProgress}%</span>
                                </div>
                                <Progress value={exportProgress} className="h-3 rounded-full" />
                            </div>

                            {exportFinished && (
                                <div className="pt-2 flex justify-center gap-2">
                                    <Button onClick={triggerDownload} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold text-xs">
                                        <Download className="h-3.5 w-3.5" />
                                        {__('Volver a Descargar')}
                                    </Button>
                                    <Button variant="outline" onClick={resetWizard} className="text-xs font-semibold">
                                        {__('Reiniciar')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

interface LiveMetrics {
    queries_per_second: number;
    active_connections: number;
    max_connections: number;
    cache_hit_rate: number;
    query_types: {
        select: number;
        insert: number;
        update: number;
        delete: number;
    };
    slow_queries: Array<{
        query: string;
        duration: string;
        time: string;
    }>;
    active_processes: Array<{
        id: number;
        user: string;
        host: string;
        db: string;
        command: string;
        time: number;
        state: string;
        info: string;
    }>;
}

export default function DbMonitoring({ dbInfo }: PageProps) {
    const { __ } = useTranslate();
    const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [qpsHistory, setQpsHistory] = useState<number[]>([]);
    const [timeLabels, setTimeLabels] = useState<string[]>([]);
    const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

    const fetchMetrics = () => {
        setLoading(true);
        fetch('/admin/monitoring/database/metrics')
            .then((res) => res.json())
            .then((data: LiveMetrics & { timestamp: string }) => {
                setMetrics(data);

                setQpsHistory((prev) => {
                    const newHist = [...prev, data.queries_per_second];
                    if (newHist.length > 15) newHist.shift();
                    return newHist;
                });

                setTimeLabels((prev) => {
                    const newLabels = [...prev, data.timestamp];
                    if (newLabels.length > 15) newLabels.shift();
                    return newLabels;
                });
            })
            .catch((err) => console.error('Error al cargar métricas:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 3000);
        return () => clearInterval(interval);
    }, []);

    const lineChartOptions: any = {
        chart: {
            type: 'line' as const,
            toolbar: { show: false },
            sparkline: { enabled: false },
            animations: { enabled: true, easing: 'linear', dynamicAnimation: { speed: 1000 } }
        },
        stroke: { curve: 'smooth' as const, width: 3 },
        colors: ['#6366f1'],
        grid: {
            borderColor: 'rgba(163, 163, 163, 0.1)',
            strokeDashArray: 4
        },
        xaxis: {
            categories: timeLabels,
            labels: {
                show: true,
                style: { colors: '#94a3b8', fontSize: '10px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            min: 0,
            labels: {
                style: { colors: '#94a3b8' }
            }
        },
        tooltip: { theme: 'dark' }
    };

    const lineChartSeries = [
        {
            name: __('Queries / Sec'),
            data: qpsHistory
        }
    ];

    const donutChartOptions: any = {
        labels: ['Select', 'Insert', 'Update', 'Delete'],
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        legend: {
            position: 'bottom' as const,
            labels: { colors: '#94a3b8' }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: __('Total de Consultas'),
                            color: '#94a3b8',
                            formatter: () => {
                                if (!metrics?.query_types) return 0;
                                return Object.values(metrics.query_types).reduce((a, b) => a + b, 0);
                            }
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false }
    };

    const donutChartSeries = metrics?.query_types
        ? [
              metrics.query_types.select,
              metrics.query_types.insert,
              metrics.query_types.update,
              metrics.query_types.delete
          ]
        : [0, 0, 0, 0];

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Monitoring'), href: '#' },
        { title: __('Database'), href: '/admin/monitoring/database' }
    ];

    return (
        <>
            <Head title={__('Database Monitoring')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Database className="h-8 w-8 text-indigo-600" />
                            {__('Monitoreo de Base de Datos')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Visualiza métricas del motor SQL, consultas en vivo, logs lentos y optimización de almacenamiento.')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsExportModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold text-xs"
                        >
                            <Download className="h-4 w-4" />
                            {__('Exportar Base de Datos')}
                        </Button>
                        <Button 
                            onClick={fetchMetrics} 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 shrink-0"
                            disabled={loading}
                        >
                            <RefreshCw className="h-4 w-4" />
                            {__('Refrescar')}
                        </Button>
                    </div>
                </div>

                {/* Resumen Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">{__('Motor y Versión')}</CardTitle>
                            <Cpu className="h-5 w-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold capitalize">{dbInfo.driver}</div>
                            <p className="text-xs text-muted-foreground mt-1">{__('Versión')} {dbInfo.version}</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">{__('Tamaño Total')}</CardTitle>
                            <HardDrive className="h-5 w-5 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {dbInfo.total_size_mb > 0 && dbInfo.total_size_mb < 0.001
                                    ? `${(dbInfo.total_size_mb * 1024).toFixed(2)} KB`
                                    : dbInfo.total_size_mb < 1
                                    ? `${(dbInfo.total_size_mb * 1024).toFixed(1)} KB`
                                    : `${dbInfo.total_size_mb.toFixed(2)} MB`}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{__('Espacio de almacenamiento ocupado')}</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">{__('Tablas del Sistema')}</CardTitle>
                            <Layers className="h-5 w-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dbInfo.total_tables}</div>
                            <p className="text-xs text-muted-foreground mt-1">{dbInfo.total_rows.toLocaleString()} {__('filas registradas')}</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">{__('Conexiones')}</CardTitle>
                            <Activity className="h-5 w-5 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {metrics?.active_connections ?? 0} / {metrics?.max_connections ?? 150}
                            </div>
                            <Progress 
                                value={((metrics?.active_connections ?? 0) / (metrics?.max_connections ?? 150)) * 100} 
                                className="h-1.5 mt-2" 
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Gráficos en Vivo */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-indigo-500" />
                                {__('Consultas por Segundo (QPS)')}
                            </CardTitle>
                            <CardDescription>{__('Carga transaccional actual en tiempo real (3s de refresco).')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Chart 
                                options={lineChartOptions} 
                                series={lineChartSeries} 
                                type="line" 
                                height={280} 
                            />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Hash className="h-5 w-5 text-blue-500" />
                                {__('Distribución de Consultas')}
                            </CardTitle>
                            <CardDescription>{__('Estadística del tipo de operaciones ejecutadas.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col justify-between h-[300px]">
                            <div className="pt-2">
                                <Chart 
                                    options={donutChartOptions} 
                                    series={donutChartSeries} 
                                    type="donut" 
                                    height={230} 
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detalle Radix UI Tabs */}
                <Tabs defaultValue="tables" className="w-full">
                    <TabsList className="grid grid-cols-3 max-w-[480px]">
                        <TabsTrigger value="tables">{__('Tablas y Tamaño')}</TabsTrigger>
                        <TabsTrigger value="processes">{__('Procesos Activos')}</TabsTrigger>
                        <TabsTrigger value="slow-queries">{__('Slow Queries')}</TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Tablas y filas */}
                    <TabsContent value="tables" className="mt-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>{__('Tamaño de Tablas y Almacenamiento')}</CardTitle>
                                <CardDescription>{__('Listado y volumen físico de datos por cada tabla en la BD.')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{__('Nombre de la Tabla')}</TableHead>
                                            <TableHead className="text-right">{__('Filas Estimadas')}</TableHead>
                                            <TableHead className="text-right">{__('Tamaño Físico (MB)')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dbInfo.tables.map((t, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-mono font-medium text-slate-800 dark:text-slate-200">
                                                    {t.name}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {t.rows.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums text-indigo-600 font-semibold">
                                                    {t.size_mb < 0.01 && t.size_mb > 0 ? '< 0.01 MB' : `${t.size_mb.toFixed(2)} MB`}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab 2: Procesos activos */}
                    <TabsContent value="processes" className="mt-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>{__('Lista de Procesos (Threads)')}</CardTitle>
                                <CardDescription>{__('Conexiones activas actualmente procesadas por la base de datos.')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-16">{__('ID')}</TableHead>
                                            <TableHead>{__('Usuario')}</TableHead>
                                            <TableHead>{__('Host')}</TableHead>
                                            <TableHead>{__('Comando')}</TableHead>
                                            <TableHead className="text-right">{__('Tiempo (s)')}</TableHead>
                                            <TableHead>{__('Estado')}</TableHead>
                                            <TableHead className="max-w-[300px] truncate">{__('Query')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {metrics?.active_processes && metrics.active_processes.length > 0 ? (
                                            metrics.active_processes.map((p, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                                                    <TableCell className="font-medium">{p.user}</TableCell>
                                                    <TableCell className="text-muted-foreground text-xs">{p.host}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={p.command === 'Query' ? 'default' : 'secondary'}>
                                                            {p.command}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums font-mono text-xs">{p.time}</TableCell>
                                                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">{p.state || 'idle'}</TableCell>
                                                    <TableCell className="font-mono text-xs max-w-[300px] truncate text-slate-700 dark:text-slate-300" title={p.info}>
                                                        {p.info || <span className="italic text-muted-foreground">{__('Ninguno')}</span>}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                                    {__('No hay procesos activos en este momento.')}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab 3: Consultas lentas */}
                    <TabsContent value="slow-queries" className="mt-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                                    {__('Registro de Slow Queries')}
                                </CardTitle>
                                <CardDescription>{__('Alertas de consultas que exceden el tiempo óptimo de respuesta (100ms).')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {metrics?.slow_queries && metrics.slow_queries.length > 0 ? (
                                    <div className="space-y-4">
                                        {metrics.slow_queries.map((q, idx) => (
                                            <div key={idx} className="p-4 border rounded-lg bg-red-50/50 dark:bg-red-950/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1 max-w-[70%]">
                                                    <p className="font-mono text-xs bg-white dark:bg-slate-900 p-2.5 rounded border overflow-x-auto text-red-800 dark:text-red-300">
                                                        {q.query}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{__('Ejecutado a las')} {q.time}</p>
                                                </div>
                                                <div className="flex gap-2 self-start md:self-auto items-center">
                                                    <span className="text-xs text-muted-foreground">{__('Duración:')}</span>
                                                    <Badge variant="destructive" className="font-mono text-xs">
                                                        {q.duration}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground space-y-2">
                                        <ShieldAlert className="h-8 w-8 mx-auto text-emerald-500/60" />
                                        <p className="font-medium text-slate-700 dark:text-slate-300">{__('No se detectaron consultas lentas.')}</p>
                                        <p className="text-xs text-muted-foreground">{__('El rendimiento de la base de datos se encuentra en niveles óptimos.')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Modal Dialog Wizard */}
                <ExportWizardModal
                    open={isExportModalOpen}
                    onOpenChange={setIsExportModalOpen}
                    dbInfo={dbInfo}
                />
            </div>
        </>
    );
}
