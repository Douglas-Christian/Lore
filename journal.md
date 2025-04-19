# **Project Journal: AI-Powered Dungeon Master Assistant**

## **Plan Outline**

### **1. Backend API Development**
- [x] Set up FastAPI project structure
- [x] Define database schema for campaigns and narration logs
- [x] Implement API endpoints for:
  - [x] Campaign management (create, retrieve, update, delete)
  - [x] Narration logs (save, retrieve, update)
  - [x] Session management (start, end, retrieve metadata)
- [x] Test API endpoints with Postman or cURL

### **2. Database Schema Design**
- [x] Design PostgreSQL schema for:
  - [x] Campaigns
  - [x] Narration logs
  - [x] Sessions
- [x] Implement schema in PostgreSQL

### **3. Frontend Development**
- [ ] Set up React project structure
- [ ] Create UI components for:
  - [ ] Campaign management
  - [ ] Narration log approval and editing
  - [ ] Session management
- [ ] Integrate frontend with backend API

### **4. Integration and Testing**
- [x] Connect LLM (Ollama) with ChromaDB and PostgreSQL
- [x] Test RAG pipeline with sample source material
- [x] Ensure narration continuity with approved logs

### **5. Deployment**
- [ ] Containerize application with Docker
- [ ] Deploy to target platform (local server or cloud)

---

## **Progress Log**

### **April 19, 2025**
- Implemented narration context integration with the LLM query system.
- Enhanced the `query_llm` endpoint to include previous narration logs in the prompt context.
- Added ChromaDB indexing for narration logs to make them retrievable via semantic search.
- Created comprehensive test scripts for validating narration context continuity.
- Improved error handling in the `query_ollama` function with configurable timeouts and fallback responses.
- Set up automated test scripts to verify context enhancement in LLM responses.
- Fixed Git repository and branch structure for better version control.

#### Key Accomplishments:
- Created a robust context-enhanced LLM query system that incorporates previous narration history.
- Implemented a dual-storage approach for narration logs (PostgreSQL + ChromaDB) to enable both transactional storage and retrieval.
- Added automated testing to quantitatively measure context enhancement in LLM responses.
- Set up resilient error handling to gracefully manage LLM timeouts and connection issues.

#### Challenges Faced:
- LLM query timeouts required implementing fallback responses and better error handling.
- Needed to modify the narration log endpoint to ensure logs are properly indexed in ChromaDB.
- Addressed connection issues in the test scripts with retry logic.

#### Next Steps:
1. Begin frontend development for the DM interface.
2. Implement user authentication and campaign access controls.
3. Create a more sophisticated prompt engineering system to better leverage narration context.
4. Optimize ChromaDB retrieval for more relevant results.

---

### **April 15, 2025**
- Resolved issues with the `ModuleNotFoundError` by adding the `backend` directory to the Python module search path in `main.py`.
- Fixed the `ValueError` for `DB_PORT` by ensuring a default value and adding a debug statement in `database.py`.
- Successfully started the FastAPI application and verified the database connection.
- Decided to proceed with defining the database schema for campaigns and narration logs.
- Successfully ran the `init_db.py` script to initialize the database.
- Created and ran the `test_db.py` script to insert and query sample data in the database.
- Verified that the database schema and functionality are working as expected.

## Journal Entry - April 15, 2025

### Current Status

#### Progress
- Integrated the Ollama Llama model (`llama3.2`) with the FastAPI application.
- Updated the `query_ollama` function to use the `/api/chat` endpoint and include the `model` field in the payload.
- Added debugging to log the URL, payload, and any errors when querying the Ollama API.
- Verified that the Ollama API is reachable and responds to direct `curl` requests.

#### Issues Encountered
- The FastAPI endpoint initially failed to process JSON input due to missing `pydantic` model validation. This was resolved by introducing the `LLMQuery` model.
- The Ollama API returned an empty `content` field for the `llama3.2` model when tested with a basic prompt.

#### Next Steps
1. Investigate whether the Ollama API requires an API key for authentication.
2. Test the `/llm/query/` endpoint with more detailed prompts to ensure the model generates meaningful responses.
3. Update the `query_ollama` function to include an API key if required.
4. Document the integration process and any additional configuration steps in the `readme.md` file.

#### Notes
- The Ollama configuration file (`config.json`) indicates a `first-time-run` status. This might suggest additional setup steps are required.
- The current operating system is Windows, and the FastAPI application is running locally.

---

## April 15, 2025

Today, I successfully integrated the Ollama API with my FastAPI application. After debugging several issues, including endpoint mismatches and payload formatting, the `/llm/query/` endpoint is now fully functional. The API returned a detailed and coherent story about a brave knight, Sir Edward, which demonstrates the successful interaction with the LLM.

### Key Accomplishments:
- Updated the `query_ollama` function to use the `/api/chat` endpoint as per the Ollama API documentation.
- Processed streaming responses from the API to extract and combine meaningful content.
- Verified the functionality of the `/llm/query/` endpoint with a test script.

### Challenges Faced:
- Encountered `404 page not found` errors due to incorrect endpoint usage.
- Resolved connection issues and ensured the Ollama API server was running correctly.
- Adjusted the payload structure to align with the API requirements.

### Next Steps:
- Test the `/llm/query/` endpoint with additional prompts to ensure robustness.
- Explore ways to handle long responses, such as summarization or pagination.
- Document the integration process in the `readme.md` file for future reference.

### Summary
- Tested text extraction from "Storm Lords Wrath.pdf" and verified successful extraction of text.
- Ran retrieval tests using the query "Wayside Inn" and confirmed proper functionality.

### Suggestions for Tomorrow
1. Test narration context logging for inclusion in retrieval to ensure proper context is captured and retrievable.
2. Review and refine the retrieval pipeline for edge cases or potential improvements.
3. Explore additional queries or scenarios to validate robustness of the retrieval system.
4. Document findings and any adjustments made to the system.

---