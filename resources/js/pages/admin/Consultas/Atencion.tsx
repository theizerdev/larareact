import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    Stethoscope,
    User,
    Calendar,
    Clock,
    FileText,
    Activity,
    Search,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Send,
    Printer,
    HeartPulse,
    Pill,
    Check,
    HelpCircle,
    Sparkles,
    ArrowRight,
    Thermometer,
    Gauge,
    Flame,
    Award,
    Zap,
    TrendingUp,
    ClipboardList,
    FlaskConical,
    Microscope,
    FileSpreadsheet,
    RotateCcw,
    MessageSquareText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { ModuleHeader } from '@/components/module-header';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { cn } from '@/lib/utils';
import { RichTextEditor } from '@/components/rich-text-editor';

interface MedicamentoItem {
    medicamento_nombre: string;
    dosis: string;
    via_administracion: string;
    frecuencia: string;
    duracion_dias: number;
    instrucciones: string;
}

interface EstudioItem {
    tipo_estudio: string;
    nombre_estudio: string;
    indicaciones: string;
}

interface Cie10DiagnosticoItem {
    codigo: string;
    nombre: string;
    tipo: 'principal' | 'secundario' | 'presuntivo';
    observaciones?: string;
}

interface CatalogoEstudioOption {
    id?: number;
    tipo_estudio: string;
    nombre_estudio: string;
    indicaciones_predeterminadas?: string;
}

interface Cita {
    id: number;
    codigo_cita: string;
    fecha_hora_inicio: string;
    motivo_consulta?: string;
    especialidad_id?: number;
    paciente?: {
        id: number;
        codigo_paciente: string;
        nombres: string;
        apellidos: string;
        nombre_mascota?: string;
        tipo_paciente: string;
        telefono?: string;
        tutor_nombre?: string;
    };
    medico?: {
        nombres: string;
        apellidos: string;
    };
    especialidad?: {
        nombre: string;
    };
    preconsulta?: {
        completado: boolean;
        respuestas?: Record<string, any>;
        plantilla?: {
            titulo: string;
            preguntas: Array<{ id: string; label: string; tipo: string }>;
        };
    };
    consulta?: {
        id: number;
        motivo_consulta?: string;
        enfermedad_actual?: string;
        examen_fisico?: string;
        presion_arterial?: string;
        frecuencia_cardiaca?: number;
        temperatura?: number;
        peso_kg?: number;
        talla_cm?: number;
        imc?: number;
        spo2?: number;
        diagnostico_cie10_codigo?: string;
        diagnostico_cie10_nombre?: string;
        observaciones_diagnostico?: string;
        conclusion?: string;
        plan_tratamiento?: string;
        observaciones_adicionales?: string;
        diagnosticosCie10?: Cie10DiagnosticoItem[];
        receta?: {
            indicaciones_generales?: string;
            medicamentos?: MedicamentoItem[];
        };
        ordenEstudio?: {
            indicaciones_generales?: string;
            estudios?: EstudioItem[];
        };
    };
}

interface Cie10Option {
    id?: number;
    codigo: string;
    nombre: string;
}

interface Props {
    cita: Cita;
    consultaExistente?: any;
    catalogoCie10Inicial?: Cie10Option[];
    catalogoEstudiosInicial?: CatalogoEstudioOption[];
}

const CATALOGO_DEFAULT: Cie10Option[] = [
    { codigo: 'J00', nombre: 'Rinitis aguda (Resfriado común)' },
    { codigo: 'J02.9', nombre: 'Faringitis aguda, no especificada' },
    { codigo: 'J03.9', nombre: 'Amigdalitis aguda, no especificada' },
    { codigo: 'J20.9', nombre: 'Bronquitis aguda, no especificada' },
    { codigo: 'I10', nombre: 'Hipertensión esencial (primaria)' },
    { codigo: 'E11.9', nombre: 'Diabetes mellitus tipo 2 sin complicaciones' },
    { codigo: 'K29.7', nombre: 'Gastritis, no especificada' },
    { codigo: 'K21.9', nombre: 'Enfermedad por reflujo gastroesofágico sin esofagitis' },
    { codigo: 'M54.5', nombre: 'Lumbago no especificado' },
    { codigo: 'R51', nombre: 'Cefalea' },
    { codigo: 'R50.9', nombre: 'Fiebre, no especificada' },
    { codigo: 'B34.9', nombre: 'Infección viral, no especificada' },
];

const SUGERENCIAS_ESTUDIOS_DEFAULT: CatalogoEstudioOption[] = [
    { tipo_estudio: 'Laboratorio', nombre_estudio: 'Hemograma Completo (Hematología)', indicaciones_predeterminadas: 'En ayunas de 8 horas' },
    { tipo_estudio: 'Laboratorio', nombre_estudio: 'Perfil Lipídico (Colesterol, Triglicéridos)', indicaciones_predeterminadas: 'Ayuno de 12 horas' },
    { tipo_estudio: 'Laboratorio', nombre_estudio: 'Glucemia en Ayunas', indicaciones_predeterminadas: 'Ayuno de 8 a 10 horas' },
    { tipo_estudio: 'Laboratorio', nombre_estudio: 'Urea y Creatinina (Función Renal)', indicaciones_predeterminadas: 'Sin preparación especial' },
    { tipo_estudio: 'Laboratorio', nombre_estudio: 'Examen General de Orina (EGO)', indicaciones_predeterminadas: 'Primera muestra de la mañana' },
    { tipo_estudio: 'Laboratorio', nombre_estudio: 'Perfil Hepático (TGO, TGP, Bilirrubina)', indicaciones_predeterminadas: 'En ayunas de 8 horas' },
    { tipo_estudio: 'Imagenología', nombre_estudio: 'Radiografía de Tórax (Rx AP y Lat)', indicaciones_predeterminadas: 'Retirar objetos metálicos' },
    { tipo_estudio: 'Imagenología', nombre_estudio: 'Ecografía Abdominal Total', indicaciones_predeterminadas: 'Ayuno de 6 horas y vejiga llena' },
    { tipo_estudio: 'Imagenología', nombre_estudio: 'Tomografía Computarizada (TAC Abdominal)', indicaciones_predeterminadas: 'Evaluación con o sin contraste' },
    { tipo_estudio: 'Electrofisiología', nombre_estudio: 'Electrocardiograma (ECG 12 derivaciones)', indicaciones_predeterminadas: 'Sin cafeína previa' },
];

