from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Explicitly load the .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Debug: Print loaded environment variables
print(f"DB_USER: {os.getenv('DB_USER')}, DB_PASSWORD: {os.getenv('DB_PASSWORD')}")
print(f"Loaded DB_PORT: {os.getenv('DB_PORT')}")

# Database connection URL
DATABASE_URL = f"postgresql+asyncpg://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME')}"

# Create the database engine
engine = create_async_engine(DATABASE_URL, echo=True)

# Create a sessionmaker for database sessions
async_session_maker = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Dependency to get the database session
async def get_db():
    async with async_session_maker() as session:
        yield session