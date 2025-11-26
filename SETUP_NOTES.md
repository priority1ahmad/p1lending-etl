# Setup Notes

## Important: Visual C++ Build Tools Required

Some Python packages require compilation and need Microsoft Visual C++ Build Tools:

- `asyncpg` - PostgreSQL async driver
- `snowflake-connector-python` - Snowflake connector

### To Install Visual C++ Build Tools:

1. Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Install "Desktop development with C++" workload
3. After installation, restart your terminal and run:
   ```bash
   cd backend
   .\venv\Scripts\activate
   pip install asyncpg snowflake-connector-python
   ```

### Alternative: Use Pre-built Wheels

If pre-built wheels are available for Python 3.14, you can try:
```bash
pip install asyncpg snowflake-connector-python --only-binary :all:
```

## Docker Desktop Required

Docker Desktop must be installed and running before starting the application.

1. Download from: https://www.docker.com/products/docker-desktop/
2. Install and start Docker Desktop
3. Verify installation: `docker --version`
4. Start services: `docker-compose up -d`

## Snowflake Private Key

The Snowflake private key should be located at:
- Windows: `C:\Users\<username>\.snowflake\rsa_key.p8`
- Or update `SNOWFLAKE_PRIVATE_KEY_PATH` in `.env` file

If you don't have the key, you'll need to generate it from your Snowflake account.


