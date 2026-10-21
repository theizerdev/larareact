import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Camera, CheckCircle2, ScanFace, ShieldCheck, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { CameraWidget } from '@/components/admin/empleados/CameraWidget';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

interface EmpleadoEnrolamiento {
    id: number;
    numero: string | null;
    nombres: string;
    apellidos: string;
    area: string | null;
    genero: string | null;
    fecha_nacimiento: string | null;
    enrolado_en: string | null;
}

interface Props {
    empleado: EmpleadoEnrolamiento;
    empresa: string | null;
}

type CampoFoto = 'foto_empleado' | 'foto_empleado_2';

/** Lado mayor (px) de una foto subida desde archivo; la cámara ya entrega 640×480. */
const LADO_MAXIMO = 1280;

const FOTOS: { campo: CampoFoto; titulo: string }[] = [
    { campo: 'foto_empleado', titulo: 'Foto frontal 1' },
    { campo: 'foto_empleado_2', titulo: 'Foto frontal 2' },
];

/** Aviso de privacidad simplificado. Validar el texto con el área legal de la empresa. */
function AvisoPrivacidad({ empresa }: { empresa: string }) {
    return (
        <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
                <strong>{empresa}</strong> es responsable del tratamiento de los datos personales que se recaban en este proceso:
                número de empleado, nombre, apellidos, área, sexo, fecha de nacimiento y fotografías de su rostro.
            </p>
            <p>
                Estos datos se utilizan únicamente para registrar su asistencia en el reloj checador con reconocimiento facial
                y para controlar el acceso a las instalaciones.
            </p>
            <p>
                Las fotografías de su rostro son datos biométricos y se consideran datos personales sensibles. Al aceptar este
                aviso otorga su consentimiento expreso para que se traten con las finalidades descritas.
            </p>
            <p>
                Puede ejercer sus derechos de acceso, rectificación, cancelación y oposición (ARCO), o revocar su consentimiento,
                a través del área de Recursos Humanos.
            </p>
        </div>
    );
}

function Pasos({ paso }: { paso: number }) {
    const etiquetas = ['Bienvenida', 'Captura', 'Listo'];

    return (
        <ol className="flex items-center gap-2 text-xs font-medium">
            {etiquetas.map((etiqueta, i) => (
                <li key={etiqueta} className="flex items-center gap-2">
                    <span className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full border',
                        paso > i ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-slate-500 dark:border-slate-700',
                    )}>
                        {i + 1}
                    </span>
                    <span className={cn(paso > i ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground')}>{etiqueta}</span>
                    {i < etiquetas.length - 1 && <span className="h-px w-6 bg-slate-300 dark:bg-slate-700" />}
                </li>
            ))}
        </ol>
    );
}

function Dato({ etiqueta, valor, mono = false }: { etiqueta: string; valor: string | null; mono?: boolean }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{etiqueta}</p>
            <p className={cn('mt-0.5 font-semibold text-slate-800 dark:text-slate-100', mono && 'font-mono tracking-wider')}>{valor || '—'}</p>
        </div>
    );
}

