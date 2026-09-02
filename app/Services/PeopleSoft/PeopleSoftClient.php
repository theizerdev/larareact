<?php

namespace App\Services\PeopleSoft;

use DOMDocument;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Transporte hacia PeopleSoft Integration Broker.
 *
 * Los mensajes asíncronos de terceros se entregan por HTTP POST al listening
 * connector del gateway, envueltos en el sobre <IBRequest>, con el contenido
 * del mensaje dentro de una sección CDATA.
 *
 * Referencia: Oracle, "Working with the HTTP Connectors" (PeopleTools,
 * Integration Broker Administration).
 *
 * ---------------------------------------------------------------------------
 * CANDADO DE SEGURIDAD
 * ---------------------------------------------------------------------------
 * Shigoto corre en producción. Mientras config('peoplesoft.enabled') sea false
 * este cliente se niega a abrir cualquier conexión: `send()` lanza excepción
 * antes de tocar la red. Construir el sobre (`buildEnvelope`) sí funciona
 * siempre, porque es lo que permite revisar y validar el payload en frío.
 */
class PeopleSoftClient
{
    public function __construct(
        private readonly ?string $gatewayUrl,
        private readonly string $nodeFrom,
        private readonly ?string $nodeTo,
        private readonly ?string $nodePassword = null,
        private readonly ?string $basicAuthUser = null,
        private readonly ?string $basicAuthPassword = null,
        private readonly int $timeout = 30,
        private readonly bool $verifySsl = true,
    ) {}

    public static function fromConfig(): self
    {
        return new self(
            gatewayUrl: config('peoplesoft.gateway_url'),
            nodeFrom: (string) config('peoplesoft.node_from', 'SHIGOTO_TCD'),
            nodeTo: config('peoplesoft.node_to'),
            nodePassword: config('peoplesoft.node_password'),
            basicAuthUser: config('peoplesoft.basic_auth_user'),
            basicAuthPassword: config('peoplesoft.basic_auth_password'),
            timeout: (int) config('peoplesoft.timeout', 30),
            verifySsl: (bool) config('peoplesoft.verify_ssl', true),
        );
    }

    /**
     * ¿Hay datos suficientes para intentar un envío?
     */
    public function isConfigured(): bool
    {
        return filled($this->gatewayUrl) && filled($this->nodeTo);
    }

    /**
     * Motivos por los que hoy NO se podría enviar. Vacío = listo.
     *
     * @return array<int,string>
     */
    public function faltantes(): array
    {
        $faltan = [];

        if (! config('peoplesoft.enabled')) {
            $faltan[] = 'La integración está desactivada (PEOPLESOFT_ENABLED=false).';
        }

        if (blank($this->gatewayUrl)) {
            $faltan[] = 'Falta la URL del gateway de Integration Broker (PEOPLESOFT_GATEWAY_URL).';
        }

        if (blank($this->nodeTo)) {
            $faltan[] = 'Falta el nodo destino de PeopleSoft (PEOPLESOFT_NODE_TO).';
        }

        return $faltan;
    }

    /**
     * Envuelve el mensaje en el sobre <IBRequest> del listening connector.
     *
     * No requiere que la integración esté activa: sirve para inspeccionar
     * exactamente qué se mandaría.
     */
    public function buildEnvelope(string $operationName, string $messageXml): string
    {
        $doc = new DOMDocument('1.0', 'UTF-8');
        $doc->formatOutput = true;

        $ibRequest = $doc->createElement('IBRequest');
        $doc->appendChild($ibRequest);

        $ibRequest->appendChild($this->texto($doc, 'ExternalOperationName', $operationName));
        $ibRequest->appendChild($this->texto($doc, 'OperationType', 'async'));

        $from = $doc->createElement('From');
        $from->appendChild($this->texto($doc, 'RequestingNode', $this->nodeFrom));
        if (filled($this->nodePassword)) {
            $from->appendChild($this->texto($doc, 'Password', (string) $this->nodePassword));
        }
        $from->appendChild($this->texto($doc, 'OrigTimeStamp', now()->format('Y-m-d\TH:i:s.uO')));
        $ibRequest->appendChild($from);

        if (filled($this->nodeTo)) {
            $to = $doc->createElement('To');
            $to->appendChild($this->texto($doc, 'DestinationNode', (string) $this->nodeTo));
            $ibRequest->appendChild($to);
        }

        $contentSections = $doc->createElement('ContentSections');
        $contentSection = $doc->createElement('ContentSection');

        $data = $doc->createElement('Data');
        // El contenido del mensaje viaja como CDATA, precedido de su propia
        // declaración XML: así lo especifica el connector.
        $data->appendChild($doc->createCDATASection($this->conDeclaracionXml($messageXml)));
        $contentSection->appendChild($data);

        $contentSections->appendChild($contentSection);
        $ibRequest->appendChild($contentSections);

        return (string) $doc->saveXML();
    }

