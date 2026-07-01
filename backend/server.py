# server.py

import uvicorn
from app.config.settings import settings

if __name__ == "__main__":
    print(f"Starting development server for {settings.PROJECT_NAME}...")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
