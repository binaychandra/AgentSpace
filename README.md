# AgentSpace

AgentSpace is a sophisticated, locally-runnable chatbot with agentic capabilities, designed to provide intelligent and context-aware responses. It can also be configured to work with external language models, offering flexibility and scalability. The application features a real-time, streaming user interface built with React, and a powerful backend powered by FastAPI and LangGraph.

## Features

- **Agentic Capabilities**: Utilizes LangGraph to create a stateful, agentic system that can perform complex tasks.
- **Local & External Model Support**: Can be run with local models (e.g., via Ollama) or configured to use external models like GPT-4.
- **Real-time Streaming**: Websocket-based communication for a seamless, real-time user experience.
- **Extensible Toolset**: Easily extendable with custom tools for the agent to use (e.g., `add`, `subtract`, `multiply`).
- **Modern Tech Stack**: Built with modern technologies like React, FastAPI, and LangGraph.
- **Easy Setup**: Comes with a `Makefile` and a Windows batch script for easy setup and execution.

## Tech Stack

- **Backend**:
  - **Framework**: FastAPI
  - **Agentic Logic**: LangGraph
  - **LLM Integration**: LangChain
  - **Websockets**: FastAPI WebSockets
  - **Package Management**: pip with `requirements.txt`

- **Frontend**:
  - **Framework**: React
  - **State Management**: React Hooks
  - **Styling**: CSS

- **Tooling**:
  - **Build System**: `make`
  - **Windows Execution**: Batch script (`run_agentspace.bat`)

## Getting Started

### Prerequisites

- [Node.js and npm](https://nodejs.org/en/)
- [Python 3.11+](https://www.python.org/downloads/)
- [Make](https://www.gnu.org/software/make/) (optional, for using the Makefile)
- An Ollama server running with a model like `gemma3:1b` for local execution.

### Installation & Running the Application

#### Using the Makefile (on Linux, macOS, or with Git Bash on Windows)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/binaychandra/AgentSpace.git
    cd AgentSpace
    ```

2.  **Run the application:**
    ```bash
    make agentspace
    ```
    This command will:
    - Install frontend dependencies and build the React app.
    - Create a Python virtual environment in the `backend` directory.
    - Install all required Python packages.
    - Start the FastAPI server.

#### Using the Batch Script (on Windows)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/binaychandra/AgentSpace.git
    cd AgentSpace
    ```

2.  **Run the application:**
    ```Makefile
    .\make agentspace
    ```

Once the server is running, you can access the application at `http://localhost:8000`.

## Project Structure

```
AgentSpace/
├── backend/
│   ├── .venv/                # Virtual environment
│   ├── graph.py              # LangGraph agent definition
│   ├── main.py               # FastAPI application and WebSocket logic
│   ├── tools.py              # Agent tools
│   ├── requirements.txt      # Python dependencies
│   └── ...
├── frontend/
│   ├── build/                # Compiled React app
│   ├── public/
│   ├── src/                  # React source code
│   │   ├── App.js            # Main application component
│   │   └── ...
│   └── package.json          # Frontend dependencies
├── Makefile                  # Makefile for building and running
└── README.md                 # This file
```

## Usage

Once the application is running, open your web browser to `http://localhost:8000`. You can type a message in the chatbox and the agent will respond. The agent can answer general questions and also use its tools for calculations. For example, you can ask "What is 5 + 3?".

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature`).
6.  Open a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
