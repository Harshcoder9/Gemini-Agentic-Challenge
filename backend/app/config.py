from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Google Gemini
    gemini_api_key: str = ""
    agent_app_name: str = "finagent"
    agent_model: str = "gemini-2.5-flash-lite"

    # NewsAPI
    news_api_key: str = ""

    # Firebase Admin (path to service-account JSON file)
    firebase_service_account: str = ""

    # CORS – comma-separated list of allowed origins
    allowed_origins: str = "*"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
