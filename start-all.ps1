$base = "D:\currentaug032025\platform\programlending\services"

$services = @(
    @{ name = "Discovery Service";    jar = "discovery-service\target\discovery-service-1.0.0-SNAPSHOT.jar";       port = 8761 },
    @{ name = "API Gateway";          jar = "api-gateway\target\api-gateway-1.0.0-SNAPSHOT.jar";                   port = 8080 },
    @{ name = "IAM Service";          jar = "iam-service\target\iam-service-1.0.0-SNAPSHOT.jar";                   port = 8081 },
    @{ name = "Program Service";      jar = "program-service\target\program-service-1.0.0-SNAPSHOT.jar";           port = 8082 },
    @{ name = "Lending Service";      jar = "lending-service\target\lending-service-1.0.0-SNAPSHOT.jar";           port = 8083 },
    @{ name = "Integration Service";  jar = "integration-service\target\integration-service-1.0.0-SNAPSHOT.jar";   port = 8084 },
    @{ name = "Notification Service"; jar = "notification-service\target\notification-service-1.0.0-SNAPSHOT.jar"; port = 8085 },
    @{ name = "Report Service";       jar = "report-service\target\report-service-1.0.0-SNAPSHOT.jar";             port = 8086 }
)

$s = $services[0]
Write-Host "Starting $($s.name) on port $($s.port)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "java -jar `"$base\$($s.jar)`" --server.port=$($s.port)"

Write-Host "Waiting 20 seconds for Discovery Service to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

foreach ($s in $services[1..($services.Length - 1)]) {
    Write-Host "Starting $($s.name) on port $($s.port)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "java -jar `"$base\$($s.jar)`" --server.port=$($s.port)"
    Start-Sleep -Seconds 3
}

Write-Host "All services launched!" -ForegroundColor Green
Write-Host "Eureka Dashboard: http://localhost:8761" -ForegroundColor Green
