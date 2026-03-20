[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$endpoints = @(
  @{ Method = "GET"; Url = "https://invoices-site.vercel.app/api/health" },
  @{ Method = "POST"; Url = "https://invoices-site.vercel.app/api/auth/login"; Body = '{"password":"PLACEHOLDER"}' }
)

foreach ($ep in $endpoints) {
  Write-Host "`n--- $($ep.Method) $($ep.Url) ---"
  try {
    $params = @{
      Uri     = $ep.Url
      Method  = $ep.Method
      UseBasicParsing = $true
      TimeoutSec = 15
    }
    if ($ep.Body) {
      $params.Body = $ep.Body
      $params.ContentType = "application/json"
    }
    $r = Invoke-WebRequest @params
    Write-Host "STATUS: $($r.StatusCode)"
    Write-Host "BODY:   $($r.Content)"
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $stream = $resp.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      Write-Host "STATUS: $([int]$resp.StatusCode)"
      Write-Host "BODY:   $($reader.ReadToEnd())"
    } else {
      Write-Host "CONNECTION ERROR: $($_.Exception.Message)"
    }
  }
}
