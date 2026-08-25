import { Head } from '@inertiajs/react';
import { useTranslate } from '@/hooks/use-translate';
import ComplianceSection from './Partials/Home/ComplianceSection';
import ContactSection from './Partials/Home/ContactSection';
import CustomersSection from './Partials/Home/CustomersSection';
import Hero from './Partials/Home/Hero';
import PartnersSection from './Partials/Home/PartnersSection';
import PlatformSection from './Partials/Home/PlatformSection';
import SiteFooter from './Partials/Home/SiteFooter';
import SiteHeader from './Partials/Home/SiteHeader';

export default function Home() {
    const { __ } = useTranslate();

    // og:title/og:description/twitter:* ya se sirven server-side desde
    // app.blade.php (la app no usa SSR, así que los crawlers de redes
    // sociales nunca verían las etiquetas si sólo vivieran aquí). Esta
    // description sí se actualiza en cliente porque está traducida.
    const description = __(
        "Enterprise workforce time and attendance platform with biometric clock-in, shift and overtime management. Supplier and vehicle onboarding with identity validation, ITSM, inventory control and WhatsApp messaging. Aligned with Mexico's Federal Labor Law 2027, CTPAT, OEA, ISO 27001, ISO 20000, ISO 9001, PLD and AML.",
    );

    return (
        <div className="shigoto-landing min-h-screen">
            <Head>
                <meta name="description" content={description} />
                <meta property="og:type" content="website" />
            </Head>

            <SiteHeader />
            <Hero />
            <PlatformSection />
            <ComplianceSection />
            <CustomersSection />
            <PartnersSection />
            <ContactSection />
            <SiteFooter />
        </div>
    );
}
