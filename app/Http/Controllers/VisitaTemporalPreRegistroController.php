<?php

namespace App\Http\Controllers;

use App\Models\Pais;
use App\Models\VisitaTemporal;
use App\Models\VisitaTemporalPreRegistro;
use App\Models\TipoServicio;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class VisitaTemporalPreRegistroController extends Controller
{
    public function showWizard($token)
    {
        $preRegistro = VisitaTemporalPreRegistro::where('token', $token)
            ->where('status', 'pendiente')
            ->where('expires_at', '>', now())
            ->first();

        if (!$preRegistro) {
            return Inertia::render('preregistro/InvalidToken', [
                'error' => __('The pre-registration link is invalid, has already been used, or has expired (12-hour validity).')
            ]);
        }

        $paises = Pais::where('activo', true)
            ->orderBy('nombre', 'asc')
            ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico']);

        $tipoServicios = TipoServicio::where('empresa_id', $preRegistro->empresa_id)
            ->where('status', 1)
            ->orderBy('nombre', 'asc')
            ->get(['id', 'nombre']);

        $empresa = $preRegistro->empresa;

        return Inertia::render('preregistro-visita/Wizard', [
            'preRegistro' => [
                'id' => $preRegistro->id,
                'nombres' => $preRegistro->nombres,
                'apellidos' => $preRegistro->apellidos,
                'pais_telefono_id' => $preRegistro->pais_telefono_id,
                'telefono' => $preRegistro->telefono,
                'motivo_registro' => $preRegistro->motivo_registro,
                'token' => $preRegistro->token,
                'empresa_id' => $preRegistro->empresa_id,
                'sucursal_id' => $preRegistro->sucursal_id,
                'empleado_id' => $preRegistro->empleado_id,
                'responsable_id' => $preRegistro->responsable_id,
            ],
            'paises' => $paises,
            'tipoServicios' => $tipoServicios,
            'mapbox_api_key' => $empresa?->mapbox_api_key,
            'mapbox_active' => (bool) ($empresa?->mapbox_active ?? false),
        ]);
    }

    public function submitWizard(Request $request, $token)
    {
        $preRegistro = VisitaTemporalPreRegistro::where('token', $token)
            ->where('status', 'pendiente')
            ->where('expires_at', '>', now())
            ->firstOrFail();

        $isEntrega = in_array((int) $request->input('tipo_servicio_id'), [1, 6]);

        $request->validate([
            'documento_identidad' => $isEntrega ? 'nullable|string|max:100' : 'required|string|max:100',
            'tipo_servicio_id' => 'nullable|exists:tipo_servicios,id',
            'fecha_ingreso' => $isEntrega ? 'nullable|date' : 'required|date',
            'hora_ingreso' => $isEntrega ? 'nullable' : 'required',
            'fecha_salida' => $isEntrega ? 'nullable|date' : 'required|date',
            'hora_salida' => $isEntrega ? 'nullable' : 'required',
            'foto_carnet' => $isEntrega ? 'nullable|string' : 'required|string',
            'foto_documento' => $isEntrega ? 'nullable|string' : 'required|string',
        ]);

        DB::beginTransaction();
        try {
            // Helper to save base64 images
            $saveBase64Image = function ($base64Data, $folder) {
                if (empty($base64Data)) return null;
                if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
                    $data = substr($base64Data, strpos($base64Data, ',') + 1);
                    $type = strtolower($type[1]); // png, jpg, jpeg, webp
                    if (!in_array($type, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                        return null;
                    }
                    $data = base64_decode($data);
                    if ($data === false) {
                        return null;
                    }
                    $fileName = $folder . '/' . uniqid() . '.' . $type;
                    Storage::disk('public')->put($fileName, $data);
                    return '/storage/' . $fileName;
                }
                return null;
            };

            $fotoCarnet = $saveBase64Image($request->foto_carnet, 'visitas_temporales');
            $fotoDocumento = $saveBase64Image($request->foto_documento, 'visitas_temporales');

            // 1. Crear Visita Temporal
            $visita = VisitaTemporal::create([
                'nombres' => $preRegistro->nombres,
                'apellidos' => $preRegistro->apellidos,
                'documento_identidad' => $request->documento_identidad,
                'pais_telefono_id' => $preRegistro->pais_telefono_id,
                'telefono' => $preRegistro->telefono,
                'empleado_id' => $preRegistro->empleado_id,
                'responsable_id' => $preRegistro->responsable_id,
                'tipo_servicio_id' => $request->tipo_servicio_id,
                'motivo_visita' => $preRegistro->motivo_registro,
                'fecha_ingreso' => $request->fecha_ingreso,
                'hora_ingreso' => $request->hora_ingreso,
                'fecha_salida' => $request->fecha_salida,
                'hora_salida' => $request->hora_salida,
                'foto_carnet' => $fotoCarnet,
                'foto_documento' => $fotoDocumento,
                'status' => 'en_revision', // Under review status
                'empresa_id' => $preRegistro->empresa_id,
                'sucursal_id' => $preRegistro->sucursal_id,
            ]);

            // 2. Marcar pre-registro como completado
            $preRegistro->update(['status' => 'completado']);

            DB::commit();

            // 3. Enviar mensaje de WhatsApp
            try {
                $pais = Pais::find($preRegistro->pais_telefono_id);
                if ($pais && $preRegistro->telefono) {
                    $prefix = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
                    $cleanPhone = preg_replace('/[^0-9]/', '', $preRegistro->telefono);
                    $to = $prefix . $cleanPhone;

                    $empresa = $preRegistro->empresa;
                    $whatsappService = new WhatsAppService($empresa);

                    $message = "Estimado Visitante *{$preRegistro->nombres} {$preRegistro->apellidos}*, hemos recibido la información de su pre-registro de visita satisfactoriamente.\n\n"
                        . "Su solicitud de ingreso se encuentra *En Revisión*. Le notificaremos una vez sea validada por el personal correspondiente.";

                    $whatsappService->sendMessage($to, $message, true);
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp de pre-registro de visita completado: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => __('Pre-registration completed successfully. Your information is under review.')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => __('An error occurred while processing your registration: ') . $e->getMessage()
            ], 500);
        }
    }

    public function storeTipoServicio(Request $request, $token)
    {
        $preRegistro = VisitaTemporalPreRegistro::where('token', $token)
            ->where('status', 'pendiente')
            ->where('expires_at', '>', now())
            ->firstOrFail();

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
        ]);

        $existing = TipoServicio::where('empresa_id', $preRegistro->empresa_id)
            ->where('nombre', $validated['nombre'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => true,
                'tipo_servicio' => $existing,
            ]);
        }

        $tipoServicio = TipoServicio::create([
            'nombre' => $validated['nombre'],
            'empresa_id' => $preRegistro->empresa_id,
            'sucursal_id' => $preRegistro->sucursal_id,
            'status' => 1,
        ]);

        return response()->json([
            'success' => true,
            'tipo_servicio' => $tipoServicio,
        ]);
    }
}
