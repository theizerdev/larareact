import { Head } from '@inertiajs/react';
import { useTranslate } from '@/hooks/use-translate';
import ComplianceMarquee from './Partials/Home/ComplianceMarquee';
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

    return (
        <div className="hosho-landing min-h-screen">
            <Head title="Hoshō">
                <meta
                    name="description"
                    content={__(
                        'Enterprise access-control platform with biometric verification, liveness detection and document validation. Fleet management, GPS asset tracking, ITSM, inventory control, workforce time tracking and corporate messaging. Aligned with CTPAT, OEA, ISO 27001, ISO 20000, ISO 9001, PLD and AML.',
                    )}
                />
                <meta
                    property="og:title"
                    content="Hoshō — Enterprise access-control platform"
                />
                <meta property="og:type" content="website" />
            </Head>

            <SiteHeader />
            <Hero />
            <ComplianceMarquee />
            <PlatformSection />
            <ComplianceSection />
            <CustomersSection />
            <PartnersSection />
            <ContactSection />
            <SiteFooter />
        </div>
    );
}
