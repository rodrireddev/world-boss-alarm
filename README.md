# World Boss Alarm

Extensión de Chrome que muestra un contador regresivo hasta el próximo **World Boss de Diablo 4** y suena una alarma antes de que aparezca, en cualquier pestaña que tengas abierta.

## Características

- Contador en vivo con el nombre y la ubicación del próximo World Boss.
- Alarma configurable: 30, 15 o 5 minutos antes.
- Sonido personalizable: usa el sonido por defecto o elige tu propio archivo de audio.
- Panel flotante que se puede minimizar a un botón con el logo. Mantén presionado el botón para arrastrarlo.
- Los horarios se actualizan solos cada 5 minutos desde [Demonly](https://demonly.net).

## Instalación

1. Ve a la sección **Releases** del repositorio y descarga `world-boss-alarm-v1.1.3.zip`.
2. Descomprime el zip en una carpeta.
3. Abre `chrome://extensions` en Chrome (o cualquier navegador basado en Chromium).
4. Activa el **Modo desarrollador** (arriba a la derecha).
5. Pulsa **Cargar descomprimida** y selecciona la carpeta del paso 2.

> No borres la carpeta después de instalar: Chrome la lee desde ahí.

## Uso

1. Abre cualquier página web: aparece el botón con el logo arriba a la derecha.
2. Haz clic en él para abrir el panel con el próximo World Boss y su cuenta regresiva.
3. En **Alarma**, elige cuánto antes quieres el aviso.
4. (Opcional) En **Música**, selecciona un audio propio.
5. Minimiza el panel con el botón **−**; la alarma seguirá activa.

**Importante:** la alarma suena solo en las pestañas abiertas, y la música personalizada se pierde al recargar la página (se vuelve al sonido por defecto). Si el navegador bloquea el audio, interactúa una vez con la página.

## Permisos

| Permiso | Para qué se usa |
| --- | --- |
| `alarms` | Programar la actualización periódica y la alarma del boss |
| `storage` | Guardar el próximo boss entre suspensiones del navegador |
| `tabs` | Avisar a tus pestañas abiertas cuando suena la alarma |
| `https://demonly.net/*` | Consultar los horarios de los World Bosses |

La extensión no recopila ni envía datos personales.

## Desarrollo

Requiere Node.js 18 o superior.

```bash
npm install
npm run build   # genera la carpeta dist/
```

Carga la carpeta `dist/` como extensión descomprimida (pasos 3 a 5 de arriba). Para generar el zip de un release:

```bash
cd dist && zip -r ../world-boss-alarm.zip .
```

En Windows PowerShell: `Compress-Archive -Path dist\* -DestinationPath world-boss-alarm.zip -Force`.

## Créditos

Datos de horarios: [Demonly](https://demonly.net). Proyecto de fans, no afiliado a Blizzard Entertainment. Diablo es marca registrada de Blizzard Entertainment.
