<?php

namespace App\Http\Controllers\Admin;

use App\Models\Client;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;

class ClientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Clients/Index', [
            'clients' => Client::orderBy('order', 'asc')->get()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'website_url' => 'nullable|url|max:255',
            'order' => 'required|integer',
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('clients', 'public');
            $validated['logo_path'] = '/storage/' . $path;
        }

        Client::create($validated);

        return redirect()->route('admin.clients.index')->with('success', 'Cliente creado con éxito.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Client $client): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'website_url' => 'nullable|url|max:255',
            'order' => 'required|integer',
        ]);

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($client->logo_path) {
                $oldPath = str_replace('/storage/', '', $client->logo_path);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('logo')->store('clients', 'public');
            $validated['logo_path'] = '/storage/' . $path;
        }

        $client->update($validated);

        return redirect()->route('admin.clients.index')->with('success', 'Cliente actualizado con éxito.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Client $client): RedirectResponse
    {
        if ($client->logo_path) {
            $oldPath = str_replace('/storage/', '', $client->logo_path);
            Storage::disk('public')->delete($oldPath);
        }

        $client->delete();

        return redirect()->route('admin.clients.index')->with('success', 'Cliente eliminado con éxito.');
    }
}