export default function Atencion({
    cita,
    consultaExistente,
    catalogoCie10Inicial = [],
    catalogoEstudiosInicial = [],
}: Props) {
    const __ = (key: string) => key;

    const [currentStep, setCurrentStep] = useState(1);
    const [cie10Search, setCie10Search] = useState('');
    const [catalogoCie10, setCatalogoCie10] = useState<Cie10Option[]>(
        catalogoCie10Inicial.length > 0 ? catalogoCie10Inicial : CATALOGO_DEFAULT
    );
    const [catalogoEstudios, setCatalogoEstudios] = useState<CatalogoEstudioOption[]>(
        catalogoEstudiosInicial.length > 0 ? catalogoEstudiosInicial : SUGERENCIAS_ESTUDIOS_DEFAULT
    );

    // Modal para crear nuevo Diagnóstico CIE-10
    const [modalCrearCie10Open, setModalCrearCie10Open] = useState(false);
    const [nuevoCie10Codigo, setNuevoCie10Codigo] = useState('');
    const [nuevoCie10Nombre, setNuevoCie10Nombre] = useState('');
    const [creandoCie10, setCreandoCie10] = useState(false);

    // Formulario de nuevo diagnóstico a ingresar en el paso 3
    const [tempDiagCodigo, setTempDiagCodigo] = useState('');
    const [tempDiagNombre, setTempDiagNombre] = useState('');
    const [tempDiagTipo, setTempDiagTipo] = useState<'principal' | 'secundario' | 'presuntivo'>('principal');

    // Modal para registrar nuevo Estudio en Catálogo
    const [modalCrearEstudioOpen, setModalCrearEstudioOpen] = useState(false);
    const [nuevoEstudioTipoCat, setNuevoEstudioTipoCat] = useState('Laboratorio');
    const [nuevoEstudioNombreCat, setNuevoEstudioNombreCat] = useState('');
    const [nuevoEstudioIndicacionesCat, setNuevoEstudioIndicacionesCat] = useState('En ayunas de 8 horas');
    const [creandoEstudioCat, setCreandoEstudioCat] = useState(false);

    // Formulario de nuevo medicamento en la receta
    const [nuevoMedicamento, setNuevoMedicamento] = useState<MedicamentoItem>({
        medicamento_nombre: '',
        dosis: '1 comprimido',
        via_administracion: 'Oral',
        frecuencia: 'Cada 8 horas',
        duracion_dias: 7,
        instrucciones: 'Tomar después de las comidas',
    });

    // Formulario de nuevo estudio solicitado en la orden activa
    const [nuevoEstudio, setNuevoEstudio] = useState<EstudioItem>({
        tipo_estudio: 'Laboratorio',
        nombre_estudio: '',
        indicaciones: 'En ayunas de 8 horas',
    });

    const consulta = cita.consulta || consultaExistente || {};
    const paciente = cita.paciente;
    const preconsulta = cita.preconsulta;

    const ordenEst = consulta.orden_estudio || consulta.ordenEstudio;
    const diagsCie10 = consulta.diagnosticos_cie10 || consulta.diagnosticosCie10;

    // Inicializar lista de diagnósticos
    const initialDiagnosticos: Cie10DiagnosticoItem[] = diagsCie10 && diagsCie10.length > 0
        ? diagsCie10.map((d: any) => ({
              codigo: d.codigo,
              nombre: d.nombre,
              tipo: d.tipo || 'principal',
              observaciones: d.observaciones || '',
          }))
        : (consulta.diagnostico_cie10_codigo
              ? [{ codigo: consulta.diagnostico_cie10_codigo, nombre: consulta.diagnostico_cie10_nombre || '', tipo: 'principal' }]
              : []);
    
    const reposoData = consulta.reposo || {};

    const { data, setData, post, processing, errors } = useForm({
        motivo_consulta: consulta.motivo_consulta || cita.motivo_consulta || '',
        enfermedad_actual: consulta.enfermedad_actual || '',
        examen_fisico: consulta.examen_fisico || '',
        presion_arterial: consulta.presion_arterial || '120/80',
        frecuencia_cardiaca: consulta.frecuencia_cardiaca || 75,
        temperatura: consulta.temperatura || 36.6,
        peso_kg: consulta.peso_kg || 70,
        talla_cm: consulta.talla_cm || 170,
        spo2: consulta.spo2 || 98,
        diagnostico_cie10_codigo: consulta.diagnostico_cie10_codigo || '',
        diagnostico_cie10_nombre: consulta.diagnostico_cie10_nombre || '',
        diagnosticos_cie10_lista: initialDiagnosticos as Cie10DiagnosticoItem[],
        observaciones_diagnostico: consulta.observaciones_diagnostico || '',
        conclusion: consulta.conclusion || '',
        plan_tratamiento: consulta.plan_tratamiento || '',
        observaciones_adicionales: consulta.observaciones_adicionales || '',
        indicaciones_generales: consulta.receta?.indicaciones_generales || '',
        medicamentos: (consulta.receta?.medicamentos || []) as MedicamentoItem[],
        indicaciones_estudios: ordenEst?.indicaciones_generales || '',
        estudios_solicitados: (ordenEst?.estudios || []) as EstudioItem[],

        tiene_reposo: reposoData.tiene_reposo ?? false,
        tipo_reposo: reposoData.tipo_reposo || 'relativo',
        dias_reposo: reposoData.dias_reposo || 3,
        fecha_inicio_reposo: reposoData.fecha_inicio || new Date().toISOString().split('T')[0],
        fecha_fin_reposo: reposoData.fecha_fin || (() => {
            const d = new Date();
            d.setDate(d.getDate() + 2);
            return d.toISOString().split('T')[0];
        })(),
        motivo_reposo: reposoData.motivo_reposo || '',
        observaciones_reposo: reposoData.observaciones || '',
    });

    // --- AUTOGUARDADO / RESTAURACIÓN DE BORRADOR EN SESSIONSTORAGE ---
    const DRAFT_KEY = `sismed_atencion_draft_${cita.id}`;

    useEffect(() => {
        try {
            const savedDraft = sessionStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed.currentStep) setCurrentStep(parsed.currentStep);
                if (parsed.data) {
                    setData(parsed.data);
                }
            }
        } catch (e) {
            console.error('Error restaurando borrador:', e);
        }
    }, [cita.id]);

    useEffect(() => {
        try {
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ currentStep, data }));
        } catch (e) {
            console.error('Error guardando borrador:', e);
        }
    }, [currentStep, data, cita.id]);

    const imcCalculado = React.useMemo(() => {
        if (data.peso_kg > 0 && data.talla_cm > 0) {
            const tallaM = data.talla_cm / 100;
            return (data.peso_kg / (tallaM * tallaM)).toFixed(1);
        }
        return '0.0';
    }, [data.peso_kg, data.talla_cm]);

    const getImcStatus = (imc: number) => {
        if (imc <= 0) return { label: 'Sin datos', color: 'bg-slate-100 text-slate-700 border-slate-300', percent: 0 };
        if (imc < 18.5) return { label: 'Bajo peso', color: 'bg-blue-500/15 text-blue-700 border-blue-500/30', percent: 15 };
        if (imc < 25.0) return { label: 'Normal (Saludable)', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30', percent: 40 };
        if (imc < 30.0) return { label: 'Sobrepeso', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30', percent: 70 };
        return { label: 'Obesidad', color: 'bg-rose-500/15 text-rose-700 border-rose-500/30', percent: 95 };
    };

    const getBpStatus = (bpStr: string) => {
        if (!bpStr || !bpStr.includes('/')) return { label: 'No evaluada', color: 'text-muted-foreground' };
        const parts = bpStr.split('/');
        const sys = parseInt(parts[0]);
        const dia = parseInt(parts[1]);

        if (isNaN(sys) || isNaN(dia)) return { label: 'No evaluada', color: 'text-muted-foreground' };

        if (sys < 120 && dia < 80) return { label: 'Óptima (Normal)', color: 'text-emerald-600' };
        if (sys <= 129 && dia <= 84) return { label: 'Normal Elevada', color: 'text-blue-600' };
        if (sys <= 139 || dia <= 89) return { label: 'Pre-hipertensión', color: 'text-amber-600' };
        return { label: 'Hipertensión Arterial', color: 'text-rose-600 font-bold' };
    };

    const getFcStatus = (fc: number) => {
        if (!fc) return { label: 'No evaluada', color: 'text-muted-foreground' };
        if (fc < 60) return { label: 'Bradicardia (<60 bpm)', color: 'text-blue-600' };
        if (fc <= 100) return { label: 'Normocardia (60-100 bpm)', color: 'text-emerald-600' };
        return { label: 'Taquicardia (>100 bpm)', color: 'text-rose-600 font-bold' };
    };

    const getTempStatus = (temp: number) => {
        if (!temp) return { label: 'No evaluada', color: 'text-muted-foreground' };
        if (temp < 36.0) return { label: 'Hipotermia (<36°C)', color: 'text-blue-600' };
        if (temp <= 37.3) return { label: 'Afebril (Normal)', color: 'text-emerald-600' };
        if (temp <= 37.9) return { label: 'Febrícula (37.4-37.9°C)', color: 'text-amber-600' };
        return { label: 'Fiebre (≥38.0°C)', color: 'text-rose-600 font-bold' };
    };

    const getSpo2Status = (spo2: number) => {
        if (!spo2) return { label: 'No evaluada', color: 'text-muted-foreground' };
        if (spo2 >= 95) return { label: 'Normoxia (≥95%)', color: 'text-emerald-600' };
        if (spo2 >= 90) return { label: 'Hipoxia Leve (90-94%)', color: 'text-amber-600' };
        return { label: 'Hipoxia Severa (<90%)', color: 'text-rose-600 font-bold' };
    };

    const getCsrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') || '' : '';
    };

    const handleImportPreconsulta = () => {
        if (!preconsulta?.respuestas) return;
        const textoRespuestas = Object.entries(preconsulta.respuestas)
            .map(([k, v]) => `• ${k}: ${v}`)
            .join('\n');

        setData((prev) => ({
            ...prev,
            motivo_consulta: `${prev.motivo_consulta ? prev.motivo_consulta + '\n\n' : ''}--- PRE-CONSULTA DEL PACIENTE ---\n${textoRespuestas}`,
        }));
        notifySuccess(__('Respuestas de pre-consulta importadas al motivo.'));
    };

    // Agregar un Diagnóstico CIE-10 a la lista
    const handleAddDiagnostico = (codigo: string, nombre: string, tipo: 'principal' | 'secundario' | 'presuntivo' = 'principal') => {
        const codUpper = codigo.trim().toUpperCase();
        const nomTrim = nombre.trim();

        if (!codUpper || !nomTrim) {
            notifyError(__('Ingresa el código y el nombre del diagnóstico.'));
            return;
        }

        setData((prev) => {
            if (prev.diagnosticos_cie10_lista.some((d) => d.codigo === codUpper)) {
                return prev;
            }

            const esPrimer = prev.diagnosticos_cie10_lista.length === 0;
            const nuevoItem: Cie10DiagnosticoItem = {
                codigo: codUpper,
                nombre: nomTrim,
                tipo: esPrimer ? 'principal' : tipo,
            };

            const nuevaLista = [...prev.diagnosticos_cie10_lista, nuevoItem];
            return {
                ...prev,
                diagnosticos_cie10_lista: nuevaLista,
                diagnostico_cie10_codigo: nuevaLista[0].codigo,
                diagnostico_cie10_nombre: nuevaLista[0].nombre,
            };
        });

        setTempDiagCodigo('');
        setTempDiagNombre('');
        notifySuccess(__('Diagnóstico agregado a la consulta.'));
    };

    const handleRemoveDiagnostico = (index: number) => {
        setData((prev) => {
            const updated = [...prev.diagnosticos_cie10_lista];
            updated.splice(index, 1);
            return {
                ...prev,
                diagnosticos_cie10_lista: updated,
                diagnostico_cie10_codigo: updated.length > 0 ? updated[0].codigo : '',
                diagnostico_cie10_nombre: updated.length > 0 ? updated[0].nombre : '',
            };
        });
    };

    const handleChangeTipoDiagnostico = (index: number, tipo: 'principal' | 'secundario' | 'presuntivo') => {
        setData((prev) => {
            const updated = [...prev.diagnosticos_cie10_lista];
            updated[index] = { ...updated[index], tipo };
            return { ...prev, diagnosticos_cie10_lista: updated };
        });
    };

    // Crear nuevo Diagnóstico CIE-10 VÍA FETCH ASÍNCRONO
    const handleCrearCie10 = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nuevoCie10Codigo.trim() || !nuevoCie10Nombre.trim()) {
            notifyError(__('Ingresa el código y el nombre del diagnóstico.'));
            return;
        }

        setCreandoCie10(true);
        const codUpper = nuevoCie10Codigo.trim().toUpperCase();
        const nomTrim = nuevoCie10Nombre.trim();

        try {
            const response = await fetch('/admin/consultas/cie10', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    codigo: codUpper,
                    nombre: nomTrim,
                    especialidad_id: cita.especialidad_id,
                }),
            });

            const res = await response.json();
            setCreandoCie10(false);

            if (res.success || response.ok) {
                const item: Cie10Option = { codigo: codUpper, nombre: nomTrim };
                setCatalogoCie10((prev) => {
                    if (prev.some((c) => c.codigo === codUpper)) return prev;
                    return [item, ...prev];
                });

                // Agregar automáticamente a la lista de diagnósticos confirmados
                handleAddDiagnostico(codUpper, nomTrim, 'principal');

                setNuevoCie10Codigo('');
                setNuevoCie10Nombre('');
                setModalCrearCie10Open(false);

                notifySuccess(__('¡Nuevo diagnóstico CIE-10 creado y agregado a la consulta!'));
            } else {
                notifyError(__('Ocurrió un error al guardar el diagnóstico.'));
            }
        } catch (error) {
            setCreandoCie10(false);
            notifyError(__('Ocurrió un error de conexión al guardar el diagnóstico.'));
        }
    };

    // Registrar nuevo Estudio en Catálogo VÍA FETCH ASÍNCRONO
    const handleCrearEstudioCatalogo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nuevoEstudioNombreCat.trim()) {
            notifyError(__('Ingresa el nombre del estudio para el catálogo.'));
            return;
        }

        setCreandoEstudioCat(true);
        const nomTrim = nuevoEstudioNombreCat.trim();
        const tipoTrim = nuevoEstudioTipoCat;
        const indTrim = nuevoEstudioIndicacionesCat.trim() || 'En ayunas de 8 horas';

        try {
            const response = await fetch('/admin/consultas/estudios-catalogo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    tipo_estudio: tipoTrim,
                    nombre_estudio: nomTrim,
                    indicaciones_predeterminadas: indTrim,
                    especialidad_id: cita.especialidad_id,
                }),
            });

            const res = await response.json();
            setCreandoEstudioCat(false);

            if (res.success || response.ok) {
                const item: CatalogoEstudioOption = {
                    tipo_estudio: tipoTrim,
                    nombre_estudio: nomTrim,
                    indicaciones_predeterminadas: indTrim,
                };

                setCatalogoEstudios((prev) => [item, ...prev]);

                // Asignarlo al carrito usando actualización funcional limpia
                setData((prev) => {
                    if (prev.estudios_solicitados.some((e) => e.nombre_estudio === nomTrim)) {
                        return prev;
                    }
                    return {
                        ...prev,
                        estudios_solicitados: [
                            ...prev.estudios_solicitados,
                            { tipo_estudio: tipoTrim, nombre_estudio: nomTrim, indicaciones: indTrim },
                        ],
                    };
                });

                setNuevoEstudioNombreCat('');
                setModalCrearEstudioOpen(false);
                notifySuccess(__('¡Nuevo estudio guardado en el catálogo y agregado a la orden!'));
            } else {
                notifyError(__('Ocurrió un error al registrar el estudio en el catálogo.'));
            }
        } catch (error) {
            setCreandoEstudioCat(false);
            notifyError(__('Ocurrió un error de conexión al registrar el estudio.'));
        }
    };

    // Agregar Estudio Solicitado a la lista (Carrito)
    const handleAddEstudio = () => {
        if (!nuevoEstudio.nombre_estudio.trim()) {
            notifyError(__('Ingresa el nombre del estudio o examen solicitado.'));
            return;
        }

        const itemToAdd: EstudioItem = {
            tipo_estudio: nuevoEstudio.tipo_estudio || 'Laboratorio',
            nombre_estudio: nuevoEstudio.nombre_estudio.trim(),
            indicaciones: nuevoEstudio.indicaciones.trim(),
        };

        setData((prev) => ({
            ...prev,
            estudios_solicitados: [...prev.estudios_solicitados, itemToAdd],
        }));

        setNuevoEstudio({
            tipo_estudio: 'Laboratorio',
            nombre_estudio: '',
            indicaciones: 'En ayunas de 8 horas',
        });
        notifySuccess(__('Estudio agregado a la orden.'));
    };

    const handleRemoveEstudio = (index: number) => {
        setData((prev) => {
            const updated = [...prev.estudios_solicitados];
            updated.splice(index, 1);
            return { ...prev, estudios_solicitados: updated };
        });
    };

    // Agregar Medicamento a la Receta
    const handleAddMedicamento = () => {
        if (!nuevoMedicamento.medicamento_nombre.trim()) {
            notifyError(__('Ingresa el nombre del medicamento.'));
            return;
        }

        setData((prev) => ({
            ...prev,
            medicamentos: [...prev.medicamentos, { ...nuevoMedicamento }],
        }));

        setNuevoMedicamento({
            medicamento_nombre: '',
            dosis: '1 comprimido',
            via_administracion: 'Oral',
            frecuencia: 'Cada 8 horas',
            duracion_dias: 7,
            instrucciones: 'Tomar después de las comidas',
        });
        notifySuccess(__('Medicamento agregado a la receta.'));
    };

    const handleRemoveMedicamento = (index: number) => {
        setData((prev) => {
            const updated = [...prev.medicamentos];
            updated.splice(index, 1);
            return { ...prev, medicamentos: updated };
        });
    };

    const handleSubmitWizard = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/consultas/${cita.id}/atencion`, {
            onSuccess: () => {
                sessionStorage.removeItem(DRAFT_KEY);
                notifySuccess(__('¡Consulta médica finalizada con éxito, receta y orden de estudios emitidas!'));
            },
            onError: () => {
                notifyError(__('Por favor revisa los campos requeridos del formulario.'));
            },
        });
    };

    const calcularFechaFin = (inicioStr: string, diasNum: number) => {
        if (!inicioStr || !diasNum || diasNum < 1) return inicioStr;
        const [year, month, day] = inicioStr.split('-').map(Number);
        const fecha = new Date(year, month - 1, day);
        fecha.setDate(fecha.getDate() + (diasNum - 1));
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const calcularDiasEntreFechas = (inicioStr: string, finStr: string) => {
        if (!inicioStr || !finStr) return 1;
        const start = new Date(inicioStr);
        const end = new Date(finStr);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 1;
    };

    const steps = [
        { id: 1, label: __('1. Pre-Consulta'), icon: FileText },
        { id: 2, label: __('2. Signos Vitales'), icon: HeartPulse },
        { id: 3, label: __('3. Anamnesis & Diagnóstico'), icon: Stethoscope },
        { id: 4, label: __('4. Estudios Solicitados'), icon: FlaskConical },
        { id: 5, label: __('5. Receta Médica'), icon: Pill },
        { id: 6, label: __('6. Reposo Médico'), icon: Calendar },
        { id: 7, label: __('7. Finalizar Atención'), icon: CheckCircle2 },
    ];

    return (
        <div className="w-full space-y-6 pb-12">
            {/* Header del Módulo */}
            <ModuleHeader
                title={__('Atención Médica en Consultorio')}
                description={__('Expediente clínico electrónico, orden de estudios y prescripción de recetas.')}
                icon={<Stethoscope className="h-6 w-6 text-primary" />}
                action={
                    <Button onClick={() => router.get('/admin/consultas/sala-de-espera')} variant="outline" className="rounded-xl font-bold">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {__('Volver a Consultas')}
                    </Button>
                }
            />

            {/* Ficha Resumen del Paciente */}
            <div className="p-5 bg-card rounded-3xl border shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-primary">
                <div className="flex items-center space-x-4">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl shrink-0">
                        {paciente?.tipo_paciente === 'animal' ? '🐾' : '👤'}
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h2 className="font-extrabold text-lg text-foreground">
                                {paciente?.tipo_paciente === 'animal'
                                    ? `${paciente.nombre_mascota}`
                                    : `${paciente?.nombres} ${paciente?.apellidos}`}
                            </h2>
                            <Badge variant="outline" className="font-mono text-xs">
                                {paciente?.codigo_paciente}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                            <span>Dr(a). {cita.medico?.nombres} {cita.medico?.apellidos}</span>
                            <span>•</span>
                            <span className="font-semibold text-primary">{cita.especialidad?.nombre || 'General'}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <span className="text-xs text-muted-foreground block font-medium">{__('Código de Cita')}</span>
                        <span className="font-mono font-bold text-sm text-foreground">{cita.codigo_cita}</span>
                    </div>
                </div>
            </div>

            {/* Stepper Wizard Indicator */}
            <div className="bg-card rounded-3xl border p-3 shadow-2xs">
                <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                    {steps.map((s) => {
                        const Icon = s.icon;
                        const isActive = currentStep === s.id;
                        const isCompleted = currentStep > s.id;

                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setCurrentStep(s.id)}
                                className={cn(
                                    'p-3 rounded-2xl border text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer',
                                    isActive && 'bg-primary text-primary-foreground border-primary shadow-sm',
                                    isCompleted && 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
                                    !isActive && !isCompleted && 'bg-background hover:bg-muted/40 text-muted-foreground'
                                )}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{s.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Formulario Wizard Principal */}
            <form onSubmit={handleSubmitWizard} className="space-y-6">
                {/* PASO 1: Pre-Consulta */}
                {currentStep === 1 && (
                    <div className="p-6 bg-card rounded-3xl border shadow-2xs space-y-6 animate-in fade-in-50">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    {__('Paso 1: Revisión de Pre-Consulta & Cuestionario')}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {__('Respuestas capturadas en sala de espera antes del ingreso del paciente.')}
                                </p>
                            </div>
                            {preconsulta?.completado && (
                                <Button type="button" onClick={handleImportPreconsulta} variant="outline" size="sm" className="rounded-xl border-emerald-500/40 text-emerald-700 bg-emerald-500/10 font-bold">
                                    <Sparkles className="h-4 w-4 mr-1.5" />
                                    {__('Importar Respuestas a Motivo')}
                                </Button>
                            )}
                        </div>

                        {preconsulta?.completado ? (
                            <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border">
                                <span className="text-xs font-bold text-primary uppercase">{preconsulta.plantilla?.titulo || 'Cuestionario de Pre-Consulta'}</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                    {Object.entries(preconsulta.respuestas || {}).map(([k, v], idx) => (
                                        <div key={idx} className="p-3 bg-background rounded-xl border">
                                            <span className="font-bold text-muted-foreground block">{k}</span>
                                            <span className="font-semibold text-foreground">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 border-2 border-dashed rounded-2xl text-center text-muted-foreground space-y-2">
                                <HelpCircle className="h-8 w-8 mx-auto opacity-40" />
                                <p className="text-sm font-medium">{__('El paciente no completó cuestionario previo en sala de espera. Puedes proceder directamente.')}</p>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button type="button" onClick={() => setCurrentStep(2)} className="rounded-xl font-bold bg-primary">
                                {__('Siguiente: Signos Vitales')}
                                <ArrowRight className="h-4 w-4 ml-1.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* PASO 2: SIGNOS VITALES & MEDIDAS */}
                {currentStep === 2 && (
                    <div className="p-6 bg-card rounded-3xl border shadow-2xs space-y-6 animate-in fade-in-50">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <HeartPulse className="h-5 w-5 text-primary" />
                                    {__('Paso 2: Signos Vitales & Medidores Clínicos')}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {__('Registro de constantes vitales del paciente e indicadores cardiometabólicos en tiempo real.')}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-muted/20 rounded-2xl border space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                        <Activity className="size-3.5 text-rose-500" />
                                        Presión Arterial
                                    </span>
                                    <Badge variant="outline" className="text-[10px] font-mono">mmHg</Badge>
                                </div>
                                <Input
                                    value={data.presion_arterial}
                                    onChange={(e) => setData('presion_arterial', e.target.value)}
                                    placeholder="120/80"
                                    className="h-10 rounded-xl bg-background font-mono text-sm font-extrabold text-foreground"
                                />
                                <div className="p-2 bg-background rounded-xl border text-[11px] space-y-0.5">
                                    <span className="text-muted-foreground block text-[10px]">Evaluación Clínica:</span>
                                    <span className={cn('font-bold block', getBpStatus(data.presion_arterial).color)}>
                                        {getBpStatus(data.presion_arterial).label}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-muted/20 rounded-2xl border space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                        <HeartPulse className="size-3.5 text-rose-600 animate-pulse" />
                                        Frec. Cardíaca
                                    </span>
                                    <Badge variant="outline" className="text-[10px] font-mono">bpm</Badge>
                                </div>
                                <Input
                                    type="number"
                                    value={data.frecuencia_cardiaca}
                                    onChange={(e) => setData('frecuencia_cardiaca', parseInt(e.target.value) || 0)}
                                    className="h-10 rounded-xl bg-background font-mono text-sm font-extrabold text-foreground"
                                />
                                <div className="p-2 bg-background rounded-xl border text-[11px] space-y-0.5">
                                    <span className="text-muted-foreground block text-[10px]">Ritmo Cardíaco:</span>
                                    <span className={cn('font-bold block', getFcStatus(data.frecuencia_cardiaca).color)}>
                                        {getFcStatus(data.frecuencia_cardiaca).label}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-muted/20 rounded-2xl border space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                        <Thermometer className="size-3.5 text-amber-500" />
                                        Temperatura
                                    </span>
                                    <Badge variant="outline" className="text-[10px] font-mono">°C</Badge>
                                </div>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={data.temperatura}
                                    onChange={(e) => setData('temperatura', parseFloat(e.target.value) || 0)}
                                    className="h-10 rounded-xl bg-background font-mono text-sm font-extrabold text-foreground"
                                />
                                <div className="p-2 bg-background rounded-xl border text-[11px] space-y-0.5">
                                    <span className="text-muted-foreground block text-[10px]">Estado Térmico:</span>
                                    <span className={cn('font-bold block', getTempStatus(data.temperatura).color)}>
                                        {getTempStatus(data.temperatura).label}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-muted/20 rounded-2xl border space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                        <Gauge className="size-3.5 text-blue-500" />
                                        Oxígeno (SpO2)
                                    </span>
                                    <Badge variant="outline" className="text-[10px] font-mono">%</Badge>
                                </div>
                                <Input
                                    type="number"
                                    value={data.spo2}
                                    onChange={(e) => setData('spo2', parseInt(e.target.value) || 0)}
                                    className="h-10 rounded-xl bg-background font-mono text-sm font-extrabold text-foreground"
                                />
                                <div className="p-2 bg-background rounded-xl border text-[11px] space-y-0.5">
                                    <span className="text-muted-foreground block text-[10px]">Oxigenación:</span>
                                    <span className={cn('font-bold block', getSpo2Status(data.spo2).color)}>
                                        {getSpo2Status(data.spo2).label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-card rounded-2xl border space-y-4 border-l-4 border-l-emerald-500">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <div>
                                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                                        <TrendingUp className="size-4 text-emerald-600" />
                                        {__('Gráfico de Estado Nutricional & IMC (Índice de Masa Corporal)')}
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground">
                                        {__('Cálculo autocalculado en base a Peso (kg) y Talla (cm).')}
                                    </p>
                                </div>

                                <div className="flex items-center space-x-3 bg-muted/40 p-2 rounded-xl border">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-muted-foreground font-semibold block">{__('Peso / Talla')}</span>
                                        <span className="text-xs font-mono font-bold">{data.peso_kg} kg / {data.talla_cm} cm</span>
                                    </div>
                                    <div className="h-6 w-px bg-border" />
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-muted-foreground font-semibold block">{__('IMC Resultante')}</span>
                                        <span className="text-sm font-mono font-black text-emerald-600">{imcCalculado}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">{__('Peso del Paciente (kg)')}</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={data.peso_kg}
                                        onChange={(e) => setData('peso_kg', parseFloat(e.target.value) || 0)}
                                        className="h-9 rounded-xl font-mono text-xs font-bold"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">{__('Talla / Estatura (cm)')}</Label>
                                    <Input
                                        type="number"
                                        value={data.talla_cm}
                                        onChange={(e) => setData('talla_cm', parseFloat(e.target.value) || 0)}
                                        className="h-9 rounded-xl font-mono text-xs font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                    <span className="text-blue-600">Bajo Peso (&lt;18.5)</span>
                                    <span className="text-emerald-600">Saludable (18.5-24.9)</span>
                                    <span className="text-amber-600">Sobrepeso (25-29.9)</span>
                                    <span className="text-rose-600">Obesidad (≥30)</span>
                                </div>

                                <div className="relative h-4 w-full rounded-full bg-muted overflow-hidden flex shadow-inner">
                                    <div className="w-[18.5%] bg-blue-500 h-full" title="Bajo Peso" />
                                    <div className="w-[25%] bg-emerald-500 h-full" title="Saludable" />
                                    <div className="w-[20%] bg-amber-500 h-full" title="Sobrepeso" />
                                    <div className="w-[36.5%] bg-rose-500 h-full" title="Obesidad" />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Badge className={cn('text-xs font-extrabold px-3 py-1 rounded-xl', getImcStatus(Number(imcCalculado)).color)}>
                                        {__('Clasificación:')} {getImcStatus(Number(imcCalculado)).label}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="rounded-xl">
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                {__('Anterior')}
                            </Button>

                            <Button type="button" onClick={() => setCurrentStep(3)} className="rounded-xl font-bold bg-primary">
                                {__('Siguiente: Anamnesis & Diagnóstico')}
                                <ArrowRight className="h-4 w-4 ml-1.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* PASO 3: ANAMNESIS, EXAMEN FÍSICO, CONCLUSIÓN, OBSERVACIONES ADICIONALES & DIAGNÓSTICOS CIE-10 */}
                {currentStep === 3 && (
                    <div className="p-6 bg-card rounded-3xl border shadow-2xs space-y-6 animate-in fade-in-50">
                        <div className="border-b pb-4">
                            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                <Stethoscope className="h-5 w-5 text-primary" />
                                {__('Paso 3: Consulta Médica (Anamnesis, Examen Físico, Conclusión & Diagnósticos CIE-10)')}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {__('Ingresa la información clínica, hallazgos de exploración, conclusión, observaciones adicionales y diagnósticos CIE-10.')}
                            </p>
                        </div>

                        {/* Campo Motivo de Consulta */}
                        <div className="space-y-2">
                            <Label className="font-semibold text-foreground flex items-center gap-1.5">
                                <Activity className="size-4 text-primary" />
                                {__('Motivo de Consulta / Síntomas *')}
                            </Label>
                            <RichTextEditor
                                value={data.motivo_consulta}
                                onChange={(val) => setData('motivo_consulta', val)}
                                placeholder="Describa el motivo de consulta expresado por el paciente..."
                            />
                        </div>

                        {/* Campo Examen Físico */}
                        <div className="space-y-2 pt-2 border-t">
                            <Label className="font-semibold text-foreground flex items-center gap-1.5">
                                <Stethoscope className="size-4 text-primary" />
                                {__('Descripción del Examen Físico / Hallazgos *')}
                            </Label>
                            <RichTextEditor
                                value={data.examen_fisico}
                                onChange={(val) => setData('examen_fisico', val)}
                                placeholder="Describa hallazgos fisiológicos en la exploración clínica..."
                            />
                        </div>

                        {/* Campo Conclusión Diagnóstica */}
                        <div className="space-y-2 pt-2 border-t">
                            <Label className="font-semibold text-foreground flex items-center gap-1.5">
                                <ClipboardList className="size-4 text-primary" />
                                {__('Conclusión Diagnóstica / Evaluación *')}
                            </Label>
                            <RichTextEditor
                                value={data.conclusion}
                                onChange={(val) => setData('conclusion', val)}
                                placeholder="Resumen o conclusión clínica del diagnóstico determinado..."
                            />
                        </div>

                        {/* Campo Referido Para */}
                        <div className="space-y-2 pt-2 border-t">
                            <Label className="font-semibold text-foreground flex items-center gap-1.5">
                                <Send className="size-4 text-primary" />
                                {__('Referido Para (Especialidad / Interconsulta)')}
                            </Label>
                            <RichTextEditor
                                value={data.plan_tratamiento}
                                onChange={(val) => setData('plan_tratamiento', val)}
                                placeholder="Indique la especialidad, médico o centro de salud al que es referido el paciente..."
                            />
                        </div>

                        {/* Campo Observaciones Adicionales */}
                        <div className="space-y-2 pt-2 border-t">
                            <Label className="font-semibold text-foreground flex items-center gap-1.5">
                                <MessageSquareText className="size-4 text-primary" />
                                {__('Observaciones Adicionales / Notas Médicas Internas')}
                            </Label>
                            <RichTextEditor
                                value={data.observaciones_adicionales}
                                onChange={(val) => setData('observaciones_adicionales', val)}
                                placeholder="Observaciones especiales, recomendaciones privadas o notas de seguimiento..."
                            />
                        </div>

                        {/* SECCIÓN MÚLTIPLES DIAGNÓSTICOS CIE-10 CONFIRMADOS */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <div>
                                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                                        <Stethoscope className="size-4 text-primary" />
                                        {__('Diagnósticos CIE-10 Confirmados')}
                                        <Badge className="bg-primary text-primary-foreground font-mono text-xs px-2 py-0.5 rounded-full font-bold">
                                            {data.diagnosticos_cie10_lista.length}
                                        </Badge>
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground">
                                        {__('Puedes asociar múltiples diagnósticos (Principal, Secundario, Presuntivo) a esta consulta.')}
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => setModalCrearCie10Open(true)}
                                    className="rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 shadow-xs"
                                >
                                    <Plus className="size-3.5" />
                                    {__('+ Nuevo Diagnóstico CIE-10')}
                                </Button>
                            </div>

                            {/* Formulario de Adición Manual de Diagnósticos */}
                            <div className="p-4 bg-muted/20 rounded-2xl border space-y-3">
                                <span className="text-xs font-bold text-primary uppercase block">{__('Agregar Diagnóstico a la Lista')}</span>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold">{__('Código CIE-10')}</Label>
                                        <Input
                                            value={tempDiagCodigo}
                                            onChange={(e) => setTempDiagCodigo(e.target.value)}
                                            placeholder="ej: J00"
                                            className="h-9 rounded-xl font-mono text-xs font-bold uppercase bg-background"
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-1">
                                        <Label className="text-[11px] font-semibold">{__('Nombre / Descripción del Diagnóstico')}</Label>
                                        <Input
                                            value={tempDiagNombre}
                                            onChange={(e) => setTempDiagNombre(e.target.value)}
                                            placeholder="ej: Rinitis aguda (Resfriado común)..."
                                            className="h-9 rounded-xl text-xs font-bold bg-background"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold">{__('Tipo de Diagnóstico')}</Label>
                                        <Select
                                            value={tempDiagTipo}
                                            onValueChange={(val: any) => setTempDiagTipo(val)}
                                        >
                                            <SelectTrigger className="w-full h-9 text-xs rounded-xl bg-background font-bold">
                                                <SelectValue placeholder="Tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="principal">⭐ Principal</SelectItem>
                                                <SelectItem value="secundario">Secundario</SelectItem>
                                                <SelectItem value="presuntivo">Presuntivo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => handleAddDiagnostico(tempDiagCodigo, tempDiagNombre, tempDiagTipo)}
                                    variant="outline"
                                    className="w-full h-9 rounded-xl font-bold border-primary text-primary hover:bg-primary/10 gap-1.5"
                                >
                                    <Plus className="size-4" />
                                    {__('Agregar Diagnóstico a la Consulta')}
                                </Button>
                            </div>

                            {/* Buscador Rápido desde Catálogo */}
                            <div className="space-y-3 p-4 bg-muted/20 rounded-2xl border">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-primary uppercase">{__('Buscador Rápido de Diagnósticos CIE-10')}</Label>
                                    <span className="text-[10px] text-muted-foreground font-medium">{catalogoCie10.length} {__('en catálogo')}</span>
                                </div>
                                <Input
                                    type="text"
                                    placeholder={__('Buscar por código o nombre para agregar con un clic (ej: J00, Faringitis, HTA)...')}
                                    value={cie10Search}
                                    onChange={(e) => setCie10Search(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-background"
                                />

                                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
                                    {catalogoCie10.filter((c) =>
                                        `${c.codigo} ${c.nombre}`.toLowerCase().includes(cie10Search.toLowerCase())
                                    ).map((item, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleAddDiagnostico(item.codigo, item.nombre, 'principal')}
                                            className="text-[11px] px-3 py-1.5 rounded-xl border bg-background hover:bg-primary/10 hover:border-primary transition-all flex items-center space-x-1.5 cursor-pointer"
                                        >
                                            <Badge variant="outline" className="font-mono text-[9px] bg-primary/10 text-primary font-bold">
                                                {item.codigo}
                                            </Badge>
                                            <span className="font-medium text-foreground">{item.nombre}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Lista / Tabla de Diagnósticos Confirmados Agregados */}
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-foreground block">{__('Lista de Diagnósticos Confirmados para la Consulta:')}</span>

                                {data.diagnosticos_cie10_lista.length === 0 ? (
                                    <div className="p-6 border rounded-2xl bg-background text-center text-muted-foreground space-y-1">
                                        <AlertCircle className="size-6 mx-auto opacity-40 text-amber-500" />
                                        <p className="text-xs font-semibold">{__('No has agregado diagnósticos a esta consulta aún.')}</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-2xl border bg-background">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-muted/50 border-b font-bold text-muted-foreground">
                                                <tr>
                                                    <th className="p-3">{__('Código')}</th>
                                                    <th className="p-3">{__('Diagnóstico CIE-10')}</th>
                                                    <th className="p-3">{__('Clasificación / Tipo')}</th>
                                                    <th className="p-3 text-right">{__('Quitar')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y border-border/40 font-medium">
                                                {data.diagnosticos_cie10_lista.map((diag, idx) => (
                                                    <tr key={idx} className="hover:bg-muted/20">
                                                        <td className="p-3 font-mono font-bold text-primary">{diag.codigo}</td>
                                                        <td className="p-3 font-bold text-foreground">{diag.nombre}</td>
                                                        <td className="p-3">
                                                            <Select
                                                                value={diag.tipo}
                                                                onValueChange={(val: any) => handleChangeTipoDiagnostico(idx, val)}
                                                            >
                                                                <SelectTrigger className="w-32 h-7 text-[11px] rounded-lg font-bold">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="principal">⭐ Principal</SelectItem>
                                                                    <SelectItem value="secundario">Secundario</SelectItem>
                                                                    <SelectItem value="presuntivo">Presuntivo</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveDiagnostico(idx)}
                                                                className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="rounded-xl">
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                {__('Anterior')}
                            </Button>

                            <Button type="button" onClick={() => setCurrentStep(4)} className="rounded-xl font-bold bg-primary">
                                {__('Siguiente: Estudios Solicitados')}
                                <ArrowRight className="h-4 w-4 ml-1.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* PASO 4: ESTUDIOS SOLICITADOS CON TABLA DE EXÁMENES SUGERIDOS EN BASE DE DATOS Y BOTÓN REGISTRAR */}
                {currentStep === 4 && (
                    <div className="p-6 bg-card rounded-3xl border shadow-2xs space-y-6 animate-in fade-in-50">
                        <div className="border-b pb-4">
                            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                <FlaskConical className="h-5 w-5 text-primary" />
                                {__('Paso 4: Solicitud de Estudios de Laboratorio e Imágenes')}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {__('Agrega los exámenes paraclínicos, laboratorios e imagenología indicados al paciente.')}
                            </p>
                        </div>

                        {/* Selección Rápida de Estudios Frecuentes desde Catálogo BD + Botón Registrar Nuevo */}
                        <div className="space-y-3 p-4 bg-muted/20 rounded-2xl border">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-primary uppercase block">
                                    {__('Catálogo de Exámenes Sugeridos')} ({catalogoEstudios.length})
                                </span>
                                <Button
                                    type="button"
                                    onClick={() => setModalCrearEstudioOpen(true)}
                                    className="rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-7 shadow-xs"
                                >
                                    <Plus className="size-3.5" />
                                    {__('+ Registrar Nuevo Estudio en Catálogo')}
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pt-1">
                                {catalogoEstudios.map((s, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            setData((prev) => {
                                                if (prev.estudios_solicitados.some((e) => e.nombre_estudio === s.nombre_estudio)) {
                                                    return prev;
                                                }
                                                return {
                                                    ...prev,
                                                    estudios_solicitados: [
                                                        ...prev.estudios_solicitados,
                                                        {
                                                            tipo_estudio: s.tipo_estudio,
                                                            nombre_estudio: s.nombre_estudio,
                                                            indicaciones: s.indicaciones_predeterminadas || 'En ayunas de 8 horas',
                                                        },
                                                    ],
                                                };
                                            });
                                            notifySuccess(__('Estudio agregado a la orden.'));
                                        }}
                                        className="text-[11px] px-3 py-1.5 rounded-xl border bg-background hover:bg-primary/10 hover:border-primary transition-all flex items-center space-x-1.5 cursor-pointer"
                                    >
                                        <Badge variant="outline" className="font-mono text-[9px] bg-primary/10 text-primary font-bold">
                                            {s.tipo_estudio}
                                        </Badge>
                                        <span className="font-medium text-foreground">{s.nombre_estudio}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Formulario Agregar Estudio Personalizado (Carrito) */}
                        <div className="p-4 bg-muted/20 rounded-2xl border space-y-4">
                            <span className="text-xs font-bold text-primary uppercase block">{__('Agregar Estudio Personalizado a la Orden Activa')}</span>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold">{__('Tipo de Estudio')}</Label>
                                    <Select
                                        value={nuevoEstudio.tipo_estudio}
                                        onValueChange={(val) => setNuevoEstudio({ ...nuevoEstudio, tipo_estudio: val })}
                                    >
                                        <SelectTrigger className="w-full h-9 text-xs rounded-xl bg-background font-bold">
                                            <SelectValue placeholder="Tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Laboratorio">Laboratorio</SelectItem>
                                            <SelectItem value="Imagenología">Imagenología (Rx, Eco, TAC)</SelectItem>
                                            <SelectItem value="Electrofisiología">Electrofisiología (ECG)</SelectItem>
                                            <SelectItem value="Otro">Otro Examen</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                    <Label className="text-[11px] font-semibold">{__('Nombre del Estudio / Examen Solicitado *')}</Label>
                                    <Input
                                        value={nuevoEstudio.nombre_estudio}
                                        onChange={(e) => setNuevoEstudio({ ...nuevoEstudio, nombre_estudio: e.target.value })}
                                        placeholder="ej: Hemograma Completo, Ecografía Abdominal..."
                                        className="h-9 text-xs rounded-xl bg-background font-bold"
                                    />
                                </div>

                                <div className="space-y-1 md:col-span-3">
                                    <Label className="text-[11px] font-semibold">{__('Indicaciones / Preparación Especial')}</Label>
                                    <Input
                                        value={nuevoEstudio.indicaciones}
                                        onChange={(e) => setNuevoEstudio({ ...nuevoEstudio, indicaciones: e.target.value })}
                                        placeholder="ej: Ayuno de 8 a 12 horas, Vejiga llena..."
                                        className="h-9 text-xs rounded-xl bg-background"
                                    />
                                </div>
                            </div>

                            <Button type="button" onClick={handleAddEstudio} variant="outline" className="w-full h-9 rounded-xl font-bold border-primary text-primary hover:bg-primary/10 gap-1.5">
                                <Plus className="size-4" />
                                {__('Agregar Estudio a la Orden')}
                            </Button>
                        </div>

                        {/* Carrito de Compras / Tabla de Estudios Agregados */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground block">{__('Estudios Solicitados en la Orden:')}</span>
                                <Badge className="bg-primary text-primary-foreground font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                                    {data.estudios_solicitados.length} {__('estudios')}
                                </Badge>
                            </div>

                            {data.estudios_solicitados.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic p-6 text-center border rounded-2xl bg-background">{__('No has agregado estudios o laboratorios a la orden (Opcional).')}</p>
                            ) : (
                                <div className="overflow-x-auto rounded-2xl border bg-background">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted/50 border-b font-bold text-muted-foreground">
                                            <tr>
                                                <th className="p-3">{__('Tipo')}</th>
                                                <th className="p-3">{__('Estudio Solicitado')}</th>
                                                <th className="p-3">{__('Indicaciones / Preparación')}</th>
                                                <th className="p-3 text-right">{__('Quitar')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y border-border/40 font-medium">
                                            {data.estudios_solicitados.map((est, idx) => (
                                                <tr key={idx} className="hover:bg-muted/20">
                                                    <td className="p-3">
                                                        <Badge variant="outline" className="text-[10px] font-bold">
                                                            {est.tipo_estudio}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 font-bold text-primary">{est.nombre_estudio}</td>
                                                    <td className="p-3 text-muted-foreground">{est.indicaciones || '-'}</td>
                                                    <td className="p-3 text-right">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveEstudio(idx)}
                                                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button type="button" variant="outline" onClick={() => setCurrentStep(3)} className="rounded-xl">
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                {__('Anterior')}
                            </Button>

                            <Button type="button" onClick={() => setCurrentStep(5)} className="rounded-xl font-bold bg-primary">
                                {__('Siguiente: Prescribir Receta')}
                                <ArrowRight className="h-4 w-4 ml-1.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* PASO 5: RECETA MÉDICA DIGITAL */}
                {currentStep === 5 && (
                    <div className="p-6 bg-card rounded-3xl border shadow-2xs space-y-6 animate-in fade-in-50">
                        <div className="border-b pb-4">
                            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                <Pill className="h-5 w-5 text-primary" />
                                {__('Paso 5: Prescripción de Receta Médica Digital')}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {__('Agrega los medicamentos prescritos con su posología y vía de administración.')}
                            </p>
                        </div>

                        <div className="p-4 bg-muted/20 rounded-2xl border space-y-4">
                            <span className="text-xs font-bold text-primary uppercase block">{__('Agregar Medicamento al Vademécum')}</span>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold">{__('Nombre del Medicamento *')}</Label>
                                    <Input
                                        value={nuevoMedicamento.medicamento_nombre}
                                        onChange={(e) => setNuevoMedicamento({ ...nuevoMedicamento, medicamento_nombre: e.target.value })}
                                        placeholder="ej: Amoxicilina 500mg"
                                        className="h-9 text-xs rounded-xl bg-background font-bold"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold">{__('Dosis')}</Label>
                                    <Input
                                        value={nuevoMedicamento.dosis}
                                        onChange={(e) => setNuevoMedicamento({ ...nuevoMedicamento, dosis: e.target.value })}
                                        placeholder="ej: 1 tabletas"
                                        className="h-9 text-xs rounded-xl bg-background"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold">{__('Vía de Administración')}</Label>
                                    <Select
                                        value={nuevoMedicamento.via_administracion}
                                        onValueChange={(val) => setNuevoMedicamento({ ...nuevoMedicamento, via_administracion: val })}
                                    >
                                        <SelectTrigger className="w-full h-9 text-xs rounded-xl bg-background font-bold">
                                            <SelectValue placeholder="Vía" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Oral">Oral</SelectItem>
                                            <SelectItem value="Intravenosa">Intravenosa</SelectItem>
                                            <SelectItem value="Intramuscular">Intramuscular</SelectItem>
                                            <SelectItem value="Tópica">Tópica</SelectItem>
                                            <SelectItem value="Oftálmica">Oftálmica</SelectItem>
                                            <SelectItem value="Inhalada">Inhalada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold">{__('Frecuencia')}</Label>
                                    <Input
                                        value={nuevoMedicamento.frecuencia}
                                        onChange={(e) => setNuevoMedicamento({ ...nuevoMedicamento, frecuencia: e.target.value })}
                                        placeholder="ej: Cada 8 horas"
                                        className="h-9 text-xs rounded-xl bg-background"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold">{__('Duración (Días)')}</Label>
                                    <Input
                                        type="number"
                                        value={nuevoMedicamento.duracion_dias}
                                        onChange={(e) => setNuevoMedicamento({ ...nuevoMedicamento, duracion_dias: parseInt(e.target.value) || 1 })}
                                        className="h-9 text-xs rounded-xl bg-background"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold">{__('Instrucciones Adicionales')}</Label>
                                    <Input
                                        value={nuevoMedicamento.instrucciones}
                                        onChange={(e) => setNuevoMedicamento({ ...nuevoMedicamento, instrucciones: e.target.value })}
                                        placeholder="ej: Con los alimentos"
                                        className="h-9 text-xs rounded-xl bg-background"
                                    />
                                </div>
                            </div>

                            <Button type="button" onClick={handleAddMedicamento} variant="outline" className="w-full h-9 rounded-xl font-bold border-primary text-primary hover:bg-primary/10 gap-1.5">
                                <Plus className="size-4" />
                                {__('Agregar Medicamento a la Receta')}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs font-bold text-foreground block">{__('Medicamentos en la Receta:')} ({data.medicamentos.length})</span>
                            {data.medicamentos.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic p-4 text-center border rounded-2xl">{__('No has agregado medicamentos a la receta aún (Opcional).')}</p>
                            ) : (
                                <div className="overflow-x-auto rounded-2xl border">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted/50 border-b font-bold text-muted-foreground">
                                            <tr>
                                                <th className="p-3">{__('Medicamento')}</th>
                                                <th className="p-3">{__('Dosis & Vía')}</th>
                                                <th className="p-3">{__('Frecuencia & Días')}</th>
                                                <th className="p-3">{__('Instrucciones')}</th>
                                                <th className="p-3 text-right">{__('Quitar')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y border-border/40 font-medium">
                                            {data.medicamentos.map((m, idx) => (
                                                <tr key={idx} className="hover:bg-muted/20">
                                                    <td className="p-3 font-bold text-primary">{m.medicamento_nombre}</td>
                                                    <td className="p-3">{m.dosis} • {m.via_administracion}</td>
                                                    <td className="p-3">{m.frecuencia} por {m.duracion_dias} días</td>
                                                    <td className="p-3 text-muted-foreground">{m.instrucciones || '-'}</td>
                                                    <td className="p-3 text-right">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveMedicamento(idx)}
                                                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button type="button" variant="outline" onClick={() => setCurrentStep(4)} className="rounded-xl">
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                {__('Anterior')}
                            </Button>

                            <Button type="button" onClick={() => setCurrentStep(6)} className="rounded-xl font-bold bg-primary">
                                {__('Siguiente: Reposo Médico')}
                                <ArrowRight className="h-4 w-4 ml-1.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* PASO 6: REPOSO MÉDICO / INCAPACIDAD */}
                {currentStep === 6 && (
                    <div className="p-6 bg-card rounded-3xl border shadow-2xs space-y-6 animate-in fade-in-50">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-amber-600" />
                                    {__('Paso 6: Reposo Médico / Incapacidad')}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {__('Configure la constancia o certificado de reposo médico para el paciente.')}
                                </p>
                            </div>

                            <div className="flex items-center space-x-3 bg-amber-500/10 px-4 py-2 rounded-2xl border border-amber-500/30">
                                <Label htmlFor="tiene_reposo_switch" className="text-xs font-extrabold text-amber-900 cursor-pointer">
                                    {data.tiene_reposo ? __('¿Emitir Reposo Médico? SÍ') : __('¿Emitir Reposo Médico? NO')}
                                </Label>
                                <Switch
                                    id="tiene_reposo_switch"
                                    checked={data.tiene_reposo}
                                    onCheckedChange={(checked) => setData('tiene_reposo', checked)}
                                />
                            </div>
                        </div>

                        {data.tiene_reposo ? (
                            <div className="space-y-6">
                                {/* Distribución limpia en 4 columnas en pantallas de escritorio */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Tipo de Reposo con Radix UI Select */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold">{__('Tipo de Reposo')}</Label>
                                        <Select
                                            value={data.tipo_reposo}
                                            onValueChange={(val) => setData('tipo_reposo', val)}
                                        >
                                            <SelectTrigger className="w-full h-10 text-xs font-bold rounded-xl border bg-background">
                                                <SelectValue placeholder={__('Seleccionar tipo...')} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl shadow-lg">
                                                <SelectItem value="relativo" className="text-xs font-bold cursor-pointer">Reposo Relativo</SelectItem>
                                                <SelectItem value="absoluto" className="text-xs font-bold cursor-pointer">Reposo Absoluto</SelectItem>
                                                <SelectItem value="laboral" className="text-xs font-bold cursor-pointer">Incapacidad Laboral Temporaria</SelectItem>
                                                <SelectItem value="deportivo" className="text-xs font-bold cursor-pointer">Reposo Deportivo / Físico</SelectItem>
                                                <SelectItem value="domiciliario" className="text-xs font-bold cursor-pointer">Reposo Domiciliario</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Días de Reposo */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold">{__('Días de Reposo (Duración)')}</Label>
                                        <div className="flex items-center space-x-2">
                                            <Input
                                                type="number"
                                                min={1}
                                                max={365}
                                                value={data.dias_reposo}
                                                onChange={(e) => {
                                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                                    const finCalculada = calcularFechaFin(data.fecha_inicio_reposo, val);
                                                    setData((prev) => ({
                                                        ...prev,
                                                        dias_reposo: val,
                                                        fecha_fin_reposo: finCalculada,
                                                    }));
                                                }}
                                                className="h-10 text-xs font-bold rounded-xl"
                                            />
                                            <span className="text-xs font-extrabold text-muted-foreground uppercase">{__('Días')}</span>
                                        </div>
                                    </div>

                                    {/* Fecha de Inicio del Reposo */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold">{__('Fecha Desde (Inicio)')}</Label>
                                        <Input
                                            type="date"
                                            value={data.fecha_inicio_reposo}
                                            onChange={(e) => {
                                                const newInicio = e.target.value;
                                                const newFin = calcularFechaFin(newInicio, data.dias_reposo);
                                                setData((prev) => ({
                                                    ...prev,
                                                    fecha_inicio_reposo: newInicio,
                                                    fecha_fin_reposo: newFin,
                                                }));
                                            }}
                                            className="h-10 text-xs font-bold rounded-xl"
                                        />
                                    </div>

                                    {/* Fecha de Fin del Reposo */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold">{__('Fecha Hasta (Culminación)')}</Label>
                                        <Input
                                            type="date"
                                            value={data.fecha_fin_reposo}
                                            onChange={(e) => {
                                                const newFin = e.target.value;
                                                const newDias = calcularDiasEntreFechas(data.fecha_inicio_reposo, newFin);
                                                setData((prev) => ({
                                                    ...prev,
                                                    fecha_fin_reposo: newFin,
                                                    dias_reposo: newDias,
                                                }));
                                            }}
                                            className="h-10 text-xs font-bold rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Motivo de Reposo / Justificación Médica */}
                                <div className="space-y-2 pt-2 border-t">
                                    <Label className="font-semibold text-foreground flex items-center gap-1.5">
                                        <FileText className="size-4 text-primary" />
                                        {__('Motivo / Justificación Médica del Reposo')}
                                    </Label>
                                    <RichTextEditor
                                        value={data.motivo_reposo}
                                        onChange={(val) => setData('motivo_reposo', val)}
                                        placeholder={__('Ej. Paciente requiere reposo médico por cuadro de lumbago agudo. Evitar esfuerzo físico.')}
                                    />
                                </div>

                                {/* Observaciones Adicionales del Reposo */}
                                <div className="space-y-2 pt-2 border-t">
                                    <Label className="font-semibold text-foreground flex items-center gap-1.5">
                                        <MessageSquareText className="size-4 text-primary" />
                                        {__('Observaciones Adicionales del Reposo')}
                                    </Label>
                                    <RichTextEditor
                                        value={data.observaciones_reposo}
                                        onChange={(val) => setData('observaciones_reposo', val)}
                                        placeholder={__('Observaciones o recomendaciones para la empresa o patrono...')}
                                    />
                                </div>

                                {/* Banner Resumen Automático de Fechas */}
                                <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className="h-6 w-6 text-amber-600 shrink-0" />
                                        <div>
                                            <span className="font-extrabold text-xs text-amber-900 block">
                                                {__('REPOSO MÉDICO')} {data.tipo_reposo.toUpperCase()} - {data.dias_reposo} {__('DÍAS')}
                                            </span>
                                            <p className="text-xs text-amber-800 font-medium">
                                                {__('Válido desde el')} <strong>{data.fecha_inicio_reposo}</strong> {__('hasta el')} <strong>{data.fecha_fin_reposo}</strong> {__('inclusive.')}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-amber-600 text-white font-bold text-xs px-3 py-1 rounded-xl">
                                        {__('Incapacidad Activa')}
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-muted/20 rounded-2xl border border-dashed">
                                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                                <p className="text-xs text-muted-foreground font-bold">{__('El paciente NO requiere certificado de reposo médico en esta consulta.')}</p>
                                <Button type="button" onClick={() => setData('tiene_reposo', true)} variant="outline" className="mt-3 text-xs font-bold rounded-xl border-amber-500/50 text-amber-800 hover:bg-amber-500/10">
                                    + {__('Activar Reposo Médico')}
                                </Button>
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <Button type="button" variant="outline" onClick={() => setCurrentStep(5)} className="rounded-xl">
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                {__('Anterior')}
                            </Button>

                            <Button type="button" onClick={() => setCurrentStep(7)} className="rounded-xl font-bold bg-primary">
                                {__('Siguiente: Resumen & Finalizar')}
                                <ArrowRight className="h-4 w-4 ml-1.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* PASO 7: RESUMEN & FINALIZACIÓN */}
                {currentStep === 7 && (
                    <div className="p-6 bg-card rounded-3xl border shadow-2xs space-y-6 animate-in fade-in-50">
                        <div className="border-b pb-4">
                            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                {__('Paso 7: Resumen de Consulta & Emisión de Documentos')}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {__('Verifica los datos de la atención antes de concluir la consulta médica.')}
                            </p>
                        </div>

                        <div className="p-5 bg-muted/20 rounded-2xl border space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="font-bold text-muted-foreground block">{__('Paciente:')}</span>
                                    <span className="font-extrabold text-foreground text-sm">
                                        {paciente?.tipo_paciente === 'animal'
                                            ? `${paciente.nombre_mascota}`
                                            : `${paciente?.nombres} ${paciente?.apellidos}`}
                                    </span>
                                </div>

                                <div>
                                    <span className="font-bold text-muted-foreground block">{__('Diagnósticos Confirmados:')}</span>
                                    {data.diagnosticos_cie10_lista.length === 0 ? (
                                        <span className="font-bold text-muted-foreground">Ninguno especificado</span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {data.diagnosticos_cie10_lista.map((d, idx) => (
                                                <Badge key={idx} variant="outline" className="font-bold bg-background text-primary border-primary/40">
                                                    [{d.codigo}] {d.nombre} ({d.tipo})
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {data.conclusion && (
                                    <div className="md:col-span-2 bg-background p-3 rounded-xl border">
                                        <span className="font-bold text-muted-foreground block text-[11px]">{__('Conclusión Diagnóstica:')}</span>
                                        <span className="font-semibold text-foreground text-xs">{data.conclusion}</span>
                                    </div>
                                )}

                                {data.observaciones_adicionales && (
                                    <div className="md:col-span-2 bg-background p-3 rounded-xl border border-l-4 border-l-primary">
                                        <span className="font-bold text-primary block text-[11px]">{__('Observaciones Adicionales / Notas Médicas Internas:')}</span>
                                        <span className="font-medium text-foreground text-xs">{data.observaciones_adicionales}</span>
                                    </div>
                                )}

                                <div>
                                    <span className="font-bold text-muted-foreground block">{__('Signos Vitales Capturados:')}</span>
                                    <span className="font-mono text-foreground font-bold">
                                        PA: {data.presion_arterial} | FC: {data.frecuencia_cardiaca} bpm | Temp: {data.temperatura}°C | SpO2: {data.spo2}% | IMC: {imcCalculado} ({getImcStatus(Number(imcCalculado)).label})
                                    </span>
                                </div>

                                <div>
                                    <span className="font-bold text-muted-foreground block">{__('Estudios Solicitados:')}</span>
                                    <span className="font-bold text-blue-600">{data.estudios_solicitados.length} exámenes solicitados</span>
                                </div>

                                <div>
                                    <span className="font-bold text-muted-foreground block">{__('Medicamentos en Receta:')}</span>
                                    <span className="font-bold text-emerald-600">{data.medicamentos.length} medicamentos prescritos</span>
                                </div>

                                <div>
                                    <span className="font-bold text-muted-foreground block">{__('Reposo Médico:')}</span>
                                    {data.tiene_reposo ? (
                                        <span className="font-bold text-amber-600">
                                            {data.dias_reposo} días ({data.fecha_inicio_reposo} al {data.fecha_fin_reposo})
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">Sin reposo emitido</span>
                                    )}
                                </div>
                            </div>

                            {consulta.id && (
                                <div className="pt-3 border-t flex flex-wrap gap-2 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.open(`/admin/consultas/${consulta.id}/imprimir/informe`, '_blank')}
                                        className="h-8 text-xs font-bold rounded-xl border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
                                    >
                                        <Printer className="size-3.5" />
                                        📄 Imprimir Informe Médico
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.open(`/admin/consultas/${consulta.id}/imprimir/receta`, '_blank')}
                                        className="h-8 text-xs font-bold rounded-xl border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 gap-1.5"
                                    >
                                        <Pill className="size-3.5 text-emerald-600" />
                                        💊 Imprimir Receta (RP)
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.open(`/admin/consultas/${consulta.id}/imprimir/estudios`, '_blank')}
                                        className="h-8 text-xs font-bold rounded-xl border-blue-500/40 text-blue-700 hover:bg-blue-500/10 gap-1.5"
                                    >
                                        <FlaskConical className="size-3.5 text-blue-600" />
                                        🔬 Imprimir Orden de Estudios
                                    </Button>

                                    {data.tiene_reposo && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => window.open(`/admin/consultas/${consulta.id}/imprimir/reposo`, '_blank')}
                                            className="h-8 text-xs font-bold rounded-xl border-amber-500/40 text-amber-700 hover:bg-amber-500/10 gap-1.5"
                                        >
                                            <Calendar className="size-3.5 text-amber-600" />
                                            📜 Imprimir Certificado de Reposo
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button type="button" variant="outline" onClick={() => setCurrentStep(6)} className="rounded-xl">
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                {__('Anterior')}
                            </Button>

                            <Button type="submit" disabled={processing} className="rounded-xl font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-11 text-sm shadow-md gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                {__('Finalizar Consulta & Emitir Documentos')}
                            </Button>
                        </div>
                    </div>
                )}
            </form>

            {/* MODAL DIALOG PARA CREAR NUEVO DIAGNÓSTICO CIE-10 */}
            <Dialog open={modalCrearCie10Open} onOpenChange={setModalCrearCie10Open}>
                <DialogContent className="rounded-3xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-extrabold text-base text-foreground">
                            <Stethoscope className="size-5 text-emerald-600" />
                            {__('Crear Nuevo Diagnóstico CIE-10')}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {__('Registra un nuevo código y nombre de diagnóstico clínico para utilizarlo en tus consultas.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCrearCie10} className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">{__('Código CIE-10 *')}</Label>
                            <Input
                                value={nuevoCie10Codigo}
                                onChange={(e) => setNuevoCie10Codigo(e.target.value)}
                                placeholder="ej: J06.9 o Z00.0"
                                className="h-10 rounded-xl font-mono text-xs font-bold uppercase"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">{__('Nombre / Descripción del Diagnóstico *')}</Label>
                            <Input
                                value={nuevoCie10Nombre}
                                onChange={(e) => setNuevoCie10Nombre(e.target.value)}
                                placeholder="ej: Infección respiratoria aguda alta no especificada"
                                className="h-10 rounded-xl text-xs font-bold"
                                required
                            />
                        </div>

                        <DialogFooter className="pt-2 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalCrearCie10Open(false)}
                                className="rounded-xl font-bold h-9 text-xs"
                            >
                                {__('Cancelar')}
                            </Button>

                            <Button
                                type="submit"
                                disabled={creandoCie10}
                                className="rounded-xl font-bold h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            >
                                <Plus className="size-4" />
                                {__('Guardar y Agregar a Consulta')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL DIALOG PARA REGISTRAR NUEVO ESTUDIO EN CATÁLOGO */}
            <Dialog open={modalCrearEstudioOpen} onOpenChange={setModalCrearEstudioOpen}>
                <DialogContent className="rounded-3xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-extrabold text-base text-foreground">
                            <FlaskConical className="size-5 text-emerald-600" />
                            {__('Registrar Nuevo Estudio en Catálogo')}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {__('Añade un nuevo examen o estudio predeterminado a las sugerencias para usarse en futuras órdenes médicas.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCrearEstudioCatalogo} className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">{__('Tipo de Estudio *')}</Label>
                            <Select value={nuevoEstudioTipoCat} onValueChange={setNuevoEstudioTipoCat}>
                                <SelectTrigger className="w-full h-10 rounded-xl text-xs bg-background font-medium">
                                    <SelectValue placeholder="Seleccione Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Laboratorio">Laboratorio</SelectItem>
                                    <SelectItem value="Imagenología">Imagenología (Rx, Eco, TAC, RM)</SelectItem>
                                    <SelectItem value="Electrofisiología">Electrofisiología (ECG, EEG)</SelectItem>
                                    <SelectItem value="Otro">Otro Examen</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">{__('Nombre del Estudio / Examen *')}</Label>
                            <Input
                                value={nuevoEstudioNombreCat}
                                onChange={(e) => setNuevoEstudioNombreCat(e.target.value)}
                                placeholder="ej: Perfil Tiroideo Completo (T3, T4, TSH)"
                                className="h-10 rounded-xl text-xs font-bold"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">{__('Indicaciones Predeterminadas')}</Label>
                            <Input
                                value={nuevoEstudioIndicacionesCat}
                                onChange={(e) => setNuevoEstudioIndicacionesCat(e.target.value)}
                                placeholder="ej: Ayuno de 8 horas en horario matutino"
                                className="h-10 rounded-xl text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalCrearEstudioOpen(false)}
                                className="rounded-xl font-bold h-9 text-xs"
                            >
                                {__('Cancelar')}
                            </Button>

                            <Button
                                type="submit"
                                disabled={creandoEstudioCat}
                                className="rounded-xl font-bold h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            >
                                <Plus className="size-4" />
                                {__('Guardar en Catálogo')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
