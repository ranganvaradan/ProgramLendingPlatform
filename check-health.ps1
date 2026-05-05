$services = @(
    @{ name = "Discovery Service";    port = 8761; url = "http://localhost:8761/actuator/health" },
    @{ name = "API Gateway";          port = 8080; url = "http://localhost:8080/actuator/health" },
    @{ name = "IAM Service";          port = 8081; url = "http://localhost:8081/actuator/health" },
    @{ name = "Program Service";      port = 8082; url = "http://localhost:8082/actuator/health" },
    @{ name = "Lending Service";      port = 8083; url = "http://localhost:8083/actuator/health" },
    @{ name = "Integration Service";  port = 8084; url = "http://localhost:8084/actuator/health" },
    @{ name = "Notification Service"; port = 8085; url = "http://localhost:8085/actuator/health" },
    @{ name = "Report Service";       port = 8086; url = "http://localhost:8086/actuator/health" }
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       SERVICE HEALTH CHECK             " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allUp = $true

foreach ($s in $services) {
    try {
        $response = Invoke-RestMethod -Uri $s.url -TimeoutSec 5
        if ($response.status -eq "UP") {
            Write-Host "  [UP]   $($s.name) (port $($s.port))" -ForegroundColor Green
        } else {
            Write-Host "  [??]   $($s.name) (port $($s.port)) — status: $($response.status)" -ForegroundColor Yellow
            $allUp = $false
        }
    } catch {
        Write-Host "  [DOWN] $($s.name) (port $($s.port)) — not reachable" -ForegroundColor Red
        $allUp = $false
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allUp) {
    Write-Host "  All services are UP and healthy!" -ForegroundColor Green
} else {
    Write-Host "  Some services are DOWN. Check their windows for errors." -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Eureka Dashboard: http://localhost:8761" -ForegroundColor Cyan
