<?php

namespace App\Helpers;

class UserAgentParser
{
    /**
     * Parsea un User Agent y extrae el sistema operativo, navegador y tipo de dispositivo.
     */
    public static function parse($userAgent)
    {
        $os = 'Unknown OS';
        $browser = 'Unknown Browser';
        $device = 'Desktop';

        if (empty($userAgent)) {
            return compact('os', 'browser', 'device');
        }

        // Detectar Sistema Operativo
        if (preg_match('/iphone|ipod|ipad/i', $userAgent)) {
            $os = 'iOS';
            $device = 'Mobile';
        } elseif (preg_match('/android/i', $userAgent)) {
            $os = 'Android';
            $device = 'Mobile';
        } elseif (preg_match('/windows|win32/i', $userAgent)) {
            $os = 'Windows';
        } elseif (preg_match('/macintosh|mac os x/i', $userAgent)) {
            $os = 'macOS';
        } elseif (preg_match('/linux/i', $userAgent)) {
            $os = 'Linux';
        }

        // Detectar Navegador
        if (preg_match('/chrome|crios/i', $userAgent) && ! preg_match('/edge|edg/i', $userAgent)) {
            $browser = 'Chrome';
        } elseif (preg_match('/safari/i', $userAgent) && ! preg_match('/chrome|crios/i', $userAgent)) {
            $browser = 'Safari';
        } elseif (preg_match('/firefox|iceweasel/i', $userAgent)) {
            $browser = 'Firefox';
        } elseif (preg_match('/edge|edg/i', $userAgent)) {
            $browser = 'Edge';
        } elseif (preg_match('/msie|trident/i', $userAgent)) {
            $browser = 'Internet Explorer';
        }

        return compact('os', 'browser', 'device');
    }
}
