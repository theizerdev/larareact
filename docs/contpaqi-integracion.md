# Integración Shigoto ↔ CONTPAQi Nóminas (NOMIPAQ)

Estado: **funcionando**. El cálculo está hecho y probado, y el layout del
archivo quedó fijado en los mnemónicos del catálogo del cliente por indicación
suya. Lo que todavía no ha ocurrido es una importación real en su CONTPAQi: la
primera vez conviene hacerla con un período de ensayo, no con una nómina que se
vaya a timbrar.

Fecha del trabajo: septiembre 2026. Las fuentes son el catálogo de incidencias y
las capturas de pantalla del CONTPAQi de Frigorífico Santander, del 07/Abr/2026.

---

## 1. La decisión de fondo

La pregunta era cómo hacer que las horas que Shigoto calcula lleguen a CONTPAQi
Nóminas sin recapturarlas a mano. Hay tres caminos y sólo uno es sostenible.

| Camino | Por qué sí | Por qué no |
|---|---|---|
| **Excel a la prenómina** | Es la puerta que CONTPAQi publica: el botón *Capturar movimientos desde Excel* de la prenómina. No requiere licencia extra ni acceso a su base de datos, y funciona desde el servidor web. | El layout hay que confirmarlo contra cada instalación. |
| SDK de CONTPAQi | Escribe directo en la prenómina. | Es una DLL/COM que sólo corre en Windows sobre la máquina donde está CONTPAQi instalado y con licencia del SDK; obligaría a construir un agente aparte. |
| Firebird directo | No hace falta nada del proveedor. | No está soportado, se rompe en cada actualización y puede invalidar el soporte. |

Se eligió el primero, por la misma razón que con PeopleSoft se eligió la
interfaz TCD en vez de escribir en sus tablas: **usar la puerta que el proveedor
ya dejó abierta sobrevive a las actualizaciones; un atajo, no.**

## 2. El flujo completo

```
marcajes del reloj
      │
      ▼
asistencia_resumenes_diarios          incidencias_empleado
(horas, retardos, festivos)           (vacaciones, permisos, incapacidades)
      │                                        │
      └────────────┬───────────────────────────┘
                   ▼
            IncidenciaMapper          ← traduce a mnemónicos del catálogo
                   ▼
         ContpaqiExportService        ← decide a quién incluir, deja constancia
                   ▼
        PrenominaExcelWriter          ← escribe el .xlsx
                   ▼
   "Capturar movimientos desde Excel" en la prenómina de CONTPAQi
```

## 3. Las dos mitades de una prenómina

Ésta es la parte que más importa entender. La asistencia sabe deducir sólo una
mitad de lo que CONTPAQi necesita:

**Lo que se deriva solo** (config `contpaqi.derivacion`):

| Mnemónico | De dónde sale |
|---|---|
| `TRAB` | Días con horas ordinarias que no son festivo ni descanso |
| `HE1` / `HE2` | Regla 3x3 de la LFT: las primeras 9 horas extra del período al doble, el excedente al triple |
| `RET` | Suma de minutos de retardo, convertida a horas |
| `DFT` | Festivo de empresa trabajado |
| `DDOL` | Festivo oficial LFT trabajado (`dias_festivos.es_oficial_lft`) |
| `DDL` | Día de descanso semanal trabajado |
| `FINJ` | Día laborable sin marcajes y sin incidencia que lo cubra |

**Lo que sólo puede capturar una persona**: `VAC`, `PSS`, `PCS`, `INC`, `ATRB`,
`ATRY`, `ENFG`, `MAT`, `L140`, `CAST`. Ningún marcaje de reloj revela que
alguien está de vacaciones o incapacitado.

Por eso el módulo incluye la pantalla de **Incidencias**. Sin ella la prenómina
sale incompleta y, peor, marca como falta injustificada a quien tenía permiso.

### Un día trabajado cae en una sola categoría

El orden de decisión es festivo oficial → festivo de empresa → día de descanso →
día normal, y es excluyente. Sin esa exclusividad un domingo festivo trabajado
se contaría como `DDOL`, `DDL` y `TRAB` a la vez, y se pagaría tres veces.

### Las faltas son el punto delicado

`FINJ` descuenta sueldo y proporción de séptimo día. Sólo se deriva cuando se
cumplen las cuatro condiciones a la vez: el día era laborable según el turno, no
era festivo, no hay resumen con horas, y ninguna incidencia **aprobada** cubre
esa fecha. Una incidencia apenas capturada no tapa la falta — si nadie la
autorizó, la ausencia sigue siendo real.

Con `CONTPAQI_DERIVAR_FALTAS=false` las faltas nunca se derivan solas.

## 4. Identidad: el mapeo de códigos

