<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Testimonio;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TestimonioController extends Controller
{
    /**
     * Muestra el listado de testimonios para administración.
     */
    public function index()
    {
        $testimonios = Testimonio::orderBy('orden', 'asc')
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('admin/testimonios/index', [
            'testimonios' => $testimonios,
        ]);
    }

    /**
     * Guarda un nuevo testimonio.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre_cliente' => ['required', 'string', 'max:255'],
            'empresa_cargo' => ['nullable', 'string', 'max:255'],
            'ubicacion' => ['nullable', 'string', 'max:255'],
            'avatar' => ['nullable', 'string', 'max:500'],
            'comentario' => ['required', 'string'],
            'calificacion' => ['required', 'integer', 'min:1', 'max:5'],
            'metrica_destacada' => ['nullable', 'string', 'max:255'],
            'destacado' => ['nullable', 'boolean'],
            'activo' => ['nullable', 'boolean'],
            'orden' => ['nullable', 'integer'],
        ]);

        Testimonio::create([
            'nombre_cliente' => $validated['nombre_cliente'],
            'empresa_cargo' => $validated['empresa_cargo'] ?? null,
            'ubicacion' => $validated['ubicacion'] ?? null,
            'avatar' => $validated['avatar'] ?? null,
            'comentario' => $validated['comentario'],
            'calificacion' => $validated['calificacion'] ?? 5,
            'metrica_destacada' => $validated['metrica_destacada'] ?? null,
            'destacado' => $validated['destacado'] ?? true,
            'activo' => $validated['activo'] ?? true,
            'orden' => $validated['orden'] ?? 0,
        ]);

        return redirect()->back()->with('success', __('Testimonio creado exitosamente.'));
    }

    /**
     * Actualiza un testimonio existente.
     */
    public function update(Request $request, Testimonio $testimonio)
    {
        $validated = $request->validate([
            'nombre_cliente' => ['required', 'string', 'max:255'],
            'empresa_cargo' => ['nullable', 'string', 'max:255'],
            'ubicacion' => ['nullable', 'string', 'max:255'],
            'avatar' => ['nullable', 'string', 'max:500'],
            'comentario' => ['required', 'string'],
            'calificacion' => ['required', 'integer', 'min:1', 'max:5'],
            'metrica_destacada' => ['nullable', 'string', 'max:255'],
            'destacado' => ['nullable', 'boolean'],
            'activo' => ['nullable', 'boolean'],
            'orden' => ['nullable', 'integer'],
        ]);

        $testimonio->update($validated);

        return redirect()->back()->with('success', __('Testimonio actualizado exitosamente.'));
    }

    /**
     * Alterna el estado activo/inactivo de un testimonio.
     */
    public function toggleStatus(Testimonio $testimonio)
    {
        $testimonio->update([
            'activo' => ! $testimonio->activo,
        ]);

        return redirect()->back()->with('success', __('Estado del testimonio actualizado.'));
    }

    /**
     * Alterna el estado destacado en Landing Page.
     */
    public function toggleFeatured(Testimonio $testimonio)
    {
        $testimonio->update([
            'destacado' => ! $testimonio->destacado,
        ]);

        return redirect()->back()->with('success', __('Visibilidad destacada actualizada.'));
    }

    /**
     * Elimina un testimonio.
     */
    public function destroy(Testimonio $testimonio)
    {
        $testimonio->delete();

        return redirect()->back()->with('success', __('Testimonio eliminado exitosamente.'));
    }
}