export default function EnrolamientoPage({ empleado, empresa }: Props) {
    const { __ } = useTranslate();
    const [paso, setPaso] = useState(1);
    const [camara, setCamara] = useState<CampoFoto | null>(null);
    const archivoRef = useRef<HTMLInputElement>(null);
    const [archivoCampo, setArchivoCampo] = useState<CampoFoto | null>(null);

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        aviso_privacidad: false,
        foto_empleado: '',
        foto_empleado_2: '',
        genero: empleado.genero === 'M' || empleado.genero === 'F' ? empleado.genero : '',
        fecha_nacimiento: empleado.fecha_nacimiento || '',
    });

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Employees'), href: '/admin/empleados' },
        { title: __('Enrolamiento'), href: `/admin/empleados/${empleado.id}/enrolamiento` },
    ];

    const elegirArchivo = (campo: CampoFoto) => {
        setArchivoCampo(campo);
        archivoRef.current?.click();
    };

    const leerArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        e.target.value = '';
        if (!archivo || !archivoCampo) return;

        const campo = archivoCampo;
        const lector = new FileReader();
        lector.onload = () => {
            // Una foto de celular pesa varios MB y dos en base64 rebasan el post_max_size de PHP:
            // se reduce como las de la cámara antes de enviarla.
            const img = new Image();
            img.onload = () => {
                const escala = Math.min(1, LADO_MAXIMO / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * escala);
                canvas.height = Math.round(img.height * escala);
                canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
                setData(campo, canvas.toDataURL('image/jpeg', 0.9));
                clearErrors(campo);
            };
            img.src = String(lector.result);
        };
        lector.readAsDataURL(archivo);
    };

    const finalizar = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/empleados/${empleado.id}/enrolamiento`, {
            preserveScroll: true,
            onSuccess: () => setPaso(3),
        });
    };

    return (
        <>
            <Head title={__('Enrolamiento')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="mx-auto max-w-3xl space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Button variant="ghost" size="sm" onClick={() => router.get('/admin/empleados')}>
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            {__('Employees')}
                        </Button>
                        <Pasos paso={paso} />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 sm:p-8">
                        {paso === 1 && (
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                                        <ScanFace className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            ¡Bienvenido(a), {empleado.nombres}!
                                        </h1>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Vamos a registrar tu rostro para que puedas checar en el reloj. Solo toma un par de minutos.
                                        </p>
                                    </div>
                                </div>

                                {empleado.enrolado_en && (
                                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                                        Este colaborador ya se enroló el {new Date(empleado.enrolado_en).toLocaleDateString('es-MX')}. Si continúa, las fotos se reemplazan.
                                    </p>
                                )}

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Dato etiqueta="No. de empleado" valor={empleado.numero} mono />
                                    <Dato etiqueta="Área" valor={empleado.area} />
                                    <Dato etiqueta="Nombre" valor={empleado.nombres} />
                                    <Dato etiqueta="Apellidos" valor={empleado.apellidos} />
                                </div>

                                <div className="space-y-3">
                                    <h2 className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                                        <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        Aviso de privacidad
                                    </h2>
                                    <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                                        <AvisoPrivacidad empresa={empresa || 'La empresa'} />
                                    </div>
                                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                                        <Checkbox
                                            checked={data.aviso_privacidad}
                                            onCheckedChange={(v) => setData('aviso_privacidad', v === true)}
                                            className="mt-0.5"
                                        />
                                        <span className="text-sm">He leído y acepto el aviso de privacidad.</span>
                                    </label>
                                </div>

                                <div className="flex justify-end">
                                    <Button size="lg" disabled={!data.aviso_privacidad} onClick={() => setPaso(2)}>
                                        Iniciar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {paso === 2 && (
                            <form onSubmit={finalizar} className="space-y-6">
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Captura de datos</h1>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Mira de frente a la cámara, con buena luz y sin lentes oscuros, gorra ni cubrebocas.
                                    </p>
                                </div>

                                <input ref={archivoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={leerArchivo} />

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {FOTOS.map(({ campo, titulo }) => (
                                        <div key={campo} className="space-y-2">
                                            <Label>{titulo}</Label>
                                            {camara === campo ? (
                                                <CameraWidget
                                                    faceGuide
                                                    onCapture={(foto) => {
                                                        setData(campo, foto);
                                                        clearErrors(campo);
                                                        setCamara(null);
                                                    }}
                                                    onCancel={() => setCamara(null)}
                                                />
                                            ) : data[campo] ? (
                                                <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                                                    <img src={data[campo]} alt={titulo} className="aspect-[4/3] w-full object-cover" />
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="destructive"
                                                        className="absolute right-2 top-2 h-7 w-7"
                                                        onClick={() => setData(campo, '')}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
                                                    <ScanFace className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                                    <div className="flex gap-2">
                                                        <Button type="button" size="sm" onClick={() => setCamara(campo)} disabled={camara !== null}>
                                                            <Camera className="mr-1.5 h-4 w-4" />
                                                            Tomar foto
                                                        </Button>
                                                        <Button type="button" size="sm" variant="outline" onClick={() => elegirArchivo(campo)}>
                                                            <Upload className="mr-1.5 h-4 w-4" />
                                                            Subir
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                            {errors[campo] && <p className="text-xs text-red-500">{errors[campo]}</p>}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Sexo</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { valor: 'M', etiqueta: 'Hombre' },
                                                { valor: 'F', etiqueta: 'Mujer' },
                                            ].map(({ valor, etiqueta }) => (
                                                <Button
                                                    key={valor}
                                                    type="button"
                                                    variant={data.genero === valor ? 'default' : 'outline'}
                                                    onClick={() => {
                                                        setData('genero', valor);
                                                        clearErrors('genero');
                                                    }}
                                                >
                                                    {etiqueta}
                                                </Button>
                                            ))}
                                        </div>
                                        {errors.genero && <p className="text-xs text-red-500">{errors.genero}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
                                        <Input
                                            id="fecha_nacimiento"
                                            type="date"
                                            max={new Date().toISOString().slice(0, 10)}
                                            value={data.fecha_nacimiento}
                                            onChange={(e) => setData('fecha_nacimiento', e.target.value)}
                                        />
                                        {errors.fecha_nacimiento && <p className="text-xs text-red-500">{errors.fecha_nacimiento}</p>}
                                    </div>
                                </div>

                                {errors.aviso_privacidad && <p className="text-sm text-red-500">{errors.aviso_privacidad}</p>}

                                <div className="flex justify-between gap-3">
                                    <Button type="button" variant="outline" onClick={() => setPaso(1)} disabled={processing}>
                                        Atrás
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={processing || !data.foto_empleado || !data.foto_empleado_2 || !data.genero || !data.fecha_nacimiento}
                                    >
                                        {processing ? 'Guardando…' : 'Finalizar'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {paso === 3 && (
                            <div className="flex flex-col items-center gap-4 py-6 text-center">
                                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">¡Gracias, {empleado.nombres}!</h1>
                                <p className="max-w-md text-muted-foreground">
                                    Tu proceso de enrolamiento quedó completo. Cualquier duda, consulta a tu supervisor.
                                </p>
                                <Button className="mt-2" onClick={() => router.get('/admin/empleados')}>
                                    Volver a colaboradores
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
