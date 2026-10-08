# Xóa build artifacts và cache. Tất cả đều tự sinh lại khi chạy `pnpm build` / `pnpm dev`.
# Chạy từ thư mục gốc của repo:  .\clean.ps1

$paths = @(
    '.turbo',
    '.playwright-mcp',
    'node_modules',
    'apps\api\.turbo',
    'apps\api\.next',
    'apps\api\node_modules',
    'apps\api\dist',
    'apps\admin\.turbo',
    'apps\admin\.next',
    'apps\admin\test-results',
    'apps\admin\tsconfig.tsbuildinfo',
    'apps\admin\AGENTS.md',
    'apps\admin\CLAUDE.md',
    'apps\admin\node_modules',
    'apps\client\.turbo',
    'apps\client\.next',
    'apps\client\.next-e2e',
    'apps\client\test-results',
    'apps\client\tsconfig.tsbuildinfo',
    'apps\client\AGENTS.md',
    'apps\client\CLAUDE.md',
    'apps\client\node_modules',
    'packages\auth\.turbo',
    'packages\db\.turbo',
    'packages\ui\.turbo',
    'packages\config\.turbo',
    'docs\plans',
    'docs\prd'
)

foreach ($p in $paths) {
    if (Test-Path $p) {
        Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Removed:  $p"
    }
}

Write-Host ""
Write-Host "DONE. RUN 'pnpm build' to installing if needed."
