<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Skill;
use App\Models\Project;
use App\Models\About;
use App\Models\Experience;
use App\Models\Client;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PortfolioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 0. Create Default About Me info
        About::updateOrCreate(
            ['id' => 1],
            [
                'hero_title' => 'Theizer Gonzalez',
                'hero_subtitle' => 'Desarrollador Web Full Stack apasionado por construir aplicaciones interactiva sofisticadas, optimizadas y con un diseño estético de primer nivel.',
                'hero_badge' => 'Disponible para Proyectos',
                'bio' => 'Soy un desarrollador con experiencia en diseñar e implementar soluciones robustas de software web. Me enfoco en escribir código limpio, reutilizable y optimizado. Mi experiencia se extiende tanto en el lado del servidor, diseñando bases de datos escalables y APIs REST en Laravel/PHP, como en el navegador, creando interfaces fluidas de usuario con React y Vite. Disfruto enfrentar retos técnicos complejos y convertirlos en experiencias de usuario gratificantes. Constantemente busco aprender nuevas tecnologías e implementar mejores prácticas de desarrollo.',
                'experience_years' => '+3 Años',
                'completed_projects' => '+10 Proyectos',
                'avatar_path' => null
            ]
        );

        // 2. Seed Skills
        $skills = [
            // Frontend
            ['name' => 'React', 'category' => 'Frontend', 'proficiency' => 90],
            ['name' => 'JavaScript (ES6+)', 'category' => 'Frontend', 'proficiency' => 95],
            ['name' => 'HTML5 & CSS3', 'category' => 'Frontend', 'proficiency' => 95],
            ['name' => 'Tailwind CSS', 'category' => 'Frontend', 'proficiency' => 90],
            // Backend
            ['name' => 'Laravel', 'category' => 'Backend', 'proficiency' => 85],
            ['name' => 'PHP', 'category' => 'Backend', 'proficiency' => 88],
            ['name' => 'MySQL', 'category' => 'Backend', 'proficiency' => 80],
            ['name' => 'Node.js & Express', 'category' => 'Backend', 'proficiency' => 75],
            // Tools/Other
            ['name' => 'Git & GitHub', 'category' => 'Tools', 'proficiency' => 90],
            ['name' => 'Vite', 'category' => 'Tools', 'proficiency' => 85],
            ['name' => 'REST APIs', 'category' => 'Tools', 'proficiency' => 90],
        ];

        foreach ($skills as $skill) {
            Skill::updateOrCreate(['name' => $skill['name']], $skill);
        }

        // 3. Seed Experiences
        $experiences = [
            [
                'role' => 'Desarrollador Full Stack Senior',
                'company' => 'Innovación Digital S.A.',
                'description' => 'Liderazgo en el desarrollo de aplicaciones web complejas utilizando Laravel y React. Optimización de consultas SQL y automatización de despliegues.',
                'start_date' => '2024-01',
                'end_date' => null,
                'is_current' => true,
            ],
            [
                'role' => 'Desarrollador Web Full Stack',
                'company' => 'Estudio Creativo Web',
                'description' => 'Desarrollo y mantenimiento de sitios web interactivos, portales corporativos y e-commerce con PHP, JavaScript y bases de datos relacionales.',
                'start_date' => '2022-03',
                'end_date' => '2023-12',
                'is_current' => false,
            ],
        ];

        foreach ($experiences as $exp) {
            Experience::updateOrCreate(
                ['role' => $exp['role'], 'company' => $exp['company']],
                $exp
            );
        }

        // 4. Seed Projects
        $projects = [
            [
                'title' => 'Plataforma E-commerce Premium',
                'description' => 'Un sistema de comercio electrónico completo con carrito de compras, pasarela de pagos integrada y panel de administración en tiempo real.',
                'image_path' => null, // Opcional, cargaremos por interfaz o usaremos una imagen genérica
                'live_url' => 'https://ecommerce.example.com',
                'github_url' => 'https://github.com/example/ecommerce',
                'category' => 'Fullstack',
                'order' => 1,
                'is_featured' => true,
            ],
            [
                'title' => 'Dashboard de Analíticas en Tiempo Real',
                'description' => 'Panel interactivo para visualizar métricas de servidores y tráfico web. Construido con React, Chart.js y WebSockets.',
                'image_path' => null,
                'live_url' => 'https://charts.example.com',
                'github_url' => 'https://github.com/example/analytics-dashboard',
                'category' => 'Frontend',
                'order' => 2,
                'is_featured' => true,
            ],
            [
                'title' => 'API RESTful de Gestión de Contenido',
                'description' => 'Servicio backend de alto rendimiento para distribución de contenidos, con autenticación JWT, documentación de OpenAPI/Swagger y caché con Redis.',
                'image_path' => null,
                'live_url' => null,
                'github_url' => 'https://github.com/example/cms-api',
                'category' => 'Backend',
                'order' => 3,
                'is_featured' => false,
            ],
        ];

        foreach ($projects as $proj) {
            Project::updateOrCreate(['title' => $proj['title']], $proj);
        }

        // 5. Seed Clients
        $clients = [
            ['name' => 'Acme Corporation', 'website_url' => 'https://example.com', 'logo_path' => null, 'order' => 1],
            ['name' => 'Globex Corporation', 'website_url' => 'https://example.com', 'logo_path' => null, 'order' => 2],
            ['name' => 'Initech LLC', 'website_url' => 'https://example.com', 'logo_path' => null, 'order' => 3],
            ['name' => 'Umbrella Corp', 'website_url' => 'https://example.com', 'logo_path' => null, 'order' => 4],
            ['name' => 'Hooli Inc', 'website_url' => 'https://example.com', 'logo_path' => null, 'order' => 5],
            ['name' => 'Soylent Corp', 'website_url' => 'https://example.com', 'logo_path' => null, 'order' => 6],
        ];

        foreach ($clients as $client) {
            Client::updateOrCreate(['name' => $client['name']], $client);
        }
    }
}
