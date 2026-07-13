<?php

namespace App\Http\Controllers\Admin;

use App\Models\About;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;

class AboutController extends Controller
{
    /**
     * Show the form for editing the About Me section.
     */
    public function edit(): Response
    {
        $about = About::firstOrCreate(
            ['id' => 1],
            [
                'hero_title' => 'Theizer Gonzalez',
                'hero_subtitle' => 'Desarrollador Web Full Stack apasionado por construir aplicaciones interactiva sofisticadas, optimizadas y con un diseño estético de primer nivel.',
                'hero_badge' => 'Disponible para Proyectos',
                'bio' => 'Completa tu biografía aquí...',
                'experience_years' => '0 Años',
                'completed_projects' => '0 Proyectos',
                'avatar_path' => null,
            ]
        );

        return Inertia::render('Admin/About/Edit', [
            'about' => $about
        ]);
    }

    /**
     * Update the About Me section in storage.
     */
    public function update(Request $request): RedirectResponse
    {
        $about = About::first();
        if (!$about) {
            $about = new About(['id' => 1]);
        }

        $validated = $request->validate([
            'hero_title' => 'required|string|max:255',
            'hero_subtitle' => 'required|string|max:5000',
            'hero_badge' => 'required|string|max:255',
            'bio' => 'required|string|max:10000',
            'experience_years' => 'required|string|max:255',
            'completed_projects' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            // Delete old avatar if exists
            if ($about->avatar_path) {
                $oldPath = str_replace('/storage/', '', $about->avatar_path);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('image')->store('avatars', 'public');
            $validated['avatar_path'] = '/storage/' . $path;
        }

        $about->fill($validated);
        $about->save();

        return redirect()->route('admin.about.edit')->with('success', 'Sección Sobre Mí actualizada con éxito.');
    }
}
