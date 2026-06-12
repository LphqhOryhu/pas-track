# Sauvegarde la base Supabase dans un fichier SQL local (schéma + données),
# via pg_dump exécuté dans un conteneur Docker (aucune install requise).
#
# Usage :
#   $env:SUPABASE_DB_URL = "postgresql://postgres.xxxx:MOT_DE_PASSE@aws-0-...pooler.supabase.com:5432/postgres"
#   ./scripts/backup.ps1
#
# La connection string se trouve dans :
#   Supabase -> Project Settings -> Database -> Connection string
#   (prends "Session pooler" ou "Direct connection" — PAS "Transaction pooler" / port 6543)

if (-not $env:SUPABASE_DB_URL) {
  Write-Error "Definis d'abord : `$env:SUPABASE_DB_URL = 'postgresql://...'"
  exit 1
}

$stamp = Get-Date -Format "yyyyMMdd-HHmm"
$file = "pas_track-backup-$stamp.sql"

docker run --rm -v "${PWD}:/backup" postgres:17-alpine `
  pg_dump $env:SUPABASE_DB_URL --no-owner --no-privileges -f "/backup/$file"

if ($LASTEXITCODE -eq 0) {
  Write-Host "Backup cree : $file"
} else {
  Write-Error "Echec du backup (verifie la connection string et le port 5432)."
}