CONTPAQi identifica a la persona por su *Código empleado* (180, 286, 320… en la
prenómina del cliente), que no tiene relación con el id de Shigoto ni con el
`emp_code` del reloj. La equivalencia se declara en `contpaqi_empleado_mapeos`.

**Sin mapeo activo, el empleado no viaja en el archivo**: se reporta como
omitido con su motivo. Es deliberado. Un renglón con el código equivocado le
carga las horas a otra persona y el error se descubre cuando la nómina ya se
timbró.

Se eligió tabla aparte en vez de una columna en `empleados` porque el código de
nómina pertenece a la relación con un sistema externo, no a la persona: el mismo
empleado puede existir en más de una razón social.

## 5. El layout y el mapeo de conceptos

**El layout de columnas** quedó fijado en los mnemónicos del catálogo del
cliente (`HE1`, `TRAB`, `RET`…), por indicación suya en septiembre de 2026, y
`layout_confirmado` está en `true` para que el panel no muestre el aviso.

Conviene tener claro qué respalda ese `true`: es la palabra del cliente sobre su
propio catálogo, **no una importación de prueba que haya funcionado**. La
primera vez sigue valiendo la pena correr un período de ensayo antes de una
nómina real. Si algo no encajara, se cambia con `CONTPAQI_ENCABEZADO_MNEMONICO`
(mnemónico contra número de concepto) y `layout.columnas_fijas`.

**El mapeo incidencia → concepto** (`contpaqi.conceptos_por_mnemonico`) llena el
campo `concepto_nomipaq` del catálogo. Hoy es **informativo**: con los
encabezados en mnemónicos, esos números no salen en el archivo. Sirve para
poder mirar el catálogo de Shigoto y saber contra qué concepto de CONTPAQi cae
cada incidencia.

Se conocen nueve, todos por coincidencia literal con el catálogo de conceptos
del cliente:

| Mnemónico | Concepto |
|---|---|
| `DFT` | 11 · Día festivo / descanso |
| `VAC` | 23 · Días de vacaciones |
| `DDL` | 54 · Días de descanso laborados |
| `DDOL` | 55 · Días de descanso obligatorios |
| `HE1`…`HE5` | 4 · Horas extras |

Los otros doce (`TRAB`, `RET`, `FINJ`, `PCS`, `PSS`, `ATRB`, `ATRY`, `ENFG`,
`INC`, `MAT`, `CAST`, `L140`) quedan en `null` porque **no se conocen**: el
catálogo de conceptos del cliente está ordenado alfabéticamente y la captura
sólo alcanza hasta la letra H. Un `null` es información verdadera; inventar un
número sería peor.

Dos advertencias sobre las horas extra:

1. El catálogo del cliente tiene **dos conceptos casi homónimos**: `4 Horas
   extras` y `135 Horas Extras.` (con punto). Se eligió el 4 por ser de
   numeración baja —en CONTPAQi eso suele indicar concepto de sistema, mientras
   que los de tres dígitos son altas del cliente—. Es una inferencia, no un dato
   confirmado.
2. Qué significa cada uno de `HE1`..`HE5` lo define el cliente en CONTPAQi, no
   la LFT. Shigoto manda las dobles a `HE1` y las triples a `HE2`; si en su
   instalación significan otra cosa, se corrige en `contpaqi.derivacion`.

## 5.1 Carga del padrón de códigos de empleado

El padrón transcrito de la captura de pantalla del cliente vive en
`database/data/contpaqi-codigos-frigorifico.php`: 19 códigos, del 180 al 999.

**Los nombres están incompletos a propósito.** En la captura la columna es más
angosta que el texto y los corta a media palabra ("GUERRERO AREVALO CARMI",
"MORENO SANCHEZ JOHAN M"). Se transcribió exactamente lo legible: completar esos
nombres sería inventar el apellido de una persona real.

```bash
# Ensayo: enseña qué emparejaría, no escribe nada.
php artisan contpaqi:importar-codigos --empresa=1

# Con la lista completa exportada de CONTPAQi (columnas codigo,nombre).
php artisan contpaqi:importar-codigos --empresa=1 --csv=padron.csv --aplicar
```

El emparejamiento por nombre está en `EmparejadorDeNombres` y su regla de oro es
que **ante la duda no elige**. Prueba los dos órdenes posibles (apellidos
primero y al revés), ignora acentos y puntos de abreviatura, conserva la eñe
—Nuño y Nuno son familias distintas— y sólo admite coincidencia por prefijo
cuando el nombre venía marcado como cortado. Si un prefijo encaja con dos
empleados, reporta la ambigüedad en vez de resolverla con el primero.

