import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { useTranslate } from '@/hooks/use-translate';
import ScrollReveal from './scroll-reveal';
import { store as contactStore } from '@/routes/contact';

export const ContactSection: React.FC = () => {
    const { __ } = useTranslate();

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const [formSuccessMessage, setFormSuccessMessage] = useState('');

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

    // Handle Escape key on country dropdown
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

    const calculateCompleteness = () => {
        let completed = 0;
        if (data.name.trim().length > 0) completed++;
        if (data.email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) completed++;
        if (data.message.trim().length > 0) completed++;
        return Math.round((completed / 3) * 100);
    };

    const completeness = calculateCompleteness();

    return (
        <section id="contact" className="py-24 max-w-xl mx-auto px-6 scroll-mt-16">
            <ScrollReveal>
                <div className="text-center space-y-3 mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">{__('Ponte En Contacto')}</h2>
                    <p className="text-slate-600 dark:text-slate-400 font-light">{__('¿Tienes un proyecto en mente? Escríbeme y hagámoslo realidad.')}</p>
                </div>

                {formSuccessMessage && (
                    <div className="mb-6 p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-2 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400 animate-fade-in">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formSuccessMessage}</span>
                    </div>
                )}

                <div className="space-y-1.5 mb-6">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                        <span>{__('Completitud del mensaje')}</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{completeness}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 rounded-full ${
                                completeness === 100
                                    ? 'bg-emerald-500'
                                    : completeness >= 66
                                        ? 'bg-indigo-500'
                                        : 'bg-indigo-400/50'
                            }`}
                            style={{ width: `${completeness}%` }}
                        />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Nombre')}</label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                            />
                            {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Correo Electrónico')}</label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                            />
                            {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
                        </div>
                    </div>

                    {/* Phone input with accessible country dropdown */}
                    <div className="space-y-2 relative">
                        <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Número Telefónico (Opcional)')}</label>

                        <div className="relative flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 overflow-visible transition-all">
                            <button
                                type="button"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center space-x-1.5 px-3 py-3 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-l-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors text-sm cursor-pointer"
                                aria-label={__('Seleccionar Código de País')}
                                aria-expanded={dropdownOpen}
                                aria-haspopup="listbox"
                            >
                                <span>{selectedCountry.flag}</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedCountry.code}</span>
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <input
                                id="phone"
                                type="tel"
                                value={phoneInput}
                                onChange={handlePhoneChange}
                                placeholder="4241703465"
                                className="flex-grow px-4 py-3 bg-transparent border-0 focus:ring-0 text-sm placeholder-slate-400 dark:placeholder-slate-500"
                            />

                            {dropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={() => setDropdownOpen(false)} />

                                    <div className="absolute top-full left-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-30 overflow-hidden animate-fade-in">
                                        <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                            <input
                                                type="text"
                                                placeholder={__('Buscar país...')}
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                                                autoFocus
                                            />
                                        </div>

                                        <ul className="max-h-48 overflow-y-auto text-xs divide-y divide-slate-100 dark:divide-slate-800" role="listbox">
                                            {filteredCountries.map(c => (
                                                <li key={c.name + c.code}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectCountry(c)}
                                                        className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between transition-colors cursor-pointer"
                                                    >
                                                        <span className="flex items-center space-x-2">
                                                            <span>{c.flag}</span>
                                                            <span className="font-medium text-slate-700 dark:text-slate-200">{__(c.name)}</span>
                                                        </span>
                                                        <span className="text-slate-500 dark:text-slate-400 font-semibold">{c.code}</span>
                                                    </button>
                                                </li>
                                            ))}
                                            {filteredCountries.length === 0 && (
                                                <li className="px-4 py-3.5 text-center text-slate-500 dark:text-slate-400">{__('No se encontraron resultados')}</li>
                                            )}
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>
                        {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Asunto (Opcional)')}</label>
                        <input
                            id="subject"
                            type="text"
                            value={data.subject}
                            onChange={e => setData('subject', e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                        />
                        {errors.subject && <div className="text-xs text-red-500 mt-1">{errors.subject}</div>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="message" className="text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Mensaje')}</label>
                        <textarea
                            id="message"
                            required
                            rows={5}
                            value={data.message}
                            onChange={e => setData('message', e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all resize-none"
                        />
                        {errors.message && <div className="text-xs text-red-500 mt-1">{errors.message}</div>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {processing ? __('Enviando...') : __('Enviar mensaje')}
                    </button>
                </form>
            </ScrollReveal>
        </section>
    );
};

export default ContactSection;

