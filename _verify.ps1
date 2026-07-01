Set-Location 'C:\FeloniousApps\1main\Fifth_felony'
Remove-Item -Force -ErrorAction SilentlyContinue package.json.bak, check_output.txt
npx tsc --noEmit
Write-Output ('TSC_EXIT:' + $LASTEXITCODE)
