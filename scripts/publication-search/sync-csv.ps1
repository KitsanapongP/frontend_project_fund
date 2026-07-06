$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$LogFile = Join-Path $ProjectRoot "logs\sync-csv.log"

if (-not (Test-Path (Split-Path -Parent $LogFile))) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $LogFile) -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$timestamp] Starting CSV sync..." | Out-File -FilePath $LogFile -Append -Encoding utf8

try {
    $result = node $PSScriptRoot\sync-csv.js 2>&1
    $output = $result | Out-String
    "$output" | Out-File -FilePath $LogFile -Append -Encoding utf8
    Write-Host $output
} catch {
    $err = $_.Exception.Message
    "[$timestamp] ERROR: $err" | Out-File -FilePath $LogFile -Append -Encoding utf8
    Write-Host "ERROR: $err"
}
