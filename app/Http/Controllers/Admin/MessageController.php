<?php

namespace App\Http\Controllers\Admin;

use App\Models\Message;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class MessageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Messages/Index', [
            'messages' => Message::orderBy('created_at', 'desc')->get()
        ]);
    }

    /**
     * Update the specified resource (Mark as read).
     */
    public function update(Request $request, Message $message): RedirectResponse
    {
        $message->update([
            'is_read' => $request->input('is_read', true)
        ]);

        return redirect()->route('admin.messages.index')->with('success', 'Mensaje marcado como leído.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Message $message): RedirectResponse
    {
        $message->delete();

        return redirect()->route('admin.messages.index')->with('success', 'Mensaje eliminado con éxito.');
    }
}
