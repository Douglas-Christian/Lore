# **Project Journal: AI-Powered Dungeon Master Assistant**

## **Plan Outline**

### **1. Backend API Development**
- [ ] Set up FastAPI project structure
- [ ] Define database schema for campaigns and narration logs
- [ ] Implement API endpoints for:
  - [ ] Campaign management (create, retrieve, update, delete)
  - [ ] Narration logs (save, retrieve, update)
  - [ ] Session management (start, end, retrieve metadata)
- [ ] Test API endpoints with Postman or cURL

### **2. Database Schema Design**
- [ ] Design PostgreSQL schema for:
  - [ ] Campaigns
  - [ ] Narration logs
  - [ ] Sessions
- [ ] Implement schema in PostgreSQL

### **3. Frontend Development**
- [ ] Set up React project structure
- [ ] Create UI components for:
  - [ ] Campaign management
  - [ ] Narration log approval and editing
  - [ ] Session management
- [ ] Implement state management (e.g., Redux or Context API) for handling application state
- [ ] Integrate frontend with backend API endpoints
- [ ] Add routing for navigation between different sections (e.g., campaigns, sessions, logs)
- [ ] Implement authentication and user management (if required)
- [ ] Test UI components and API integration

### **4. Integration and Testing**
- [ ] Connect LLM (Ollama) with ChromaDB and PostgreSQL
- [ ] Test RAG pipeline with sample source material
- [ ] Ensure narration continuity with approved logs

### **5. Deployment**
- [ ] Containerize application with Docker
- [ ] Deploy to target platform (local server or cloud)

---

## **Proposed Next Steps for Backend Completion**

1. **Database Enhancements**:
   - Finalize and optimize the PostgreSQL schema for campaigns, narration logs, and sessions.
   - Add indexes to frequently queried fields for performance improvement.

2. **API Development**:
   - Complete the implementation of API endpoints for campaign management, narration logs, and session management.
   - Add input validation and error handling for all endpoints.

3. **Testing**:
   - Write unit tests for all API endpoints using `pytest`.
   - Perform integration testing to ensure seamless interaction between the API and the database.

4. **LLM Integration**:
   - Refine the `query_ollama` function to handle edge cases and improve response formatting.
   - Test the `/llm/query/` endpoint with diverse prompts to ensure robustness.

5. **Documentation**:
   - Update the `readme.md` file with detailed instructions for setting up and running the backend.
   - Document the API endpoints with examples of requests and responses.

6. **Deployment Preparation**:
   - Create a Dockerfile for containerizing the backend application.
   - Set up a CI/CD pipeline for automated testing and deployment.

---

## **Progress Log**

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