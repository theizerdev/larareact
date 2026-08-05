<?php

namespace Database\Seeders;

use App\Models\Testimonio;
use Illuminate\Database\Seeder;

class TestimonioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            [
                'nombre_cliente' => 'Carlos Eduardo Mendoza',
                'empresa_cargo' => 'Gerente General - Mendoza Tech & Repuestos S.A.',
                'ubicacion' => 'Caracas, Venezuela',
                'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                'comentario' => 'Antes perdíamos hasta 2 horas diarias cuadrando la caja en dólares y bolívares al cierre del día. Con FixSale, la tasa BCV se actualiza sola y los cierres Z se realizan en 30 segundos.',
                'calificacion' => 5,
                'metrica_destacada' => 'Ahorro de 12 hrs/semana en administración',
                'destacado' => true,
                'activo' => true,
                'orden' => 1,
            ],
            [
                'nombre_cliente' => 'María Gabriela Rivas',
                'empresa_cargo' => 'Propietaria - Minimarket El Samán',
                'ubicacion' => 'Valencia, Venezuela',
                'avatar' => 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
                'comentario' => 'El punto de venta POS es ultrarrápido. Mis cajeros usan los atajos de teclado y la búsqueda por código de barras sin demoras. La auditoría de caja nos dio 100% de tranquilidad con el inventario.',
                'calificacion' => 5,
                'metrica_destacada' => '+35% velocidad en atención al cliente',
                'destacado' => true,
                'activo' => true,
                'orden' => 2,
            ],
            [
                'nombre_cliente' => 'Alejandro Torres',
                'empresa_cargo' => 'Fundador - FixMobile Express',
                'ubicacion' => 'Barquisimeto, Venezuela',
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                'comentario' => 'Gestionar el inventario, ventas a crédito y recibir las alertas de stock directamente en el sistema nos permitió expandir el negocio. El soporte técnico por WhatsApp responde inmediato.',
                'calificacion' => 5,
                'metrica_destacada' => 'Expansión a 3 sucursales en 8 meses',
                'destacado' => true,
                'activo' => true,
                'orden' => 3,
            ],
        ];

        foreach ($items as $item) {
            Testimonio::firstOrCreate(
                ['nombre_cliente' => $item['nombre_cliente']],
                $item
            );
        }
    }
}
