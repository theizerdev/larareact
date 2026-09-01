/**
 * Notificaciones de escritorio (Web Notifications API) + sonido del sistema.
 *
 * El backend expone las notificaciones como props de Inertia (`notifications` y
 * `unreadNotificationsCount`). Como no hay websockets, este hook:
 *
 *  1. Refresca esas props cada POLL_INTERVAL_MS con un partial reload de Inertia.
 *  2. Detecta las notificaciones nuevas no leídas comparando contra un registro
 *     de IDs ya vistos (persistido en localStorage para sobrevivir recargas).
 *  3. Por cada notificación nueva lanza un aviso del sistema operativo, reproduce
 *     un sonido corto y muestra un toast dentro de la app.
 *
 * Todo el disparo está detrás de un interruptor (`enabled`) que el usuario activa
 * manualmente desde la campana; al activarlo se pide permiso al navegador.
 */
import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslate } from '@/hooks/use-translate';
import { playNotificationSound, primeNotificationSound } from '@/lib/notification-sound';

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
};

const POLL_INTERVAL_MS = 45_000;
const SEEN_STORAGE_KEY = 'shigoto:notif:seen';
const ENABLED_STORAGE_KEY = 'shigoto:notif:enabled';
const SOUND_STORAGE_KEY = 'shigoto:notif:sound';
const SEEN_LIMIT = 500;
const OS_ICON = '/icons/kiosko-192.png';
/** Si llegan más de estas de golpe, se resume en un solo aviso en vez de una ráfaga. */
const BURST_LIMIT = 3;

const isBrowser = typeof window !== 'undefined';
const supportsNotifications = isBrowser && 'Notification' in window;

function readStorage(key: string): string | null {
    if (!isBrowser) {
        return null;
    }

    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key: string, value: string): void {
    if (!isBrowser) {
        return;
    }

    try {
        window.localStorage.setItem(key, value);
    } catch {
        /* almacenamiento no disponible: se ignora */
    }
}

function loadSeenIds(): Set<string> {
    const raw = readStorage(SEEN_STORAGE_KEY);

    if (!raw) {
        return new Set();
    }

    try {
        const parsed = JSON.parse(raw);

        return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
    } catch {
        return new Set();
    }
}

function persistSeenIds(ids: Set<string>): void {
    const trimmed = Array.from(ids).slice(-SEEN_LIMIT);
    writeStorage(SEEN_STORAGE_KEY, JSON.stringify(trimmed));
}

function showOsNotification(title: string, body: string, tag: string): void {
    if (!supportsNotifications || Notification.permission !== 'granted') {
        return;
    }

    try {
        const notification = new Notification(title, {
            body,
            icon: OS_ICON,
            badge: OS_ICON,
            tag,
            renotify: true,
        } as NotificationOptions);

        notification.onclick = () => {
            try {
                window.focus();
            } catch {
                /* se ignora */
            }

            notification.close();
        };
    } catch {
        /* algunos navegadores exigen ServiceWorkerRegistration.showNotification: se ignora */
    }
}

export type DesktopNotifications = {
    /** El navegador soporta la Web Notifications API. */
    supported: boolean;
    /** Estado del permiso del navegador: 'default' | 'granted' | 'denied'. */
    permission: NotificationPermission;
    /** El usuario activó los avisos de escritorio. */
    enabled: boolean;
    /** Reproducir sonido junto con el aviso. */
    soundEnabled: boolean;
    /** Pide permiso y activa los avisos. */
    enable: () => Promise<void>;
    /** Desactiva los avisos (no revoca el permiso del navegador). */
    disable: () => void;
    /** Activa/desactiva el sonido. */
    setSoundEnabled: (value: boolean) => void;
    /** Dispara un aviso de prueba. */
    sendTest: () => void;
};

