<?php

namespace App\Http\Controllers\Admin;

use App\Models\Skill;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class SkillController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Skills/Index', [
            'skills' => Skill::orderBy('category')->orderBy('name')->get()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:skills,name',
            'category' => 'required|string|max:255',
            'proficiency' => 'required|integer|min:0|max:100',
        ]);

        Skill::create($validated);

        return redirect()->route('admin.skills.index')->with('success', 'Habilidad creada con éxito.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Skill $skill): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:skills,name,' . $skill->id,
            'category' => 'required|string|max:255',
            'proficiency' => 'required|integer|min:0|max:100',
        ]);

        $skill->update($validated);

        return redirect()->route('admin.skills.index')->with('success', 'Habilidad actualizada con éxito.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Skill $skill): RedirectResponse
    {
        $skill->delete();

        return redirect()->route('admin.skills.index')->with('success', 'Habilidad eliminada con éxito.');
    }
}
