"""
Motor Nativo de WhatsApp Multi-Dispositivo en Python (Sin APIs Externas).
Impulsado por Neonize (WhatsMeow embebido en Python) + Segno (QR SVG nativo).
Diseñado para Fixsale Multi-Sucursal (1 instancia totalmente aislada por sucursal).

Características clave:
- Multi-instancia real aislada (1 SQLite de sesión + 1 JSON de políticas por sucursal).
- Auto-reconexión automática al arrancar el servicio para todas las sucursales ya vinculadas.
- Conexión directa por Código QR (SVG nativo) o Código de Emparejamiento (8 dígitos por teléfono).
- Simulación humana real de "Escribiendo..." (ChatPresence COMPOSING -> duración orgánica -> PAUSED).
- Escudo Anti-Baneo integral por sucursal: Warm-up progresivo de 5 etapas, límite diario y horario,
  ventana horaria laboral, verificación previa is_on_whatsapp con caché, Spintax, anti-fingerprinting,
  retardo gaussiano humano, pausas por lote, lista negra y Circuit Breaker automático.
- Worker Asíncrono de Cola persistente en SQLite (_queue.sqlite3) por instancia con webhooks a Laravel.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import random
import re
import sqlite3
import threading
import time
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Deque, Dict, List, Optional, Tuple

import httpx
import segno

try:
    import psutil
except ImportError:
    psutil = None

from neonize.client import NewClient, ProxySettings
from neonize.events import (
    ConnectedEv,
    ConnectFailureEv,
    DisconnectedEv,
    KeepAliveRestoredEv,
    KeepAliveTimeoutEv,
    LoggedOutEv,
    ManualLoginReconnectEv,
    MessageEv,
    PairStatusEv,
    ReceiptEv,
    StreamReplacedEv,
    TemporaryBanEv,
)
from neonize.proto.waCompanionReg.WACompanionReg_pb2 import DeviceProps
from neonize.utils import build_jid
from neonize.utils.enum import (
    ChatPresence,
    ChatPresenceMedia,
    ClientName,
    ClientType,
    Presence,
    ReceiptType,
)

logger = logging.getLogger("fixsale_whatsapp_engine")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SESSIONS_DIR = os.path.join(BASE_DIR, "sessions")
os.makedirs(SESSIONS_DIR, exist_ok=True)
QUEUE_DB_PATH = os.path.join(SESSIONS_DIR, "_queue.sqlite3")


def detect_laravel_webhook_url() -> str:
    """Detecta automáticamente la URL del webhook desde env o ../.env de Fixsale."""
    explicit = os.getenv("WHATSAPP_WEBHOOK_URL", "").strip()
    if explicit:
        return explicit

    laravel_env = os.path.abspath(os.path.join(BASE_DIR, "..", ".env"))
    if os.path.exists(laravel_env):
        try:
            with open(laravel_env, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("APP_URL="):
                        app_url = line.split("=", 1)[1].strip().strip('"').strip("'").rstrip("/")
                        if app_url:
                            return f"{app_url}/api/whatsapp/webhook"
        except Exception:
            pass

    return "http://127.0.0.1:8000/api/whatsapp/webhook"


def sanitize_instance_name(name: str) -> str:
    clean = re.sub(r"[^a-zA-Z0-9_-]", "_", (name or "sucursal_1").strip())
    return clean[:80] or "sucursal_1"


def normalize_hhmm(value: Optional[str], fallback: str = "08:00") -> str:
    raw = str(value or fallback).strip()
    parts = raw.split(":")
    if len(parts) >= 2:
        try:
            h = max(0, min(23, int(parts[0])))
            m = max(0, min(59, int(parts[1])))
            return f"{h:02d}:{m:02d}"
        except ValueError:
            pass
    return fallback


def format_phone_number(phone: str, default_country_code: str = "+58") -> str:
    raw_str = str(phone or "").strip()
    digits = re.sub(r"[^0-9]", "", raw_str)
    if not digits:
        return ""

    has_explicit_intl = raw_str.startswith("+") or digits.startswith("00")
    digits = digits.lstrip("0")
    if not digits:
        return ""

    if digits.startswith("580"):
        digits = "58" + digits[3:]

    # Venezuela (+58)
    if digits.startswith("58") and len(digits) >= 12:
        return digits

    # México (+521 o +52)
    if digits.startswith("521") and len(digits) == 13:
        return digits
    if digits.startswith("52") and len(digits) == 12:
        return "521" + digits[2:]

    # Preservar otros números internacionales válidos con prefijo explícito (+ o 00)
    if has_explicit_intl and 11 <= len(digits) <= 15:
        return digits

    clean_prefix = re.sub(r"[^0-9]", "", default_country_code or "58") or "58"

    if clean_prefix in ("52", "521"):
        if len(digits) == 10:
            return "521" + digits
        if digits.startswith("521") and len(digits) >= 12:
            return digits
        if digits.startswith("52") and len(digits) == 12:
            return "521" + digits[2:]
        return "521" + digits

    if len(digits) == 10:
        return clean_prefix + digits

    if digits.startswith(clean_prefix):
        return digits

    return clean_prefix + digits


def parse_spintax(text: str) -> str:
    if not text:
        return ""
    pattern = re.compile(r"\{([^{}]+)\}")
    result = text
    while True:
        match = None
        for m in pattern.finditer(result):
            if "|" in m.group(1):
                match = m
                break
        if not match:
            break
        choices = match.group(1).split("|")
        replacement = random.choice(choices)
        result = result[: match.start()] + replacement + result[match.end() :]
    return result


def replace_variables(text: str, variables: Optional[Dict[str, Any]]) -> str:
    if not text or not variables:
        return text or ""
    result = text
    for k, v in variables.items():
        val = "" if v is None else str(v)
        result = result.replace(f"{{{{{k}}}}}", val).replace(f"{{{k}}}", val)
    return result


def apply_anti_fingerprint_variance(text: str) -> str:
    zw_variants = ["", "\u200b", "\u200c", "\u200b\u200c", "\u200c\u200b"]
    return text.rstrip() + random.choice(zw_variants)


def compute_warmup_limit(
    connected_at: Optional[datetime],
    configured_daily_limit: int,
    warmup_mode: bool,
) -> Tuple[int, int]:
    """
    Escala progresivamente el límite diario para proteger líneas nuevas:
    - Días 1-2: máx 20/día
    - Días 3-4: máx 40/día
    - Días 5-7: máx 80/día
    - Días 8-14: máx 150/día
    - Día 15+: límite completo configurado
    """
    base_limit = max(10, int(configured_daily_limit or 200))
    if not connected_at:
        warmup_day = 1
    else:
        delta_days = (datetime.now() - connected_at).days
        warmup_day = max(1, delta_days + 1)

    if not warmup_mode:
        return base_limit, warmup_day

    if warmup_day <= 2:
        cap = 20
    elif warmup_day <= 4:
        cap = 40
    elif warmup_day <= 7:
        cap = 80
    elif warmup_day <= 14:
        cap = 150
    else:
        cap = base_limit

    return min(base_limit, cap), warmup_day


def is_within_working_hours(
    enabled: bool,
    start_str: str = "08:00",
    end_str: str = "20:00",
    now: Optional[datetime] = None,
) -> Tuple[bool, Optional[datetime]]:
    if not enabled:
        return True, None

    current = now or datetime.now()
    s_norm = normalize_hhmm(start_str, "08:00")
    e_norm = normalize_hhmm(end_str, "20:00")
    sh, sm = [int(x) for x in s_norm.split(":")]
    eh, em = [int(x) for x in e_norm.split(":")]

    start_dt = current.replace(hour=sh, minute=sm, second=0, microsecond=0)
    end_dt = current.replace(hour=eh, minute=em, second=0, microsecond=0)

    if start_dt <= end_dt:
        if start_dt <= current <= end_dt:
            return True, None
        next_open = start_dt if current < start_dt else (start_dt + timedelta(days=1))
        return False, next_open
    else:
        if current >= start_dt or current <= end_dt:
            return True, None
        return False, start_dt


def calculate_safety_score(
    simulate_typing: bool,
    warmup_mode: bool,
    working_hours_enabled: bool,
    verify_number: bool,
    delay_min_sec: int,
    delay_max_sec: int,
    daily_limit: int,
    hourly_limit: int,
    batch_size: int,
    batch_pause_sec: int,
) -> Tuple[int, List[str]]:
    score = 0
    tips: List[str] = []

    if simulate_typing:
        score += 20
    else:
        tips.append("Activa la simulación de 'Escribiendo...' para humanizar cada despacho.")

    if warmup_mode:
        score += 18
    else:
        tips.append("Habilita el Modo Calentamiento (Warm-up) en líneas nuevas o recién vinculadas.")

    if working_hours_enabled:
        score += 14
    else:
        tips.append("Configura una ventana horaria laboral para evitar envíos nocturnos.")

    if verify_number:
        score += 14
    else:
        tips.append("Activa la verificación previa en WhatsApp para evitar rebotes a números inexistentes.")

    if delay_min_sec >= 8 and delay_max_sec >= 15:
        score += 14
    elif delay_min_sec >= 5:
        score += 8
        tips.append("Aumenta el retardo aleatorio a 8–20 s para reducir patrones automatizados.")
    else:
        tips.append("El retardo entre mensajes es muy bajo (<5 s); se recomienda 8–20 s.")

    if hourly_limit <= 35:
        score += 10
    elif hourly_limit <= 60:
        score += 5
        tips.append("Limita los envíos a ≤ 35 mensajes/hora para mayor seguridad.")
    else:
        tips.append("Más de 60 mensajes/hora incrementa significativamente el riesgo de bloqueo.")

    if batch_size <= 15 and batch_pause_sec >= 45:
        score += 10
    else:
        score += 4
        tips.append("Configura pausas de enfriamiento de ≥ 45 s cada 10–15 mensajes.")

    if daily_limit > 500:
        score = max(0, score - 10)
        tips.append("Un límite diario mayor a 500 mensajes exige cuentas muy maduras.")

    return min(100, max(0, score)), tips


def gaussian_human_delay(min_sec: float, max_sec: float) -> float:
    lo = max(1.0, float(min_sec))
    hi = max(lo + 0.5, float(max_sec))
    mean = (lo + hi) / 2.0
    sigma = (hi - lo) / 4.0
    val = random.gauss(mean, sigma)
    return max(lo, min(hi, val))


def generate_qr_svg_data_uri(qr_text: str) -> str:
    qr = segno.make(qr_text, error="L")
    return qr.svg_data_uri(scale=6, border=2, dark="#0f172a", light="#ffffff")


class PersistentQueueStore:
    """Cola persistente en SQLite aislada por instancia para difusiones y envíos seguros."""

    def __init__(self, db_path: str = QUEUE_DB_PATH) -> None:
        self.db_path = db_path
        self._lock = threading.RLock()
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        con = sqlite3.connect(self.db_path, timeout=5.0)
        con.row_factory = sqlite3.Row
        return con

    def _init_db(self) -> None:
        with self._lock:
            con = self._connect()
            try:
                con.execute(
                    """
                    CREATE TABLE IF NOT EXISTS outbound_queue (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        instance_name TEXT NOT NULL,
                        local_message_id INTEGER,
                        recipient_phone TEXT NOT NULL,
                        message_content TEXT NOT NULL,
                        variables_json TEXT,
                        country_code TEXT DEFAULT '+58',
                        simulate_typing INTEGER DEFAULT 1,
                        verify_number INTEGER DEFAULT 1,
                        status TEXT NOT NULL DEFAULT 'queued',
                        error_message TEXT,
                        scheduled_at REAL DEFAULT 0,
                        created_at REAL NOT NULL,
                        updated_at REAL NOT NULL
                    )
                    """
                )
                con.execute(
                    "CREATE INDEX IF NOT EXISTS idx_oq_inst_status ON outbound_queue (instance_name, status, scheduled_at)"
                )
                # Recuperar mensajes que quedaron en 'sending' tras un reinicio abrupto
                con.execute(
                    "UPDATE outbound_queue SET status = 'queued' WHERE status = 'sending'"
                )
                con.commit()
            finally:
                con.close()

    def enqueue(
        self,
        instance_name: str,
        recipient_phone: str,
        message_content: str,
        variables: Optional[Dict[str, Any]] = None,
        country_code: str = "+58",
        local_message_id: Optional[int] = None,
        simulate_typing: bool = True,
        verify_number: bool = True,
        scheduled_at: float = 0.0,
    ) -> int:
        now = time.time()
        with self._lock:
            con = self._connect()
            try:
                cur = con.execute(
                    """
                    INSERT INTO outbound_queue (
                        instance_name, local_message_id, recipient_phone, message_content,
                        variables_json, country_code, simulate_typing, verify_number,
                        status, scheduled_at, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?)
                    """,
                    (
                        instance_name,
                        local_message_id,
                        recipient_phone,
                        message_content,
                        json.dumps(variables or {}, ensure_ascii=False),
                        country_code,
                        1 if simulate_typing else 0,
                        1 if verify_number else 0,
                        scheduled_at,
                        now,
                        now,
                    ),
                )
                con.commit()
                return int(cur.lastrowid)
            finally:
                con.close()

    def fetch_ready_candidates(self, limit: int = 30) -> List[Dict[str, Any]]:
        now = time.time()
        with self._lock:
            con = self._connect()
            try:
                rows = con.execute(
                    """
                    SELECT * FROM outbound_queue
                    WHERE status = 'queued' AND (scheduled_at IS NULL OR scheduled_at <= ?)
                    ORDER BY id ASC
                    LIMIT ?
                    """,
                    (now, limit),
                ).fetchall()
                return [dict(r) for r in rows]
            finally:
                con.close()

    def update_status(
        self,
        queue_id: int,
        status: str,
        error_message: Optional[str] = None,
        scheduled_at: Optional[float] = None,
    ) -> None:
        now = time.time()
        with self._lock:
            con = self._connect()
            try:
                if scheduled_at is not None:
                    con.execute(
                        "UPDATE outbound_queue SET status = ?, error_message = ?, scheduled_at = ?, updated_at = ? WHERE id = ?",
                        (status, error_message, scheduled_at, now, queue_id),
                    )
                else:
                    con.execute(
                        "UPDATE outbound_queue SET status = ?, error_message = ?, updated_at = ? WHERE id = ?",
                        (status, error_message, now, queue_id),
                    )
                con.commit()
            finally:
                con.close()

    def count_queued(self, instance_name: str) -> int:
        with self._lock:
            con = self._connect()
            try:
                row = con.execute(
                    "SELECT COUNT(*) FROM outbound_queue WHERE instance_name = ? AND status IN ('queued', 'sending')",
                    (instance_name,),
                ).fetchone()
                return int(row[0] or 0)
            finally:
                con.close()

    def clear_instance_queue(self, instance_name: str) -> List[Optional[int]]:
        now = time.time()
        with self._lock:
            con = self._connect()
            try:
                rows = con.execute(
                    "SELECT id, local_message_id FROM outbound_queue WHERE instance_name = ? AND status = 'queued'",
                    (instance_name,),
                ).fetchall()
                local_ids = [r["local_message_id"] for r in rows if r["local_message_id"] is not None]
                con.execute(
                    "UPDATE outbound_queue SET status = 'cancelled', error_message = 'Cancelado por el usuario', updated_at = ? WHERE instance_name = ? AND status = 'queued'",
                    (now, instance_name),
                )
                con.commit()
                return local_ids
            finally:
                con.close()


@dataclass
class WhatsAppInstanceRuntime:
    instance_name: str
    db_path: str
    config_path: str
    client: Optional[NewClient] = None
    thread: Optional[threading.Thread] = None
    connection_state: str = "DISCONNECTED"  # DISCONNECTED | CONNECTING | RECONNECTING | QR_READY | CONNECTED | BANNED_COOLDOWN
    qr_code: Optional[str] = None
    qr_data_url: Optional[str] = None
    qr_generated_at: Optional[datetime] = None
    phone_number: Optional[str] = None
    push_name: Optional[str] = None
    connected_at: Optional[datetime] = None
    last_sync: datetime = field(default_factory=datetime.now)
    last_error: Optional[str] = None
    proxy_url: Optional[str] = None
    manual_disconnect: bool = False
    logged_out: bool = False
    reconnect_attempts: int = 0
    disconnected_at: Optional[datetime] = None

    # Políticas Anti-Baneo aisladas por instancia/sucursal
    daily_limit: int = 200
    hourly_limit: int = 25
    warmup_mode: bool = True
    working_hours_enabled: bool = True
    working_hours_start: str = "08:00"
    working_hours_end: str = "20:00"
    simulate_typing: bool = True
    typing_min_sec: float = 2.0
    typing_max_sec: float = 6.0
    delay_min_sec: int = 8
    delay_max_sec: int = 20
    batch_size: int = 10
    batch_pause_sec: int = 60
    verify_number: bool = True
    blacklist: Dict[str, str] = field(default_factory=dict)

    # Estado en vivo Anti-Baneo y Cola
    queue_paused: bool = False
    pause_reason: Optional[str] = None
    consecutive_failures: int = 0
    sent_timestamps_hour: Deque[float] = field(default_factory=lambda: deque(maxlen=500))
    sent_today_count: int = 0
    failed_today_count: int = 0
    sent_today_date: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    batch_counter: int = 0
    next_allowed_send_at: float = 0.0
    last_sent_at: float = 0.0
    currently_typing_to: Optional[str] = None
    number_check_cache: Dict[str, Tuple[bool, float]] = field(default_factory=dict)
    recent_sends: Dict[str, float] = field(default_factory=dict)

    ready_event: threading.Event = field(default_factory=threading.Event)
    lock: threading.RLock = field(default_factory=threading.RLock)


class WhatsAppPythonEngine:
    """
    Gestor singleton multi-instancia de WhatsApp nativo en Python (Neonize) para Fixsale.
    """

    def __init__(self, webhook_url: Optional[str] = None) -> None:
        self._instances: Dict[str, WhatsAppInstanceRuntime] = {}
        self._global_lock = threading.RLock()
        self._event_loop: Optional[asyncio.AbstractEventLoop] = None
        self._started_at: datetime = datetime.now()
        self.webhook_url: str = webhook_url or detect_laravel_webhook_url()
        self.queue_store = PersistentQueueStore()
        self._worker_task: Optional[asyncio.Task] = None
        self._worker_running: bool = False

    def attach_event_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._event_loop = loop

    def _session_path(self, instance_name: str) -> str:
        safe = sanitize_instance_name(instance_name)
        return os.path.join(SESSIONS_DIR, f"{safe}.sqlite3")

    def _config_path(self, instance_name: str) -> str:
        safe = sanitize_instance_name(instance_name)
        return os.path.join(SESSIONS_DIR, f"{safe}.config.json")

    def _load_persisted_config(self, rt: WhatsAppInstanceRuntime) -> None:
        if not os.path.exists(rt.config_path):
            return
        try:
            with open(rt.config_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            rt.daily_limit = int(cfg.get("daily_limit", rt.daily_limit))
            rt.hourly_limit = int(cfg.get("hourly_limit", rt.hourly_limit))
            rt.warmup_mode = bool(cfg.get("warmup_mode", rt.warmup_mode))
            rt.working_hours_enabled = bool(cfg.get("working_hours_enabled", rt.working_hours_enabled))
            rt.working_hours_start = normalize_hhmm(cfg.get("working_hours_start"), rt.working_hours_start)
            rt.working_hours_end = normalize_hhmm(cfg.get("working_hours_end"), rt.working_hours_end)
            rt.simulate_typing = bool(cfg.get("simulate_typing", rt.simulate_typing))
            rt.typing_min_sec = float(cfg.get("typing_min_sec", rt.typing_min_sec))
            rt.typing_max_sec = float(cfg.get("typing_max_sec", rt.typing_max_sec))
            rt.delay_min_sec = int(cfg.get("delay_min_sec", rt.delay_min_sec))
            rt.delay_max_sec = int(cfg.get("delay_max_sec", rt.delay_max_sec))
            rt.batch_size = int(cfg.get("batch_size", rt.batch_size))
            rt.batch_pause_sec = int(cfg.get("batch_pause_sec", rt.batch_pause_sec))
            rt.verify_number = bool(cfg.get("verify_number", rt.verify_number))
            rt.proxy_url = cfg.get("proxy_url") or None
            rt.queue_paused = bool(cfg.get("queue_paused", False))
            rt.pause_reason = cfg.get("pause_reason")
            rt.blacklist = dict(cfg.get("blacklist") or {})
            if cfg.get("connected_at"):
                try:
                    rt.connected_at = datetime.fromisoformat(cfg["connected_at"])
                except Exception:
                    pass
            today_str = datetime.now().strftime("%Y-%m-%d")
            if cfg.get("sent_today_date") == today_str:
                rt.sent_today_date = today_str
                rt.sent_today_count = int(cfg.get("sent_today_count", 0))
                rt.failed_today_count = int(cfg.get("failed_today_count", 0))
        except Exception as e:
            logger.warning(f"[WA {rt.instance_name}] Error leyendo config JSON: {e}")

    def _save_persisted_config(self, rt: WhatsAppInstanceRuntime) -> None:
        try:
            with rt.lock:
                data = {
                    "daily_limit": rt.daily_limit,
                    "hourly_limit": rt.hourly_limit,
                    "warmup_mode": rt.warmup_mode,
                    "working_hours_enabled": rt.working_hours_enabled,
                    "working_hours_start": rt.working_hours_start,
                    "working_hours_end": rt.working_hours_end,
                    "simulate_typing": rt.simulate_typing,
                    "typing_min_sec": rt.typing_min_sec,
                    "typing_max_sec": rt.typing_max_sec,
                    "delay_min_sec": rt.delay_min_sec,
                    "delay_max_sec": rt.delay_max_sec,
                    "batch_size": rt.batch_size,
                    "batch_pause_sec": rt.batch_pause_sec,
                    "verify_number": rt.verify_number,
                    "proxy_url": rt.proxy_url,
                    "queue_paused": rt.queue_paused,
                    "pause_reason": rt.pause_reason,
                    "blacklist": rt.blacklist,
                    "connected_at": rt.connected_at.isoformat() if rt.connected_at else None,
                    "sent_today_date": rt.sent_today_date,
                    "sent_today_count": rt.sent_today_count,
                    "failed_today_count": rt.failed_today_count,
                }
            tmp_path = rt.config_path + ".tmp"
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            os.replace(tmp_path, rt.config_path)
        except Exception as e:
            logger.debug(f"[WA {rt.instance_name}] Error guardando config JSON: {e}")

    def has_persisted_session(self, instance_name: str) -> bool:
        path = self._session_path(instance_name)
        if not os.path.exists(path) or os.path.getsize(path) < 4096:
            return False
        try:
            con = sqlite3.connect(f"file:{path}?mode=ro", uri=True, timeout=1.0)
            try:
                cur = con.execute("SELECT COUNT(*) FROM whatsmeow_device WHERE jid IS NOT NULL AND jid != ''")
                count = int(cur.fetchone()[0] or 0)
                return count > 0
            finally:
                con.close()
        except Exception:
            return False

    def _get_or_create_runtime(self, instance_name: str) -> WhatsAppInstanceRuntime:
        safe = sanitize_instance_name(instance_name)
        with self._global_lock:
            rt = self._instances.get(safe)
            if rt is None:
                rt = WhatsAppInstanceRuntime(
                    instance_name=safe,
                    db_path=self._session_path(safe),
                    config_path=self._config_path(safe),
                )
                self._load_persisted_config(rt)
                self._instances[safe] = rt
            return rt

    def get_runtime(self, instance_name: str) -> Optional[WhatsAppInstanceRuntime]:
        safe = sanitize_instance_name(instance_name)
        with self._global_lock:
            return self._instances.get(safe)

    def _schedule_coro(self, coro) -> None:
        loop = self._event_loop
        if loop and loop.is_running():
            try:
                asyncio.run_coroutine_threadsafe(coro, loop)
                return
            except Exception as e:
                logger.debug(f"No se pudo despachar corrutina: {e}")
        try:
            coro.close()
        except Exception:
            pass

    async def _forward_webhook(self, event_type: str, data: Dict[str, Any]) -> None:
        if not self.webhook_url:
            return
        try:
            payload = {"event": event_type, "timestamp": datetime.now().isoformat(), "data": data}
            async with httpx.AsyncClient(timeout=4.0, verify=False) as client:
                await client.post(self.webhook_url, json=payload)
        except Exception as e:
            logger.debug(f"[WEBHOOK] No se pudo notificar evento {event_type} a {self.webhook_url}: {e}")

    async def restore_persisted_sessions(self) -> None:
        """Reconecta automáticamente todas las sucursales que ya tienen sesión guardada."""
        try:
            files = os.listdir(SESSIONS_DIR)
        except Exception:
            return

        restored = 0
        for fname in files:
            if not fname.endswith(".sqlite3") or fname.startswith("_"):
                continue
            inst_name = fname[:-8]
            if self.has_persisted_session(inst_name):
                rt = self._get_or_create_runtime(inst_name)
                logger.info(f"[WA {inst_name}] Restaurando sesión persistida automáticamente...")
                self._start_client_thread(rt, proxy_url=rt.proxy_url)
                restored += 1
                await asyncio.sleep(0.5)
        if restored:
            logger.info(f"[WA ENGINE] {restored} instancia(s) restauradas en segundo plano.")

    def _build_client(self, rt: WhatsAppInstanceRuntime) -> NewClient:
        props = DeviceProps(
            os="Fixsale Suite",
            platformType=DeviceProps.CHROME,
        )
        client = NewClient(rt.db_path, uuid=rt.instance_name, props=props)

        @client.event.qr
        def on_qr(_c: NewClient, data_qr: bytes):
            qr_str = data_qr.decode("utf-8", errors="ignore").strip()
            if not qr_str:
                return
            try:
                svg_uri = generate_qr_svg_data_uri(qr_str)
            except Exception as exc:
                logger.warning(f"[WA {rt.instance_name}] Error generando SVG QR: {exc}")
                svg_uri = None
            with rt.lock:
                rt.qr_code = qr_str
                rt.qr_data_url = svg_uri
                rt.qr_generated_at = datetime.now()
                rt.connection_state = "QR_READY"
                rt.last_sync = datetime.now()
                rt.last_error = None
                rt.ready_event.set()
            logger.info(f"[WA {rt.instance_name}] Código QR generado (motor Python nativo).")
            self._schedule_coro(
                self._forward_webhook("status", {"instance": rt.instance_name, "status": "qr_ready"})
            )

        @client.event(ConnectedEv)
        def on_connected(c: NewClient, _ev: ConnectedEv):
            phone = None
            push_name = None
            try:
                me = c.get_me()
                if me and me.JID and me.JID.User:
                    phone = str(me.JID.User)
                if me and me.PushName:
                    push_name = str(me.PushName)
            except Exception:
                pass
            with rt.lock:
                rt.connection_state = "CONNECTED"
                rt.qr_code = None
                rt.qr_data_url = None
                rt.qr_generated_at = None
                rt.logged_out = False
                rt.manual_disconnect = False
                rt.reconnect_attempts = 0
                rt.disconnected_at = None
                if phone:
                    rt.phone_number = phone
                if push_name:
                    rt.push_name = push_name
                if not rt.connected_at:
                    rt.connected_at = datetime.now()
                rt.last_sync = datetime.now()
                rt.last_error = None
                rt.consecutive_failures = 0
                rt.ready_event.set()
            self._save_persisted_config(rt)
            logger.info(f"[WA {rt.instance_name}] Conectado exitosamente (+{phone or 'sin JID'}).")
            self._schedule_coro(
                self._forward_webhook(
                    "status",
                    {
                        "instance": rt.instance_name,
                        "status": "connected",
                        "phone": phone,
                        "push_name": push_name,
                    },
                )
            )

        @client.event(PairStatusEv)
        def on_pair(_c: NewClient, ev: PairStatusEv):
            phone = str(ev.ID.User) if ev.ID and ev.ID.User else None
            bname = str(ev.BusinessName) if getattr(ev, "BusinessName", None) else None
            with rt.lock:
                if phone:
                    rt.phone_number = phone
                if bname and not rt.push_name:
                    rt.push_name = bname
                rt.connection_state = "CONNECTED"
                rt.qr_code = None
                rt.qr_data_url = None
                rt.logged_out = False
                rt.manual_disconnect = False
                rt.reconnect_attempts = 0
                rt.disconnected_at = None
                if not rt.connected_at:
                    rt.connected_at = datetime.now()
                rt.last_sync = datetime.now()
                rt.ready_event.set()
            self._save_persisted_config(rt)
            logger.info(f"[WA {rt.instance_name}] Emparejamiento completado (+{phone}).")
            self._schedule_coro(
                self._forward_webhook(
                    "status", {"instance": rt.instance_name, "status": "connected", "phone": phone}
                )
            )

        @client.event(KeepAliveTimeoutEv)
        def on_ka_timeout(_c: NewClient, _ev: KeepAliveTimeoutEv):
            logger.warning(f"[WA {rt.instance_name}] Keep-alive timeout temporal...")
            with rt.lock:
                if rt.connection_state == "CONNECTED":
                    rt.connection_state = "RECONNECTING"
                    rt.disconnected_at = datetime.now()

        @client.event(KeepAliveRestoredEv)
        def on_ka_restored(_c: NewClient, _ev: KeepAliveRestoredEv):
            logger.info(f"[WA {rt.instance_name}] Keep-alive restaurado.")
            with rt.lock:
                if rt.connection_state in ("RECONNECTING", "CONNECTING"):
                    rt.connection_state = "CONNECTED"
                    rt.disconnected_at = None
                    rt.last_error = None
                    rt.last_sync = datetime.now()

        @client.event(StreamReplacedEv)
        def on_stream_replaced(_c: NewClient, _ev: StreamReplacedEv):
            logger.warning(f"[WA {rt.instance_name}] StreamReplacedEv: otra sesión abierta simultáneamente.")
            with rt.lock:
                rt.manual_disconnect = True
                rt.connection_state = "DISCONNECTED"
                rt.last_error = "Conflicto de sesión: otro proceso abrió la misma sesión."
                rt.last_sync = datetime.now()
            self._schedule_coro(
                self._forward_webhook("status", {"instance": rt.instance_name, "status": "disconnected"})
            )

        @client.event(ManualLoginReconnectEv)
        def on_manual_reconnect(_c: NewClient, _ev: ManualLoginReconnectEv):
            with rt.lock:
                rt.connection_state = "RECONNECTING"
                rt.disconnected_at = datetime.now()

        @client.event(DisconnectedEv)
        def on_disconnected(_c: NewClient, _ev: DisconnectedEv):
            with rt.lock:
                if rt.connection_state == "BANNED_COOLDOWN":
                    return
                if rt.manual_disconnect or rt.logged_out:
                    rt.connection_state = "DISCONNECTED"
                    rt.last_sync = datetime.now()
                    persist_disc = True
                elif self.has_persisted_session(rt.instance_name):
                    rt.connection_state = "RECONNECTING"
                    rt.disconnected_at = datetime.now()
                    rt.last_sync = datetime.now()
                    persist_disc = False
                else:
                    rt.connection_state = "DISCONNECTED"
                    rt.last_sync = datetime.now()
                    persist_disc = True
            logger.info(f"[WA {rt.instance_name}] DisconnectedEv (estado={rt.connection_state}).")
            if persist_disc:
                self._schedule_coro(
                    self._forward_webhook("status", {"instance": rt.instance_name, "status": "disconnected"})
                )

        @client.event(LoggedOutEv)
        def on_logged_out(_c: NewClient, _ev: LoggedOutEv):
            with rt.lock:
                rt.logged_out = True
                rt.manual_disconnect = True
                rt.connection_state = "DISCONNECTED"
                rt.phone_number = None
                rt.push_name = None
                rt.qr_code = None
                rt.qr_data_url = None
                rt.last_error = "Sesión cerrada desde el dispositivo móvil."
                rt.last_sync = datetime.now()
            logger.warning(f"[WA {rt.instance_name}] Sesión cerrada remotamente (LoggedOutEv).")
            self._schedule_coro(
                self._forward_webhook("status", {"instance": rt.instance_name, "status": "disconnected"})
            )

        @client.event(ConnectFailureEv)
        def on_connect_failure(_c: NewClient, ev: ConnectFailureEv):
            with rt.lock:
                rt.connection_state = "DISCONNECTED"
                rt.last_error = f"Fallo de conexión WhatsApp: {ev}"
                rt.last_sync = datetime.now()
                rt.ready_event.set()
            logger.error(f"[WA {rt.instance_name}] ConnectFailureEv: {ev}")

        @client.event(TemporaryBanEv)
        def on_temp_ban(_c: NewClient, ev: TemporaryBanEv):
            with rt.lock:
                rt.connection_state = "BANNED_COOLDOWN"
                rt.queue_paused = True
                rt.pause_reason = "Circuit Breaker Anti-Ban activado: alerta temporal de WhatsApp."
                rt.last_error = f"Alerta temporal de WhatsApp: {ev}"
                rt.last_sync = datetime.now()
            self._save_persisted_config(rt)
            logger.critical(f"[WA {rt.instance_name}] TemporaryBanEv! Cola pausada preventivamente.")
            self._schedule_coro(
                self._forward_webhook(
                    "status",
                    {"instance": rt.instance_name, "status": "banned_cooldown", "paused": True, "error": str(ev)},
                )
            )

        @client.event(ReceiptEv)
        def on_receipt(_c: NewClient, ev: ReceiptEv):
            try:
                ids = list(ev.MessageIDs) if ev.MessageIDs else []
                if not ids:
                    return
                if ev.Type in (ReceiptType.READ, ReceiptType.READ_SELF):
                    rtype = "read"
                elif ev.Type == ReceiptType.DELIVERED:
                    rtype = "delivered"
                else:
                    return
                self._schedule_coro(
                    self._forward_webhook(
                        "receipt",
                        {"instance": rt.instance_name, "message_ids": ids, "receipt_type": rtype},
                    )
                )
            except Exception:
                pass

        @client.event(MessageEv)
        def on_message(c: NewClient, ev: MessageEv):
            try:
                src = ev.Info.MessageSource
                if src.IsFromMe or src.IsGroup:
                    return

                sender_phone = ""
                if getattr(src, "SenderAlt", None) and src.SenderAlt.User and src.SenderAlt.Server != "lid":
                    sender_phone = str(src.SenderAlt.User)
                elif src.Sender and src.Sender.User and src.Sender.Server != "lid":
                    sender_phone = str(src.Sender.User)
                elif src.Chat and src.Chat.User and src.Chat.Server != "lid":
                    sender_phone = str(src.Chat.User)
                elif src.Sender and src.Sender.Server == "lid":
                    try:
                        pn_jid = c.get_pn_from_lid(src.Sender)
                        if pn_jid and pn_jid.User:
                            sender_phone = str(pn_jid.User)
                    except Exception:
                        sender_phone = str(src.Sender.User or "")

                if not sender_phone:
                    return

                push_name = str(getattr(ev.Info, "Pushname", "") or "").strip()
                msg_id = str(getattr(ev.Info, "ID", "") or "")
                msg = ev.Message

                text_body = ""
                if getattr(msg, "conversation", None):
                    text_body = str(msg.conversation).strip()
                elif msg.HasField("extendedTextMessage") and getattr(msg.extendedTextMessage, "text", None):
                    text_body = str(msg.extendedTextMessage.text).strip()

                is_media = False
                filename = ""
                if msg.HasField("documentMessage"):
                    is_media = True
                    filename = msg.documentMessage.fileName or "documento.pdf"
                    text_body = msg.documentMessage.caption or ""
                elif msg.HasField("imageMessage"):
                    is_media = True
                    filename = "imagen.jpg"
                    text_body = msg.imageMessage.caption or ""

                self._schedule_coro(
                    self._forward_webhook(
                        "inbound_message",
                        {
                            "instance": rt.instance_name,
                            "from": sender_phone,
                            "push_name": push_name,
                            "message_id": msg_id,
                            "text": text_body,
                            "is_media": is_media,
                            "filename": filename,
                        },
                    )
                )
            except Exception as exc:
                logger.warning(f"[WA {rt.instance_name}] Error en on_message: {exc}")

        return client

    def _start_client_thread(
        self, rt: WhatsAppInstanceRuntime, proxy_url: Optional[str] = None
    ) -> None:
        with rt.lock:
            if rt.thread and rt.thread.is_alive():
                return
            rt.ready_event.clear()
            rt.manual_disconnect = False
            rt.logged_out = False
            rt.connection_state = "RECONNECTING" if self.has_persisted_session(rt.instance_name) else "CONNECTING"
            rt.last_error = None
            if proxy_url is not None:
                rt.proxy_url = proxy_url or None
            client = self._build_client(rt)
            rt.client = client

            proxy_settings = None
            if rt.proxy_url and rt.proxy_url.strip():
                proxy_settings = ProxySettings(proxy_address=rt.proxy_url.strip())

            def _runner():
                try:
                    client.connect(proxy_settings)
                except Exception as exc:
                    logger.warning(f"[WA {rt.instance_name}] Hilo cliente finalizado: {exc}")
                    with rt.lock:
                        rt.last_error = str(exc)
                        rt.ready_event.set()
                finally:
                    should_auto_retry = False
                    retry_delay = 5.0
                    with rt.lock:
                        if rt.client is client:
                            rt.client = None
                            rt.thread = None
                            if (
                                not rt.manual_disconnect
                                and not rt.logged_out
                                and rt.connection_state != "BANNED_COOLDOWN"
                                and self.has_persisted_session(rt.instance_name)
                                and rt.reconnect_attempts < 6
                            ):
                                rt.reconnect_attempts += 1
                                rt.connection_state = "RECONNECTING"
                                retry_delay = min(30.0, 3.0 * (2 ** (rt.reconnect_attempts - 1)))
                                should_auto_retry = True
                            else:
                                if rt.connection_state != "BANNED_COOLDOWN":
                                    rt.connection_state = "DISCONNECTED"
                        rt.ready_event.set()

                    if should_auto_retry:
                        logger.info(
                            f"[WA {rt.instance_name}] Auto-reconexión en {retry_delay:.0f}s (intento {rt.reconnect_attempts}/6)..."
                        )
                        self._schedule_coro(
                            self._delayed_reconnect(rt.instance_name, rt.proxy_url, retry_delay)
                        )

            thread = threading.Thread(
                target=_runner,
                name=f"wa-neonize-{rt.instance_name}",
                daemon=True,
            )
            rt.thread = thread
            thread.start()

    async def _delayed_reconnect(
        self, instance_name: str, proxy_url: Optional[str], delay: float
    ) -> None:
        await asyncio.sleep(delay)
        rt = self.get_runtime(instance_name)
        if not rt:
            return
        with rt.lock:
            if rt.manual_disconnect or rt.logged_out or rt.connection_state == "BANNED_COOLDOWN":
                return
            if rt.thread and rt.thread.is_alive():
                return
        if self.has_persisted_session(instance_name):
            self._start_client_thread(rt, proxy_url=proxy_url)

    async def connect_instance(
        self,
        instance_name: str,
        proxy_url: Optional[str] = None,
        wait_seconds: float = 10.0,
    ) -> Dict[str, Any]:
        if self._event_loop is None:
            try:
                self._event_loop = asyncio.get_running_loop()
            except RuntimeError:
                pass
        rt = self._get_or_create_runtime(instance_name)

        needs_reset = False
        with rt.lock:
            ws_open = bool(rt.client and rt.client.is_connected)
            thread_alive = bool(rt.thread and rt.thread.is_alive())

            if rt.connection_state == "CONNECTED" and ws_open and thread_alive:
                return self.build_status_payload(rt)

            if (
                rt.connection_state == "QR_READY"
                and rt.qr_data_url
                and rt.qr_generated_at
                and (datetime.now() - rt.qr_generated_at).total_seconds() < 45
                and ws_open
                and thread_alive
            ):
                return self.build_status_payload(rt)

            if thread_alive and not ws_open:
                needs_reset = True

        if needs_reset:
            await self.disconnect_instance(instance_name, clear_session=False)

        self._start_client_thread(rt, proxy_url=proxy_url)

        deadline = time.monotonic() + wait_seconds
        while time.monotonic() < deadline:
            if rt.ready_event.is_set():
                break
            await asyncio.sleep(0.25)

        return self.build_status_payload(rt)

    async def reconnect_instance(
        self,
        instance_name: str,
        clear_session: bool = True,
        proxy_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        await self.disconnect_instance(instance_name, clear_session=clear_session)
        await asyncio.sleep(0.4)
        return await self.connect_instance(instance_name, proxy_url=proxy_url, wait_seconds=10.0)

    async def pair_phone(
        self,
        instance_name: str,
        phone: str,
        country_code: str = "+58",
        proxy_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        rt = self._get_or_create_runtime(instance_name)
        formatted = format_phone_number(phone, country_code)
        if not formatted or len(formatted) < 10:
            return {"success": False, "error": f"Número telefónico inválido: {phone}"}

        with rt.lock:
            if rt.connection_state == "CONNECTED" and rt.client and rt.client.is_connected:
                return {
                    "success": True,
                    "already_connected": True,
                    "phone": rt.phone_number or formatted,
                    "instance_name": rt.instance_name,
                }

        async def _ensure_open_websocket(force_fresh: bool = False) -> Optional[NewClient]:
            with rt.lock:
                ws_open = bool(rt.client and rt.client.is_connected)
                th_alive = bool(rt.thread and rt.thread.is_alive())
                if ws_open and th_alive and not force_fresh:
                    return rt.client

            if force_fresh or not th_alive or not ws_open:
                await self.disconnect_instance(rt.instance_name, clear_session=force_fresh)
                self._start_client_thread(rt, proxy_url=proxy_url)

            deadline = time.monotonic() + 7.0
            while time.monotonic() < deadline:
                with rt.lock:
                    if rt.client is not None and rt.client.is_connected:
                        return rt.client
                await asyncio.sleep(0.25)

            with rt.lock:
                return rt.client

        loop = asyncio.get_running_loop()
        last_err = ""
        for attempt in range(2):
            client = await _ensure_open_websocket(force_fresh=(attempt > 0))
            if not client:
                return {"success": False, "error": "No se pudo abrir la conexión WebSocket con WhatsApp."}

            await asyncio.sleep(0.4)
            try:
                code = await loop.run_in_executor(
                    None,
                    lambda c=client: c.PairPhone(
                        formatted,
                        show_push_notification=True,
                        client_name=ClientName.WINDOWS,
                        client_type=ClientType.CHROME,
                    ),
                )
                return {
                    "success": True,
                    "pairing_code": code,
                    "pairingCode": code,
                    "phone": formatted,
                    "instance_name": rt.instance_name,
                }
            except Exception as e:
                last_err = str(e)
                logger.warning(f"[WA {rt.instance_name}] Intento {attempt + 1} PairPhone falló: {last_err}")
                if "websocket" not in last_err.lower() and "not connected" not in last_err.lower():
                    break

        return {"success": False, "error": last_err or "No se pudo generar el código de emparejamiento."}

    async def disconnect_instance(
        self, instance_name: str, clear_session: bool = True
    ) -> Dict[str, Any]:
        safe = sanitize_instance_name(instance_name)
        rt = self._get_or_create_runtime(safe)
        loop = asyncio.get_running_loop()

        def _stop_sync():
            with rt.lock:
                client = rt.client
                thread = rt.thread
                rt.manual_disconnect = True
                rt.logged_out = clear_session
                rt.client = None
                rt.thread = None
                rt.connection_state = "DISCONNECTED"
                rt.qr_code = None
                rt.qr_data_url = None
                rt.qr_generated_at = None
                rt.phone_number = None
                rt.push_name = None
                rt.currently_typing_to = None
                if clear_session:
                    rt.connected_at = None
                rt.last_sync = datetime.now()

            if client:
                if clear_session:
                    try:
                        client.logout()
                    except Exception:
                        pass
                try:
                    client.stop()
                except Exception:
                    pass
                try:
                    client.disconnect()
                except Exception:
                    pass

            if thread and thread.is_alive():
                thread.join(timeout=3.0)

            if clear_session:
                for suffix in ("", "-wal", "-shm", "-journal"):
                    fpath = rt.db_path + suffix
                    if os.path.exists(fpath):
                        try:
                            os.remove(fpath)
                        except Exception as ex:
                            logger.debug(f"No se pudo borrar sesión {fpath}: {ex}")

        await loop.run_in_executor(None, _stop_sync)
        if clear_session:
            self._save_persisted_config(rt)
        return self.build_status_payload(rt)

    def get_status(self, instance_name: str) -> Dict[str, Any]:
        rt = self._get_or_create_runtime(instance_name)
        with rt.lock:
            ws_open = bool(rt.client and rt.client.is_connected)
            logged_in = bool(rt.client and rt.client.is_logged_in)
            thread_alive = bool(rt.thread and rt.thread.is_alive())

            if ws_open and logged_in and thread_alive and rt.connection_state in ("RECONNECTING", "CONNECTING", "DISCONNECTED"):
                rt.connection_state = "CONNECTED"
                rt.disconnected_at = None
                rt.last_error = None
                if not rt.phone_number:
                    try:
                        me = rt.client.get_me()
                        if me and me.JID and me.JID.User:
                            rt.phone_number = str(me.JID.User)
                        if me and me.PushName:
                            rt.push_name = str(me.PushName)
                    except Exception:
                        pass

            if rt.connection_state == "QR_READY":
                age = (datetime.now() - rt.qr_generated_at).total_seconds() if rt.qr_generated_at else 999
                if (not thread_alive) or (age > 12 and not ws_open) or age > 70:
                    rt.connection_state = "DISCONNECTED"
                    rt.qr_code = None
                    rt.qr_data_url = None
                    rt.qr_generated_at = None
            elif rt.connection_state == "CONNECTED" and not thread_alive:
                rt.connection_state = (
                    "RECONNECTING"
                    if (not rt.manual_disconnect and not rt.logged_out and self.has_persisted_session(rt.instance_name))
                    else "DISCONNECTED"
                )
            elif rt.connection_state == "RECONNECTING" and rt.disconnected_at:
                if not thread_alive and (datetime.now() - rt.disconnected_at).total_seconds() > 90:
                    rt.connection_state = "DISCONNECTED"
            return self.build_status_payload(rt)

    def build_status_payload(self, rt: WhatsAppInstanceRuntime) -> Dict[str, Any]:
        with rt.lock:
            qr_expires_in = None
            if rt.connection_state == "QR_READY" and rt.qr_generated_at:
                elapsed = int((datetime.now() - rt.qr_generated_at).total_seconds())
                qr_expires_in = max(0, 55 - elapsed)

            status_str = "close"
            if rt.connection_state == "CONNECTED":
                status_str = "open"
            elif rt.connection_state == "QR_READY":
                status_str = "qr"
            elif rt.connection_state in ("CONNECTING", "RECONNECTING"):
                status_str = "connecting"

            return {
                "instanceName": rt.instance_name,
                "status": status_str,
                "isConnected": rt.connection_state == "CONNECTED",
                "connectionState": rt.connection_state,
                "connection_state": rt.connection_state,
                "qrCode": rt.qr_data_url,
                "qrDataUrl": rt.qr_data_url,
                "qrExpiresIn": qr_expires_in,
                "phoneNumber": rt.phone_number,
                "pushName": rt.push_name,
                "userName": rt.push_name,
                "userJid": f"{rt.phone_number}@s.whatsapp.net" if rt.phone_number else None,
                "currentlyTypingTo": rt.currently_typing_to,
                "queuePaused": rt.queue_paused,
                "pauseReason": rt.pause_reason,
                "lastError": rt.last_error,
                "engine": "python-neonize",
                "hasSavedSession": self.has_persisted_session(rt.instance_name),
            }

    def get_hourly_count(self, instance_name: str) -> int:
        rt = self._get_or_create_runtime(instance_name)
        cutoff = time.time() - 3600
        with rt.lock:
            while rt.sent_timestamps_hour and rt.sent_timestamps_hour[0] < cutoff:
                rt.sent_timestamps_hour.popleft()
            return len(rt.sent_timestamps_hour)

    def update_antiban_policy(self, instance_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        rt = self._get_or_create_runtime(instance_name)
        with rt.lock:
            if payload.get("dailyLimit") is not None:
                rt.daily_limit = max(10, min(5000, int(payload["dailyLimit"])))
            if payload.get("hourlyLimit") is not None:
                rt.hourly_limit = max(5, min(500, int(payload["hourlyLimit"])))
            if payload.get("warmupMode") is not None:
                rt.warmup_mode = bool(payload["warmupMode"])
            if payload.get("workingHoursEnabled") is not None:
                rt.working_hours_enabled = bool(payload["workingHoursEnabled"])
            if payload.get("workingHoursStart") is not None:
                rt.working_hours_start = normalize_hhmm(payload["workingHoursStart"], rt.working_hours_start)
            if payload.get("workingHoursEnd") is not None:
                rt.working_hours_end = normalize_hhmm(payload["workingHoursEnd"], rt.working_hours_end)
            if payload.get("simulateTyping") is not None:
                rt.simulate_typing = bool(payload["simulateTyping"])
            if payload.get("typingMinSec") is not None:
                rt.typing_min_sec = max(0.5, min(15.0, float(payload["typingMinSec"])))
            if payload.get("typingMaxSec") is not None:
                rt.typing_max_sec = max(rt.typing_min_sec + 0.5, min(25.0, float(payload["typingMaxSec"])))
            if payload.get("delayMinSec") is not None:
                rt.delay_min_sec = max(2, min(120, int(payload["delayMinSec"])))
            if payload.get("delayMaxSec") is not None:
                rt.delay_max_sec = max(rt.delay_min_sec + 1, min(240, int(payload["delayMaxSec"])))
            if payload.get("batchSize") is not None:
                rt.batch_size = max(2, min(100, int(payload["batchSize"])))
            if payload.get("batchPauseSec") is not None:
                rt.batch_pause_sec = max(10, min(600, int(payload["batchPauseSec"])))
            if payload.get("verifyNumber") is not None:
                rt.verify_number = bool(payload["verifyNumber"])
            if "proxyUrl" in payload:
                rt.proxy_url = (payload.get("proxyUrl") or "").strip() or None
        self._save_persisted_config(rt)
        return self.get_queue_stats(instance_name)

    def set_queue_paused(self, instance_name: str, paused: bool, reason: Optional[str] = None) -> Dict[str, Any]:
        rt = self._get_or_create_runtime(instance_name)
        with rt.lock:
            rt.queue_paused = paused
            rt.pause_reason = (reason or "Cola pausada manualmente por el administrador.") if paused else None
            if not paused:
                rt.consecutive_failures = 0
                if rt.connection_state == "BANNED_COOLDOWN":
                    rt.connection_state = "DISCONNECTED"
        self._save_persisted_config(rt)
        return self.get_queue_stats(instance_name)

    def add_blacklist(self, instance_name: str, phone: str, reason: str = "MANUAL_BLOCK") -> Dict[str, Any]:
        rt = self._get_or_create_runtime(instance_name)
        formatted = format_phone_number(phone)
        with rt.lock:
            rt.blacklist[formatted] = reason
        self._save_persisted_config(rt)
        return {"success": True, "phone": formatted, "reason": reason, "blacklist": rt.blacklist}

    def remove_blacklist(self, instance_name: str, phone: str) -> Dict[str, Any]:
        rt = self._get_or_create_runtime(instance_name)
        formatted = format_phone_number(phone)
        with rt.lock:
            rt.blacklist.pop(formatted, None)
            rt.blacklist.pop(phone, None)
        self._save_persisted_config(rt)
        return {"success": True, "phone": formatted, "blacklist": rt.blacklist}

    async def check_number(
        self,
        instance_name: str,
        phone: str,
        country_code: str = "+58",
    ) -> Dict[str, Any]:
        formatted = format_phone_number(phone, country_code)
        if not formatted or len(formatted) < 10 or len(formatted) > 15:
            return {
                "exists": False,
                "jid": f"{formatted}@s.whatsapp.net",
                "phone": formatted,
                "formattedPhone": formatted,
                "verified_live": False,
                "reason": "Formato de teléfono inválido",
            }

        rt = self._get_or_create_runtime(instance_name)
        now_ts = time.time()

        with rt.lock:
            cached = rt.number_check_cache.get(formatted)
            if cached and (now_ts - cached[1]) < 600:
                return {
                    "exists": cached[0],
                    "jid": f"{formatted}@s.whatsapp.net",
                    "phone": formatted,
                    "formattedPhone": formatted,
                    "verified_live": True,
                    "cached": True,
                }
            client = rt.client if rt.connection_state == "CONNECTED" else None

        if client is None:
            return {
                "exists": 10 <= len(formatted) <= 15,
                "jid": f"{formatted}@s.whatsapp.net",
                "phone": formatted,
                "formattedPhone": formatted,
                "verified_live": False,
                "reason": "Instancia desconectada (validación solo de formato)",
            }

        try:
            loop = asyncio.get_running_loop()
            results = await loop.run_in_executor(None, lambda: client.is_on_whatsapp(formatted))
            exists = False
            jid_str = f"{formatted}@s.whatsapp.net"
            verified_name = None
            if results:
                first = results[0]
                exists = bool(getattr(first, "IsIn", False))
                if getattr(first, "JID", None) and first.JID.User:
                    jid_str = f"{first.JID.User}@{first.JID.Server or 's.whatsapp.net'}"
                if getattr(first, "VerifiedName", None):
                    verified_name = str(first.VerifiedName)

            with rt.lock:
                rt.number_check_cache[formatted] = (exists, now_ts)

            return {
                "exists": exists,
                "jid": jid_str,
                "phone": formatted,
                "formattedPhone": formatted,
                "verified_live": True,
                "verified_name": verified_name,
            }
        except Exception as e:
            logger.warning(f"[WA {rt.instance_name}] is_on_whatsapp({formatted}) error: {e}")
            return {
                "exists": True,
                "jid": f"{formatted}@s.whatsapp.net",
                "phone": formatted,
                "formattedPhone": formatted,
                "verified_live": False,
                "error": str(e),
            }

    async def send_text_humanized(
        self,
        instance_name: str,
        to: str,
        message: str,
        country_code: str = "+58",
        variables: Optional[Dict[str, Any]] = None,
        simulate_typing: Optional[bool] = None,
        typing_min_sec: Optional[float] = None,
        typing_max_sec: Optional[float] = None,
        verify_number: Optional[bool] = None,
        anti_fingerprint: bool = True,
        enforce_cooldown: bool = True,
    ) -> Dict[str, Any]:
        rt = self._get_or_create_runtime(instance_name)
        formatted = format_phone_number(to, country_code)

        if not formatted or len(formatted) < 10:
            return {"success": False, "error": f"Número telefónico inválido: {to}"}

        # Si la instancia tiene sesión guardada o está reconectando, esperar brevemente antes de fallar
        should_wait_reconnect = False
        with rt.lock:
            if rt.connection_state == "BANNED_COOLDOWN":
                return {"success": False, "error": "Circuit Breaker Anti-Ban activo: pausa preventiva."}
            if rt.connection_state in ("CONNECTING", "RECONNECTING"):
                should_wait_reconnect = True
            elif (
                rt.connection_state == "DISCONNECTED"
                and not rt.manual_disconnect
                and not rt.logged_out
                and self.has_persisted_session(rt.instance_name)
            ):
                should_wait_reconnect = True
                self._start_client_thread(rt, proxy_url=rt.proxy_url)

        if should_wait_reconnect:
            deadline = time.monotonic() + 6.0
            while time.monotonic() < deadline:
                with rt.lock:
                    if rt.connection_state == "CONNECTED" and rt.client is not None:
                        break
                    if rt.connection_state in ("QR_READY", "BANNED_COOLDOWN") or rt.logged_out:
                        break
                await asyncio.sleep(0.25)

        with rt.lock:
            if formatted in rt.blacklist:
                return {"success": False, "error": f"Número +{formatted} bloqueado en Lista Negra ({rt.blacklist[formatted]})."}
            if rt.connection_state == "BANNED_COOLDOWN":
                return {"success": False, "error": "Circuit Breaker Anti-Ban activo: pausa preventiva."}
            if rt.connection_state != "CONNECTED" or rt.client is None:
                return {
                    "success": False,
                    "error": f"La instancia '{rt.instance_name}' no está conectada. Escanea el código QR primero.",
                }
            client = rt.client
            use_typing = rt.simulate_typing if simulate_typing is None else bool(simulate_typing)
            t_min = rt.typing_min_sec if typing_min_sec is None else float(typing_min_sec)
            t_max = rt.typing_max_sec if typing_max_sec is None else float(typing_max_sec)
            use_verify = rt.verify_number if verify_number is None else bool(verify_number)

        processed_msg = parse_spintax(message)
        if variables:
            processed_msg = replace_variables(processed_msg, variables)
        if anti_fingerprint:
            processed_msg = apply_anti_fingerprint_variance(processed_msg)

        msg_hash = hashlib.sha256(f"{formatted}:{processed_msg.strip()}".encode()).hexdigest()[:16]
        now_ts = time.time()
        if enforce_cooldown:
            with rt.lock:
                expired = [k for k, ts in rt.recent_sends.items() if now_ts - ts > 45]
                for k in expired:
                    rt.recent_sends.pop(k, None)
                if msg_hash in rt.recent_sends:
                    return {
                        "success": False,
                        "error": "Bloqueo Anti-Duplicado: mensaje idéntico despachado recientemente al mismo contacto.",
                    }

        if use_verify:
            chk = await self.check_number(instance_name, formatted, country_code=country_code)
            if chk.get("verified_live") and not chk.get("exists"):
                return {
                    "success": False,
                    "error": f"El número +{formatted} no está registrado en WhatsApp (bloqueado por Anti-Ban).",
                }

        jid = build_jid(formatted)
        loop = asyncio.get_running_loop()
        typing_elapsed = 0.0

        try:
            try:
                await loop.run_in_executor(None, lambda: client.send_presence(Presence.AVAILABLE))
            except Exception:
                pass

            await asyncio.sleep(random.uniform(0.3, 0.7))

            if use_typing:
                with rt.lock:
                    rt.currently_typing_to = formatted
                try:
                    await loop.run_in_executor(
                        None,
                        lambda: client.send_chat_presence(
                            jid,
                            ChatPresence.CHAT_PRESENCE_COMPOSING,
                            ChatPresenceMedia.CHAT_PRESENCE_MEDIA_TEXT,
                        ),
                    )
                    chars = max(12, len(processed_msg))
                    organic = (chars / random.uniform(36.0, 52.0)) + random.uniform(0.4, 1.1)
                    lo = max(1.0, t_min)
                    hi = max(lo + 0.5, t_max)
                    typing_duration = max(lo, min(hi, organic))
                    await asyncio.sleep(typing_duration)
                    typing_elapsed = round(typing_duration, 2)

                    await loop.run_in_executor(
                        None,
                        lambda: client.send_chat_presence(
                            jid,
                            ChatPresence.CHAT_PRESENCE_PAUSED,
                            ChatPresenceMedia.CHAT_PRESENCE_MEDIA_TEXT,
                        ),
                    )
                    await asyncio.sleep(0.25)
                finally:
                    with rt.lock:
                        rt.currently_typing_to = None

            resp = await loop.run_in_executor(None, lambda: client.send_message(jid, processed_msg))
            ext_id = str(getattr(resp, "ID", "") or f"fix_{int(time.time() * 1000)}")

            with rt.lock:
                rt.consecutive_failures = 0
                rt.last_sent_at = time.time()
                rt.sent_timestamps_hour.append(rt.last_sent_at)
                today_str = datetime.now().strftime("%Y-%m-%d")
                if rt.sent_today_date != today_str:
                    rt.sent_today_date = today_str
                    rt.sent_today_count = 0
                    rt.failed_today_count = 0
                rt.sent_today_count += 1
                rt.recent_sends[msg_hash] = rt.last_sent_at
                rt.last_sync = datetime.now()
            self._save_persisted_config(rt)

            return {
                "success": True,
                "messageId": ext_id,
                "data": {"key": {"id": ext_id}},
                "final_message": processed_msg,
                "formatted_phone": formatted,
                "typing_seconds": typing_elapsed,
                "engine": "python-neonize",
            }
        except Exception as e:
            err_str = str(e)
            logger.error(f"[WA {rt.instance_name}] Error enviando mensaje a +{formatted}: {err_str}")
            with rt.lock:
                rt.currently_typing_to = None
                rt.consecutive_failures += 1
                today_str = datetime.now().strftime("%Y-%m-%d")
                if rt.sent_today_date != today_str:
                    rt.sent_today_date = today_str
                    rt.sent_today_count = 0
                    rt.failed_today_count = 0
                rt.failed_today_count += 1
                rt.last_error = err_str
                if rt.consecutive_failures >= 3:
                    rt.queue_paused = True
                    rt.pause_reason = f"Circuit Breaker activado tras {rt.consecutive_failures} fallos: {err_str[:110]}"
            self._save_persisted_config(rt)
            return {"success": False, "error": err_str}

    async def send_document_bytes(
        self,
        instance_name: str,
        to: str,
        file_bytes: bytes,
        filename: str,
        caption: Optional[str] = None,
        country_code: str = "+58",
        mimetype: str = "application/pdf",
        simulate_typing: bool = True,
    ) -> Dict[str, Any]:
        rt = self._get_or_create_runtime(instance_name)
        formatted = format_phone_number(to, country_code)

        if not formatted or len(formatted) < 10:
            return {"success": False, "error": f"Número telefónico inválido: {to}"}

        with rt.lock:
            if rt.connection_state != "CONNECTED" or rt.client is None:
                return {"success": False, "error": f"Instancia '{rt.instance_name}' desconectada."}
            client = rt.client

        jid = build_jid(formatted)
        loop = asyncio.get_running_loop()

        try:
            if simulate_typing:
                with rt.lock:
                    rt.currently_typing_to = formatted
                try:
                    await loop.run_in_executor(
                        None,
                        lambda: client.send_chat_presence(
                            jid,
                            ChatPresence.CHAT_PRESENCE_COMPOSING,
                            ChatPresenceMedia.CHAT_PRESENCE_MEDIA_TEXT,
                        ),
                    )
                    await asyncio.sleep(random.uniform(1.0, 2.0))
                    await loop.run_in_executor(
                        None,
                        lambda: client.send_chat_presence(
                            jid,
                            ChatPresence.CHAT_PRESENCE_PAUSED,
                            ChatPresenceMedia.CHAT_PRESENCE_MEDIA_TEXT,
                        ),
                    )
                finally:
                    with rt.lock:
                        rt.currently_typing_to = None

            if mimetype.startswith("image/"):
                resp = await loop.run_in_executor(
                    None,
                    lambda: client.send_image(
                        to=jid,
                        file=file_bytes,
                        caption=caption or None,
                    ),
                )
            else:
                resp = await loop.run_in_executor(
                    None,
                    lambda: client.send_document(
                        to=jid,
                        file=file_bytes,
                        filename=filename,
                        caption=caption or None,
                        mimetype=mimetype,
                    ),
                )
            ext_id = str(getattr(resp, "ID", "") or f"doc_{int(time.time() * 1000)}")

            with rt.lock:
                rt.consecutive_failures = 0
                rt.last_sent_at = time.time()
                rt.sent_timestamps_hour.append(rt.last_sent_at)
                today_str = datetime.now().strftime("%Y-%m-%d")
                if rt.sent_today_date != today_str:
                    rt.sent_today_date = today_str
                    rt.sent_today_count = 0
                    rt.failed_today_count = 0
                rt.sent_today_count += 1
                rt.last_sync = datetime.now()
            self._save_persisted_config(rt)

            return {
                "success": True,
                "messageId": ext_id,
                "data": {"key": {"id": ext_id}},
                "filename": filename,
                "formatted_phone": formatted,
            }
        except Exception as e:
            err_str = str(e)
            logger.error(f"[WA {rt.instance_name}] Error enviando archivo: {err_str}")
            return {"success": False, "error": err_str}

    def enqueue_text(
        self,
        instance_name: str,
        to: str,
        message: str,
        country_code: str = "+58",
        variables: Optional[Dict[str, Any]] = None,
        local_message_id: Optional[int] = None,
        simulate_typing: Optional[bool] = None,
        verify_number: Optional[bool] = None,
    ) -> Dict[str, Any]:
        rt = self._get_or_create_runtime(instance_name)
        formatted = format_phone_number(to, country_code)
        if not formatted or len(formatted) < 10:
            return {"success": False, "error": f"Número telefónico inválido: {to}"}

        with rt.lock:
            use_typing = rt.simulate_typing if simulate_typing is None else bool(simulate_typing)
            use_verify = rt.verify_number if verify_number is None else bool(verify_number)

        qid = self.queue_store.enqueue(
            instance_name=rt.instance_name,
            recipient_phone=formatted,
            message_content=message,
            variables=variables,
            country_code=country_code,
            local_message_id=local_message_id,
            simulate_typing=use_typing,
            verify_number=use_verify,
        )
        return {
            "success": True,
            "queued": True,
            "queueId": qid,
            "jobId": f"q_{qid}",
            "status": "queued",
            "formatted_phone": formatted,
        }

    async def clear_queue(self, instance_name: str) -> Dict[str, Any]:
        safe = sanitize_instance_name(instance_name)
        local_ids = self.queue_store.clear_instance_queue(safe)
        if local_ids:
            await self._forward_webhook(
                "queue_bulk_cancelled",
                {"instance": safe, "local_message_ids": local_ids},
            )
        return {"success": True, "cancelled_count": len(local_ids)}

    async def _process_queue_cycle(self) -> None:
        candidates = self.queue_store.fetch_ready_candidates(limit=30)
        if not candidates:
            return

        now_ts = time.time()
        now_dt = datetime.now()
        handled_instances = set()

        for item in candidates:
            inst_name = item["instance_name"]
            if inst_name in handled_instances:
                continue
            handled_instances.add(inst_name)

            rt = self._get_or_create_runtime(inst_name)
            with rt.lock:
                if now_ts < rt.next_allowed_send_at:
                    continue
                if rt.connection_state != "CONNECTED" or rt.client is None:
                    continue
                if rt.queue_paused:
                    continue

                wh_enabled = rt.working_hours_enabled
                wh_start = rt.working_hours_start
                wh_end = rt.working_hours_end
                daily_cfg = rt.daily_limit
                hourly_cfg = rt.hourly_limit
                warmup_mode = rt.warmup_mode
                connected_at = rt.connected_at
                today_str = now_dt.strftime("%Y-%m-%d")
                if rt.sent_today_date != today_str:
                    rt.sent_today_date = today_str
                    rt.sent_today_count = 0
                    rt.failed_today_count = 0
                sent_today = rt.sent_today_count
                d_min = rt.delay_min_sec
                d_max = rt.delay_max_sec
                b_size = rt.batch_size
                b_pause = rt.batch_pause_sec

            # 1. Ventana horaria laboral
            in_hours, next_open = is_within_working_hours(wh_enabled, wh_start, wh_end, now_dt)
            if not in_hours:
                if next_open:
                    self.queue_store.update_status(
                        item["id"],
                        "queued",
                        f"En espera de horario laboral ({wh_start}–{wh_end})",
                        scheduled_at=next_open.timestamp(),
                    )
                continue

            # 2. Límite diario efectivo con Warm-up
            effective_daily, _ = compute_warmup_limit(connected_at, daily_cfg, warmup_mode)
            if sent_today >= effective_daily:
                tomorrow = (now_dt + timedelta(days=1)).replace(
                    hour=int(wh_start.split(":")[0]),
                    minute=int(wh_start.split(":")[1]),
                    second=0,
                    microsecond=0,
                )
                self.queue_store.update_status(
                    item["id"],
                    "queued",
                    f"Cuota diaria segura alcanzada ({sent_today}/{effective_daily}). Reprogramado.",
                    scheduled_at=tomorrow.timestamp(),
                )
                continue

            # 3. Límite por hora
            if self.get_hourly_count(inst_name) >= hourly_cfg:
                with rt.lock:
                    rt.next_allowed_send_at = time.time() + 180.0
                continue

            # 4. Despachar mensaje con simulación humana
            self.queue_store.update_status(item["id"], "sending")
            local_id = item.get("local_message_id")
            if local_id:
                await self._forward_webhook(
                    "queue_update",
                    {"instance": inst_name, "local_message_id": local_id, "status": "sending"},
                )

            try:
                variables = json.loads(item["variables_json"] or "{}")
            except Exception:
                variables = {}

            res = await self.send_text_humanized(
                instance_name=inst_name,
                to=item["recipient_phone"],
                message=item["message_content"],
                country_code=item.get("country_code") or "+58",
                variables=variables,
                simulate_typing=bool(item.get("simulate_typing", 1)),
                verify_number=bool(item.get("verify_number", 1)),
                anti_fingerprint=True,
                enforce_cooldown=True,
            )

            if res.get("success"):
                self.queue_store.update_status(item["id"], "sent")
                with rt.lock:
                    rt.batch_counter += 1
                    delay = gaussian_human_delay(d_min, d_max)
                    if rt.batch_counter >= max(2, b_size):
                        rt.batch_counter = 0
                        delay += float(b_pause)
                        logger.info(f"[WA {inst_name}] Pausa de enfriamiento de lote ({b_pause}s).")
                    rt.next_allowed_send_at = time.time() + delay

                if local_id:
                    await self._forward_webhook(
                        "queue_update",
                        {
                            "instance": inst_name,
                            "local_message_id": local_id,
                            "status": "sent",
                            "message_id": res.get("messageId"),
                            "final_message": res.get("final_message"),
                        },
                    )
            else:
                err = res.get("error") or "Error al enviar mensaje"
                self.queue_store.update_status(item["id"], "failed", error_message=err)
                with rt.lock:
                    rt.next_allowed_send_at = time.time() + max(5.0, float(d_min))
                if local_id:
                    await self._forward_webhook(
                        "queue_update",
                        {
                            "instance": inst_name,
                            "local_message_id": local_id,
                            "status": "failed",
                            "error": err,
                        },
                    )

    async def _worker_loop(self) -> None:
        logger.info("[WA QUEUE WORKER] Iniciado motor asíncrono de cola Anti-Baneo.")
        while self._worker_running:
            try:
                await self._process_queue_cycle()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"[WA QUEUE WORKER] Error en ciclo: {e}")
            await asyncio.sleep(2.0)

    def start_queue_worker(self) -> None:
        if self._worker_running:
            return
        self._worker_running = True
        loop = self._event_loop
        if loop and loop.is_running():
            self._worker_task = loop.create_task(self._worker_loop())

    async def stop_queue_worker(self) -> None:
        self._worker_running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
            self._worker_task = None

    def get_queue_stats(self, instance_name: str) -> Dict[str, Any]:
        rt = self._get_or_create_runtime(instance_name)
        today_str = datetime.now().strftime("%Y-%m-%d")
        sent_hour = self.get_hourly_count(rt.instance_name)
        queued_count = self.queue_store.count_queued(rt.instance_name)

        with rt.lock:
            if rt.sent_today_date != today_str:
                rt.sent_today_date = today_str
                rt.sent_today_count = 0
                rt.failed_today_count = 0

            sent_today = rt.sent_today_count
            effective_daily_limit, warmup_day = compute_warmup_limit(
                rt.connected_at, rt.daily_limit, rt.warmup_mode
            )
            in_hours, _ = is_within_working_hours(
                rt.working_hours_enabled, rt.working_hours_start, rt.working_hours_end
            )
            safety_score, safety_tips = calculate_safety_score(
                simulate_typing=rt.simulate_typing,
                warmup_mode=rt.warmup_mode,
                working_hours_enabled=rt.working_hours_enabled,
                verify_number=rt.verify_number,
                delay_min_sec=rt.delay_min_sec,
                delay_max_sec=rt.delay_max_sec,
                daily_limit=rt.daily_limit,
                hourly_limit=rt.hourly_limit,
                batch_size=rt.batch_size,
                batch_pause_sec=rt.batch_pause_sec,
            )

            return {
                "sentToday": sent_today,
                "dailySentCount": sent_today,
                "sentThisHour": sent_hour,
                "dailyLimit": rt.daily_limit,
                "effectiveDailyLimit": effective_daily_limit,
                "hourlyLimit": rt.hourly_limit,
                "remaining": max(0, effective_daily_limit - sent_today),
                "queued": queued_count,
                "queuedCount": queued_count,
                "inQueue": queued_count,
                "failedToday": rt.failed_today_count,
                "warmupMode": rt.warmup_mode,
                "warmupDay": warmup_day,
                "workingHoursEnabled": rt.working_hours_enabled,
                "workingHoursStart": rt.working_hours_start,
                "workingHoursEnd": rt.working_hours_end,
                "withinWorkingHours": in_hours,
                "simulateTyping": rt.simulate_typing,
                "typingMinSec": rt.typing_min_sec,
                "typingMaxSec": rt.typing_max_sec,
                "delayMinSec": rt.delay_min_sec,
                "delayMaxSec": rt.delay_max_sec,
                "batchSize": rt.batch_size,
                "batchPauseSec": rt.batch_pause_sec,
                "verifyNumber": rt.verify_number,
                "queuePaused": rt.queue_paused,
                "pauseReason": rt.pause_reason,
                "consecutiveFailures": rt.consecutive_failures,
                "circuitBreakerActive": rt.queue_paused,
                "proxyUrl": rt.proxy_url or "",
                "safetyScore": safety_score,
                "safetyTips": safety_tips,
            }

    def get_instances_summary(self, instance_names: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        names: List[str] = []
        if instance_names:
            for n in instance_names:
                clean = sanitize_instance_name(n)
                if clean not in names:
                    names.append(clean)
        else:
            with self._global_lock:
                names = list(self._instances.keys())

        result = []
        for name in names:
            st = self.get_status(name)
            qs = self.get_queue_stats(name)
            result.append(
                {
                    "instanceName": name,
                    "connectionState": st["connectionState"],
                    "status": st["status"],
                    "isConnected": st["isConnected"],
                    "phoneNumber": st["phoneNumber"],
                    "pushName": st["pushName"],
                    "currentlyTypingTo": st["currentlyTypingTo"],
                    "sentToday": qs["sentToday"],
                    "effectiveDailyLimit": qs["effectiveDailyLimit"],
                    "sentThisHour": qs["sentThisHour"],
                    "hourlyLimit": qs["hourlyLimit"],
                    "queued": qs["queued"],
                    "queuePaused": qs["queuePaused"],
                    "safetyScore": qs["safetyScore"],
                    "hasSavedSession": st["hasSavedSession"],
                }
            )
        return result

    async def diagnostic(self, instance_name: str) -> Dict[str, Any]:
        start_time = time.perf_counter()
        rt = self._get_or_create_runtime(instance_name)
        st = self.get_status(instance_name)
        session_size_kb = 0.0
        if os.path.exists(rt.db_path):
            try:
                session_size_kb = round(os.path.getsize(rt.db_path) / 1024.0, 1)
            except Exception:
                pass

        mem_str = "N/D"
        if psutil:
            try:
                proc = psutil.Process(os.getpid())
                rss_mb = proc.memory_info().rss / (1024 * 1024)
                mem_str = f"{rss_mb:.1f} MB"
            except Exception:
                pass

        with rt.lock:
            thread_alive = bool(rt.thread and rt.thread.is_alive())
            active_count = len(self._instances)

        uptime_sec = int((datetime.now() - self._started_at).total_seconds())
        latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        return {
            "success": True,
            "engine": "Python Nativo (Neonize / WhatsMeow)",
            "instance": rt.instance_name,
            "socket_state": st["connectionState"],
            "is_connected": st["isConnected"],
            "thread_alive": thread_alive,
            "phone_number": st["phoneNumber"],
            "push_name": st["pushName"],
            "latency_ms": latency_ms,
            "memory_usage": mem_str,
            "session_size_kb": session_size_kb,
            "active_instances_count": active_count,
            "uptime_seconds": uptime_sec,
            "webhook_url": self.webhook_url,
            "worker_running": self._worker_running,
        }


whatsapp_engine = WhatsAppPythonEngine()
