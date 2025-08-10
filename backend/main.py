from fastapi import FastAPI, Body, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi.responses import HTMLResponse
from typing import Dict, Any, List
import json
import asyncio

# Import the SimpleAgent class and required message types
from langchain_core.messages import HumanMessage, SystemMessage
from graph import SimpleAgent

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
        # Initialize SimpleAgent once
        agent = SimpleAgent(mode='local', llm_model=None, tools=[])
        config = {"configurable": {"thread_id": "5"}}
        
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            data_json = json.loads(data)
            user_message = data_json.get("message", "")
            attachment_name = data_json.get("attachment")
            
            try:
                # Start streaming response
                await manager.send_personal_message(
                    json.dumps({"type": "start", "message": "Starting to generate response..."}),
                    websocket
                )
                
                # Create system message and human message
                system_message = SystemMessage(content="""You are a helpful assistant that provides well-formatted responses.
                    
                    Format your responses using Markdown:
                    1. Use # ## ### for headings
                    2. Use **bold** and *italic* for emphasis
                    3. Use `code` for inline code and ```language for code blocks
                    4. Use - or * for bullet points
                    5. Use 1. 2. 3. for numbered lists
                    6. Organize complex information into sections with headings
                    7. Use paragraphs to separate topics (leave blank line)

                    Always format code snippets properly with code blocks.""")
                input_message = HumanMessage(content=user_message)
                
                # Stream the response using langgraph
                content_buffer = ""
                async for event in agent.graph.astream_events(
                    {"messages": [system_message, input_message]}, 
                    config, 
                    version="v2"
                ):
                    # Get chat model tokens from the assistant node
                    if event["event"] == "on_chat_model_stream" and event['metadata'].get('langgraph_node', '') == "assistant":
                        if "data" in event and "chunk" in event["data"]:
                            content = event["data"]["chunk"].content
                            if content:
                                content_buffer += content
                                # Send each chunk as it arrives
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
