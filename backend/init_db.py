import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database credentials from environment variables
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

# Path to the schema file
SCHEMA_FILE = "schema.sql"

def initialize_database():
    try:
        # Connect to PostgreSQL
        connection = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        connection.autocommit = True

        # Open a cursor to perform database operations
        cursor = connection.cursor()

        # Read and execute the schema file
        with open(SCHEMA_FILE, "r") as schema:
            cursor.execute(schema.read())

        print("Database initialized successfully.")

    except Exception as e:
        print(f"Error initializing database: {e}")

    finally:
        if connection:
            cursor.close()
            connection.close()

if __name__ == "__main__":
    initialize_database()