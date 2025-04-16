import requests

# Define the URL and payload
url = "http://127.0.0.1:8000/llm/query/"
payload = {"prompt": "Write a detailed story about a brave knight who saves a village from a dragon."}
headers = {"Content-Type": "application/json"}

# Send the POST request
response = requests.post(url, json=payload, headers=headers)

# Process the response
if response.status_code == 200:
    response_json = response.json()
    if "response" in response_json:
        # Combine the chunks into a single string, ignoring the "done" field
        chunks = response_json["response"].splitlines()
        combined_response = "".join([
            chunk.split('"response":"')[1].rsplit('"', 1)[0]
            for chunk in chunks
            if '"response":"' in chunk and '"done":' not in chunk
        ])
        print("Final Combined Response:")
        print(combined_response)
    else:
        print("Unexpected response format:", response_json)
else:
    print(f"Error: {response.status_code}")
    print(response.text)