<?php

namespace App\Services\PeopleSoft;

use DOMDocument;
use DOMElement;

/**
 * Arma el mensaje PUNCHED_TIME_ADD en el formato "rowset-based" de PeopleSoft:
 * una sección <FieldTypes> que describe los campos y una <MsgData> con las
 * filas, cada una cerrada por su registro PSCAMA.
 *
 * Referencia: Oracle, "PeopleSoft Rowset-Based Message Format" (PeopleTools,
 * Integration Broker) y "Objects Sent from the TCD" (HCM 9.2, Time and Labor).
 *
 * OJO al poner esto en marcha con un PeopleSoft real: el XSD/WSDL que publica
 * la instancia del cliente manda sobre este generador. Antes del primer envío
 * hay que descargarlo de
 *   <gateway>/PSIGW/PeopleSoftServiceListeningConnector/PUNCHED_TIME_ADD.VERSION_1.xsd
 * y confirmar tipos y orden de campos. Está construido para que ese ajuste sea
 * cambiar el arreglo FIELD_TYPES y nada más.
 */
class PunchedTimeMessageBuilder
{
    /** Nombre del registro de la interfaz de marcajes. */
    public const RECORD = 'TL_PUNCH_INTFC';

    /**
     * Campos del registro y su tipo en la sección <FieldTypes>, en el orden
     * del layout publicado por Oracle.
     *
     * @var array<string,string>
     */
    public const FIELD_TYPES = [
        'BADGE_ID' => 'CHAR',
        'EMPLID' => 'CHAR',
        'EMPL_RCD' => 'NUMBER',
        'PUNCH_DTTM' => 'DATETIME',
        'DELETE_DATE' => 'DATE',
        'PUNCH_TYPE' => 'CHAR',
        'TCD_ID' => 'CHAR',
        'TIMEZONE' => 'CHAR',
        'TCD_SUPERVISR_ID' => 'CHAR',
        'OPRID' => 'CHAR',
        'OVERRIDE_RSN_CD' => 'CHAR',
        'ADD_DELETE_IND' => 'CHAR',
        'ACTION_DTTM' => 'DATETIME',
        'TASK_PROFILE_ID' => 'CHAR',
        'TASK_PRFL_TMPLT_ID' => 'CHAR',
        'COUNTRY' => 'CHAR',
        'STATE' => 'CHAR',
        'LOCALITY' => 'CHAR',
        'TL_COMMENTS' => 'CHAR',
        'AUDIT_ACTN' => 'CHAR',
    ];

    /** Campos del registro PSCAMA de nivel 0. */
    private const PSCAMA_FIELD_TYPES = [
        'LANGUAGE_CD' => 'CHAR',
        'AUDIT_ACTN' => 'CHAR',
        'BASE_LANGUAGE_CD' => 'CHAR',
        'MSG_SEQ_FLG' => 'CHAR',
        'PROCESS_INSTANCE' => 'NUMBER',
    ];

    public function __construct(
        private readonly string $messageName = 'PUNCHED_TIME_ADD',
        private readonly string $languageCode = 'ENG',
    ) {}

    /**
     * @param  array<int,array<string,mixed>>  $filas  Filas TL_PUNCH_INTFC (salida de PunchedTimeMapper).
     */
    public function build(array $filas): string
    {
        $doc = new DOMDocument('1.0', 'UTF-8');
        $doc->formatOutput = true;

        $raiz = $doc->createElement($this->messageName);
        $doc->appendChild($raiz);

        $raiz->appendChild($this->fieldTypes($doc));

        $msgData = $doc->createElement('MsgData');
        $raiz->appendChild($msgData);

        // Una <Transaction> por marcaje. Así, si Time and Labor rechaza uno,
        // el resto del lote sigue siendo interpretable y el error se aísla a
        // una persona y un momento concretos en el TCD error queue.
        foreach ($filas as $fila) {
            $msgData->appendChild($this->transaction($doc, $fila));
        }

        return (string) $doc->saveXML();
    }

    private function fieldTypes(DOMDocument $doc): DOMElement
    {
        $fieldTypes = $doc->createElement('FieldTypes');

        $registro = $doc->createElement(self::RECORD);
        $registro->setAttribute('class', 'R');
        foreach (self::FIELD_TYPES as $campo => $tipo) {
            $el = $doc->createElement($campo);
            $el->setAttribute('type', $tipo);
            $registro->appendChild($el);
        }
        $fieldTypes->appendChild($registro);

        // PSCAMA necesita su descripción de tipos igual que cualquier registro.
        $pscama = $doc->createElement('PSCAMA');
        $pscama->setAttribute('class', 'R');
        foreach (self::PSCAMA_FIELD_TYPES as $campo => $tipo) {
            $el = $doc->createElement($campo);
            $el->setAttribute('type', $tipo);
            $pscama->appendChild($el);
        }
        $fieldTypes->appendChild($pscama);

        return $fieldTypes;
    }

    /**
     * @param  array<string,mixed>  $fila
     */
    private function transaction(DOMDocument $doc, array $fila): DOMElement
    {
        $transaction = $doc->createElement('Transaction');

        $registro = $doc->createElement(self::RECORD);
        $registro->setAttribute('class', 'R');

        foreach (array_keys(self::FIELD_TYPES) as $campo) {
            $valor = $fila[$campo] ?? null;

            // Los campos vacíos se mandan como etiqueta vacía, no se omiten:
            // el orden del rowset importa.
            $el = $doc->createElement($campo);
            $el->appendChild($doc->createTextNode($valor === null ? '' : (string) $valor));
            $registro->appendChild($el);
        }

        $transaction->appendChild($registro);
        $transaction->appendChild($this->pscama($doc));

        return $transaction;
    }

    /**
     * PSCAMA de nivel 0 con AUDIT_ACTN = 'A' (alta de fila).
     */
    private function pscama(DOMDocument $doc): DOMElement
    {
        $pscama = $doc->createElement('PSCAMA');
        $pscama->setAttribute('class', 'R');

        $valores = [
            'LANGUAGE_CD' => $this->languageCode,
            'AUDIT_ACTN' => 'A',
            'BASE_LANGUAGE_CD' => $this->languageCode,
            'MSG_SEQ_FLG' => '',
            'PROCESS_INSTANCE' => '0',
        ];

        foreach ($valores as $campo => $valor) {
            $el = $doc->createElement($campo);
            $el->appendChild($doc->createTextNode((string) $valor));
            $pscama->appendChild($el);
        }

        return $pscama;
    }
}
