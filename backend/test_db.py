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

def test_database():
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

        # Insert a sample campaign
        cursor.execute(
            """
            INSERT INTO campaigns (name, description) 
            VALUES ('Test Campaign', 'This is a test campaign.') 
            RETURNING id;
            """
        )
        campaign_id = cursor.fetchone()[0]
        print(f"Inserted campaign with ID: {campaign_id}")

        # Insert a sample narration log
        cursor.execute(
            """
            INSERT INTO narration_logs (campaign_id, content) 
            VALUES (%s, 'This is a test narration.') 
            RETURNING id;
            """,
            (campaign_id,)
        )
        narration_id = cursor.fetchone()[0]
        print(f"Inserted narration log with ID: {narration_id}")

        # Insert a sample session
        cursor.execute(
            """
            INSERT INTO sessions (campaign_id, start_time) 
            VALUES (%s, CURRENT_TIMESTAMP) 
            RETURNING id;
            """,
            (campaign_id,)
        )
        session_id = cursor.fetchone()[0]
        print(f"Inserted session with ID: {session_id}")

        # Query the campaigns table
        cursor.execute("SELECT * FROM campaigns;")
        campaigns = cursor.fetchall()
        print("Campaigns:", campaigns)

        # Query the narration logs table
        cursor.execute("SELECT * FROM narration_logs;")
        narration_logs = cursor.fetchall()
        print("Narration Logs:", narration_logs)

        # Query the sessions table
        cursor.execute("SELECT * FROM sessions;")
        sessions = cursor.fetchall()
        print("Sessions:", sessions)

    except Exception as e:
        print(f"Error testing database: {e}")

    finally:
        if connection:
            cursor.close()
            connection.close()

if __name__ == "__main__":
    test_database()