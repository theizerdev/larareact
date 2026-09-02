# Integración Shigoto ↔ Oracle PeopleSoft HCM (Time and Labor)

Estado: **preparada, desactivada**. No hay acceso todavía a un PeopleSoft real,
así que nada de esto ha corrido contra un sistema del cliente. Lo que está
hecho es el andamiaje completo y probado en frío, para que activarlo el día que
haya credenciales sea configuración y no desarrollo.

Fecha de la investigación: septiembre 2026. Todas las fuentes son documentación
oficial de Oracle; no se usó material de foros ni de comunidad.

---

## 1. La decisión de fondo

La pregunta original era "cómo mandar los marcajes de los relojes ZKTeco
SpeedFace a PeopleSoft". La respuesta corta es que **no hay que inventar nada**:
PeopleSoft Time and Labor ya tiene previsto este escenario desde hace años bajo
el nombre de **TCD (Time Collection Device)**, que es exactamente "reloj
checador de un tercero".

Eso cambia el planteamiento. En vez de construir una integración a medida contra
tablas internas —frágil y no soportada—, Shigoto se presenta ante PeopleSoft
como un TCD más y usa la interfaz que Oracle publica y mantiene para eso.

Ventajas concretas:

- Es un camino soportado por Oracle, no un atajo. Sobrevive a los updates del PUM.
- Trae de fábrica la validación, la cola de errores (*TCD error queue*) y el
  encadenamiento con Time Administration.
- No requiere personalizaciones (customizations) en el PeopleSoft del cliente:
  es configuración de objetos que ya vienen entregados.

## 2. Cómo funciona la interfaz TCD

El intercambio va por **PeopleSoft Integration Broker** y es bidireccional.

**De PeopleSoft hacia el reloj** (opcional, sólo si el cliente lo quiere): once
operaciones de servicio `TIME_DEVICE_*_FULLSYNC` que publican el catálogo de
time reporters, gafetes, horarios, TRCs, perfiles de tarea, supervisores y
reglas de restricción. Viajan por la cola `TIME_COLLECTION_DEVICE_SETUP`, que
Oracle entrega en estado *Pause* y hay que pasar a *Run*.

**Del reloj hacia PeopleSoft** (lo que nos interesa): dos operaciones.

| Interfaz | Operación de servicio | Cola | Registro |
|---|---|---|---|
| Marcajes (punch) | `PUNCHED_TIME_ADD` | `PUNCHED_TIME` | `TL_PUNCH_INTFC` (+ hijo `TL_PCHTSK_INTFC`) |
| Tiempo acumulado | `ELAPSED_TIME_ADD` | `ELAPSED_TIME` | `TL_ELP_INTFC` (+ hijo `TL_ELPTSK_INTFC`) |

Usamos la primera: un reloj SpeedFace produce eventos con hora exacta, que es
justo lo que modela `PUNCHED_TIME_ADD`.

Al llegar el mensaje, Time and Labor lo procesa con el Application Engine
`TL_ST_LOADER`, que valida el formato, traduce el `BADGE_ID` a `EMPLID`, escribe
en las tablas de *Reported Time* y dispara la validación. Lo que no pasa el
filtro no se pierde: cae en la cola de errores TCD
(*Set Up HCM > System Administration > Utilities > Analyze Time and Labor >
Review TCD Errors*), donde se corrige a mano y se reenvía con la casilla
*Resubmit to Reported Time*.

Para volúmenes altos existe un handler alternativo, `PUNCH_ADD_DAEMON`, que
procesa por lotes con el job `STDAEMON` y un tamaño configurable en la página
TL Installation (*Max Punches in a Batch*, 2000 por defecto). Vale la pena
tenerlo en el radar si el cliente tiene muchos relojes.

## 3. El transporte

Los mensajes asíncronos de un tercero se entregan por **HTTP POST al listening
connector** del gateway:

```
http(s)://<gateway>/PSIGW/HttpListeningConnector
```

El cuerpo va envuelto en el sobre `<IBRequest>`, con el contenido del mensaje
dentro de una sección `CDATA`:

```xml
<IBRequest>
  <ExternalOperationName>PUNCHED_TIME_ADD.VERSION_1</ExternalOperationName>
  <OperationType>async</OperationType>
  <From>
    <RequestingNode>SHIGOTO_TCD</RequestingNode>
    <Password>...</Password>
  </From>
  <To><DestinationNode>PSFT_HR</DestinationNode></To>
  <ContentSections>
    <ContentSection>
      <Data><![CDATA[ ...mensaje PUNCHED_TIME_ADD... ]]></Data>
    </ContentSection>
  </ContentSections>
</IBRequest>
```

