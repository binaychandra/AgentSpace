import React, { useState, useEffect } from "react";

// Add CSS reset to ensure full viewport usage and consistent styling
const resetStyle = document.createElement('style');
resetStyle.textContent = `
  body, html {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    display: flex;
    justify-content: center;
    background-color: #f0f2f5;
  }
  
  #root {
    width: 100%;
    height: 100vh;
    overflow: hidden;
    display: flex;
    justify-content: center;
  }
  
  /* Hide scrollbars but maintain functionality */
  ::-webkit-scrollbar {
    width: 0px;
    height: 0px;
    background: transparent;
  }
  
  * {
    scrollbar-width: none; /* Firefox */
  }
  
  *::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Edge */
  }
  
  .message-container {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  
  /* Global box sizing */
  * {
    box-sizing: border-box;
  }
`;
document.head.appendChild(resetStyle);

// Add CSS for animations and text formatting
const style = document.createElement('style');
style.textContent = `
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  
  .message {
    padding: 15px;
    margin-bottom: 10px;
    width: 100%; /* Use full width */
    line-height: 1.5;
    box-sizing: border-box;
  }
  
  .user-message {
    background-color: #f0f0f0;
  }
  
  .bot-message {
    background-color: #f8f8ff;
  }
  
  /* Markdown styling */
  .message h1 {
    font-size: 1.5em;
    font-weight: bold;
    margin: 0.5em 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.3em;
  }
  
  .message h2 {
    font-size: 1.3em;
    font-weight: bold;
    margin: 0.5em 0;
  }
  
  .message h3 {
    font-size: 1.1em;
    font-weight: bold;
    margin: 0.5em 0;
  }
  
  .message p {
    margin: 0.5em 0;
  }
  
  .message ul, .message ol {
    margin: 0.5em 0;
    padding-left: 2em;
  }
  
  .message li {
    margin: 0.3em 0;
  }
  
  .message code {
    background-color: #f0f0f0;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.9em;
  }
  
  .message pre {
    background-color: #f5f5f5;
    padding: 1em;
    border-radius: 5px;
    overflow-x: auto;
    max-width: 100%;
    white-space: pre-wrap;
    margin: 0.8em 0;
    border: 1px solid #eee;
  }
  
  .message a {
    color: #0366d6;
    text-decoration: none;
  }
  
  .message a:hover {
    text-decoration: underline;
  }
  
  .message blockquote {
    border-left: 4px solid #ddd;
    padding-left: 1em;
    color: #666;
    margin: 0.8em 0;
  }
`;
document.head.appendChild(style);

