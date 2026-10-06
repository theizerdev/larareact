<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Assistant\InternalAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssistantController extends Controller
{
    protected InternalAssistantService $assistant;

    public function __construct(InternalAssistantService $assistant)
    {
        $this->assistant = $assistant;
    }

    /**
     * Procesa un mensaje de texto enviado por el usuario.
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:500',
            'context' => 'nullable|array',
        ]);

        $response = $this->assistant->process(
            $request->user(),
            $validated['message'],
            $validated['context'] ?? []
        );

        return response()->json($response);
    }

    /**
     * Ejecuta una acción rápida invocada mediante botones en el chat.
     */
    public function action(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|string|max:100',
            'params' => 'nullable|array',
        ]);

        $response = $this->assistant->executeAction(
            $request->user(),
            $validated['action'],
            $validated['params'] ?? []
        );

        return response()->json($response);
    }

    /**
     * Retorna estadísticas rápidas para inicialización del asistente.
     */
    public function quickStats(Request $request): JsonResponse
    {
        $response = $this->assistant->executeAction(
            $request->user(),
            'get_summary'
        );

        return response()->json($response);
    }
}
