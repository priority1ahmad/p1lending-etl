# Testing idiCORE API with curl

This guide shows how to test the idiCORE API authentication and search endpoints using curl.

## Prerequisites

You'll need:
- Your `IDICORE_CLIENT_ID` (e.g., `api-client@p1l`)
- Your `IDICORE_CLIENT_SECRET` (your secret key)
- `curl` installed on your system

## Step 1: Get Authentication Token

The idiCORE API uses Basic Authentication to get an access token.

### Basic curl command:

```bash
curl -X POST https://login-api.idicore.com/apiclient \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'YOUR_CLIENT_ID:YOUR_CLIENT_SECRET' | base64)" \
  -d '{"glba":"otheruse","dppa":"none"}'
```

### With actual credentials (replace with your values):

```bash
# Set your credentials as variables
CLIENT_ID="api-client@p1l"
CLIENT_SECRET="RGemru9Qkrh6zW4Z4rMNRidqRCPqyRCFsgEvirx88WkJPjvbXK"

# Get authentication token
curl -X POST https://login-api.idicore.com/apiclient \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${CLIENT_ID}:${CLIENT_SECRET}" | base64)" \
  -d '{"glba":"otheruse","dppa":"none"}'
```

### Expected Response:

If successful, you'll get a token string (looks like a long alphanumeric string):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If authentication fails, you'll get an error:
```
401 Unauthorized
```

### Verbose output (to see full request/response):

```bash
curl -v -X POST https://login-api.idicore.com/apiclient \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${CLIENT_ID}:${CLIENT_SECRET}" | base64)" \
  -d '{"glba":"otheruse","dppa":"none"}'
```

## Step 2: Test Search API (After Getting Token)

Once you have a token, you can test the search endpoint.

### Save token from Step 1:

```bash
# Get token and save it
TOKEN=$(curl -s -X POST https://login-api.idicore.com/apiclient \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${CLIENT_ID}:${CLIENT_SECRET}" | base64)" \
  -d '{"glba":"otheruse","dppa":"none"}')

echo "Token: $TOKEN"
```

### Search for a person:

```bash
# Test search with sample data
curl -X POST https://api.idicore.com/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "address": "123 Main St",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90210"
  }'
```

## Complete Test Script

Here's a complete bash script to test both endpoints:

```bash
#!/bin/bash

# Set your credentials
CLIENT_ID="api-client@p1l"
CLIENT_SECRET="RGemru9Qkrh6zW4Z4rMNRidqRCPqyRCFsgEvirx88WkJPjvbXK"

echo "=========================================="
echo "Testing idiCORE API Authentication"
echo "=========================================="
echo ""

# Step 1: Get authentication token
echo "Step 1: Getting authentication token..."
TOKEN=$(curl -s -X POST https://login-api.idicore.com/apiclient \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${CLIENT_ID}:${CLIENT_SECRET}" | base64)" \
  -d '{"glba":"otheruse","dppa":"none}')

# Check if token was received
if [ -z "$TOKEN" ] || [[ "$TOKEN" == *"error"* ]] || [[ "$TOKEN" == *"401"* ]]; then
    echo "❌ Authentication failed!"
    echo "Response: $TOKEN"
    exit 1
else
    echo "✅ Authentication successful!"
    echo "Token (first 50 chars): ${TOKEN:0:50}..."
    echo ""
fi

# Step 2: Test search endpoint
echo "Step 2: Testing search endpoint..."
SEARCH_RESULT=$(curl -s -X POST https://api.idicore.com/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "address": "123 Main St",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90210"
  }')

echo "Search result:"
echo "$SEARCH_RESULT" | jq '.' 2>/dev/null || echo "$SEARCH_RESULT"
echo ""

echo "=========================================="
echo "Test complete!"
echo "=========================================="
```

## Windows PowerShell Version

If you're on Windows, here's a PowerShell version:

```powershell
# Set your credentials
$CLIENT_ID = "api-client@p1l"
$CLIENT_SECRET = "RGemru9Qkrh6zW4Z4rMNRidqRCPqyRCFsgEvirx88WkJPjvbXK"

# Encode credentials
$credentials = "${CLIENT_ID}:${CLIENT_SECRET}"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($credentials)
$encoded = [System.Convert]::ToBase64String($bytes)

# Get authentication token
Write-Host "Getting authentication token..."
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Basic $encoded"
}
$body = '{"glba":"otheruse","dppa":"none"}'

$response = Invoke-RestMethod -Uri "https://login-api.idicore.com/apiclient" `
    -Method Post `
    -Headers $headers `
    -Body $body

Write-Host "Token received: $($response.Substring(0, [Math]::Min(50, $response.Length)))..."

# Test search (if you want)
$searchHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $response"
}
$searchBody = @{
    first_name = "John"
    last_name = "Doe"
    address = "123 Main St"
    city = "Los Angeles"
    state = "CA"
    zip = "90210"
} | ConvertTo-Json

$searchResult = Invoke-RestMethod -Uri "https://api.idicore.com/search" `
    -Method Post `
    -Headers $searchHeaders `
    -Body $searchBody

Write-Host "Search result:"
$searchResult | ConvertTo-Json -Depth 10
```

## Common Issues and Troubleshooting

### Issue 1: "401 Unauthorized"
- **Cause**: Invalid credentials
- **Solution**: Double-check your `CLIENT_ID` and `CLIENT_SECRET`

### Issue 2: "403 Forbidden" or IP not whitelisted
- **Cause**: Your IP address is not whitelisted in idiCORE
- **Solution**: Contact idiCORE support to whitelist your IP

### Issue 3: Base64 encoding issues
- **On Windows**: Use PowerShell's `[System.Convert]::ToBase64String()` instead of `base64`
- **On Linux/Mac**: Ensure `base64` command is available

### Issue 4: Token expires quickly
- **Note**: Tokens expire after 15 minutes
- **Solution**: Get a new token if you get 401 errors on search requests

## Testing from Your Application

You can also test using your application's test endpoint:

```bash
# First, get a JWT token from your app (if needed)
# Then test the idiCORE connection:

curl -X POST http://localhost:8000/api/v1/config/test/idicore \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Environment Variables

You can also use environment variables:

```bash
export IDICORE_CLIENT_ID="api-client@p1l"
export IDICORE_CLIENT_SECRET="your-secret-here"

# Then use in curl:
curl -X POST https://login-api.idicore.com/apiclient \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${IDICORE_CLIENT_ID}:${IDICORE_CLIENT_SECRET}" | base64)" \
  -d '{"glba":"otheruse","dppa":"none"}'
```

## Quick One-Liner Test

```bash
# Replace with your credentials
curl -X POST https://login-api.idicore.com/apiclient \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'api-client@p1l:RGemru9Qkrh6zW4Z4rMNRidqRCPqyRCFsgEvirx88WkJPjvbXK' | base64)" \
  -d '{"glba":"otheruse","dppa":"none"}' && echo ""
```

If you see a long token string, authentication is working! ✅