El contenido usa el **formato rowset** de PeopleSoft: una sección
`<FieldTypes>` que declara campos y tipos, y una `<MsgData>` con una
`<Transaction>` por marcaje, cada una cerrada por su registro `PSCAMA` con
`AUDIT_ACTN` = `A`.

Un HTTP 200 significa *recibido*, no *procesado*. El gateway puede contestar 200
con un `<IBResponse type="error">`; el resultado real se ve en el Service
Operations Monitor. `PeopleSoftClient` distingue los dos casos.

### Seguridad

La operación de servicio define el nivel exigido (campo *Security Verification*,
o *Req Verification* en las REST). Para operaciones no-REST como
`PUNCHED_TIME_ADD` las opciones van de `None` a combinaciones de SSL, firma
digital y cifrado WS-Security. Además, a nivel de nodo se puede exigir
contraseña o certificado.

Recomendación para el cliente: **SSL + contraseña de nodo** como mínimo. La
contraseña nunca en query string (viaja en claro); va dentro del `<IBRequest>`
o en cabecera HTTP.

## 4. El punto fino: traducir los marcajes

Ésta es la parte donde una integración así se rompe en silencio. ZKTeco y
PeopleSoft **no modelan los punches igual**.

| ZKTeco `punch_state` | Etiqueta | PeopleSoft `PUNCH_TYPE` |
|---|---|---|
| 0 | Entrada | 1 (In) |
| 1 | Salida | 2 (Out) |
| 2 | Salida a descanso | 3 (Meal) *o* 4 (Break) |
| 3 | Regreso de descanso | **1 (In)** |
| 4 | Entrada horas extra | 1 (In) |
| 5 | Salida horas extra | 2 (Out) |

Los dos casos que hay que mirar con cuidado:

- **El regreso de comida no tiene tipo propio en PeopleSoft.** Se marca *Meal*
  al salir y *In* al volver. Mapear el `3` de ZKTeco a un supuesto "Meal In"
  produciría jornadas mal calculadas.
- **`2` es una decisión de negocio, no técnica.** Si el reloj se usa para
  comida va a *Meal*; si se usa para pausas cortas, a *Break*. Por eso queda en
  `config/peoplesoft.php` y no clavado en el código.

Un `punch_state` sin equivalencia **no se exporta**: se registra como omitido
con su motivo. Inventar un tipo sería peor que no mandar nada.

### Otro detalle que condiciona el diseño

El indicador `ADD_DELETE_IND` de la interfaz **borra el día completo** del
empleado, no un marcaje suelto. Oracle lo dice explícitamente: corregir es
borrar el día y volver a mandarlo entero, y para eso *el TCD debe conservar la
imagen de ese día*.

Shigoto ya la conserva —`biotime_marcajes` es el espejo completo—, así que la
reposición de un día es viable. No está implementada todavía porque no debe
diseñarse a ciegas: es la clase de operación que hay que probar contra un
entorno real antes de dejarla suelta.

## 5. Qué se construyó

Todo aditivo. No se modificó ninguna tabla ni flujo existente; en particular no
se toca `asistencia_marcajes`, el cálculo LFT ni WhatsApp.

| Archivo | Qué hace |
|---|---|
| `config/peoplesoft.php` | Configuración. Interruptor maestro, mapa de tipos de punch, TCD_ID por reloj, lotes. |
| `app/Services/PeopleSoft/PunchedTimeMapper.php` | Traduce un marcaje al layout `TL_PUNCH_INTFC`. Puro, sin red ni BD. |
| `app/Services/PeopleSoft/PunchedTimeMessageBuilder.php` | Arma el mensaje rowset `PUNCHED_TIME_ADD`. |
| `app/Services/PeopleSoft/PeopleSoftClient.php` | Sobre `<IBRequest>` y transporte. **Se niega a enviar si la integración está desactivada.** |
| `app/Services/PeopleSoft/PeopleSoftExportService.php` | Orquesta: ventana, mapeo, lotes, bitácora. Idempotente. |
| `app/Console/Commands/PeopleSoftExportarMarcajes.php` | Comando `peoplesoft:exportar-marcajes`. Simula por defecto. |
| `peoplesoft_empleado_mapeos` (tabla) | Equivalencia `emp_code` ZKTeco ↔ `BADGE_ID`/`EMPLID` PeopleSoft. |
| `peoplesoft_exportaciones` (tabla) | Bitácora de salida: qué se mandó, cuándo, con qué payload y en qué acabó. |

