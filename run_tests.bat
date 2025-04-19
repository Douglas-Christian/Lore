@echo off
REM Script to run the FastAPI server and test scripts

echo Starting the FastAPI server...
start cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --reload"

REM Wait for the server to start
echo Waiting for the server to start...
timeout /t 5 /nobreak > nul

REM Run the narration context test script
echo Running narration context test...
python backend/test_retrieve.py

REM Run the context-enhanced LLM query test
echo Running context-enhanced LLM query test...
python backend/test_llm_context.py

echo Tests completed!
pause