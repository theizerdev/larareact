<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Modo claro/oscuro y color primario compartidos entre la web (personalizador
 * de plantilla) y la app móvil, en `users.layout_settings`.
 */
class AparienciaMovilTest extends TestCase
{
    use RefreshDatabase;

    private const LAYOUT_WEB = [
        'primaryColor' => 'teal',
        'skin' => 'bordered',
        'semiDark' => false,
        'collapsed' => true,
        'navbarType' => 'sticky',
        'contentWidth' => 'wide',
        'direction' => 'ltr',
    ];

    public function test_la_app_recibe_la_apariencia_de_la_web_en_el_usuario(): void
    {
        $user = User::factory()->create(['layout_settings' => self::LAYOUT_WEB + ['appearance' => 'dark']]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('layout_settings.appearance', 'dark')
            ->assertJsonPath('layout_settings.primaryColor', 'teal');
    }

    public function test_la_app_cambia_modo_y_color_sin_borrar_el_resto_del_layout(): void
    {
        $user = User::factory()->create(['layout_settings' => self::LAYOUT_WEB]);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/user/layout', ['appearance' => 'light', 'primaryColor' => '#1a2b3c'])
            ->assertOk()
            ->assertJsonPath('layout_settings.appearance', 'light');

        $layout = $user->fresh()->layout_settings;
        $this->assertSame('light', $layout['appearance']);
        $this->assertSame('#1a2b3c', $layout['primaryColor']);
        $this->assertSame('bordered', $layout['skin']);
        $this->assertTrue($layout['collapsed']);
    }

    public function test_rechaza_modos_y_colores_invalidos(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/user/layout', ['appearance' => 'sepia', 'primaryColor' => 'red; drop'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['appearance', 'primaryColor']);
    }

    public function test_la_web_guarda_el_modo_y_conserva_el_que_puso_la_app(): void
    {
        $user = User::factory()->create(['layout_settings' => ['appearance' => 'dark']]);

        // Un navegador con el JS anterior no envía `appearance`.
        $this->actingAs($user)
            ->put(route('profile.layout.update'), self::LAYOUT_WEB)
            ->assertSessionHasNoErrors();
        $this->assertSame('dark', $user->fresh()->layout_settings['appearance']);

        $this->actingAs($user)
            ->put(route('profile.layout.update'), self::LAYOUT_WEB + ['appearance' => 'system'])
            ->assertSessionHasNoErrors();
        $this->assertSame('system', $user->fresh()->layout_settings['appearance']);
    }
}
