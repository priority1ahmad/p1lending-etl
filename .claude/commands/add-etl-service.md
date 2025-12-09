# Add New ETL Service

Create a new external service integration for the ETL pipeline.

## Service Description
$ARGUMENTS

## Instructions

### 1. Create Service File

Create new file in `backend/app/services/etl/`:

```python
"""
{ServiceName} API Service for ETL pipeline
"""

import requests
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.logger import etl_logger


class {ServiceName}Service:
    """Service for {purpose}"""

    def __init__(self):
        self.base_url = settings.{service}_api.base_url
        self.api_key = settings.{service}_api.api_key
        self.logger = etl_logger.logger.getChild("{ServiceName}")
        self.session = requests.Session()

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Make authenticated API request"""
        try:
            url = f"{self.base_url}/{endpoint}"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                timeout=30
            )

            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            self.logger.error(f"API request failed: {e}")
            return None

    def process_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single record through the service"""
        # Implement service-specific logic
        pass

    def process_batch(
        self,
        records: List[Dict[str, Any]],
        batch_size: int = 100
    ) -> List[Dict[str, Any]]:
        """Process multiple records in batches"""
        results = []

        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            self.logger.info(f"Processing batch {i//batch_size + 1}")

            for record in batch:
                result = self.process_record(record)
                if result:
                    results.append(result)

        return results
```

### 2. Add Configuration

Update `backend/app/core/config.py`:

```python
class {ServiceName}Config(BaseSettings):
    """{ServiceName} API configuration"""
    api_key: str = Field(default="", alias="{SERVICE}_API_KEY")
    base_url: str = Field(default="https://api.service.com/v1", alias="{SERVICE}_BASE_URL")
    rate_limit_delay: float = Field(default=0.5)
    timeout: int = Field(default=30)

    model_config = SettingsConfigDict(env_prefix="{SERVICE}_", case_sensitive=False, extra="ignore")
```

Add to `Settings` class:
```python
class Settings(BaseSettings):
    # ... existing fields ...
    {service}_api: {ServiceName}Config = Field(default_factory={ServiceName}Config)
```

### 3. Update env.example

Add to `env.example`:
```
# ===========================================
# {SERVICE_NAME} API
# ===========================================
{SERVICE}_API_KEY=your_api_key_here
{SERVICE}_BASE_URL=https://api.service.com/v1
```

### 4. Integrate into ETL Engine

Update `backend/app/services/etl/engine.py`:

```python
from app.services.etl.{service}_service import {ServiceName}Service

class ETLEngine:
    def __init__(self, ...):
        # ... existing services ...
        self.{service}_service = {ServiceName}Service()

    def _execute_single_script(self, ...):
        # Add service call at appropriate stage
        # After idiCORE, before/after DNC check, etc.
        pass
```

### 5. Add Error Handling

Use the project's logging pattern:
```python
from app.core.logger import etl_logger

self.logger = etl_logger.logger.getChild("{ServiceName}")
self.logger.info("Processing started")
self.logger.warning("Rate limit approaching")
self.logger.error(f"API error: {e}")
```

### 6. Create Test Script

Create `backend/scripts/test_{service}.py`:

```python
"""
Test script for {ServiceName} API integration
"""
import sys
sys.path.insert(0, '/app')

from app.services.etl.{service}_service import {ServiceName}Service

def test_service():
    service = {ServiceName}Service()

    # Test with sample data
    test_record = {
        "field1": "value1",
        "field2": "value2"
    }

    result = service.process_record(test_record)
    print(f"Result: {result}")

    if result:
        print("✅ Service test passed")
    else:
        print("❌ Service test failed")

if __name__ == "__main__":
    test_service()
```

## Patterns from Existing Services

Reference these for implementation patterns:
- `idicore_service.py` - Token-based auth, batch processing with threading
- `ccc_service.py` - API key auth, multi-threaded batch processing
- `dnc_service.py` - Local SQLite database integration
- `cache_service.py` - Snowflake caching patterns

## Output

1. Create the service file in `services/etl/`
2. Update `config.py` with configuration class
3. Update `env.example` with new variables
4. Create test script
5. Provide integration points in `engine.py`