Pruebas: 26 casos en `tests/Feature/PeopleSoftPunchedTimeMapperTest.php` y
`tests/Feature/PeopleSoftExportTest.php`. Cubren el mapeo de los seis tipos de
punch, los recortes de longitud, la idempotencia, el troceado en lotes, el
manejo de acuses con error y —lo más importante— que **no sale ni una petición
de red mientras la integración esté apagada**.

### Los tres candados

1. `config('peoplesoft.enabled')` es `false`. Con eso, `PeopleSoftClient::send()`
   lanza excepción antes de tocar la red.
2. `config('peoplesoft.dry_run')` es `true`. Aun habilitado, se queda en simulación.
3. El comando necesita `--enviar` explícito. Sin la bandera, sólo genera payload.

Además, el comando **no está dado de alta en el scheduler** (`bootstrap/app.php`).
Se agrega el día que la integración esté validada, no antes.

## 6. Cómo usarlo hoy (sin PeopleSoft)

```bash
# Genera los payloads de las últimas 24 h y los deja en la bitácora. No envía.
php artisan peoplesoft:exportar-marcajes

# Una ventana concreta, mostrando el XML que se generaría.
php artisan peoplesoft:exportar-marcajes \
    --desde="2026-09-01 00:00:00" --hasta="2026-09-02 00:00:00" --mostrar-xml
```

Sirve para dos cosas: validar el mapeo contra datos reales y **mandarle al
cliente un XML de muestra** para que su equipo de PeopleSoft lo revise antes de
abrir ningún puerto.

## 7. Cómo se activa el día que haya acceso

1. El cliente da de alta el TCD en *Set Up HCM > Time and Labor > Time
   Collection Devices* (TCD Type, TCD Setup, TCD Group) y nos pasa el `TCD_ID`.
2. El cliente crea el **nodo externo** para Shigoto en Integration Broker y
   activa la operación `PUNCHED_TIME_ADD`, su handler, su routing (**InAsync**)
   y su cola.
3. Nos entregan: URL del gateway, nombre del nodo destino, nombre y contraseña
   del nodo remitente, y el `.xsd` de la operación.
4. **Contrastar el `.xsd` con `PunchedTimeMessageBuilder::FIELD_TYPES`.** El
   esquema de su instancia manda sobre nuestro generador.
5. Cargar las equivalencias de empleado en `peoplesoft_empleado_mapeos`.
6. Poblar el `.env` y **probar primero contra el entorno de pruebas del
   cliente**, nunca contra producción.
7. Recién entonces: `PEOPLESOFT_DRY_RUN=false` y programar el comando.

## 8. Lo que falta y hay que decidir con el cliente

- **Cómo se identifica a la gente**: ¿`BADGE_ID` o `EMPLID` + `EMPL_RCD`? Y quién
  mantiene la equivalencia. Con empleados con varios puestos concurrentes,
  `EMPL_RCD` deja de ser 0 y hay que resolver a cuál se imputa el marcaje.
- **Salida a descanso**: ¿*Meal* o *Break*?
- **Zona horaria**: el campo `TIMEZONE` usa códigos propios de PeopleSoft, no
  IANA. Hay que confirmar el valor exacto de su instalación.
- **Corrección de días**: definir el procedimiento de reposición completa.
- **Tareas / centros de costo**: si necesitan imputar a proyecto, entra el
  registro hijo `TL_PCHTSK_INTFC`, que hoy no se manda.
- **Frecuencia**: Oracle deja la periodicidad abierta, se acuerda por
  implementación.

## 9. Fuentes (todas de Oracle)

- *Understanding TCD Setup and Data Integration* — PeopleSoft HCM 9.2, Time and Labor
- *Understanding the TCD Interface* — id.
- *Objects Sent from the TCD* — id. (layouts `TL_PUNCH_INTFC` y `TL_ELP_INTFC`)
- *Input Data Sent to TCD Systems* — id.
- *Configuration of the Integration Broker and the TCD* — id.
- *Viewing and Resolving TCD Errors* — id.
- *Sending Setup Data to a TCD* — id.
- *Working with the HTTP Connectors* — PeopleTools, Integration Broker Administration
- *Validating Security on Inbound Integrations* — id.
- *PeopleSoft Rowset-Based Message Format* — PeopleTools, Integration Broker
