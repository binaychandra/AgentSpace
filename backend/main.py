from fastapi import FastAPI, Body, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi.responses import HTMLResponse
from typing import Dict, Any, List
from openai import OpenAI
import json

app = FastAPI()

# Add CORS middleware to allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the React build folder as static files
app.mount("/static", StaticFiles(directory="../frontend/build/static", html=True), name="static")

@app.get("/")
def read_root():
    # Serve the React index.html
    return FileResponse(os.path.join("../frontend/build", "index.html"))

@app.get("/hello")
def hello_world():
    return HTMLResponse(content="""
    <html>
        <body>
            <h1>Hello World</h1>
        </body>
    </html>
    """)

# @app.post("/api/chat_response")
# def chat_response(data: Dict[str, Any] = Body(...)):
#     """
#     Endpoint to handle chat messages from frontend
#     """
#     user_message = data.get("message", "")
#     attachment_name = data.get("attachment")

#     client = OpenAI(base_url="http://localhost:11434/v1", api_key="nothing")

#     response = client.chat.completions.create(
#         model="gemma3:1b",
#         messages=[
#             {"role": "system", "content": "You are a helpful assistant."},
#             {"role": "user", "content": user_message}
#         ]
#     )
#     final_response = response.choices[0].message.content

#     return JSONResponse({"response": final_response})

# Connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            data_json = json.loads(data)
            user_message = data_json.get("message", "")
            attachment_name = data_json.get("attachment")
            
            # Initialize OpenAI client
            client = OpenAI(base_url="http://localhost:11434/v1", api_key="nothing")
            
            try:
                # Start streaming response
                await manager.send_personal_message(
                    json.dumps({"type": "start", "message": "Starting to generate response..."}),
                    websocket
                )
                
                # Stream the LLM response with enhanced system prompt for markdown formatting
                stream = client.chat.completions.create(
                    model="gemma3:1b",
                    messages=[
                        {"role": "system", "content": """You are a helpful assistant that provides well-formatted responses.
                        
                            Format your responses using Markdown:
                            1. Use # ## ### for headings
                            2. Use **bold** and *italic* for emphasis
                            3. Use `code` for inline code and ```language for code blocks
                            4. Use - or * for bullet points
                            5. Use 1. 2. 3. for numbered lists
                            6. Organize complex information into sections with headings
                            7. Use paragraphs to separate topics (leave blank line)

                            Always format code snippets properly with code blocks."""},
                        {"role": "user", "content": user_message}
                    ],
                    stream=True  # Enable streaming
                )
                
                # Send each chunk as it arrives
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        await manager.send_personal_message(
                            json.dumps({"type": "chunk", "content": content}),
                            websocket
                        )
                
                # Send completion message
                await manager.send_personal_message(
                    json.dumps({"type": "end", "message": "Response complete"}),
                    websocket
                )
                
            except Exception as e:
                # Send error message
                await manager.send_personal_message(
                    json.dumps({"type": "error", "error": str(e)}),
                    websocket
                )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)

#uvicorn main:app --reload    
