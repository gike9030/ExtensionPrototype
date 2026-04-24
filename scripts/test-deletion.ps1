# Test script for deletion detection

$testCode = @"
import React, { useState } from 'react'

export function App() {
  const handleSubmit = (e) => {
    console.log('submitting old code')
    doSomething()
    updateUI()
  }

  const handleCancel = () => {
    console.log('cancelled')
  }

  return <button onClick={handleSubmit}>Submit</button>
}
"@

$body = @{
    message = "please rewrite the handleSubmit function to add error handling"
    activeFile = @{
        fileName = "App.tsx"
        filePath = "src/App.tsx"  
        content = $testCode
    }
} | ConvertTo-Json

Write-Host "Sending test request to API..."
Write-Host "Message: 'please rewrite the handleSubmit function to add error handling'"
Write-Host ""
Write-Host "File content:"
Write-Host $testCode
Write-Host ""
Write-Host "---"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5587/chat" `
      -Method POST `
      -Headers @{ "Content-Type" = "application/json" } `
      -Body $body `
      -UseBasicParsing `
      -TimeoutSec 30
    
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "API Response:"
    Write-Host "Reply: $($data.reply.Substring(0, [Math]::Min(100, $data.reply.Length)))..."
    Write-Host ""
    Write-Host "DeletionInfo:"
    if ($data.deletionInfo) {
        Write-Host "  StartLine: $($data.deletionInfo.startLine)"
        Write-Host "  EndLine: $($data.deletionInfo.endLine)"
        Write-Host "  InsertLine: $($data.deletionInfo.insertLine)"
    } else {
        Write-Host "  (null - no deletion detected)"
    }
}
catch {
    Write-Host "Error: $_"
}
