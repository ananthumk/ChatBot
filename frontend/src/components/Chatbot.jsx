import React, { useEffect, useRef, useState } from "react";
import { FaArrowUp, FaThumbsUp, FaThumbsDown, FaBars } from "react-icons/fa";
import { FiSun, FiMoon } from "react-icons/fi";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";

const Chatbot = ({ sessionId, setSessionId, onSessionCreated, setIsCollapsed }) => {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // scroll on messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      setMessages([]); 
    }
   
  }, [sessionId]);

  const loadSession = async (id) => {
    try {
      const res = await axios.get(`https://chatbot-dhj6.onrender.com/api/sessions/${id}`);
      setMessages(res.data.session.messages || []);
    } catch (err) {
      console.log("Load Session Error:", err.message);
      setMessages([]);
    }
  };

  const createSession = async (firstQuestion = "") => {
    try {
      const title = firstQuestion
        ? firstQuestion.length > 50
          ? firstQuestion.substring(0, 50) + "..."
          : firstQuestion
        : undefined;

      const res = await axios.post("https://chatbot-dhj6.onrender.com/api/sessions", {
        title,
        firstQuestion: firstQuestion ? firstQuestion : undefined
      });

      const newId = res.data.id;
      setSessionId(newId);
      if (onSessionCreated) onSessionCreated();
      return newId;
    } catch (err) {
      console.log("Create session error:", err.message);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!question.trim()) return;
    const currentQuestion = question.trim();
    setQuestion("");
    setLoading(true);

    try {
      let currentSessionId = sessionId;

      if (!currentSessionId) {
        
        currentSessionId = await createSession(currentQuestion);
        if (!currentSessionId) {
          setLoading(false);
          return;
        }
      }

      
      const userMsg = { id: `u-${Date.now()}`, role: "user", text: currentQuestion, createdAt: new Date().toISOString() };
      setMessages((prev) => [...prev, userMsg]);

      
      const res = await axios.post(`https://chatbot-dhj6.onrender.com/api/sessions/${currentSessionId}/messages`, {
        question: currentQuestion
      });

      const assistant = res.data.assistant;
      
      setMessages((prev) => [...prev, assistant]);
    } catch (err) {
      console.log("Send Message Error:", err.message);
    } finally {
      setLoading(false);
      
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFeedback = async (messageId, feedback) => {
    try {
      await axios.post("https://chatbot-dhj6.onrender.com/api/feedback", {
        sessionId,
        messageId,
        feedback
      });

      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback } : m)));
    } catch (err) {
      console.log("Feedback Error:", err.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`flex-1 ${theme === "dark" ? "bg-[#242124]" : "bg-white"} flex flex-col h-screen`}>
      {/* Top Bar */}
      <div className={`${theme === "dark" ? "bg-[#2a292a] border-gray-700" : "bg-gray-50 border-gray-200"} border-b px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsCollapsed(false)} className={`md:hidden p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"} transition-colors`}>
            <FaBars className={`w-5 h-5 ${theme === "dark" ? "text-white" : "text-gray-800"}`} />
          </button>
          <h1 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>AI Assistant</h1>
        </div>

        <button onClick={toggleTheme} className={`p-2 rounded-lg ${theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} transition-colors`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
          {theme === "dark" ? <FiSun className="w-5 h-5 text-yellow-400" /> : <FiMoon className="w-5 h-5 text-gray-700" />}
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <div className={`text-6xl mb-4 ${theme === "dark" ? "text-gray-600" : "text-gray-300"}`}>💬</div>
              <h2 className={`text-2xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>How can I help you today?</h2>
              <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Start a conversation by typing a message below</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex flex-col gap-2">
                <div className={`${msg.role === "user" ? `ml-auto max-w-[80%] ${theme === "dark" ? "bg-blue-600" : "bg-blue-500"} text-white` : `mr-auto max-w-full ${theme === "dark" ? "bg-[#2a292a]" : "bg-gray-100"} ${theme === "dark" ? "text-white" : "text-gray-800"}`} px-5 py-3 rounded-2xl shadow-sm`}>
                  {msg.answerText ? (
                    <div className="space-y-4">
                      <p className="text-base leading-relaxed">{msg.answerText}</p>

                      {msg.table && (
                        <div className={`overflow-x-auto rounded-lg border ${theme === "dark" ? "border-gray-600" : "border-gray-300"}`}>
                          <table className="w-full text-sm">
                            <thead className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                              <tr>
                                {msg.table.columns.map((col, i) => (
                                  <th key={i} className={`px-4 py-3 text-left font-semibold ${theme === "dark" ? "text-gray-200 border-gray-600" : "text-gray-700 border-gray-200"} border-b`}>
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {msg.table.rows.map((row, rIdx) => (
                                <tr key={rIdx} className={`${theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-50"} transition-colors`}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className={`px-4 py-3 ${theme === "dark" ? "border-gray-700" : "border-gray-200"} border-b`}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {msg.description && <p className={`text-sm italic ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{msg.description}</p>}
                    </div>
                  ) : (
                    <p className="text-base leading-relaxed">{msg.text}</p>
                  )}
                </div>

                {/* Feedback for assistant */}
                {msg.role === "assistant" && msg.id && (
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => handleFeedback(msg.id, msg.feedback === "like" ? null : "like")}
                      className={`p-2 rounded-lg transition-all ${msg.feedback === "like" ? "bg-blue-500 text-white" : theme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
                      title="Like"
                    >
                      <FaThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, msg.feedback === "dislike" ? null : "dislike")}
                      className={`p-2 rounded-lg transition-all ${msg.feedback === "dislike" ? "bg-blue-500 text-white" : theme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
                      title="Dislike"
                    >
                      <FaThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className={`mr-auto max-w-full ${theme === "dark" ? "bg-[#2a292a]" : "bg-gray-100"} px-5 py-3 rounded-2xl shadow-sm`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${theme === "dark" ? "bg-gray-400" : "bg-gray-600"} rounded-full animate-bounce`} style={{ animationDelay: "0ms" }}></div>
                <div className={`w-2 h-2 ${theme === "dark" ? "bg-gray-400" : "bg-gray-600"} rounded-full animate-bounce`} style={{ animationDelay: "150ms" }}></div>
                <div className={`w-2 h-2 ${theme === "dark" ? "bg-gray-400" : "bg-gray-600"} rounded-full animate-bounce`} style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Box */}
      <div className={`${theme === "dark" ? "bg-[#242124]" : "bg-white"} border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"} px-4 md:px-8 py-4 sticky bottom-0`}>
        <div className="max-w-4xl mx-auto">
          <div className={`flex items-end gap-3 ${theme === "dark" ? "bg-[#2a292a]" : "bg-gray-100"} py-3 px-4 rounded-2xl shadow-lg`}>
            <textarea
              placeholder="Type your message..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              rows={1}
              className={`flex-1 ${theme === "dark" ? "text-white placeholder:text-gray-400" : "text-gray-800 placeholder:text-gray-500"} bg-transparent outline-0 border-0 resize-none max-h-32`}
              style={{ minHeight: "24px" }}
            />

            <button
              onClick={sendMessage}
              disabled={loading || !question.trim()}
              className="w-6 h-6 flex justify-center items-center bg-gradient-to-r from-blue-500 to-purple-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              title="Send"
            >
              <FaArrowUp className="text-white w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
