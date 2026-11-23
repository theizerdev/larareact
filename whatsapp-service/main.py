"""
Servidor REST Multi-Sucursal de WhatsApp para Fixsale (FastAPI + Neonize).
100% independiente de APIs externas, con soporte Multi-Instancia por Sucursal,
emparejamiento por QR o código de 8 dígitos y Cola Anti-Baneo asíncrona.
"""

import asyncio
import os
import urllib.parse
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from engine import (
    detect_laravel_webhook_url,
    parse_spintax,
    replace_variables,
    whatsapp_engine,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    loop = asyncio.get_running_loop()
    whatsapp_engine.attach_event_loop(loop)
    whatsapp_engine.webhook_url = detect_laravel_webhook_url()
    whatsapp_engine.start_queue_worker()
    # Restaurar sesiones persistidas de sucursales en segundo plano sin bloquear el arranque
    loop.create_task(whatsapp_engine.restore_persisted_sessions())
    yield
    await whatsapp_engine.stop_queue_worker()


app = FastAPI(
    title="Fixsale WhatsApp Native Engine",
    description="Motor nativo Multi-Sucursal en Python (Neonize + WhatsMeow) para Fixsale",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── MODELOS DE PETICIÓN ──────────────────────────────────────────

class InstanceCreateRequest(BaseModel):
    name: str = "sucursal_1"
    token: Optional[str] = None
    proxyUrl: Optional[str] = None


class ReconnectRequest(BaseModel):
    clear_session: Optional[bool] = True
    proxyUrl: Optional[str] = None


class SendTextRequest(BaseModel):
    to: str
    message: str
    variables: Optional[Dict[str, Any]] = None
    country_code: Optional[str] = "+58"
    sync: Optional[bool] = True
    simulateTyping: Optional[bool] = None
    typingMinSec: Optional[float] = None
    typingMaxSec: Optional[float] = None
    verifyNumber: Optional[bool] = None
    localMessageId: Optional[int] = None


class SendMediaRequest(BaseModel):
    to: str
    url: str
    caption: Optional[str] = ""
    message: Optional[str] = ""
    country_code: Optional[str] = "+58"
    variables: Optional[Dict[str, Any]] = None
    sync: Optional[bool] = True
    simulateTyping: Optional[bool] = True


class PairPhoneRequest(BaseModel):
    phone: str
    country_code: Optional[str] = "+58"


class SpintaxPreviewRequest(BaseModel):
    text: str
    count: Optional[int] = 4
    variables: Optional[Dict[str, Any]] = None


class AntiBanUpdateRequest(BaseModel):
    dailyLimit: Optional[int] = None
    hourlyLimit: Optional[int] = None
    warmupMode: Optional[bool] = None
    workingHoursEnabled: Optional[bool] = None
    workingHoursStart: Optional[str] = None
    workingHoursEnd: Optional[str] = None
    simulateTyping: Optional[bool] = None
    typingMinSec: Optional[float] = None
    typingMaxSec: Optional[float] = None
    delayMinSec: Optional[int] = None
    delayMaxSec: Optional[int] = None
    batchSize: Optional[int] = None
    batchPauseSec: Optional[int] = None
    verifyNumber: Optional[bool] = None
    proxyUrl: Optional[str] = None


class QueuePauseRequest(BaseModel):
    paused: bool
    reason: Optional[str] = None


class BlacklistRequest(BaseModel):
    phone: str
    reason: Optional[str] = "MANUAL_BLOCK"


# ── RUTAS PRINCIPALES ─────────────────────────────────────────────

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "fixsale-whatsapp-engine",
        "engine": "python-neonize",
        "version": "2.0.0",
        "webhook_url": whatsapp_engine.webhook_url,
    }


# Resumen multi-instancia en una sola llamada (ideal para tablero de sucursales)
@app.get("/api/instances")
def list_instances(names: Optional[str] = Query(None, description="Lista separada por comas de instancias")):
    requested = [n.strip() for n in names.split(",") if n.strip()] if names else None
    return {
        "success": True,
        "instances": whatsapp_engine.get_instances_summary(requested),
    }


# 1. Crear / Inicializar Instancia de Sucursal
@app.post("/api/instance/create")
async def create_instance(req: InstanceCreateRequest):
    status = await whatsapp_engine.connect_instance(req.name, proxy_url=req.proxyUrl, wait_seconds=9.0)
    return {
        "success": True,
        "message": f"Instancia {req.name} inicializada.",
        "instance": {"name": req.name, "token": req.token},
        **status,
    }


# 2. Consultar Estado en Vivo de la Instancia
@app.get("/api/instance/{instance_name}/status")
def get_instance_status(instance_name: str):
    return whatsapp_engine.get_status(instance_name)


# 3. Diagnóstico / Telemetría en Vivo
@app.get("/api/instance/{instance_name}/diagnostic")
async def get_instance_diagnostic(instance_name: str):
    return await whatsapp_engine.diagnostic(instance_name)


# 4. Iniciar / Conectar Instancia
@app.post("/api/instance/{instance_name}/start")
@app.post("/api/instance/{instance_name}/connect")
async def start_instance(instance_name: str):
    return await whatsapp_engine.connect_instance(instance_name, wait_seconds=9.0)


# 5. Reconectar / Regenerar QR (Cambiar Línea)
@app.post("/api/instance/{instance_name}/reconnect")
async def reconnect_instance(instance_name: str, req: Optional[ReconnectRequest] = None):
    clear = True if req is None else bool(req.clear_session)
    proxy = None if req is None else req.proxyUrl
    return await whatsapp_engine.reconnect_instance(instance_name, clear_session=clear, proxy_url=proxy)


# 6. Detener Instancia (sin borrar sesión)
@app.post("/api/instance/{instance_name}/stop")
async def stop_instance(instance_name: str):
    return await whatsapp_engine.disconnect_instance(instance_name, clear_session=False)


# 7. Desconectar y Eliminar Sesión
@app.delete("/api/instance/{instance_name}")
async def delete_instance(instance_name: str):
    st = await whatsapp_engine.disconnect_instance(instance_name, clear_session=True)
    return {"success": True, "message": f"Sesión de {instance_name} desvinculada y eliminada.", **st}


# 8. Vincular por Código de Emparejamiento (8 dígitos)
@app.post("/api/instance/{instance_name}/pair")
async def pair_phone(instance_name: str, req: PairPhoneRequest):
    res = await whatsapp_engine.pair_phone(
        instance_name=instance_name,
        phone=req.phone,
        country_code=req.country_code or "+58",
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Error generando código"))
    return res


# 9. Verificar si un número está registrado en WhatsApp
@app.get("/api/instance/{instance_name}/check-number/{phone}")
async def check_number(instance_name: str, phone: str, country_code: str = "+58"):
    return await whatsapp_engine.check_number(instance_name, phone, country_code=country_code)


# 10. Enviar Mensaje de Texto (Directo o vía Cola Anti-Baneo)
@app.post("/api/message/send-text/{instance_name}")
async def send_text_message(instance_name: str, req: SendTextRequest):
    if req.sync is False:
        res = whatsapp_engine.enqueue_text(
            instance_name=instance_name,
            to=req.to,
            message=req.message,
            country_code=req.country_code or "+58",
            variables=req.variables,
            local_message_id=req.localMessageId,
            simulate_typing=req.simulateTyping,
            verify_number=req.verifyNumber,
        )
        if not res.get("success"):
            raise HTTPException(status_code=400, detail=res.get("error", "Error al encolar mensaje"))
        return res

    res = await whatsapp_engine.send_text_humanized(
        instance_name=instance_name,
        to=req.to,
        message=req.message,
        country_code=req.country_code or "+58",
        variables=req.variables,
        simulate_typing=req.simulateTyping,
        typing_min_sec=req.typingMinSec,
        typing_max_sec=req.typingMaxSec,
        verify_number=req.verifyNumber,
        enforce_cooldown=False,
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Fallo al enviar mensaje"))
    return res


# 11. Enviar Archivo Multimedia vía URL o Ruta Local
@app.post("/api/message/send-media/{instance_name}")
async def send_media_message(instance_name: str, req: SendMediaRequest):
    caption = req.caption or req.message or ""
    if caption:
        caption = parse_spintax(caption)
        if req.variables:
            caption = replace_variables(caption, req.variables)

    file_bytes = b""
    filename = "documento.pdf"
    mimetype = "application/pdf"

    if req.url.startswith("http://") or req.url.startswith("https://"):
        async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
            resp = await client.get(req.url)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail=f"No se pudo descargar el archivo: HTTP {resp.status_code}")
            file_bytes = resp.content
            mimetype = resp.headers.get("content-type", "application/pdf").split(";")[0]
            parsed_path = urllib.parse.urlparse(req.url).path
            filename = os.path.basename(parsed_path) or "archivo.pdf"
    elif os.path.exists(req.url):
        with open(req.url, "rb") as f:
            file_bytes = f.read()
        filename = os.path.basename(req.url)
        if filename.lower().endswith((".jpg", ".jpeg")):
            mimetype = "image/jpeg"
        elif filename.lower().endswith(".png"):
            mimetype = "image/png"
        elif filename.lower().endswith(".webp"):
            mimetype = "image/webp"
        else:
            mimetype = "application/pdf"
    else:
        raise HTTPException(status_code=400, detail=f"Ruta de archivo o URL no válida: {req.url}")

    res = await whatsapp_engine.send_document_bytes(
        instance_name=instance_name,
        to=req.to,
        file_bytes=file_bytes,
        filename=filename,
        caption=caption,
        country_code=req.country_code or "+58",
        mimetype=mimetype,
        simulate_typing=bool(req.simulateTyping),
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Fallo al despachar multimedia"))
    return res


# 12. Enviar Archivo Multipart Local
@app.post("/api/message/send-multimedia/{instance_name}")
async def send_multimedia_upload(
    instance_name: str,
    file: UploadFile = File(...),
    to: str = Form(...),
    mediaType: str = Form("document"),
    caption: Optional[str] = Form(""),
    simulateTyping: Optional[bool] = Form(True),
):
    content = await file.read()
    filename = file.filename or "archivo.pdf"
    mimetype = file.content_type or ("image/jpeg" if mediaType == "image" else "application/pdf")

    res = await whatsapp_engine.send_document_bytes(
        instance_name=instance_name,
        to=to,
        file_bytes=content,
        filename=filename,
        caption=caption,
        mimetype=mimetype,
        simulate_typing=bool(simulateTyping),
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Error al enviar archivo"))
    return res


# 13. Estado de la Cola y Estadísticas Anti-Baneo
@app.get("/api/message/queue-status/{instance_name}")
def get_queue_status(instance_name: str):
    stats = whatsapp_engine.get_queue_stats(instance_name)
    return {"stats": stats}


# 14. Pausar / Reanudar Cola de la Instancia
@app.post("/api/instance/{instance_name}/queue/pause")
def toggle_queue_pause(instance_name: str, req: QueuePauseRequest):
    stats = whatsapp_engine.set_queue_paused(instance_name, paused=req.paused, reason=req.reason)
    return {
        "success": True,
        "message": "Cola pausada." if req.paused else "Cola reanudada y Circuit Breaker restablecido.",
        "stats": stats,
    }


# 15. Vaciar / Cancelar Cola Pendiente de la Instancia
@app.post("/api/instance/{instance_name}/queue/clear")
async def clear_instance_queue(instance_name: str):
    return await whatsapp_engine.clear_queue(instance_name)


# 16. Previsualizar Variaciones Spintax
@app.post("/api/message/spintax/preview")
def preview_spintax(req: SpintaxPreviewRequest):
    count = min(20, max(1, req.count or 4))
    variations: List[str] = []
    for _ in range(count):
        processed = parse_spintax(req.text)
        if req.variables:
            processed = replace_variables(processed, req.variables)
        variations.append(processed)
    return {"success": True, "variations": variations}


# 17. Actualizar Parámetros Anti-Baneo de la Sucursal
@app.post("/api/instance/{instance_name}/antiban")
def update_antiban(instance_name: str, req: AntiBanUpdateRequest):
    stats = whatsapp_engine.update_antiban_policy(instance_name, req.model_dump(exclude_unset=True))
    return {"success": True, "message": "Políticas Anti-Baneo actualizadas correctamente.", "stats": stats}


# 18. Reset de Disyuntor (Circuit Breaker)
@app.post("/api/instance/{instance_name}/circuit-breaker/reset")
@app.post("/api/instance/{instance_name}/emergency-brake/reset")
def reset_circuit_breaker(instance_name: str):
    stats = whatsapp_engine.set_queue_paused(instance_name, paused=False)
    return {"success": True, "message": "Disyuntor restablecido.", "stats": stats}


# 19. Lista Negra por Instancia
@app.post("/api/instance/{instance_name}/blacklist")
def add_to_blacklist(instance_name: str, req: BlacklistRequest):
    return whatsapp_engine.add_blacklist(instance_name, req.phone, req.reason or "MANUAL_BLOCK")


@app.delete("/api/instance/{instance_name}/blacklist/{phone}")
def remove_from_blacklist(instance_name: str, phone: str):
    return whatsapp_engine.remove_blacklist(instance_name, phone)