export function useDesktopNotifications(): DesktopNotifications {
    const page = usePage();
    const notifications = useMemo(
        () => (page.props.notifications ?? []) as NotificationItem[],
        [page.props.notifications],
    );
    const authUser = (page.props.auth as { user?: unknown } | undefined)?.user;

    const [permission, setPermission] = useState<NotificationPermission>(
        supportsNotifications ? Notification.permission : 'denied',
    );
    const [enabled, setEnabled] = useState<boolean>(() => readStorage(ENABLED_STORAGE_KEY) === '1');
    const [soundEnabled, setSoundEnabledState] = useState<boolean>(
        () => readStorage(SOUND_STORAGE_KEY) !== '0',
    );

    const seenRef = useRef<Set<string> | null>(null);

    if (seenRef.current === null) {
        seenRef.current = loadSeenIds();
    }

    const initializedRef = useRef(false);

    // Mantiene actualizados los valores usados dentro de intervalos/efectos sin
    // reprogramarlos en cada cambio.
    const { __ } = useTranslate();
    const tRef = useRef(__);
    const enabledRef = useRef(enabled);
    const soundRef = useRef(soundEnabled);
    useEffect(() => {
        tRef.current = __;
    });
    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);
    useEffect(() => {
        soundRef.current = soundEnabled;
    }, [soundEnabled]);

    const fireFor = useCallback((items: NotificationItem[]) => {
        if (!enabledRef.current || items.length === 0) {
            return;
        }

        if (soundRef.current) {
            playNotificationSound();
        }

        if (items.length > BURST_LIMIT) {
            const summary = tRef.current('You have :count new notifications', {
                count: String(items.length),
            });
            toast.info(summary);
            showOsNotification(summary, tRef.current('Open them from the notifications bell.'), 'shigoto:notif:burst');

            return;
        }

        for (const item of items) {
            toast.info(item.title, { description: item.message });
            showOsNotification(item.title, item.message, `shigoto:notif:${item.id}`);
        }
    }, []);

    // Detección de notificaciones nuevas.
    useEffect(() => {
        const seen = seenRef.current;

        if (!seen) {
            return;
        }

        const fresh = notifications.filter((n) => !n.read && !seen.has(n.id));

        if (!initializedRef.current) {
            initializedRef.current = true;

            // Primera vez en este navegador: no disparamos por el historial previo,
            // solo lo registramos como visto.
            if (seen.size > 0) {
                fireFor(fresh);
            }
        } else {
            fireFor(fresh);
        }

        let changed = false;

        for (const n of notifications) {
            if (!seen.has(n.id)) {
                seen.add(n.id);
                changed = true;
            }
        }

        if (changed) {
            persistSeenIds(seen);
        }
    }, [notifications, fireFor]);

    // Polling: refresca las props de notificaciones sin recargar la página.
    useEffect(() => {
        if (!isBrowser || !authUser) {
            return;
        }

        const reload = () => {
            router.reload({ only: ['notifications', 'unreadNotificationsCount'] });
        };

        const interval = window.setInterval(reload, POLL_INTERVAL_MS);

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                reload();
            }
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [authUser]);

    const enable = useCallback(async () => {
        if (!supportsNotifications) {
            toast.error(tRef.current('Your browser does not support desktop notifications.'));

            return;
        }

        let result: NotificationPermission = Notification.permission;

        if (result === 'default') {
            try {
                result = await Notification.requestPermission();
            } catch {
                result = Notification.permission;
            }
        }

        setPermission(result);

        if (result !== 'granted') {
            toast.error(tRef.current('The browser blocked notifications. Enable them in the site settings.'));

            return;
        }

        setEnabled(true);
        writeStorage(ENABLED_STORAGE_KEY, '1');
        primeNotificationSound();

        if (soundRef.current) {
            playNotificationSound();
        }

        toast.success(tRef.current('Desktop notifications enabled.'));
        showOsNotification(
            tRef.current('Notifications enabled'),
            tRef.current('This is how Shigoto alerts will look.'),
            'shigoto:notif:welcome',
        );
    }, []);

    const disable = useCallback(() => {
        setEnabled(false);
        writeStorage(ENABLED_STORAGE_KEY, '0');
    }, []);

    const setSoundEnabled = useCallback((value: boolean) => {
        setSoundEnabledState(value);
        writeStorage(SOUND_STORAGE_KEY, value ? '1' : '0');

        if (value) {
            playNotificationSound();
        }
    }, []);

    const sendTest = useCallback(() => {
        if (soundRef.current) {
            playNotificationSound();
        }

        const title = tRef.current('Test notification');
        const body = tRef.current('Everything works correctly.');
        toast.info(title, { description: body });
        showOsNotification(title, body, 'shigoto:notif:test');
    }, []);

    return {
        supported: supportsNotifications,
        permission,
        enabled,
        soundEnabled,
        enable,
        disable,
        setSoundEnabled,
        sendTest,
    };
}
