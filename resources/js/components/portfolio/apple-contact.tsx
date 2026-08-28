import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Send, Mail, MessageSquare, Check } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import ScrollReveal from './scroll-reveal';
import { store as contactStore } from '@/routes/contact';

export const AppleContact: React.FC = () => {
    const { __ } = useTranslate();

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const [formSuccessMessage, setFormSuccessMessage] = useState('');
    const [copiedEmail, setCopiedEmail] = useState(false);

    const countries = [
        { name: 'Venezuela', code: '+58', flag: '🇻🇪' },
        { name: 'Colombia', code: '+57', flag: '🇨🇴' },
        { name: 'España', code: '+34', flag: '🇪🇸' },
        { name: 'Estados Unidos', code: '+1', flag: '🇺🇸' },
        { name: 'Argentina', code: '+54', flag: '🇦🇷' },
        { name: 'Chile', code: '+56', flag: '🇨🇱' },
        { name: 'México', code: '+52', flag: '🇲🇽' },
        { name: 'Perú', code: '+51', flag: '🇵🇪' },
        { name: 'Ecuador', code: '+593', flag: '🇪🇨' },
        { name: 'Uruguay', code: '+598', flag: '🇺🇾' },
        { name: 'Paraguay', code: '+595', flag: '🇵🇾' },
        { name: 'Bolivia', code: '+591', flag: '🇧🇴' },
        { name: 'Costa Rica', code: '+506', flag: '🇨🇷' },
        { name: 'Panamá', code: '+507', flag: '🇵🇦' },
        { name: 'Canadá', code: '+1', flag: '🇨🇦' },
        { name: 'Reino Unido', code: '+44', flag: '🇬🇧' },
    ];

    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const [phoneInput, setPhoneInput] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && dropdownOpen) {
                setDropdownOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dropdownOpen]);

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.includes(searchQuery)
    );

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cleanVal = value.replace(/\D/g, '');
        setPhoneInput(cleanVal);
        setData('phone', cleanVal ? `${selectedCountry.code}${cleanVal}` : '');
    };

    const handleSelectCountry = (country: typeof countries[0]) => {
        setSelectedCountry(country);
        setDropdownOpen(false);
        setSearchQuery('');
        setData('phone', phoneInput ? `${country.code}${phoneInput}` : '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(contactStore.url(), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setPhoneInput('');
                setFormSuccessMessage(__('¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.'));
                setTimeout(() => setFormSuccessMessage(''), 5000);
            }
        });
    };

    const handleCopyEmail = () => {
        navigator.clipboard.writeText('contact@theizerdev.com');
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
    };

    return (
        <section id="contact" className="py-24 max-w-4xl mx-auto px-6 scroll-mt-16">
            <ScrollReveal>
                <div className="space-y-3 mb-12 text-center">
                    <span className="text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                        {__('Iniciar una Conversación')}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {__('Ponte En Contacto')}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 font-normal max-w-md mx-auto">
                        {__('¿Tienes una propuesta o proyecto? Escríbeme directamente o envía un formulario.')}
                    </p>
                </div>

                {/* Direct Contact Pills */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
                    <button
                        onClick={handleCopyEmail}
                        className="px-5 py-3 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center space-x-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                        {copiedEmail ? <Check className="w-4 h-4 text-emerald-500" /> : <Mail className="w-4 h-4 text-indigo-500" />}
                        <span>{copiedEmail ? __('¡Correo Copiado!') : 'contact@theizerdev.com'}</span>
                    </button>
                    <a
                        href="https://wa.me/584241703465"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-3 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 transition-all"
                    >
                        <MessageSquare className="w-4 h-4 text-emerald-500" />
                        <span>WhatsApp Directo</span>
                    </a>
                </div>

                {/* Bento Form Card */}
                <div className="max-w-xl mx-auto bento-card p-8 shadow-xl">
                    {formSuccessMessage && (
                        <div className="mb-6 p-4 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                            <Check className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                            <span>{formSuccessMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">{__('Nombre')}</label>
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-white transition-all text-slate-900 dark:text-white"
                                />
                                {errors.name && <div className="text-xs text-rose-500 mt-1">{errors.name}</div>}
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">{__('Correo Electrónico')}</label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-white transition-all text-slate-900 dark:text-white"
                                />
                                {errors.email && <div className="text-xs text-rose-500 mt-1">{errors.email}</div>}
                            </div>
                        </div>

                        {/* Phone with Country Dropdown */}
                        <div className="space-y-1.5 relative">
                            <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">{__('Número Telefónico (Opcional)')}</label>

                            <div className="relative flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus-within:ring-2 focus-within:ring-slate-950 dark:focus-within:ring-white overflow-visible transition-all">
                                <button
                                    type="button"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center space-x-1.5 px-3 py-3 border-r border-slate-200 dark:border-slate-800 rounded-l-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-sm cursor-pointer"
                                    aria-label={__('Seleccionar Código de País')}
                                >
                                    <span>{selectedCountry.flag}</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{selectedCountry.code}</span>
                                </button>

                                <input
                                    id="phone"
                                    type="tel"
                                    value={phoneInput}
                                    onChange={handlePhoneChange}
                                    placeholder="4241703465"
                                    className="flex-grow px-4 py-3 bg-transparent border-0 focus:ring-0 text-sm placeholder-slate-400 text-slate-900 dark:text-white"
                                />

                                {dropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-30 overflow-hidden">
                                            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                                <input
                                                    type="text"
                                                    placeholder={__('Buscar país...')}
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none"
                                                    autoFocus
                                                />
                                            </div>
                                            <ul className="max-h-48 overflow-y-auto text-xs divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredCountries.map(c => (
                                                    <li key={c.name + c.code}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectCountry(c)}
                                                            className="w-full text-left px-3.5 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                                                        >
                                                            <span className="flex items-center space-x-2">
                                                                <span>{c.flag}</span>
                                                                <span className="font-medium text-slate-700 dark:text-slate-200">{__(c.name)}</span>
                                                            </span>
                                                            <span className="text-slate-400 font-bold">{c.code}</span>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>
                            {errors.phone && <div className="text-xs text-rose-500 mt-1">{errors.phone}</div>}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-slate-500">{__('Asunto (Opcional)')}</label>
                            <input
                                id="subject"
                                type="text"
                                value={data.subject}
                                onChange={e => setData('subject', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-white transition-all text-slate-900 dark:text-white"
                            />
                            {errors.subject && <div className="text-xs text-rose-500 mt-1">{errors.subject}</div>}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-slate-500">{__('Mensaje')}</label>
                            <textarea
                                id="message"
                                required
                                rows={5}
                                value={data.message}
                                onChange={e => setData('message', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-white transition-all resize-none text-slate-900 dark:text-white"
                            />
                            {errors.message && <div className="text-xs text-rose-500 mt-1">{errors.message}</div>}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-4 text-xs font-extrabold uppercase tracking-widest text-white bg-slate-950 dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
                        >
                            <Send className="w-4 h-4" />
                            <span>{processing ? __('Enviando...') : __('Enviar mensaje')}</span>
                        </button>
                    </form>
                </div>
            </ScrollReveal>
        </section>
    );
};

export default AppleContact;

