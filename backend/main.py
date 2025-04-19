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
import uuid

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
    # Create the narration log in the database
    narration_log = await create_narration_log(db, campaign_id, content)
    
    # Also add the narration log to ChromaDB for retrieval
    try:
        collection = chroma_client.get_or_create_collection(name="dnd_sourcebooks")
        document_id = str(uuid.uuid4())
        metadata = {
            "type": "narration_log",
            "campaign_id": str(campaign_id),
            "narration_id": str(narration_log.id),
            "created_at": str(narration_log.created_at)
        }
        collection.add(documents=[content], metadatas=[metadata], ids=[document_id])
        print(f"Added narration log to ChromaDB with ID: {document_id}")
    except Exception as e:
        # Log the error but don't fail the request
        print(f"Warning: Failed to add narration log to ChromaDB: {e}")
        # The narration is still saved in the database, so we can continue
    
    return narration_log

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
async def query_llm(query: LLMQuery, campaign_id: int = None, db: AsyncSession = Depends(get_db)):
    """
    Endpoint to query the Ollama Llama API with context from previous narrations.

    Args:
        query (LLMQuery): The input query containing the prompt for the LLM.
        campaign_id (int, optional): The ID of the campaign to retrieve context from. Defaults to None.

    Returns:
        dict: The response from the LLM API.
    """
    # Debugging: Log the parsed query
    print(f"Parsed query: {query}")
    
    # Build context from previous narrations if campaign_id is provided
    context = ""
    if campaign_id is not None:
        # Get the most recent narration logs (limited to 5 to prevent context overflow)
        narration_logs = await get_narration_logs(db, campaign_id)
        narration_logs = sorted(narration_logs, key=lambda x: x.created_at, reverse=True)[:5]
        
        if narration_logs:
            context = "Previous narrations:\n"
            # Add the narrations in chronological order (oldest first)
            for log in reversed(narration_logs):
                context += f"- {log.content}\n"
            context += "\nBased on the above context, "
    
    # Prepare the enhanced prompt with context
    enhanced_prompt = f"{context}{query.prompt}"
    print(f"Enhanced prompt with context: {enhanced_prompt}")

    # Load the API key from the Ollama config.json file
    import json
    config_path = r"c:\Users\dougl\AppData\Local\Ollama\config.json"
    with open(config_path, "r") as config_file:
        config = json.load(config_file)
    api_key = config.get("id")  # Use the `id` field as the API key

    # Prepare the query payload
    query_payload = {"model": "llama3.2", "prompt": enhanced_prompt}
    print(f"Query payload: {query_payload}")  # Debugging: Log the query payload

    # Send the query to the Ollama API
    response = query_ollama(enhanced_prompt, api_key=api_key)

    # Debugging: Log the full response
    print(f"Full response from Ollama API: {response}")

    # If campaign_id was provided, also retrieve similar content from ChromaDB
    if campaign_id is not None and 'response' in response:
        # Get relevant content from ChromaDB
        retrieve_results = retrieve_from_chromadb(query.prompt)
        
        # Add a note about additional context used (if any)
        if 'documents' in retrieve_results and retrieve_results['documents'][0]:
            response['context_note'] = "Response was enhanced with additional context from previous narrations and source materials."
    
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