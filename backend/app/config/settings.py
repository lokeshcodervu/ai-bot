from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import List, Optional
import os
import urllib.parse

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-BOT API"
    DEBUG: bool = True
    DB_HOST: Optional[str] = None
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    DB_NAME: Optional[str] = None
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    SECRET_KEY: str = "your-super-secret-key-for-jwt-token-generation-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Pinecone & OpenAI configuration
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_INDEX_NAME: str = "ai-bot-index"
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Twilio global credentials (system-level fallback if no per-tenant creds set)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # List of allowed origins for CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    


    @model_validator(mode="before")
    @classmethod
    def assemble_db_connection(cls, data: dict) -> dict:
        db_user = data.get("DB_USER")
        db_password = data.get("DB_PASSWORD")
        db_host = data.get("DB_HOST")
        db_name = data.get("DB_NAME")
        
        # If all DB variables are present, construct DATABASE_URL for PostgreSQL
        if db_user and db_password and db_host and db_name:
            encoded_password = urllib.parse.quote(str(db_password))
            data["DATABASE_URL"] = f"postgresql://{db_user}:{encoded_password}@{db_host}/{db_name}"
        return data

    model_config = SettingsConfigDict(
        # Look for the env file in the parent folder relative to this file
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
