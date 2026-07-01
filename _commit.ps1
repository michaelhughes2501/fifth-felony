Set-Location 'C:\FeloniousApps\1main\Fifth_felony'
git add next.config.mjs package.json package-lock.json tsconfig.tsbuildinfo scripts/patch-postcss.mjs
git commit -m "chore(deps): bump supabase-js, openai, tailwindcss, postcss & related patch versions; add turbopack root config + postcss patch script"
git push origin master
Write-Output ('PUSH_EXIT:' + $LASTEXITCODE)
git log -1 --oneline