// Enhanced markdown parser function
const parseMarkdown = (text) => {
  if (!text) return '';
  
  // Preserve code blocks first (```...```)
  const codeBlocks = [];
  let processedText = text.replace(/```([\s\S]*?)```/g, (match) => {
    const id = `CODE_BLOCK_${codeBlocks.length}`;
    codeBlocks.push(match.substring(3, match.length - 3).trim());
    return id;
  });
  
  // Replace headers
  processedText = processedText.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  processedText = processedText.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  processedText = processedText.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Replace bold and italic
  processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Replace inline code
  processedText = processedText.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Process lists (must happen before paragraph processing)
  
  // Numbered lists
  let inNumberedList = false;
  let listItems = [];
  
  processedText = processedText.split('\n').map(line => {
    const numberMatch = line.match(/^(\d+)\. (.*)$/);
    if (numberMatch) {
      if (!inNumberedList) {
        inNumberedList = true;
        listItems = [];
      }
      listItems.push(`<li>${numberMatch[2]}</li>`);
      return '';
    } else if (inNumberedList && line.trim() === '') {
      inNumberedList = false;
      return `<ol>${listItems.join('')}</ol>\n`;
    } else if (inNumberedList) {
      // Continue previous list item
      const lastItem = listItems.pop();
      listItems.push(lastItem.slice(0, -5) + ' ' + line + '</li>');
      return '';
    }
    return line;
  }).join('\n');
  
  // Add any remaining list
  if (inNumberedList) {
    processedText += `<ol>${listItems.join('')}</ol>\n`;
  }
  
  // Bullet lists
  inNumberedList = false; // Reuse variable for bullet lists
  listItems = [];
  
  processedText = processedText.split('\n').map(line => {
    const bulletMatch = line.match(/^[-*] (.*)$/);
    if (bulletMatch) {
      if (!inNumberedList) {
        inNumberedList = true;
        listItems = [];
      }
      listItems.push(`<li>${bulletMatch[1]}</li>`);
      return '';
    } else if (inNumberedList && line.trim() === '') {
      inNumberedList = false;
      return `<ul>${listItems.join('')}</ul>\n`;
    } else if (inNumberedList) {
      // Continue previous list item
      const lastItem = listItems.pop();
      listItems.push(lastItem.slice(0, -5) + ' ' + line + '</li>');
      return '';
    }
    return line;
  }).join('\n');
  
  // Add any remaining list
  if (inNumberedList) {
    processedText += `<ul>${listItems.join('')}</ul>\n`;
  }
  
  // Replace links [text](url)
  processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Replace horizontal rules
  processedText = processedText.replace(/^\s*---\s*$/gm, '<hr>');
  
  // Replace blockquotes
  processedText = processedText.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');
  
  // Replace double newlines with paragraph breaks
  processedText = processedText.replace(/\n\n/g, '</p><p>');
  
  // Replace single newlines with <br> (except inside lists/code blocks)
  processedText = processedText.replace(/\n(?![<\/>])/g, '<br>');
  
  // Restore code blocks
  codeBlocks.forEach((code, index) => {
    processedText = processedText.replace(`CODE_BLOCK_${index}`, `<pre><code>${code}</code></pre>`);
  });
  
  // Wrap in paragraphs if not already wrapped
  if (!processedText.startsWith('<')) {
    processedText = '<p>' + processedText + '</p>';
  }
  
  return processedText;
};

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const suggestions = [
    { id: 1, text: "Tell me about FastAPI" },
    { id: 2, text: "How to use React with FastAPI?" },
    { id: 3, text: "What is app.mount?" },
    { id: 4, text: "Show me an example" }
  ];

  // Create WebSocket reference
  const socketRef = React.useRef(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    // Determine the WebSocket URL (same host, different protocol)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
    
    // Create WebSocket connection
    socketRef.current = new WebSocket(wsUrl);
    
    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);
  
  const handleSendMessage = async () => {
    if (inputText.trim() || attachment) {
      const messageToSend = inputText.trim();
      const userMessage = {
        id: Date.now(),
        text: messageToSend,
        attachment: attachment ? attachment.name : null,
        sender: "user"
      };
      
      setMessages([...messages, userMessage]);
      setInputText("");
      setAttachment(null);
      
      // Create a new response message with placeholder
      const responseId = Date.now() + 1;
      const responseMessage = {
        id: responseId,
        text: "",
        sender: "bot",
        isStreaming: true
      };
      
      setMessages(prevMessages => [...prevMessages, responseMessage]);
      setIsLoading(true);
      
      try {
        // Make sure WebSocket is connected
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          // Setup message handler for this specific response
          let accumulatedText = "";
          
          socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'chunk':
                // Add new chunk to accumulated text
                accumulatedText += data.content;
                setMessages(prevMessages => 
                  prevMessages.map(msg => 
                    msg.id === responseId 
                      ? { ...msg, text: accumulatedText }
                      : msg
                  )
                );
                break;
                
              case 'end':
                // Stream completed
                setIsLoading(false);
                setMessages(prevMessages => 
                  prevMessages.map(msg => 
                    msg.id === responseId 
                      ? { ...msg, isStreaming: false }
                      : msg
                  )
                );
                break;
                
              case 'error':
                // Error occurred
                setIsLoading(false);
                setMessages(prevMessages => 
                  prevMessages.map(msg => 
                    msg.id === responseId 
                      ? { 
                          ...msg, 
                          text: accumulatedText || `Error: ${data.error}`, 
                          isStreaming: false 
                        }
                      : msg
                  )
                );
                break;
                
              default:
                // Ignore other message types
                break;
            }
          };
          
          // Handle socket errors
          socketRef.current.onerror = () => {
            setIsLoading(false);
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === responseId 
                  ? { 
                      ...msg, 
                      text: "Error connecting to the server. Please try again.", 
                      isStreaming: false 
                    }
                  : msg
              )
            );
          };
          
          // Send the message to the WebSocket server
          socketRef.current.send(JSON.stringify({
            message: messageToSend,
            attachment: attachment ? attachment.name : null
          }));
        } else {
          throw new Error("WebSocket is not connected");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setIsLoading(false);
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === responseId 
              ? { 
                  ...msg, 
                  text: "Network error. Please check your connection.", 
                  isStreaming: false 
                }
              : msg
          )
        );
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSuggestionClick = (text) => {
    setInputText(text);
  };

  return (
    <div style={{ 
      width: "66.6%", 
      height: "100vh", 
      margin: "0 auto", 
      padding: 0, 
      display: "flex", 
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 0 20px rgba(0,0,0,0.1)",
      borderRadius: "0px",
      backgroundColor: "white"
    }}>
      <header style={{ 
        padding: "15px", 
        background: "#f8f9fa", 
        borderBottom: "1px solid #e9ecef",
        textAlign: "center"
      }}>
        <h2 style={{ margin: 0 }}>Chat App</h2>
      </header>
      
      <div 
        className="message-container"
        style={{ 
          flex: 1,
          overflowY: "auto",
          position: "relative",
          msOverflowStyle: "none", /* IE and Edge */
          scrollbarWidth: "none", /* Firefox */
          paddingLeft: "15px",
          paddingRight: "15px"
        }}
        ref={(el) => {
          // Auto-scroll to bottom when messages change
          if (el) {
            setTimeout(() => {
              el.scrollTop = el.scrollHeight;
            }, 10);
          }
        }}
      >
        {messages.length === 0 ? (
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center",
            height: "100%",
            padding: "20px"
          }}>
            <p style={{ 
              textAlign: "center", 
              color: "#888", 
              fontSize: "1.2em",
              marginBottom: "20px"
            }}>
              Welcome to Chat! Try one of these:
            </p>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr",
              gap: "10px", 
              width: "100%", 
              maxWidth: "600px"
            }}>
              {suggestions.map(suggestion => (
                <div 
                  key={suggestion.id} 
                  style={{ 
                    padding: "15px", 
                    background: "#fff", 
                    border: "1px solid #e0e0e0",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  onMouseOver={(e) => e.currentTarget.style.background = "#f0f0f0"}
                  onMouseOut={(e) => e.currentTarget.style.background = "#fff"}
                >
                  {suggestion.text}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ width: "100%" }}>
            {messages.map(msg => (
              <div 
                key={msg.id}
                className={`message ${msg.sender === "user" ? "user-message" : "bot-message"}`}
              >
                <div style={{ 
                  display: "flex", 
                  alignItems: "flex-start", 
                  marginBottom: "5px" 
                }}>
                  <div style={{ 
                    fontWeight: "bold", 
                    marginRight: "10px",
                    color: msg.sender === "user" ? "#007bff" : "#28a745"
                  }}>
                    {msg.sender === "user" ? "You:" : "Assistant:"}
                  </div>
                  {msg.attachment && (
                    <div style={{ 
                      fontSize: "0.85em", 
                      color: "#666",
                      marginLeft: "auto"
                    }}>
                      📎 {msg.attachment}
                    </div>
                  )}
                </div>
                
                <div
                  style={{
                    width: "100%",
                    wordBreak: "break-word",
                    overflow: "hidden"
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: msg.sender === 'bot' 
                      ? parseMarkdown(msg.text) 
                      : `<p>${msg.text}</p>` 
                  }}
                />
                
                {msg.isStreaming && (
                  <span style={{
                    display: "inline-block",
                    width: "6px",
                    height: "15px",
                    backgroundColor: "#28a745",
                    marginLeft: "5px",
                    verticalAlign: "middle",
                    animation: "blink 1s step-start infinite"
                  }}></span>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div style={{
                padding: "10px 15px",
                color: "#555",
                display: "flex",
                alignItems: "center",
                background: "#f8f8f8",
                borderTop: "1px solid #eee"
              }}>
                <div style={{ marginRight: "10px" }}>Thinking</div>
                <div style={{ display: "flex" }}>
                  <span style={{ 
                    height: "8px", 
                    width: "8px", 
                    borderRadius: "50%",
                    background: "#555",
                    margin: "0 2px",
                    animation: "pulse 1s infinite",
                    animationDelay: "0s" 
                  }}></span>
                  <span style={{ 
                    height: "8px", 
                    width: "8px", 
                    borderRadius: "50%",
                    background: "#555",
                    margin: "0 2px",
                    animation: "pulse 1s infinite",
                    animationDelay: "0.2s" 
                  }}></span>
                  <span style={{ 
                    height: "8px", 
                    width: "8px", 
                    borderRadius: "50%",
                    background: "#555",
                    margin: "0 2px",
                    animation: "pulse 1s infinite",
                    animationDelay: "0.4s" 
                  }}></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div style={{ 
        display: "flex", 
        padding: "15px",
        paddingLeft: "15px",
        paddingRight: "15px",
        borderTop: "1px solid #e9ecef",
        background: "#f8f9fa"
      }}>
        <input
          type="file"
          id="attachment"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <label 
          htmlFor="attachment" 
          style={{ 
            cursor: "pointer", 
            padding: "10px", 
            border: "1px solid #ddd", 
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px"
          }}
        >
          📎
        </label>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          style={{ 
            flex: 1,
            padding: "10px 15px",
            margin: "0 10px",
            border: "1px solid #ddd",
            background: "#fff"
          }}
        />
        <button
          onClick={handleSendMessage}
          style={{ 
            padding: "10px 20px", 
            background: "#007bff", 
            color: "white", 
            border: "none",
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </div>
      
      {attachment && (
        <div style={{ 
          padding: "10px 15px", 
          color: "#666",
          background: "#e9f5ff",
          fontSize: "0.9em"
        }}>
          File attached: {attachment.name}
          <button 
            onClick={() => setAttachment(null)}
            style={{ 
              marginLeft: "10px", 
              background: "none", 
              border: "none", 
              color: "#007bff", 
              cursor: "pointer" 
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
