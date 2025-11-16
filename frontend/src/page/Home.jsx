import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Chatbot from "../components/Chatbot";

const Home = () => {
  const { sessionId: urlSessionId } = useParams();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(urlSessionId || null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update URL when session changes
  useEffect(() => {
    if (sessionId) {
      navigate(`/chat/${sessionId}`, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [sessionId, navigate]);

  // Sync sessionId from URL (if user pastes a url)
  useEffect(() => {
    if (urlSessionId !== sessionId) {
      setSessionId(urlSessionId || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSessionId]);

  const handleNewChat = () => {
    setSessionId(null);
    setIsCollapsed(true);
  };

  const handleSelectSession = (id) => {
    setSessionId(id);
    setIsCollapsed(true);
  };

  const handleSessionCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="w-full h-screen flex relative overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed md:relative z-20 h-full transition-transform duration-300 ${
          isCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        }`}
      >
        <Sidebar
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          refreshTrigger={refreshTrigger}
          activeSessionId={sessionId}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1">
        <Chatbot
          sessionId={sessionId}
          setSessionId={setSessionId}
          onSessionCreated={handleSessionCreated}
          setIsCollapsed={setIsCollapsed}
        />
      </div>
    </div>
  );
};

export default Home;
