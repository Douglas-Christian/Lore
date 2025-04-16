import requests
from pathlib import Path
import PyPDF2
import docx
import uuid
import chromadb
from chromadb.config import Settings
from backend.utils import debug_process_and_store_files

# Initialize ChromaDB client
chroma_client = chromadb.Client(Settings(persist_directory="chroma_data"))

def test_retrieve_endpoint():
    url = "http://127.0.0.1:8000/retrieve/"
    params = {"query": "leilon town council"}
    response = requests.get(url, params=params)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())

def debug_indexing():
    """
    Debug the indexing process by extracting and printing text from sourcebooks.
    """
    path = Path("e:/Lore/backend/sourcebooks")
    files = path.glob("*.*")

    for file in files:
        extracted_text = ""
        if file.suffix.lower() == ".pdf":
            with open(file, "rb") as pdf_file:
                reader = PyPDF2.PdfReader(pdf_file)
                for page in reader.pages:
                    extracted_text += page.extract_text()
        elif file.suffix.lower() == ".docx":
            doc = docx.Document(file)
            for paragraph in doc.paragraphs:
                extracted_text += paragraph.text + "\n"
        elif file.suffix.lower() == ".txt":
            with open(file, "r", encoding="utf-8") as txt_file:
                extracted_text = txt_file.read()

        print(f"Extracted text from {file.name}:")
        print(extracted_text[:500])  # Print the first 500 characters for inspection

def debug_chromadb_indexing():
    """
    Debug the ChromaDB indexing process by printing the documents, metadata, and IDs being added.
    """
    path = Path("e:/Lore/backend/sourcebooks")
    files = path.glob("*.*")

    # Initialize ChromaDB collection
    collection = chroma_client.get_or_create_collection(name="dnd_sourcebooks")

    for file in files:
        extracted_text = ""
        if file.suffix.lower() == ".pdf":
            with open(file, "rb") as pdf_file:
                reader = PyPDF2.PdfReader(pdf_file)
                for page in reader.pages:
                    extracted_text += page.extract_text()
        elif file.suffix.lower() == ".docx":
            doc = docx.Document(file)
            for paragraph in doc.paragraphs:
                extracted_text += paragraph.text + "\n"
        elif file.suffix.lower() == ".txt":
            with open(file, "r", encoding="utf-8") as txt_file:
                extracted_text = txt_file.read()

        document_id = str(uuid.uuid4())
        print(f"Indexing document: {file.name}")
        print(f"Document ID: {document_id}")
        print(f"Metadata: {{'filename': {file.name}}}")
        print(f"Text snippet: {extracted_text[:500]}")

        if extracted_text.strip():
            collection.add(documents=[extracted_text], metadatas=[{"filename": file.name}], ids=[document_id])

def verify_full_text_extraction():
    """
    Verify if the full text of each page in the PDF is being extracted.
    """
    path = Path("e:/Lore/backend/sourcebooks/Storm Lords Wrath.pdf")
    if not path.exists():
        print(f"File '{path}' does not exist.")
        return

    extracted_text = ""
    with open(path, "rb") as pdf_file:
        reader = PyPDF2.PdfReader(pdf_file)
        for page_number, page in enumerate(reader.pages):
            page_text = page.extract_text()
            print(f"Page {page_number + 1} Text:")
            print(page_text[:500])  # Print the first 500 characters of each page for inspection
            extracted_text += page_text

    print("Total Extracted Text:")
    print(extracted_text[:1000])  # Print the first 1000 characters of the full text for inspection

if __name__ == "__main__":
    verify_full_text_extraction()
    # Test the `/retrieve/` endpoint with the query "Growler"
    url = "http://127.0.0.1:8000/retrieve/"
    params = {"query": "Growler"}
    response = requests.get(url, params=params)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())