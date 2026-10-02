import { useForm } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    Clock3,
    Globe,
    Mail,
    MapPin,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { hoshoButtonClass } from './button-styles';
import HoshoMark from './HoshoMark';
import Reveal from './Reveal';

const fieldClass =
    'h-auto rounded-hosho-sm border-hosho-line bg-hosho-surface-2 px-3 py-2.5 sm:px-[.85rem] sm:py-[.74rem] font-hosho-body text-[.95rem] text-hosho-ink shadow-none focus-visible:border-hosho-indigo focus-visible:bg-hosho-surface focus-visible:ring-[4px] focus-visible:ring-hosho-indigo/[.12]';
const labelClass =
    'font-hosho-data text-[.64rem] tracking-[.08em] text-hosho-ink-soft uppercase';

function Field({
    label,
    htmlFor,
    error,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={htmlFor} className={labelClass}>
                {label}
            </Label>
            {children}
            <InputError
                message={error}
                className="text-[.78rem] text-hosho-coral"
            />
        </div>
    );
}

type FormValues = {
    nombre: string;
    empresa: string;
    correo: string;
    telefono: string;
    sitios_acceso: string;
    area_interes: string;
    mensaje: string;
    acepta_contacto: boolean;
};

export default function ContactSection() {
    const { __ } = useTranslate();

    const sitiosOpts = [
        __('1 to 3 access points'),
        __('4 to 10 access points'),
        __('11 to 30 access points'),
        __('More than 30 access points'),
    ];
    const interesOpts = [
        __('Biometric access control with liveness detection'),
        __('Time and attendance management'),
        __('Fleet and yard control'),
        __('GPS and AI-based asset management'),
        __('IT service management and inventory control'),
        __('Evidence for CTPAT / OEA / ISO'),
        __('Partner program'),
    ];

    const { data, setData, post, processing, errors, wasSuccessful, reset } =
        useForm<FormValues>({
            nombre: '',
            empresa: '',
            correo: '',
            telefono: '',
            sitios_acceso: sitiosOpts[0],
            area_interes: interesOpts[0],
            mensaje: '',
            acepta_contacto: false,
        });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/contacto', {
            preserveScroll: true,
            onSuccess: () => reset('mensaje'),
        });
    };

    return (
        <section id="contacto" className="py-[clamp(4.25rem,9vh,7rem)]">
            <div className="mx-auto grid max-w-[1240px] gap-8 px-4 sm:gap-10 sm:px-8 md:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] md:gap-[clamp(2.3rem,5vw,3.8rem)]">
                <Reveal>
                    <div className="mb-[1.1rem] inline-flex items-center gap-2 rounded-full bg-hosho-indigo-tint py-[.42rem] pr-[.85rem] pl-[.62rem]">
                        <HoshoMark className="size-3.5 text-hosho-indigo" />
                        <span className="font-hosho-data text-[.68rem] tracking-[.07em] text-hosho-indigo uppercase">
                            {__('Contact')}
                        </span>
                    </div>
                    <h2 className="m-0 mb-[.85rem] font-hosho-display text-[clamp(1.85rem,3.8vw,2.85rem)] leading-[1.1] font-bold tracking-[-.012em] text-hosho-ink">
                        {__('Request an assessment of your operation.')}
                    </h2>
                    <p className="m-0 text-[clamp(1rem,1.25vw,1.13rem)] text-hosho-ink-soft">
                        {__(
                            "A demonstration takes approximately 30 minutes and is tailored to your organization's actual scenario: number of access points, volume of external personnel and current certification requirements.",
                        )}
                    </p>

                    <dl className="mt-[1.9rem] grid gap-[1.3rem]">
                        {[
                            {
                                Icon: Mail,
                                dt: __('Email'),
                                dd: (
                                    <a
                                        href="mailto:contacto@innovacionmovil.com"
                                        className="border-b border-hosho-line pb-px hover:border-hosho-indigo hover:text-hosho-indigo"
                                    >
                                        contacto@innovacionmovil.com
                                    </a>
                                ),
                            },
                            {
                                Icon: Globe,
                                dt: __('Website'),
                                dd: (
                                    <a
                                        href="https://www.innovacionmovil.com"
                                        target="_blank"
                                        rel="noopener"
                                        className="border-b border-hosho-line pb-px hover:border-hosho-indigo hover:text-hosho-indigo"
                                    >
                                        www.innovacionmovil.com
                                    </a>
                                ),
                            },
                            {
                                Icon: MapPin,
                                dt: __('Offices'),
                                dd: __(
                                    'San Pedro Tlaquepaque, Jalisco, Mexico',
                                ),
                            },
                            {
                                Icon: Clock3,
                                dt: __('Business hours'),
                                dd: __(
                                    'Monday through Friday, 9:00 a.m. to 6:00 p.m. (Mexico City time)',
                                ),
                            },
                        ].map((row, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-[.9rem]"
                            >
                                <row.Icon
                                    className="mt-[.32rem] size-[19px] text-hosho-mist"
                                    strokeWidth={1.6}
                                />
                                <div className="min-w-0">
                                    <dt className="mb-[.22rem] font-hosho-data text-[.65rem] tracking-[.08em] text-hosho-mist uppercase">
                                        {row.dt}
                                    </dt>
                                    <dd className="m-0 text-[.98rem] break-words text-hosho-ink">
                                        {row.dd}
                                    </dd>
                                </div>
                            </div>
                        ))}
                    </dl>
                </Reveal>

                <Reveal>
                    {wasSuccessful ? (
                        <div className="grid grid-cols-[26px_1fr] gap-[.9rem] rounded-hosho-md border border-hosho-jade bg-hosho-jade-tint p-[1.1rem_1.2rem]">
                            <BadgeCheck
                                className="mt-[.2rem] size-[22px] text-hosho-jade"
                                strokeWidth={1.6}
                            />
                            <div>
                                <b className="mb-[.22rem] block font-hosho-display text-[1.05rem] text-hosho-ink">
                                    {__('Request received')}
                                </b>
                                <p className="m-0 text-[.87rem] text-hosho-ink-soft">
                                    {__(
                                        'Thank you, :name. A specialist from Innovación Móvil will contact you within 24 business hours with two available time slots for the demonstration.',
                                        {
                                            name:
                                                data.nombre.split(' ')[0] ||
                                                data.nombre,
                                        },
                                    )}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form
                            onSubmit={submit}
                            noValidate
                            className="rounded-hosho-lg border border-hosho-line bg-hosho-surface p-[clamp(1.3rem,4vw,2.2rem)] shadow-hosho-md"
                        >
                            <div className="grid gap-3 sm:gap-[1.05rem] sm:grid-cols-2">
                                <Field
                                    label={__('Full name')}
                                    htmlFor="f-nombre"
                                    error={errors.nombre}
                                >
                                    <Input
                                        id="f-nombre"
                                        autoComplete="name"
                                        required
                                        value={data.nombre}
                                        onChange={(e) =>
                                            setData('nombre', e.target.value)
                                        }
                                        className={fieldClass}
                                    />
                                </Field>
                                <Field
                                    label={__('Organization')}
                                    htmlFor="f-empresa"
                                    error={errors.empresa}
                                >
                                    <Input
                                        id="f-empresa"
                                        autoComplete="organization"
                                        required
                                        value={data.empresa}
                                        onChange={(e) =>
                                            setData('empresa', e.target.value)
                                        }
                                        className={fieldClass}
                                    />
                                </Field>
                            </div>

                            <div className="mt-3 grid gap-3 sm:mt-[1.05rem] sm:gap-[1.05rem] sm:grid-cols-2">
                                <Field
                                    label={__('Corporate email address')}
                                    htmlFor="f-correo"
                                    error={errors.correo}
                                >
                                    <Input
                                        id="f-correo"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={data.correo}
                                        onChange={(e) =>
                                            setData('correo', e.target.value)
                                        }
                                        className={fieldClass}
                                    />
                                </Field>
                                <Field
                                    label={__('Phone / WhatsApp')}
                                    htmlFor="f-tel"
                                    error={errors.telefono}
                                >
                                    <Input
                                        id="f-tel"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        value={data.telefono}
                                        onChange={(e) =>
                                            setData('telefono', e.target.value)
                                        }
                                        className={fieldClass}
                                    />
                                </Field>
                            </div>

                            <div className="mt-3 grid gap-3 sm:mt-[1.05rem] sm:gap-[1.05rem] sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label className={labelClass}>
                                        {__(
                                            'Number of access points to control',
                                        )}
                                    </Label>
                                    <Select
                                        value={data.sitios_acceso}
                                        onValueChange={(v) =>
                                            setData('sitios_acceso', v)
                                        }
                                    >
                                        <SelectTrigger
                                            className={cn(fieldClass, 'w-full')}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sitiosOpts.map((opt) => (
                                                <SelectItem
                                                    key={opt}
                                                    value={opt}
                                                >
                                                    {opt}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className={labelClass}>
                                        {__('Primary area of interest')}
                                    </Label>
                                    <Select
                                        value={data.area_interes}
                                        onValueChange={(v) =>
                                            setData('area_interes', v)
                                        }
                                    >
                                        <SelectTrigger
                                            className={cn(fieldClass, 'w-full')}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {interesOpts.map((opt) => (
                                                <SelectItem
                                                    key={opt}
                                                    value={opt}
                                                >
                                                    {opt}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="mt-[1.05rem]">
                                <Field
                                    label={__(
                                        'Description of your operational scenario',
                                    )}
                                    htmlFor="f-msg"
                                    error={errors.mensaje}
                                >
                                    <Textarea
                                        id="f-msg"
                                        rows={4}
                                        placeholder={__(
                                            'Example: facility with 3 access points, 40 daily suppliers, OEA certification currently under renewal.',
                                        )}
                                        value={data.mensaje}
                                        onChange={(e) =>
                                            setData('mensaje', e.target.value)
                                        }
                                        className={cn(
                                            fieldClass,
                                            'min-h-[104px] resize-y',
                                        )}
                                    />
                                </Field>
                            </div>

                            <label className="mt-3 mb-3 flex items-start gap-[.7rem] text-[.8rem] leading-[1.5] text-hosho-ink-soft sm:mt-[1.15rem] sm:mb-[1.35rem]">
                                <Checkbox
                                    checked={data.acepta_contacto}
                                    onCheckedChange={(v) =>
                                        setData('acepta_contacto', v === true)
                                    }
                                    className="mt-[.15rem] flex-none data-[state=checked]:border-hosho-indigo data-[state=checked]:bg-hosho-indigo"
                                />
                                <span>
                                    {__(
                                        'I authorize Innovación Móvil to use this information to contact me regarding Hoshō, in accordance with its privacy notice.',
                                    )}
                                </span>
                            </label>
                            {errors.acepta_contacto && (
                                <p className="mb-4 text-[.78rem] text-hosho-coral">
                                    {errors.acepta_contacto}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={processing}
                                className={hoshoButtonClass(
                                    'primary',
                                    'md',
                                    'w-full disabled:opacity-60 sm:w-auto',
                                )}
                            >
                                <span>{__('Request a demonstration')}</span>
                                <ArrowRight />
                            </button>
                        </form>
                    )}
                </Reveal>
            </div>
        </section>
    );
}
