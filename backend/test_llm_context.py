import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
import json
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def create_session_with_retries(retries=3, backoff_factor=0.5):
    """Create a requests session with retry logic"""
    session = requests.Session()
    retry_strategy = Retry(
        total=retries,
        backoff_factor=backoff_factor,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

def check_server_status():
    """Check if the FastAPI server is running"""
    session = create_session_with_retries()
    try:
        response = session.get("http://127.0.0.1:8000/")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        return False

def test_context_enhanced_llm_query():
    """
    Test that narration context is correctly included in LLM queries to enhance responses.
    This test:
    1. Creates a campaign with a narrative
    2. Makes an LLM query with and without context
    3. Compares the responses to show context enhancement
    """
    # Create a session with retry logic
    session = create_session_with_retries()
    
    if not check_server_status():
        print("ERROR: FastAPI server is not running. Please start the server with 'uvicorn backend.main:app --reload'")
        return
    
    print("\n===== TESTING CONTEXT-ENHANCED LLM QUERIES =====\n")
    
    # Step 1: Create a campaign
    campaign_name = f"Context Test Campaign {int(time.time())}"
    campaign_url = "http://127.0.0.1:8000/campaigns/"
    campaign_data = {"name": campaign_name, "description": "A campaign for testing context-enhanced LLM responses."}
    
    print(f"Creating campaign: {campaign_name}")
    response = session.post(campaign_url, params=campaign_data)
    
    if response.status_code != 200:
        print(f"Failed to create campaign: {response.text}")
        return
    
    campaign = response.json()
    campaign_id = campaign["id"]
    print(f"Created campaign with ID: {campaign_id}")
    
    # Step 2: Add a sequence of narration logs to build a coherent story
    narrations = [
        "The adventurers arrived in the small coastal town of Saltmarsh, known for its fishing industry and recent troubles with smugglers.",
        "At the Wicker Goat tavern, they met Eliza, the bartender with a missing eye who seemed to know more than she let on about the abandoned mansion on the cliff.",
        "After gathering information, they decided to investigate the mansion the next morning, suspecting it might be connected to the recent disappearances."
    ]
    
    narration_url = f"http://127.0.0.1:8000/campaigns/{campaign_id}/narration_logs/"
    
    print("\nAdding narration logs to build campaign context...")
    for i, narration in enumerate(narrations):
        narration_data = {"content": narration}
        try:
            response = session.post(narration_url, params=narration_data)
            
            if response.status_code != 200:
                print(f"Failed to add narration log {i+1}: {response.text}")
                return
            
            print(f"Added narration log {i+1}: {narration[:50]}...")
            # Add a small delay between requests to avoid overwhelming the server
            time.sleep(0.5)
        except Exception as e:
            print(f"Error adding narration log {i+1}: {e}")
            return
    
    # Step 3: Make an LLM query WITHOUT context
    prompt = "What should the adventurers do next at the mansion?"
    query_url = "http://127.0.0.1:8000/llm/query/"
    query_data = {"prompt": prompt}
    
    print("\nQuerying LLM WITHOUT campaign context...")
    without_context_response = None
    try:
        response = session.post(query_url, json=query_data)
        
        if response.status_code != 200:
            print(f"Failed to query LLM without context: {response.text}")
            return
        
        without_context_response = response.json()
        print("\nLLM Response WITHOUT context:")
        
        # Check if we got an error or a valid response
        if "error" in without_context_response:
            print(f"Error: {without_context_response['error']}")
            if "fallback_response" in without_context_response:
                print(f"Fallback Response: {without_context_response['fallback_response']}")
            print("Continuing with test despite error...")
        elif "response" in without_context_response:
            print("-" * 50)
            print(without_context_response["response"][:500] + "..." if len(without_context_response["response"]) > 500 else without_context_response["response"])
            print("-" * 50)
        else:
            print(f"Unexpected response format: {without_context_response}")
    except Exception as e:
        print(f"Error querying LLM without context: {e}")
        print("Continuing with test despite error...")
    
    # Step 4: Make an LLM query WITH context
    query_url_with_context = f"http://127.0.0.1:8000/llm/query/?campaign_id={campaign_id}"
    
    print("\nQuerying LLM WITH campaign context...")
    with_context_response = None
    try:
        response = session.post(query_url_with_context, json=query_data)
        
        if response.status_code != 200:
            print(f"Failed to query LLM with context: {response.text}")
            return
        
        with_context_response = response.json()
        print("\nLLM Response WITH context:")
        
        # Check if we got an error or a valid response
        if "error" in with_context_response:
            print(f"Error: {with_context_response['error']}")
            if "fallback_response" in with_context_response:
                print(f"Fallback Response: {with_context_response['fallback_response']}")
        elif "response" in with_context_response:
            print("-" * 50)
            print(with_context_response["response"][:500] + "..." if len(with_context_response["response"]) > 500 else with_context_response["response"])
            print("-" * 50)
        else:
            print(f"Unexpected response format: {with_context_response}")
    except Exception as e:
        print(f"Error querying LLM with context: {e}")
        return
    
    # Step 5: Compare responses (only if we got valid responses from both queries)
    if (without_context_response and with_context_response and
            ("response" in without_context_response or "fallback_response" in without_context_response) and
            ("response" in with_context_response or "fallback_response" in with_context_response)):
        
        print("\nContext Enhancement Analysis:")
        
        # Extract responses, using fallback if needed
        without_context_text = without_context_response.get("response", without_context_response.get("fallback_response", ""))
        with_context_text = with_context_response.get("response", with_context_response.get("fallback_response", ""))
        
        # Only compare if we have actual text responses, not just errors
        if without_context_text and with_context_text:
            context_keywords = ["Saltmarsh", "coastal", "smugglers", "Wicker Goat", "Eliza", "bartender", "abandoned mansion", "cliff", "disappearances"]
            
            without_context_count = sum(1 for keyword in context_keywords if keyword.lower() in without_context_text.lower())
            with_context_count = sum(1 for keyword in context_keywords if keyword.lower() in with_context_text.lower())
            
            print(f"Context-specific elements without context: {without_context_count}/{len(context_keywords)}")
            print(f"Context-specific elements with context: {with_context_count}/{len(context_keywords)}")
            print(f"Context enhancement: {'Significant' if with_context_count > without_context_count else 'Minimal'}")
        else:
            print("Unable to compare responses due to missing text content.")
        
        if "context_note" in with_context_response:
            print(f"Context note: {with_context_response['context_note']}")
    else:
        print("\nUnable to perform context enhancement analysis due to missing responses.")
    
    print("\n===== CONTEXT-ENHANCED LLM QUERY TEST COMPLETED =====\n")

if __name__ == "__main__":
    test_context_enhanced_llm_query()