<?php

/*
|--------------------------------------------------------------------------
| Padrón de códigos de empleado de CONTPAQi — Frigorífico Santander
|--------------------------------------------------------------------------
|
| Transcrito de la captura de pantalla de la prenómina del cliente
| ("CODIGOS DE INCIDENCIAS - SAT- FRIGO.docx", período 15 del 07/Abr/2026).
|
| ------------------------------------------------------------------------
| LOS NOMBRES ESTÁN INCOMPLETOS Y ESO ES A PROPÓSITO.
| ------------------------------------------------------------------------
| En la captura, la columna "Nombre empleado" es más angosta que el texto y
| corta los nombres a media palabra. Aquí se transcribe exactamente lo que se
| alcanza a leer, ni una letra más: completar "CARMI" a "CARMEN" o "JOHAN M" a
| "JOHAN MANUEL" sería inventar el apellido de una persona real y arriesgarse a
| cargarle la nómina a otra.
|
| Por eso cada renglón lleva 'truncado'. El comando contpaqi:importar-codigos
| compara los truncados por prefijo y exige coincidencia única: si el prefijo
| encaja con dos empleados, no elige — reporta la ambigüedad y sigue.
|
| Cuando haya la lista completa (exportándola de CONTPAQi), conviene pasarla al
| comando con --csv en vez de editar este archivo: esto es el registro de lo que
| traía la captura original.
*/

return [
    ['codigo' => '180', 'nombre' => 'LUQUE CASILLAS MA BEATRI', 'truncado' => true],
    ['codigo' => '286', 'nombre' => 'FRANCO GARCIA JOSE ALBER', 'truncado' => true],
    ['codigo' => '320', 'nombre' => 'SALDAÑA SIERRA JONATHAN', 'truncado' => true],
    ['codigo' => '326', 'nombre' => 'PEREZ NILA JUAN CARLOS', 'truncado' => false],
    ['codigo' => '341', 'nombre' => 'CAMARENA VELAZQUEZ ALA', 'truncado' => true],
    ['codigo' => '345', 'nombre' => 'BELTRAN CURIEL JOSE ALAN', 'truncado' => false],
    ['codigo' => '370', 'nombre' => 'VICTORINO ROMERO EMMAN', 'truncado' => true],
    ['codigo' => '371', 'nombre' => 'IBARRA VELAZQUEZ LUIS MI', 'truncado' => true],
    ['codigo' => '413', 'nombre' => 'CIRA VALENTIN HERIBERTO', 'truncado' => false],
    ['codigo' => '431', 'nombre' => 'ENRIQUEZ ECHEVERRIA JOE', 'truncado' => true],
    ['codigo' => '448', 'nombre' => 'FLORES ROJAS BRIAN ALEJA', 'truncado' => true],
    ['codigo' => '464', 'nombre' => 'REGIN NUÑO ADRIANA GUAD', 'truncado' => true],
    ['codigo' => '465', 'nombre' => 'ARCE MARTINEZ MA. GUADA', 'truncado' => true],
    ['codigo' => '466', 'nombre' => 'GUERRERO AREVALO CARMI', 'truncado' => true],
    ['codigo' => '467', 'nombre' => 'GUTIERREZ SILVA EDUARDO', 'truncado' => true],
    ['codigo' => '468', 'nombre' => 'CAMARENA VELAZQUEZ KER', 'truncado' => true],
    ['codigo' => '469', 'nombre' => 'RETANA PEDRO JESUS DAVI', 'truncado' => true],
    ['codigo' => '470', 'nombre' => 'MORENO SANCHEZ JOHAN M', 'truncado' => true],
    ['codigo' => '999', 'nombre' => 'PONCE GARCIA ALEXIS FERN', 'truncado' => true],
];
