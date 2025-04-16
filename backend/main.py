# Initial FastAPI project structure

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Create the main application file
from fastapi import FastAPI, Depends, HTTPException, Request, File, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from utils import (
    create_campaign, get_campaigns, get_campaign_by_id,
    create_narration_log, get_narration_logs,
    create_session, get_sessions, query_ollama, retrieve_from_chromadb
)
from pydantic import BaseModel
import PyPDF2
import chromadb
from chromadb.config import Settings

# Initialize ChromaDB client
chroma_client = chromadb.Client(Settings(persist_directory="chroma_data"))

app = FastAPI()

class LLMQuery(BaseModel):
    prompt: str

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """
    Custom exception handler to log validation errors.
    """
    print(f"Validation error: {exc}")  # Debugging: Log the validation error
    return JSONResponse(
        status_code=400,
        content={"error": str(exc)}
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to the Dungeon Master Assistant API!"}

@app.post("/campaigns/")
async def create_new_campaign(name: str, description: str = None, db: AsyncSession = Depends(get_db)):
    return await create_campaign(db, name, description)

@app.get("/campaigns/")
async def list_campaigns(db: AsyncSession = Depends(get_db)):
    return await get_campaigns(db)

@app.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: int, db: AsyncSession = Depends(get_db)):
    campaign = await get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@app.post("/campaigns/{campaign_id}/narration_logs/")
async def add_narration_log(campaign_id: int, content: str, db: AsyncSession = Depends(get_db)):
    return await create_narration_log(db, campaign_id, content)

@app.get("/campaigns/{campaign_id}/narration_logs/")
async def list_narration_logs(campaign_id: int, db: AsyncSession = Depends(get_db)):
    return await get_narration_logs(db, campaign_id)

@app.post("/campaigns/{campaign_id}/sessions/")
async def start_new_session(campaign_id: int, db: AsyncSession = Depends(get_db)):
    return await create_session(db, campaign_id)

@app.get("/campaigns/{campaign_id}/sessions/")
async def list_sessions(campaign_id: int, db: AsyncSession = Depends(get_db)):
    return await get_sessions(db, campaign_id)

@app.post("/llm/query/")
async def query_llm(query: LLMQuery):
    """
    Endpoint to query the Ollama Llama API.

    Args:
        query (LLMQuery): The input query containing the prompt for the LLM.

    Returns:
        dict: The response from the LLM API.
    """
    # Debugging: Log the parsed query
    print(f"Parsed query: {query}")

    # Load the API key from the Ollama config.json file
    import json
    config_path = r"c:\Users\dougl\AppData\Local\Ollama\config.json"
    with open(config_path, "r") as config_file:
        config = json.load(config_file)
    api_key = config.get("id")  # Use the `id` field as the API key

    # Prepare the query payload
    query_payload = {"model": "llama3.2", "prompt": query.prompt}
    print(f"Query payload: {query_payload}")  # Debugging: Log the query payload

    # Send the query to the Ollama API
    response = query_ollama(query.prompt, api_key=api_key)

    # Debugging: Log the full response
    print(f"Full response from Ollama API: {response}")

    return response

@app.post("/upload/")
async def upload_sourcebook(file: UploadFile = File(...)):
    """
    Endpoint to upload D&D sourcebooks for retrieval.

    Args:
        file (UploadFile): The uploaded file (PDF or text).

    Returns:
        dict: A message indicating success or failure.
    """
    # Validate file type
    if not file.filename.endswith(('.pdf', '.txt')):
        return {"error": "Unsupported file type. Please upload a PDF or text file."}

    # Save the uploaded file
    upload_dir = "uploaded_files"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text from the file
    extracted_text = ""
    if file.filename.endswith('.pdf'):
        with open(file_path, "rb") as pdf_file:
            reader = PyPDF2.PdfReader(pdf_file)
            for page in reader.pages:
                extracted_text += page.extract_text()
    elif file.filename.endswith('.txt'):
        with open(file_path, "r", encoding="utf-8") as txt_file:
            extracted_text = txt_file.read()

    # Store extracted_text in ChromaDB
    collection = chroma_client.get_or_create_collection(name="dnd_sourcebooks")
    collection.add(documents=[extracted_text], metadatas=[{"filename": file.filename}])

    return {"message": "File uploaded and processed successfully."}

@app.get("/retrieve/")
def retrieve_content(query: str):
    """
    Endpoint to retrieve content from ChromaDB based on a query.

    Args:
        query (str): The search query.

    Returns:
        dict: Retrieved documents and their metadata.
    """
    results = retrieve_from_chromadb(query)
    return {"query": query, "results": results}