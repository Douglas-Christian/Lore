# Initial FastAPI project structure

import sys
import os
import json
import logging
from typing import Optional
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("backend")

# Create the main application file
from fastapi import FastAPI, Depends, HTTPException, Request, File, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
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
import datetime

# Initialize ChromaDB client
chroma_client = chromadb.Client(Settings(persist_directory="chroma_data"))

app = FastAPI()

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, you can specify exact origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LLMQuery(BaseModel):
    prompt: str

# Middleware to log all requests and responses
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    
    # Log request body for non-GET requests
    if request.method != "GET":
        try:
            body = await request.body()
            if body:
                logger.info(f"Request body: {body.decode()}")
                
            # Log form data if present
            form_data = await request.form()
            if form_data:
                logger.info(f"Form data: {dict(form_data)}")
        except Exception as e:
            logger.error(f"Error logging request body: {e}")
    
    # Log query parameters
    query_params = dict(request.query_params)
    if query_params:
        logger.info(f"Query params: {query_params}")
    
    # Process the request
    response = await call_next(request)
    
    logger.info(f"Response status: {response.status_code}")
    return response

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """
    Custom exception handler to log validation errors.
    """
    logger.error(f"Validation error: {exc}")
    return JSONResponse(
        status_code=400,
        content={"error": str(exc)}
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to the Dungeon Master Assistant API!"}

@app.post("/campaigns/")
async def create_new_campaign(name: str, description: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    logger.info(f"Creating campaign: name='{name}', description='{description}'")
    campaign = await create_campaign(db, name, description)
    logger.info(f"Campaign created: {campaign}")
    return campaign

@app.get("/campaigns/")
async def list_campaigns(db: AsyncSession = Depends(get_db)):
    logger.info("Fetching all campaigns")
    campaigns = await get_campaigns(db)
    logger.info(f"Fetched {len(campaigns)} campaigns")
    return campaigns

@app.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"Fetching campaign with ID: {campaign_id}")
    campaign = await get_campaign_by_id(db, campaign_id)
    if not campaign:
        logger.error(f"Campaign with ID {campaign_id} not found")
        raise HTTPException(status_code=404, detail="Campaign not found")
    logger.info(f"Fetched campaign: {campaign}")
    return campaign

@app.post("/campaigns/{campaign_id}/narration_logs/")
async def add_narration_log(campaign_id: int, content: str, db: AsyncSession = Depends(get_db)):
    logger.info(f"Adding narration log to campaign ID: {campaign_id}")
    narration_log = await create_narration_log(db, campaign_id, content)
    
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
        logger.info(f"Added narration log to ChromaDB with ID: {document_id}")
    except Exception as e:
        logger.warning(f"Failed to add narration log to ChromaDB: {e}")
    
    return narration_log

@app.get("/campaigns/{campaign_id}/narration_logs/")
async def list_narration_logs(campaign_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"Fetching narration logs for campaign ID: {campaign_id}")
    narration_logs = await get_narration_logs(db, campaign_id)
    logger.info(f"Fetched {len(narration_logs)} narration logs")
    return narration_logs

@app.post("/campaigns/{campaign_id}/sessions/")
async def start_new_session(campaign_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"Starting new session for campaign ID: {campaign_id}")
    session = await create_session(db, campaign_id)
    logger.info(f"Session started: {session}")
    return session

@app.get("/campaigns/{campaign_id}/sessions/")
async def list_sessions(campaign_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"Fetching sessions for campaign ID: {campaign_id}")
    sessions = await get_sessions(db, campaign_id)
    logger.info(f"Fetched {len(sessions)} sessions")
    return sessions

@app.post("/llm/query/")
async def query_llm(query: LLMQuery, campaign_id: int = None, db: AsyncSession = Depends(get_db)):
    logger.info(f"Querying LLM with prompt: {query.prompt}, campaign_id: {campaign_id}")
    context = ""
    if campaign_id is not None:
        narration_logs = await get_narration_logs(db, campaign_id)
        narration_logs = sorted(narration_logs, key=lambda x: x.created_at, reverse=True)[:5]
        
        if narration_logs:
            context = "Previous narrations:\n"
            for log in reversed(narration_logs):
                context += f"- {log.content}\n"
            context += "\nBased on the above context, "
    
    enhanced_prompt = f"{context}{query.prompt}"
    logger.info(f"Enhanced prompt: {enhanced_prompt}")

    config_path = r"c:\Users\dougl\AppData\Local\Ollama\config.json"
    with open(config_path, "r") as config_file:
        config = json.load(config_file)
    api_key = config.get("id")

    query_payload = {"model": "llama3.2", "prompt": enhanced_prompt}
    logger.debug(f"Query payload: {query_payload}")

    response = query_ollama(enhanced_prompt, api_key=api_key)
    logger.debug(f"Response from Ollama API: {response}")

    if campaign_id is not None and 'response' in response:
        retrieve_results = retrieve_from_chromadb(query.prompt)
        if 'documents' in retrieve_results and retrieve_results['documents'][0]:
            response['context_note'] = "Response was enhanced with additional context from previous narrations and source materials."
    
    return response

@app.post("/upload/")
async def upload_sourcebook(file: UploadFile = File(...)):
    logger.info(f"Uploading file: {file.filename}")
    if not file.filename.endswith(('.pdf', '.txt', '.docx', '.doc')):
        logger.error("Unsupported file type")
        return {"error": "Unsupported file type. Please upload a PDF, Word document, or text file."}

    upload_dir = "sourcebooks"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    extracted_text = ""
    if file.filename.endswith('.pdf'):
        try:
            with open(file_path, "rb") as pdf_file:
                reader = PyPDF2.PdfReader(pdf_file)
                for page in reader.pages:
                    extracted_text += page.extract_text()
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return {"error": f"Error processing PDF file: {str(e)}"}
    elif file.filename.endswith('.txt'):
        try:
            with open(file_path, "r", encoding="utf-8") as txt_file:
                extracted_text = txt_file.read()
        except Exception as e:
            logger.error(f"Error reading text file: {e}")
            return {"error": f"Error reading text file: {str(e)}"}
    elif file.filename.endswith(('.docx', '.doc')):
        try:
            # For Word documents, you'll need python-docx library
            # This is a placeholder - you'd need to install python-docx
            # pip install python-docx
            import docx
            doc = docx.Document(file_path)
            extracted_text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        except ImportError:
            logger.error("python-docx library not installed")
            return {"error": "Word document processing not available. Please install python-docx library."}
        except Exception as e:
            logger.error(f"Error extracting text from Word document: {e}")
            return {"error": f"Error processing Word document: {str(e)}"}

    try:
        collection = chroma_client.get_or_create_collection(name="dnd_sourcebooks")
        document_id = file.filename
        metadata = {
            "filename": file.filename,
            "size": os.path.getsize(file_path),
            "created_at": str(datetime.datetime.now()),
            "processed": True
        }
        collection.add(documents=[extracted_text], metadatas=[metadata], ids=[document_id])
        logger.info(f"File {file.filename} uploaded and processed successfully")
    except Exception as e:
        logger.error(f"Error adding document to ChromaDB: {e}")
        return {"error": f"Error indexing document: {str(e)}"}

    return {
        "filename": file.filename,
        "size": os.path.getsize(file_path),
        "created_at": str(datetime.datetime.now()),
        "processed": True
    }

@app.get("/sourcebooks/")
async def list_sourcebooks():
    logger.info("Listing all sourcebooks")
    sourcebooks_dir = "sourcebooks"
    
    try:
        if not os.path.exists(sourcebooks_dir):
            os.makedirs(sourcebooks_dir, exist_ok=True)
            return []
        
        result = []
        
        # Get files in the directory
        for filename in os.listdir(sourcebooks_dir):
            filepath = os.path.join(sourcebooks_dir, filename)
            if os.path.isfile(filepath):
                # Try to get metadata from ChromaDB
                try:
                    collection = chroma_client.get_or_create_collection(name="dnd_sourcebooks")
                    metadata = collection.get(ids=[filename], include=["metadatas"])
                    if metadata and metadata["metadatas"] and metadata["metadatas"][0]:
                        result.append(metadata["metadatas"][0])
                    else:
                        # If not in ChromaDB, create basic metadata
                        result.append({
                            "filename": filename,
                            "size": os.path.getsize(filepath),
                            "created_at": str(datetime.datetime.fromtimestamp(os.path.getctime(filepath))),
                            "processed": False
                        })
                except Exception as e:
                    logger.error(f"Error getting metadata from ChromaDB: {e}")
                    # Fall back to basic file info
                    result.append({
                        "filename": filename,
                        "size": os.path.getsize(filepath),
                        "created_at": str(datetime.datetime.fromtimestamp(os.path.getctime(filepath))),
                        "processed": False
                    })
        
        logger.info(f"Found {len(result)} sourcebooks")
        return result
    except Exception as e:
        logger.error(f"Error listing sourcebooks: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing sourcebooks: {str(e)}")

@app.delete("/sourcebooks/{filename}")
async def delete_sourcebook(filename: str):
    logger.info(f"Deleting sourcebook: {filename}")
    sourcebooks_dir = "sourcebooks"
    
    # URL decode the filename
    from urllib.parse import unquote
    filename = unquote(filename)
    
    # Validate filename to prevent path traversal
    if os.path.sep in filename or filename.startswith("."):
        logger.error(f"Invalid filename: {filename}")
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    file_path = os.path.join(sourcebooks_dir, filename)
    
    if not os.path.exists(file_path):
        logger.error(f"Sourcebook not found: {filename}")
        raise HTTPException(status_code=404, detail="Sourcebook not found")
    
    try:
        # Remove from filesystem
        os.remove(file_path)
        
        # Remove from ChromaDB
        try:
            collection = chroma_client.get_or_create_collection(name="dnd_sourcebooks")
            collection.delete(ids=[filename])
            logger.info(f"Deleted sourcebook from ChromaDB: {filename}")
        except Exception as e:
            logger.error(f"Error deleting from ChromaDB: {e}")
        
        logger.info(f"Deleted sourcebook: {filename}")
        return {"message": f"Sourcebook {filename} deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting sourcebook: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting sourcebook: {str(e)}")

# Rename the existing endpoint for clarity
@app.post("/sourcebooks/upload/")
async def upload_sourcebook_new(file: UploadFile = File(...)):
    return await upload_sourcebook(file)

@app.get("/retrieve/")
def retrieve_content(query: str):
    logger.info(f"Retrieving content for query: {query}")
    results = retrieve_from_chromadb(query)
    logger.info(f"Retrieved {len(results.get('documents', []))} documents")
    return {"query": query, "results": results}