Tampoco le cambia el código a quien ya lo tiene: reasignar códigos en una
corrida masiva es la forma más silenciosa de romper una nómina.

## 6. Cómo se usa

```bash
# Ensayo: calcula y enseña el resultado, no escribe nada.
php artisan contpaqi:exportar-prenomina --empresa=1

# Un período concreto, generando el archivo.
php artisan contpaqi:exportar-prenomina --empresa=1 \
    --desde=2026-04-06 --hasta=2026-04-12 --periodo=15 --generar
```

Sin `--desde` toma la semana completa anterior a hoy, que es el caso normal: la
prenómina se cierra cuando la semana terminó.

Desde el panel, en **Nómina → Prenómina CONTPAQi**: se elige el período, se
previsualiza (la URL con `?desde=&hasta=` es compartible) y se genera. Conviene
previsualizar siempre antes: es donde se ve quién queda fuera y por qué.

El comando **no está en el scheduler** a propósito. La prenómina se cierra
cuando Recursos Humanos termina de capturar incidencias, no cuando da una hora
del reloj; generarla sola produciría archivos incompletos que alguien acabaría
importando por descuido.

## 7. Permisos

| Permiso | Para qué |
|---|---|
| `incidencias.view` / `.create` / `.edit` / `.delete` | Captura de incidencias |
| `incidencias.aprobar` | Autorizar o rechazar |
| `contpaqi.view` | Ver el panel y previsualizar |
| `contpaqi.exportar` | Generar el archivo |
| `contpaqi.catalogo` | Mapeo de códigos de empleado |

Aprobar está separado de capturar a propósito: una incidencia aprobada mueve
dinero y tapa faltas, así que quien la captura no debería poder autorizarse a sí
misma.

## 8. Decisiones que conviene no deshacer sin pensarlo

**Los modelos no usan el trait `Multitenantable`.** Ese trait filtra por
`sucursal_id` en cualquier tabla que no sea `empresas`/`sucursales`, y estas
tablas no tienen esa columna: la nómina pertenece a la razón social completa, no
a una sucursal. Agregarles `sucursal_id` sólo para satisfacer al trait modelaría
mal el negocio. El alcance se aplica explícitamente con `paraEmpresa()`, y el
servicio de exportación usa `withoutTenant()` para que corriendo desde la
consola —sin usuario autenticado— dé exactamente el mismo resultado que desde el
panel.

**Regenerar un período da el mismo archivo.** El scope `vigentes()` incluye
tanto `aprobada` como `aplicada`. Si el estado terminal sacara la incidencia del
cálculo, el segundo archivo contradiría al primero y nadie sabría cuál importar.

**El detalle guarda también lo que no se exportó.** "Faltaron 12 empleados" no
le sirve a nadie; "estos 12 no tienen código de CONTPAQi" se resuelve en cinco
minutos.

**Una celda vacía no es un cero.** Un cero afirma "cero horas extra"; una celda
vacía dice que no hubo dato. Sólo se escriben los movimientos distintos de cero,
y por default sólo salen las columnas que alguien usó en el período — revisar a
ojo un archivo con 15 columnas vacías es justo lo que hay que evitar las
primeras veces.

## 9. Archivos

| Archivo | Qué hace |
|---|---|
| `config/contpaqi.php` | Interruptores, layout, derivación y catálogo semilla |
| `app/Services/Contpaqi/IncidenciaMapper.php` | Traduce asistencia + incidencias a mnemónicos |
| `app/Services/Contpaqi/ContpaqiExportService.php` | Orquesta, decide inclusiones, deja constancia |
| `app/Services/Contpaqi/PrenominaExcelWriter.php` | Escribe el `.xlsx` |
| `app/Services/Contpaqi/EmparejadorDeNombres.php` | Empareja nombres de CONTPAQi con empleados |
| `app/Console/Commands/ContpaqiExportarPrenomina.php` | Genera la prenómina |
| `app/Console/Commands/ContpaqiImportarCodigos.php` | Carga el padrón de códigos |
| `database/data/contpaqi-codigos-frigorifico.php` | Padrón transcrito de la captura del cliente |
| `app/Http/Controllers/Admin/ContpaqiPrenominaController.php` | Panel y mapeos |
| `app/Http/Controllers/Admin/IncidenciaEmpleadoController.php` | Captura de incidencias |
| `tests/Feature/ContpaqiPrenominaExportTest.php` | 17 pruebas del cálculo |
| `tests/Feature/ContpaqiPanelTest.php` | 8 pruebas de pantallas y permisos |
| `tests/Feature/ContpaqiEmparejadorDeNombresTest.php` | 8 pruebas del emparejamiento |
| `tests/Feature/ContpaqiImportarCodigosTest.php` | 5 pruebas de la carga del padrón |
