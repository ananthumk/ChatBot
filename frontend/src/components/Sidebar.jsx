import React, { useEffect, useState } from "react";
import { FaSearch, FaEdit, FaTimes, FaBars, FaUser } from "react-icons/fa";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";

const Sidebar = ({
  onNewChat,
  onSelectSession,
  refreshTrigger,
  activeSessionId,
  isCollapsed,
  setIsCollapsed
}) => {
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme } = useTheme();

  const loadSessions = async () => {
    try {
      const res = await axios.get("https://chatbot-dhj6.onrender.com/api/sessions");
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.log("Fetch Sessions Error:", err.message);
      setSessions([]);
    }
  };

  useEffect(() => {
    loadSessions();
   
    const id = setInterval(loadSessions, 6000);
    return () => clearInterval(id);
  }, []);

  
  useEffect(() => {
    loadSessions();
  }, [refreshTrigger]);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectSession = (id) => {
    onSelectSession(id);
  };

  const handleNewChat = () => {
    onNewChat();
    setIsCollapsed(true);
  };

  if (isCollapsed) {
    return (
      <div
        className={`w-16 min-h-screen ${
          theme === "dark" ? "bg-[#242124] border-gray-700" : "bg-gray-100 border-gray-300"
        } border-r-2 py-5 flex flex-col items-center gap-5`}
      >
        <FaBars
          className={`w-6 h-6 ${theme === "dark" ? "text-white" : "text-gray-800"} cursor-pointer`}
          onClick={() => setIsCollapsed(false)}
        />
        <FaEdit
          className={`w-6 h-6 ${theme === "dark" ? "text-white" : "text-gray-800"} cursor-pointer hover:text-blue-500 transition-colors`}
          onClick={handleNewChat}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full md:w-80 min-h-screen ${
        theme === "dark" ? "bg-[#242124] border-gray-700" : "bg-gray-100 border-gray-300"
      } border-r-2 py-5 px-4 flex flex-col gap-5`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Chats</h1>
        <FaTimes
          className={`w-5 h-5 ${theme === "dark" ? "text-white" : "text-gray-800"} cursor-pointer md:hidden`}
          onClick={() => setIsCollapsed(true)}
        />
      </div>

      {/* Search + New Chat button */}
      <div className="flex items-center gap-3 w-full">
        <div className={`flex items-center px-3 ${theme === "dark" ? "bg-[#848482]" : "bg-gray-200"} gap-2 rounded-lg flex-1`}>
          <FaSearch className={`w-4 h-4 ${theme === "dark" ? "text-white" : "text-gray-600"}`} />
          <input
            type="search"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${theme === "dark" ? "text-white placeholder:text-gray-300" : "text-gray-800 placeholder:text-gray-500"} bg-transparent py-2 px-2 outline-0`}
          />
        </div>

        <button
          onClick={handleNewChat}
          className={`p-2 ${theme === "dark" ? "bg-gray-300 hover:bg-gray-500" : "bg-gray-400 hover:bg-gray-600"} rounded-lg transition-colors`}
          title="New Chat"
        >
          <FaEdit className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* New Chat big button */}
      <button
        onClick={handleNewChat}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg ${theme === "dark" ? "bg-[#848482] hover:bg-[#6a6a68]" : "bg-gray-200 hover:bg-gray-300"} transition-colors`}
      >
        <FaEdit className={`w-5 h-5 ${theme === "dark" ? "text-white" : "text-gray-800"}`} />
        <span className={`text-base font-medium ${theme === "dark" ? "text-white" : "text-gray-800"}`}>New Chat</span>
      </button>

      {/* History */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        <h2 className={`text-sm font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-600"} uppercase tracking-wide`}>Recent</h2>

        <div className="flex flex-col gap-1">
          {filteredSessions.length === 0 ? (
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} px-2 py-2`}>
              {searchQuery ? "No sessions found" : "No chat history yet"}
            </p>
          ) : (
            filteredSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                className={`text-left px-3 py-2.5 cursor-pointer rounded-lg transition-all ${activeSessionId === s.id ? theme === "dark" ? "bg-[#848482] text-white" : "bg-blue-100 text-blue-800" : theme === "dark" ? "text-gray-300 hover:bg-[#3a393a]" : "text-gray-700 hover:bg-gray-200"}`}
              >
                <p className="text-sm font-medium truncate" title={s.title}>{s.title}</p>
                <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"} mt-1`}>{new Date(s.createdAt).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* User Info */}
      <div className={`flex items-center gap-3 mt-auto pt-4 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`}>
        <div className="w-10 h-10 rounded-full flex justify-center bg-gradient-to-br from-blue-500 to-purple-600 items-center">
          <FaUser className="text-base text-white" />
        </div>
        <div className="flex flex-col">
          <h5 className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Akhil</h5>
          <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Free Plan</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
