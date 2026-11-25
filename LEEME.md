# Pixel Agents · fork de Javi

Fork de [pixel-agents-hq/pixel-agents](https://github.com/pixel-agents-hq/pixel-agents) (v1.6.0, MIT) adaptado para trabajar con Claude Code en español, ver qué skills y qué roles usa cada agente, subir de nivel y supervisar la oficina desde el móvil.

## Qué cambia respecto al original

| Cambio                    | Qué verás                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Skills visibles**       | Cuando un agente carga una skill aparece una insignia morada con su nombre y su nivel (`✦ spec-mvp · Nv 2`) sobre el personaje. Se mantiene hasta que termina el turno.                                                                                                                                                                                                                  |
| **Personajes por rol**    | El reparto por defecto se llama Planner, Implementer, Reviewer, Tester, Explorer y General. Un subagente cuyo tipo coincide con el nombre de un personaje se viste como él (`reviewer` → Reviewer). Los tipos integrados también encajan: `Plan` → Planner, `Explore` → Explorer, `general-purpose` → General. Si creas un personaje llamado como otro de tus agentes, también funciona. |
| **Niveles y XP**          | Cada herramienta da 1 XP a quien la usa (el agente principal o el rol del subagente), cada subagente lanzado da 5 XP a su rol y cada skill cargada suma 10 XP a esa skill. El botón **Niveles** (y el menú en el móvil) enseña el progreso. Se guarda en `~/.pixel-agents/xp.json`.                                                                                                      |
| **Interfaz en español**   | Estados (`Leyendo…`, `Ejecutando: …`, `Necesita aprobación`), menús, ajustes, editor de oficina y de personajes, avisos y el texto de consentimiento de los hooks.                                                                                                                                                                                                                       |
| **Móvil**                 | `--qr` imprime un QR para abrir la oficina en el teléfono y `scripts/oficina.ps1 -Movil` lo deja todo listo con Tailscale.                                                                                                                                                                                                                                                               |
| **Plantillas de agentes** | `plantillas/agents/` trae `planner`, `implementer`, `reviewer` y `tester`, con nombres que encajan con el reparto.                                                                                                                                                                                                                                                                       |

## Arrancar en Windows 11

Requisitos: Node.js 20 o superior, Git y Claude Code instalados.

```powershell
git clone https://github.com/javimarttinn/pixel-agents.git
cd pixel-agents
.\scripts\oficina.ps1
```

La primera vez instala dependencias y compila. Después abre la URL que imprime (lleva `?token=`). En el primer arranque la oficina te pide permiso para instalar los hooks de Claude Code; acéptalo para que la detección sea instantánea.

> Si PowerShell bloquea el script: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

### Desde el móvil

1. Instala [Tailscale](https://tailscale.com/download) en el PC y en el móvil, con la misma cuenta.
2. Arranca con `.\scripts\oficina.ps1 -Movil`. El script publica la oficina en tu tailnet por HTTPS con `tailscale serve` y muestra un QR.
3. Escanéalo con el móvil y añádela a la pantalla de inicio. Como el puerto es fijo (3100), el acceso directo sigue funcionando entre reinicios.

Trata el QR y la URL con token como una contraseña: dan control total de la oficina, incluido lanzar agentes.

## Plantillas de agentes

Copia las que quieras a tu carpeta de agentes de usuario:

```powershell
Copy-Item .\plantillas\agents\*.md $HOME\.claude\agents\
```

O a `.claude/agents/` dentro de un proyecto si solo las quieres ahí. `planner` y `reviewer` usan Opus y son de solo lectura; `implementer` y `tester` usan Sonnet para abaratar la ejecución.

## Desarrollo

```powershell
npm install
npm run build        # tipos, lint, extensión, CLI y webview
npm test             # tests unitarios (webview + server)
node dist/cli.js --port 3100
```

Los commits pasan por un hook de husky que exige [gitleaks](https://github.com/gitleaks/gitleaks) (`scoop install gitleaks`).

Notas:

- Los tests e2e de Playwright del original buscan textos en inglés; con la interfaz traducida, muchos selectores tendrán que actualizarse antes de usarlos.
- Para traer cambios del original: `git remote add upstream https://github.com/pixel-agents-hq/pixel-agents.git` y `git fetch upstream`. Las traducciones tocan muchos archivos, así que espera conflictos en textos de interfaz.