    /**
     * Entrega el sobre al gateway.
     *
     * @return array{success: bool, status: int|null, body: string|null, error: string|null}
     *
     * @throws \RuntimeException si la integración no está habilitada.
     */
    public function send(string $operationName, string $messageXml): array
    {
        // Candado. No es negociable desde el código que llama.
        if (! config('peoplesoft.enabled')) {
            throw new \RuntimeException(
                'Envío bloqueado: la integración con PeopleSoft está desactivada. '.
                'Actívala con PEOPLESOFT_ENABLED=true sólo cuando haya un entorno destino validado.'
            );
        }

        if (! $this->isConfigured()) {
            throw new \RuntimeException('Envío bloqueado: '.implode(' ', $this->faltantes()));
        }

        $sobre = $this->buildEnvelope($operationName, $messageXml);

        try {
            $response = $this->client()
                ->withHeaders(['Content-Type' => 'text/xml; charset=utf-8'])
                ->withBody($sobre, 'text/xml')
                ->post($this->listeningConnectorUrl());
        } catch (ConnectionException $e) {
            Log::channel('peoplesoft')->error('PeopleSoft inalcanzable: '.$e->getMessage(), [
                'url' => $this->gatewayUrl,
                'operation' => $operationName,
            ]);

            return ['success' => false, 'status' => null, 'body' => null, 'error' => 'No se pudo contactar al gateway de PeopleSoft.'];
        } catch (\Throwable $e) {
            Log::channel('peoplesoft')->error('PeopleSoft error de envío: '.$e->getMessage(), [
                'operation' => $operationName,
            ]);

            return ['success' => false, 'status' => null, 'body' => null, 'error' => 'Error inesperado al enviar a PeopleSoft.'];
        }

        $body = $response->body();

        if (! $response->successful()) {
            Log::channel('peoplesoft')->warning('PeopleSoft respondió con error HTTP', [
                'status' => $response->status(),
                'operation' => $operationName,
            ]);

            return ['success' => false, 'status' => $response->status(), 'body' => $body, 'error' => 'PeopleSoft respondió HTTP '.$response->status().'.'];
        }

        // El gateway contesta un acuse XML. Un 200 significa "recibido", no
        // "procesado": el resultado real se ve en el Service Operations
        // Monitor y, si la fila fue rechazada, en el TCD error queue.
        if ($this->acuseConError($body)) {
            return ['success' => false, 'status' => $response->status(), 'body' => $body, 'error' => 'El Integration Broker devolvió un acuse con error.'];
        }

        return ['success' => true, 'status' => $response->status(), 'body' => $body, 'error' => null];
    }

    public function listeningConnectorUrl(): string
    {
        return rtrim((string) $this->gatewayUrl, '/').'/PSIGW/HttpListeningConnector';
    }

    /**
     * Un acuse del gateway trae <IBResponse type="error"> cuando algo falló
     * aunque el HTTP haya sido 200.
     */
    private function acuseConError(?string $body): bool
    {
        if (blank($body)) {
            return false;
        }

        return (bool) preg_match('/<IBResponse[^>]*type\s*=\s*"error"/i', (string) $body);
    }

    private function conDeclaracionXml(string $xml): string
    {
        $xml = trim($xml);

        return str_starts_with($xml, '<?xml')
            ? $xml
            : '<?xml version="1.0"?>'.$xml;
    }

    private function texto(DOMDocument $doc, string $nombre, string $valor): \DOMElement
    {
        $el = $doc->createElement($nombre);
        $el->appendChild($doc->createTextNode($valor));

        return $el;
    }

    private function client(): PendingRequest
    {
        $client = Http::timeout($this->timeout)->connectTimeout(10);

        if (filled($this->basicAuthUser)) {
            $client = $client->withBasicAuth((string) $this->basicAuthUser, (string) $this->basicAuthPassword);
        }

        if (! $this->verifySsl) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }
}
