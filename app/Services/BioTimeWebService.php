<?php

namespace App\Services;

use App\Models\Empresa;
use GuzzleHttp\Cookie\CookieJar;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sube fotos a BioTime Cloud por su interfaz web, con la misma cuenta de la
 * integración. La API REST no recibe fotos (/iclock/api/bio_photo/ responde
 * 403 hasta a un super usuario y el empleado no tiene campo de foto), así que
 * aquí se repiten las dos importaciones que un administrador hace a mano:
 *
 * - Personal › Empleado › Importar foto        → foto de perfil.
 * - Dispositivo › Bio-Photo › Importar bio-foto → rostro para los relojes;
 *   queda «Pendiente» y se aprueba con Aprobar/Rechazar.
 *
 * Ambas reciben archivos nombrados con el número de empleado (123.jpg).
 *
 * No es una API publicada: si BioTime cambia su interfaz esto deja de
 * funcionar y devuelve el error, sin tocar nada más. Quien llama debe dejar
 * la foto como pendiente en ese caso (config biotime.web_fotos lo apaga).
 */
class BioTimeWebService
{
    /** Nombres de las acciones de la interfaz, en hexadecimal como los manda BioTime. */
    private const IMPORTAR_FOTO = '496d706f727450686f746f';            // ImportPhoto

    private const IMPORTAR_BIOFOTO = '496d706f727442696f50686f746f';    // ImportBioPhoto

    private const APROBAR_BIOFOTO = '42696f50686f746f417070726f7665';   // BioPhotoApprove

    private const URL_EMPLEADOS = '/personnel/employee/action/';

    private const URL_BIOFOTOS = '/iclock/biophoto/action/';

    private const TABLA_BIOFOTOS = '/iclock/biophoto/table/';

    /** Estado «Pendiente» en el filtro de la tabla de bio-fotos. */
    private const ESTADO_PENDIENTE = 0;

    private ?string $baseUrl;

    private ?string $company;

    private ?string $username;

    private ?string $password;

    private int $empresaId;

    private CookieJar $cookies;

    private bool $conSesion = false;

    public function __construct(Empresa $empresa)
    {
        $this->baseUrl = $empresa->biotime_base_url ? rtrim($empresa->biotime_base_url, '/') : null;
        $this->company = filled($empresa->biotime_company) ? trim($empresa->biotime_company) : null;
        $this->username = $empresa->biotime_username;
        $this->password = $empresa->biotime_password;
        $this->empresaId = $empresa->id;
        $this->cookies = new CookieJar();
    }

    /** Sólo BioTime Cloud (cuenta por compañía) y con la vía web encendida. */
    public function disponible(): bool
    {
        return (bool) config('biotime.web_fotos', false)
            && filled($this->baseUrl) && filled($this->company) && filled($this->username) && filled($this->password);
    }

    /**
     * Foto de perfil del empleado (JPG de hasta 25 KB). Reemplaza la que haya.
     *
     * @return array{success: bool, error: string|null}
     */
    public function subirFotoPerfil(string $empCode, string $jpg): array
    {
        return $this->protegido(fn () => $this->importar(self::URL_EMPLEADOS, self::IMPORTAR_FOTO, $empCode, $jpg));
    }

    /**
     * Bio-foto del empleado. BioTime la deja pendiente; si
     * config('biotime.web_aprobar_biofoto') está encendido se aprueba la que
     * se acaba de subir (y sólo ésa).
     *
     * @return array{success: bool, error: string|null, aprobada?: bool}
     */
    public function subirBioFoto(string $empCode, string $jpg): array
    {
        return $this->protegido(function () use ($empCode, $jpg) {
            $antes = $this->pendientes($empCode);

            $r = $this->importar(self::URL_BIOFOTOS, self::IMPORTAR_BIOFOTO, $empCode, $jpg);
            if (! $r['success'] || ! config('biotime.web_aprobar_biofoto', true)) {
                return $r + ['aprobada' => false];
            }

            // Lo nuevo respecto de antes de importar: nunca se aprueba una
            // bio-foto pendiente que ya estaba (la pudo subir otra persona).
            $nuevas = array_values(array_unique(array_diff_key($this->pendientes($empCode), $antes)));
            if ($nuevas === []) {
                return ['success' => false, 'error' => 'BioTime recibió la bio-foto pero no aparece como pendiente para aprobarla.', 'aprobada' => false];
            }

            $formulario = $this->formulario(self::URL_BIOFOTOS, self::APROBAR_BIOFOTO, ['id' => $nuevas[0]]);
            $campos = [
                ['name' => 'csrfmiddlewaretoken', 'contents' => $formulario],
                ['name' => 'state', 'contents' => '1'],
                ['name' => 'overwrite', 'contents' => '1'],
                ['name' => 'remark', 'contents' => 'Hosho'],
                ['name' => 'action_name', 'contents' => self::APROBAR_BIOFOTO],
            ];
            foreach ($nuevas as $id) {
                $campos[] = ['name' => 'id', 'contents' => (string) $id];
            }

            $resp = $this->cliente()->withHeaders($this->ajax($formulario))->asMultipart()->post($this->baseUrl.self::URL_BIOFOTOS, $campos);
            $error = $this->errorDe($resp);

            return ['success' => $error === null, 'error' => $error === null ? null : "La bio-foto se subió pero no se pudo aprobar: {$error}", 'aprobada' => $error === null];
        });
    }

