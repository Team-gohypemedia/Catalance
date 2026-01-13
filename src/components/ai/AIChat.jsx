import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api-client";
import "./AIChat.css";

const DEFAULT_API_BASE = "http://localhost:5000/api";
const API_ROOT = API_BASE_URL || DEFAULT_API_BASE;
const API_URL = `${API_ROOT}/ai`;

const DEFAULT_WELCOME_MESSAGE = [
  "Hello! I am your AI business consultant.",
  "",
  "How this works:",
  "1) Tell me what you are looking for",
  "2) I will ask a few questions to understand your requirements",
  "3) I can generate a custom proposal when we are done",
  "",
  "What brings you here today?"
].join("\n");

const DEFAULT_NEW_CHAT_MESSAGE = [
  "Hello! I am your AI assistant.",
  "",
  "I can help you explore our digital services and find the right solution.",
  "What would you like to work on today?"
].join("\n");

function AIChat({ prefill = "", embedded = false }) {
  const location = useLocation();
  const prefillMessage = typeof prefill === "string" && prefill.length
    ? prefill
    : location.state?.prefill || "";

  const [messages, setMessages] = useState(() => [
    { role: "assistant", content: DEFAULT_WELCOME_MESSAGE }
  ]);
  const [input, setInput] = useState(prefillMessage);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    setInput(prefillMessage);
  }, [prefillMessage]);

  useEffect(() => {
    fetch(`${API_URL}/services`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setServices(data.services || []);
        }
      })
      .catch((err) => console.error("Failed to fetch services:", err));
  }, []);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages
        })
      });

      const data = await response.json();

      if (data?.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again."
          }
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error. Please check if the server is running."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    setInput(action);
  };

  const startNewChat = () => {
    setMessages([{ role: "assistant", content: DEFAULT_NEW_CHAT_MESSAGE }]);
    setInput("");
  };

  return (
    <div className={`ai-chat${embedded ? " embedded" : ""}`}>
      <div className="chat-container">
        <aside className="chat-sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <span className="logo-icon">AI</span>
              <span className="logo-text">Assistant</span>
            </div>
            <button className="new-chat-btn" onClick={startNewChat}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Chat
            </button>
          </div>

          <div className="sidebar-section">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <button onClick={() => handleQuickAction("What services do you offer?")}>
                View Services
              </button>
              <button onClick={() => handleQuickAction("I need help with branding")}>
                Branding Help
              </button>
              <button onClick={() => handleQuickAction("How much does a website cost?")}>
                Get Pricing
              </button>
              <button onClick={() => handleQuickAction("I want to build an app")}>
                App Development
              </button>
            </div>
          </div>

          <div className="sidebar-section services-list">
            <h3>Our Services</h3>
            <ul>
              {services.slice(0, 8).map((service) => (
                <li
                  key={service.id}
                  onClick={() =>
                    handleQuickAction(`Tell me about ${service.name}`)
                  }
                >
                  {service.name}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="chat-main">
          <header className="chat-header">
            <h1>Chat with AI</h1>
            <p>Ask me anything about our services</p>
          </header>

          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === "user" ? "U" : "AI"}
                </div>
                <div className="message-content">
                  <div className="message-bubble">
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message assistant">
                <div className="message-avatar">AI</div>
                <div className="message-content">
                  <div className="message-bubble typing">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={sendMessage}>
            <div className="input-wrapper">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !input.trim()}>
                <span>Send</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
                </svg>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default AIChat;
