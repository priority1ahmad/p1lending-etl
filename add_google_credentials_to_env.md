# Add Google Credentials to .env File

## Quick Setup

Use the helper script to automatically add credentials to your `.env` file:

```bash
python backend/scripts/add_google_credentials_to_env.py [path_to_google_credentials.json]
```

The script will:
- Read your Google credentials JSON file
- Convert it to a single-line format
- Add it to your `.env` file as `GOOGLE_CREDENTIALS_JSON`

## Manual Setup

If you prefer to add credentials manually:

1. Convert your credentials file to a single-line JSON:
   ```bash
   python -c "import json; f = open('google_credentials.json', 'r', encoding='utf-8'); data = json.load(f); f.close(); print(json.dumps(data, separators=(',', ':')))"
   ```

2. Add the output to your `.env` file:
   ```bash
   GOOGLE_CREDENTIALS_JSON={paste_the_json_output_here}
   ```

## Steps:

1. **On your local machine (for development):**
   - Create `.env` file in the root directory: `cp env.example .env`
   - Open `.env` and find the line `GOOGLE_CREDENTIALS_JSON=`
   - Replace it with the line above

2. **On your production server (EC2):**
   ```bash
   cd ~/new_app
   nano .env
   # Find GOOGLE_CREDENTIALS_JSON= and paste the value above
   # Save and exit (Ctrl+X, Y, Enter)
   
   # Restart backend to load new credentials
   docker compose -f docker-compose.prod.yml restart backend celery-worker
   ```

## Important Notes:

- The JSON is on a single line (no line breaks)
- You can wrap it in single quotes if your shell requires it: `GOOGLE_CREDENTIALS_JSON='{...}'`
- Once this is set, the backend will use it and won't look for the file
- The credentials file is no longer needed once this is in .env