    /* ------------------------------------------------------------------ */

    /**
     * @param  callable(): array  $fn
     * @return array{success: bool, error: string|null}
     */
    private function protegido(callable $fn): array
    {
        if (! $this->disponible()) {
            return ['success' => false, 'error' => 'La subida de fotos por la web de BioTime no está disponible para esta empresa.'];
        }

        try {
            $this->iniciarSesion();

            return $fn();
        } catch (\Throwable $e) {
            Log::channel('biotime')->warning('BioTime web: '.$e->getMessage(), ['empresa_id' => $this->empresaId]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * @return array{success: bool, error: string|null}
     */
    private function importar(string $url, string $accion, string $empCode, string $jpg): array
    {
        $csrf = $this->formulario($url, $accion);

        $resp = $this->cliente()->withHeaders($this->ajax($csrf))
            ->attach('bio_photo', $jpg, trim($empCode).'.jpg', ['Content-Type' => 'image/jpeg'])
            ->post($this->baseUrl.$url, [
                ['name' => 'csrfmiddlewaretoken', 'contents' => $csrf],
                ['name' => 'overwrite', 'contents' => '1'],
                ['name' => 'ignore_error', 'contents' => '0'],
                ['name' => 'action_name', 'contents' => $accion],
            ]);

        $error = $this->errorDe($resp);

        return ['success' => $error === null, 'error' => $error];
    }

    /** Abre el formulario de una acción y devuelve su token CSRF. */
    private function formulario(string $url, string $accion, array $extra = []): string
    {
        $resp = $this->cliente()->withHeaders(['X-Requested-With' => 'XMLHttpRequest'])
            ->get($this->baseUrl.$url, ['action_name' => $accion, '_popup' => 'true'] + $extra);

        $csrf = $resp->successful() ? $this->csrf($resp->body()) : null;
        if ($csrf === null) {
            throw new \RuntimeException('BioTime no mostró el formulario de importación (HTTP '.$resp->status().'). Puede haber cambiado su interfaz web.');
        }

        return $csrf;
    }

    /**
     * Bio-fotos pendientes de aprobar de un empleado, como «id|archivo» => id:
     * así una pendiente reemplazada (mismo id, otro archivo) cuenta como nueva.
     *
     * @return array<string,string>
     */
    private function pendientes(string $empCode): array
    {
        $resp = $this->cliente()->withHeaders(['X-Requested-With' => 'XMLHttpRequest'])->get($this->baseUrl.self::TABLA_BIOFOTOS, [
            'page' => 1, 'limit' => 50,
            '_p_employee__emp_code__exact' => trim($empCode),
            '_p_approval_state__exact' => self::ESTADO_PENDIENTE,
        ]);

        $filas = $resp->json('data');
        if (! $resp->successful() || ! is_array($filas)) {
            throw new \RuntimeException('BioTime no devolvió la lista de bio-fotos (HTTP '.$resp->status().').');
        }

        $pendientes = [];
        foreach ($filas as $fila) {
            // El filtro podría ignorarse si BioTime cambia: se vuelve a comprobar aquí.
            if ((string) ($fila['get_emp_code'] ?? '') === trim($empCode) && str_starts_with((string) ($fila['bio_photo'] ?? ''), 'register/')) {
                $pendientes[(string) $fila['id'].'|'.$fila['bio_photo']] = (string) $fila['id'];
            }
        }

        return $pendientes;
    }

    /** null = BioTime aceptó la acción ({"code": 0}). */
    private function errorDe(Response $resp): ?string
    {
        $json = $resp->json();

        if ($resp->successful() && is_array($json) && (int) ($json['code'] ?? -1) === 0) {
            return null;
        }

        $msg = is_array($json) ? trim(strip_tags((string) ($json['msg'] ?? ''))) : '';

        return $msg !== '' ? mb_substr($msg, 0, 300) : 'BioTime rechazó la importación (HTTP '.$resp->status().').';
    }

    /* ------------------------------------------------------------------ */
    /*  Sesión web                                                         */
    /* ------------------------------------------------------------------ */

    /**
     * Mismo inicio de sesión que la página /login/ de BioTime Cloud: compañía
     * y correo primero, contraseña después; los datos viajan cifrados con el
     * token CSRF de la página (RC4 + base64), igual que lo hace su JavaScript.
     */
    private function iniciarSesion(): void
    {
        if ($this->conSesion) {
            return;
        }

        // Tras un rechazo no se reintenta enseguida: evita bloquear la cuenta.
        $bloqueo = "biotime:web_login_rechazado:{$this->empresaId}";
        if (Cache::has($bloqueo)) {
            throw new \RuntimeException('BioTime rechazó hace poco el inicio de sesión web; se reintentará más tarde.');
        }

        $csrf = $this->csrf($this->cliente()->get($this->baseUrl.'/login/')->body());
        if ($csrf === null) {
            throw new \RuntimeException('No se pudo abrir la página de inicio de sesión de BioTime.');
        }

        $compania = $this->cliente()->withHeaders(['X-Requested-With' => 'XMLHttpRequest'])
            ->get($this->baseUrl.'/accounts/check_company/?'.$this->cifrado(['username' => $this->username, 'company_name' => $this->company], $csrf))
            ->json();

        if (! is_array($compania) || (int) ($compania['ret'] ?? -1) !== 0 || ! isset($compania['company_name'], $compania['username'], $compania['login_user'])) {
            Cache::put($bloqueo, true, now()->addMinutes(15));
            throw new \RuntimeException('BioTime no reconoció la compañía o el correo en el inicio de sesión web.');
        }

        $pagina = $this->cliente()->get($this->baseUrl.'/accounts/redirect_check_company/?'.$this->cifrado([
            'company_name' => $compania['company_name'], 'username' => $compania['username'], 'login_user' => $compania['login_user'],
        ], $csrf));

        $csrf = $this->csrf($pagina->body());
        if ($csrf === null) {
            throw new \RuntimeException('BioTime no mostró la página de contraseña.');
        }

        $cuerpo = $this->cifrado(['username' => $this->username, 'password' => $this->password, 'csrfmiddlewaretoken' => $csrf], $csrf)
            .'&company_name='.rawurlencode((string) $this->company)
            .'&login_user='.rawurlencode((string) $compania['login_user']);

        $login = $this->cliente()->withHeaders($this->ajax($csrf))
            ->withBody($cuerpo, 'application/x-www-form-urlencoded; charset=UTF-8')
            ->post($this->baseUrl.'/login/');

        if (! $login->successful() || $login->json('ret') !== 0) {
            Cache::put($bloqueo, true, now()->addMinutes(15));
            throw new \RuntimeException('BioTime rechazó el inicio de sesión web (correo o contraseña).');
        }

        $this->conSesion = true;
    }

    private function cifrado(array $datos, string $csrf): string
    {
        return 'encrypt_data='.rawurlencode(base64_encode($this->rc4($csrf, http_build_query($datos))))
            .'&csrfmiddlewaretoken='.rawurlencode($csrf);
    }

    private function rc4(string $clave, string $texto): string
    {
        $s = range(0, 255);
        $j = 0;
        $largo = strlen($clave);

        for ($i = 0; $i < 256; $i++) {
            $j = ($j + $s[$i] + ord($clave[$i % $largo])) % 256;
            [$s[$i], $s[$j]] = [$s[$j], $s[$i]];
        }

        $i = $j = 0;
        $salida = '';
        for ($y = 0, $n = strlen($texto); $y < $n; $y++) {
            $i = ($i + 1) % 256;
            $j = ($j + $s[$i]) % 256;
            [$s[$i], $s[$j]] = [$s[$j], $s[$i]];
            $salida .= chr(ord($texto[$y]) ^ $s[($s[$i] + $s[$j]) % 256]);
        }

        return $salida;
    }

    private function csrf(string $html): ?string
    {
        return preg_match('/name=[\'"]csrfmiddlewaretoken[\'"]\s+value=[\'"]([^\'"]+)/', $html, $m) ? $m[1] : null;
    }

    /** @return array<string,string> */
    private function ajax(string $csrf): array
    {
        return ['X-Requested-With' => 'XMLHttpRequest', 'X-CSRFToken' => $csrf, 'Referer' => $this->baseUrl.'/'];
    }

    private function cliente(): PendingRequest
    {
        $cliente = Http::timeout((int) config('biotime.timeout', 20))
            ->connectTimeout(10)
            ->withOptions(['cookies' => $this->cookies]);

        return config('biotime.verify_ssl', true) ? $cliente : $cliente->withoutVerifying();
    }
}
