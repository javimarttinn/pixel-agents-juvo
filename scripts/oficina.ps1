<#
.SYNOPSIS
  Arranca la oficina de Pixel Agents (modo navegador) en Windows.

.DESCRIPTION
  Compila el proyecto si hace falta y levanta el servidor en el puerto fijo
  3100, para que los marcadores y el acceso directo del móvil sigan
  funcionando entre reinicios.

  Con -Movil publica la oficina en tu tailnet con Tailscale Serve (HTTPS, solo
  tus dispositivos) y muestra un QR para abrirla en el teléfono.

.EXAMPLE
  .\scripts\oficina.ps1
  .\scripts\oficina.ps1 -Movil
  .\scripts\oficina.ps1 -Movil -Puerto 3200
#>
param(
  [switch]$Movil,
  [int]$Puerto = 3100,
  [switch]$SinTerminal
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

if (-not (Test-Path (Join-Path $raiz 'dist\cli.js'))) {
  Write-Host 'Primera vez: instalando dependencias y compilando...' -ForegroundColor Cyan
  npm install
  if ($LASTEXITCODE -ne 0) { throw 'npm install ha fallado' }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'npm run build ha fallado' }
}

$argumentos = @('dist\cli.js', '--port', "$Puerto")
if ($SinTerminal) { $argumentos += '--no-terminal' }

if ($Movil) {
  $tailscale = Get-Command tailscale -ErrorAction SilentlyContinue
  if (-not $tailscale) {
    throw 'No encuentro Tailscale. Instálalo desde https://tailscale.com/download e inicia sesión en el PC y en el móvil.'
  }
  $estado = tailscale status --json | ConvertFrom-Json
  $nombre = "$($estado.Self.DNSName)".TrimEnd('.')
  if (-not $nombre) { throw 'Tailscale no devuelve el nombre de este equipo. ¿Has iniciado sesión?' }

  Write-Host "Publicando la oficina en https://$nombre (solo tu tailnet)..." -ForegroundColor Cyan
  tailscale serve --bg $Puerto | Out-Null
  $argumentos += @('--allowed-host', $nombre, '--qr')
}

Write-Host 'Abriendo la oficina. Ctrl+C para cerrarla.' -ForegroundColor Green
node @argumentos
