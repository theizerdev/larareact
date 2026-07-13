<?php

namespace App\Http\Controllers\Admin;

use App\Models\Project;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Projects/Index', [
            'projects' => Project::orderBy('order', 'asc')->get()
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Projects/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'live_url' => 'nullable|url|max:255',
            'github_url' => 'nullable|url|max:255',
            'category' => 'required|string|max:255',
            'order' => 'required|integer',
            'is_featured' => 'required|boolean',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('projects', 'public');
            $validated['image_path'] = '/storage/' . $path;
        }

        Project::create($validated);

        return redirect()->route('admin.projects.index')->with('success', 'Proyecto creado con éxito.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Project $project): Response
    {
        return Inertia::render('Admin/Projects/Edit', [
            'project' => $project
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'live_url' => 'nullable|url|max:255',
            'github_url' => 'nullable|url|max:255',
            'category' => 'required|string|max:255',
            'order' => 'required|integer',
            'is_featured' => 'required|boolean',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($project->image_path) {
                $oldPath = str_replace('/storage/', '', $project->image_path);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('image')->store('projects', 'public');
            $validated['image_path'] = '/storage/' . $path;
        }

        $project->update($validated);

        return redirect()->route('admin.projects.index')->with('success', 'Proyecto actualizado con éxito.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project): RedirectResponse
    {
        if ($project->image_path) {
            $oldPath = str_replace('/storage/', '', $project->image_path);
            Storage::disk('public')->delete($oldPath);
        }

        $project->delete();

        return redirect()->route('admin.projects.index')->with('success', 'Proyecto eliminado con éxito.');
    }
}
