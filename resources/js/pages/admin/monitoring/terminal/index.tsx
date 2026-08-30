import React, { useState, useRef, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin/admin-saas-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Terminal as TerminalIcon,
    Play,
    Trash2,
    Copy,
    Check,
    Download,
    Cpu,
    Database,
    HardDrive,
    Server,
    ShieldAlert,
    Clock,
    Sparkles,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    Zap,
    RotateCcw,
    Layers,
    Activity,
    Info,
    CheckCircle2,
    XCircle,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemInfo {
    php_version: string;
    laravel_version: string;
    server_os: string;
    hostname: string;
    default_connection: string;
    database_name: string;
    memory_usage: string;
    server_time: string;
    environment: string;
}

interface EmpresaItem {
    id: number;
    razon_social: string;
    nombre_comercial?: string;
    whatsapp_instance?: string;
    status: boolean;
}

interface CommandPreset {
    name: string;
    command: string;
    description: string;
    requires_param: boolean;
    param_type?: string;
}

interface PresetCategory {
    category: string;
    color: string;
    commands: CommandPreset[];
}

interface TerminalHistoryItem {
    id: string;
    command: string;
    output: string;
    exit_code: number;
    duration_ms: number;
    executed_at: string;
    executed_by: string;
    success: boolean;
}

interface TerminalPageProps {
    system_info: SystemInfo;
    empresas: EmpresaItem[];
    presets: PresetCategory[];
    [key: string]: any;
}

export default function TerminalIndex({ system_info, empresas, presets }: TerminalPageProps) {
    const { auth } = usePage<any>().props;

    const [currentCommand, setCurrentCommand] = useState('');
    const [history, setHistory] = useState<TerminalHistoryItem[]>([
        {
            id: 'init-0',
            command: 'about',
            output: `FixSale Cloud Artisan Terminal v1.0\nEntorno: ${system_info.environment.toUpperCase()} | PHP ${system_info.php_version} | Laravel ${system_info.laravel_version}\nConectado a: ${system_info.database_name} (${system_info.default_connection})\nUsuario: ${auth?.user?.name ?? 'Super Admin'} (Acceso Total Concedido)\n\nEscribe un comando Artisan o selecciona uno de los atajos rápidos para comenzar.`,
            exit_code: 0,
            duration_ms: 12,
            executed_at: system_info.server_time,
            executed_by: 'Sistema',
            success: true,
        },
    ]);

    const [commandLog, setCommandLog] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [isExecuting, setIsExecuting] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    // Modal para comandos con parámetros (ej. Seleccionar Empresa)
    const [isParamModalOpen, setIsParamModalOpen] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<CommandPreset | null>(null);
    const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('');

    const terminalBodyRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto scroll down when new output arrives
    useEffect(() => {
        if (autoScroll && terminalBodyRef.current) {
            terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
        }
    }, [history, isExecuting, autoScroll]);

    // Ejecutar comando Artisan
    const handleExecuteCommand = async (commandToRun: string) => {
        const cmd = commandToRun.trim();
        if (!cmd || isExecuting) return;

        setIsExecuting(true);
        setCurrentCommand('');
        setHistoryIndex(-1);

        // Agregar al historial de comandos escritos
        setCommandLog((prev) => [cmd, ...prev.filter((c) => c !== cmd)]);

        try {
            const response = await axios.post('/admin/monitoring/terminal/execute', {
                command: cmd,
            });

            const data = response.data;
            const newItem: TerminalHistoryItem = {
                id: `cmd-${Date.now()}-${Math.random()}`,
                command: data.command || cmd,
                output: data.output || (data.success ? 'Comando ejecutado con éxito.' : data.error || 'Error en ejecución.'),
                exit_code: data.exit_code ?? (data.success ? 0 : 1),
                duration_ms: data.duration_ms || 0,
                executed_at: data.executed_at || new Date().toLocaleTimeString(),
                executed_by: data.executed_by || (auth?.user?.name ?? 'Admin'),
                success: Boolean(data.success),
            };

            setHistory((prev) => [...prev, newItem]);
        } catch (error: any) {
            const errorMsg =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Error de conexión al ejecutar el comando.';

            const newItem: TerminalHistoryItem = {
                id: `cmd-err-${Date.now()}`,
                command: cmd,
                output: `❌ ERROR HTTP: ${errorMsg}`,
                exit_code: 1,
                duration_ms: 0,
                executed_at: new Date().toLocaleTimeString(),
                executed_by: auth?.user?.name ?? 'Admin',
                success: false,
            };

            setHistory((prev) => [...prev, newItem]);
        } finally {
            setIsExecuting(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    // Form submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleExecuteCommand(currentCommand);
    };

    // Navegar historial con flechas
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandLog.length === 0) return;
            const nextIndex = Math.min(historyIndex + 1, commandLog.length - 1);
            setHistoryIndex(nextIndex);
            setCurrentCommand(commandLog[nextIndex] || '');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex <= 0) {
                setHistoryIndex(-1);
                setCurrentCommand('');
            } else {
                const nextIndex = historyIndex - 1;
                setHistoryIndex(nextIndex);
                setCurrentCommand(commandLog[nextIndex] || '');
            }
        }
    };

    // Manejar clic en Preset
    const handlePresetClick = (preset: CommandPreset) => {
        if (preset.requires_param) {
            setSelectedPreset(preset);
            setSelectedEmpresaId(empresas[0]?.id ? String(empresas[0].id) : '');
            setIsParamModalOpen(true);
        } else {
            handleExecuteCommand(preset.command);
        }
    };

    // Confirmar preset parametrizado
    const handleConfirmParamModal = () => {
        if (!selectedPreset) return;

        let cmd = selectedPreset.command;
        if (selectedPreset.param_type === 'empresa_id') {
            cmd = cmd.replace('{empresa_id}', selectedEmpresaId);
        }

        setIsParamModalOpen(false);
        handleExecuteCommand(cmd);
    };

    // Copiar salida al portapapeles
    const handleCopyOutput = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Limpiar terminal
    const handleClearTerminal = () => {
        setHistory([]);
    };

    // Descargar salida como archivo .log
    const handleDownloadLog = () => {
        const content = history
            .map(
                (h) =>
                    `========================================\nFECHA: ${h.executed_at} | POR: ${h.executed_by}\nCOMANDO: ${h.command}\nCÓDIGO: ${h.exit_code} (${h.success ? 'OK' : 'FAIL'}) | TIEMPO: ${h.duration_ms}ms\n----------------------------------------\n${h.output}\n\n`
            )
            .join('');

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `artisan_terminal_${new Date().toISOString().slice(0, 10)}.log`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AdminLayout>
            <Head title="Terminal Artisan - Monitoreo Avanzado" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header Principal */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm">
                                <TerminalIcon className="size-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-black tracking-tight text-foreground">
                                        Terminal Artisan & Consola del Sistema
                                    </h1>
                                    <Badge
                                        variant="outline"
                                        className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold gap-1 py-0.5"
                                    >
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Super Administrador
                                    </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                    Ejecuta comandos CLI, sincroniza microservicios y gestiona cachés directamente desde la interfaz gráfica.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick System Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border text-xs font-semibold text-muted-foreground shadow-2xs">
                            <Server className="size-3.5 text-indigo-500" />
                            <span>PHP {system_info.php_version}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border text-xs font-semibold text-muted-foreground shadow-2xs">
                            <Zap className="size-3.5 text-rose-500" />
                            <span>Laravel {system_info.laravel_version}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border text-xs font-semibold text-muted-foreground shadow-2xs">
                            <Database className="size-3.5 text-cyan-500" />
                            <span>{system_info.database_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border text-xs font-semibold text-muted-foreground shadow-2xs">
                            <HardDrive className="size-3.5 text-amber-500" />
                            <span>{system_info.memory_usage}</span>
                        </div>
                    </div>
                </div>

                {/* Catálogo de Atajos Rápidos por Categoría */}
                <Card className="border shadow-xs overflow-hidden">
                    <CardHeader className="p-4 sm:p-5 bg-muted/20 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                                    <Sparkles className="size-4 text-indigo-500" />
                                    <span>Atajos de Comandos Frecuentes (1-Click)</span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Haz clic en cualquier comando para ejecutarlo al instante o personalizar sus parámetros.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                        <Tabs defaultValue={presets[0]?.category || 'WhatsApp & Microservicios'} className="w-full">
                            <div className="overflow-x-auto pb-2 custom-scrollbar">
                                <TabsList className="inline-flex w-auto min-w-full justify-start gap-1.5 bg-muted/50 p-1.5 rounded-xl border border-border/60">
                                    {presets.map((cat) => (
                                        <TabsTrigger
                                            key={cat.category}
                                            value={cat.category}
                                            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary transition-all shrink-0"
                                        >
                                            {cat.category}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            {presets.map((cat) => (
                                <TabsContent key={cat.category} value={cat.category} className="mt-4 focus-visible:outline-none">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {cat.commands.map((cmd) => (
                                            <div
                                                key={cmd.name}
                                                onClick={() => handlePresetClick(cmd)}
                                                className="group relative p-3.5 rounded-xl border bg-card hover:bg-muted/40 hover:border-indigo-400/60 dark:hover:border-indigo-600/60 transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                                        <h4 className="text-xs font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {cmd.name}
                                                        </h4>
                                                        <span className="p-1 rounded-md bg-muted text-muted-foreground group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                                                            <Play className="size-3 fill-current" />
                                                        </span>
                                                    </div>
                                                    <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/80 text-muted-foreground block truncate mb-1.5">
                                                        {cmd.command}
                                                    </code>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                                                        {cmd.description}
                                                    </p>
                                                </div>

                                                {cmd.requires_param && (
                                                    <div className="mt-2 pt-2 border-t flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                                        <span>Requiere selector de empresa</span>
                                                        <ChevronRight className="size-3" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Ventana de Terminal Interactiva */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden text-slate-100 font-mono">
                    {/* Terminal Header Bar */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 select-none">
                        {/* Traffic lights */}
                        <div className="flex items-center gap-2">
                            <span className="size-3 rounded-full bg-rose-500/80 inline-block" />
                            <span className="size-3 rounded-full bg-amber-500/80 inline-block" />
                            <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
                            <span className="text-xs text-slate-400 ml-2 font-sans font-medium hidden sm:inline">
                                fixsale-cloud-artisan: bash/artisan
                            </span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setAutoScroll(!autoScroll)}
                                className={cn(
                                    "h-7 px-2.5 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg",
                                    autoScroll && "text-emerald-400 bg-emerald-950/40 border border-emerald-800/50"
                                )}
                                title="Auto-scroll"
                            >
                                <Activity className="size-3.5 mr-1" />
                                Auto-scroll
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleDownloadLog}
                                className="h-7 px-2.5 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                                title="Descargar registro como .log"
                            >
                                <Download className="size-3.5 mr-1" />
                                Descargar Log
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClearTerminal}
                                className="h-7 px-2.5 text-[11px] text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                                title="Limpiar pantalla"
                            >
                                <Trash2 className="size-3.5 mr-1" />
                                Limpiar
                            </Button>
                        </div>
                    </div>

                    {/* Terminal Output Area */}
                    <div
                        ref={terminalBodyRef}
                        className="p-5 overflow-y-auto max-h-[540px] min-h-[380px] space-y-6 text-xs sm:text-sm custom-scrollbar bg-slate-950"
                    >
                        {history.length === 0 && (
                            <div className="text-slate-500 py-12 text-center select-none font-sans">
                                <TerminalIcon className="size-8 mx-auto mb-2 opacity-40" />
                                <p>Terminal lista. Ingresa un comando o selecciona un atajo para ejecutar.</p>
                            </div>
                        )}

                        {history.map((item, index) => (
                            <div key={item.id} className="space-y-2 border-b border-slate-900 pb-4 last:border-b-0">
                                {/* Command Prompt Header */}
                                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="text-emerald-400 font-bold">fixsale@server</span>
                                        <span className="text-slate-500">:</span>
                                        <span className="text-cyan-400 font-semibold">~</span>
                                        <span className="text-slate-400">$</span>
                                        <span className="text-amber-300 font-bold tracking-wide">{item.command}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-sans">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] px-1.5 py-0 border font-mono font-bold",
                                                item.success
                                                    ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/80"
                                                    : "bg-rose-950/60 text-rose-400 border-rose-800/80"
                                            )}
                                        >
                                            {item.success ? 'EXIT: 0' : `EXIT: ${item.exit_code}`}
                                        </Badge>
                                        <span className="text-slate-500">({item.duration_ms}ms)</span>
                                        <span className="text-slate-500 hidden sm:inline">{item.executed_at}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyOutput(item.output, index)}
                                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                                            title="Copiar salida"
                                        >
                                            {copiedIndex === index ? (
                                                <Check className="size-3.5 text-emerald-400" />
                                            ) : (
                                                <Copy className="size-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Formatted Output */}
                                <pre className="font-mono text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 overflow-x-auto selection:bg-indigo-500 selection:text-white">
                                    {item.output}
                                </pre>
                            </div>
                        ))}

                        {/* Spinner when executing */}
                        {isExecuting && (
                            <div className="flex items-center gap-2.5 text-emerald-400 animate-pulse text-xs sm:text-sm py-2">
                                <Loader2 className="size-4 animate-spin shrink-0" />
                                <span>Ejecutando comando en el servidor... por favor espera.</span>
                            </div>
                        )}
                    </div>

                    {/* Interactive Command Input Form */}
                    <form onSubmit={handleSubmit} className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold pl-2 select-none shrink-0 text-xs sm:text-sm">
                            <span>$</span>
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={currentCommand}
                            onChange={(e) => setCurrentCommand(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isExecuting}
                            placeholder="Escribe un comando Artisan (ej: whatsapp:create-instance, optimize:clear, route:cache)..."
                            className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-0 font-mono"
                            autoComplete="off"
                            autoFocus
                        />
                        <Button
                            type="submit"
                            disabled={isExecuting || !currentCommand.trim()}
                            className="h-8 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm shrink-0"
                        >
                            {isExecuting ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <>
                                    <span>Ejecutar</span>
                                    <Play className="size-3 ml-1.5 fill-current" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Modal para selección de parámetros (Empresa) */}
            <Dialog open={isParamModalOpen} onOpenChange={setIsParamModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Building2Icon className="size-4 text-indigo-500" />
                            <span>Seleccionar Empresa para el Comando</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Este comando requiere especificar el ID de la empresa a procesar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="p-3 rounded-xl bg-muted/40 border text-xs font-mono">
                            <span className="text-muted-foreground">Comando base:</span>{' '}
                            <span className="text-foreground font-bold">{selectedPreset?.command}</span>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">
                                Empresa Destino:
                            </label>
                            <Select value={selectedEmpresaId} onValueChange={setSelectedEmpresaId}>
                                <SelectTrigger className="h-10 text-xs font-medium">
                                    <SelectValue placeholder="Selecciona una empresa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {empresas.map((emp) => (
                                        <SelectItem key={emp.id} value={String(emp.id)} className="text-xs">
                                            #{emp.id} - {emp.razon_social} {emp.whatsapp_instance ? `(${emp.whatsapp_instance})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsParamModalOpen(false)}
                            className="h-9 text-xs font-semibold"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmParamModal}
                            disabled={!selectedEmpresaId}
                            className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                            Ejecutar Comando
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

function Building2Icon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    );
}
