# READ-ONLY probe of the 4070 tower for the Learn image service.
# Reports; changes nothing. Run as creed over OpenSSH (DR-0579).
$ErrorActionPreference = 'Continue'
function Say($k, $v) { Write-Output ("{0}: {1}" -f $k, $v) }
Say 'local_time' (Get-Date -Format 'yyyy-MM-dd HH:mm dddd')
Say 'os' ((Get-CimInstance Win32_OperatingSystem).Caption)
$cs = Get-CimInstance Win32_ComputerSystem
Say 'ram_total_gb' ([math]::Round($cs.TotalPhysicalMemory / 1GB, 1))
Say 'ram_free_gb' ([math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1MB, 1))
Write-Output '== gpu =='
nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,driver_version,utilization.gpu,power.limit --format=csv
Write-Output '== gpu processes =='
nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv
Write-Output '== disks =='
Get-PSDrive -PSProvider FileSystem | ForEach-Object { Say $_.Name ("free {0} GB of {1} GB" -f [math]::Round($_.Free / 1GB, 1), [math]::Round(($_.Used + $_.Free) / 1GB, 1)) }
Write-Output '== docker =='
docker version --format '{{.Server.Version}}' 2>$null
docker ps --format '{{.Names}} | {{.Image}} | {{.Status}}' 2>$null
docker images --format '{{.Repository}}:{{.Tag}} {{.Size}}' 2>$null | Select-String -Pattern 'comfy|ollama|xtts|whisper|cuda' 
Write-Output '== comfyui on disk =='
$paths = @('C:\ComfyUI', 'C:\ComfyUI_windows_portable', "$env:USERPROFILE\ComfyUI", "$env:USERPROFILE\Documents\ComfyUI", 'C:\poetech\gpu-node\data\comfyui', 'D:\ComfyUI', 'D:\ComfyUI_windows_portable')
foreach ($p in $paths) { if (Test-Path $p) { Say 'found' $p; Get-ChildItem -Path (Join-Path $p 'models') -Recurse -Include *.safetensors, *.gguf -ErrorAction SilentlyContinue | Select-Object -First 20 | ForEach-Object { Say '  model' ("{0} ({1} GB)" -f $_.FullName, [math]::Round($_.Length / 1GB, 2)) } } }
Write-Output '== listening ports of interest =='
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 8188, 11434, 8770, 8771, 18789 } | ForEach-Object { Say ('port ' + $_.LocalPort) ((Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName) }
Write-Output '== python =='
python --version 2>$null
Write-Output 'probe: done'
