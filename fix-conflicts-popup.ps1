# PowerShell script to fix conflicts popup issue in all timetable pages

# Get all page.tsx files in adjust-time-tables directories
$files = Get-ChildItem -Path "app\adjust-time-tables" -Filter "page.tsx" -Recurse

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)"
    
    # Read file content
    $content = Get-Content $file.FullName -Raw
    
    # Check if it already has onConflictsClear
    if ($content -notmatch "onConflictsClear") {
        # Find the PlansStatusCustom component and add onConflictsClear prop
        $pattern = '(\s+dragFailedSubjectId=\{dragFailedSubjectId\}[^\n]*\n\s+onDragFailedReset=\{[^}]+\}[^\n]*\n)'
        $replacement = '$1                    onConflictsClear={() => setConflicts([])} // เพิ่มฟังก์ชัน clear conflicts
'
        
        if ($content -match $pattern) {
            $newContent = $content -replace $pattern, $replacement
            Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
            Write-Host "✅ Updated: $($file.FullName)"
        } else {
            Write-Host "⚠️ Pattern not found in: $($file.FullName)"
        }
    } else {
        Write-Host "✅ Already updated: $($file.FullName)"
    }
}

Write-Host "Done!"
