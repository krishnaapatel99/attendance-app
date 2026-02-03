import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar';
import StudentSidebar from '../../components/StudentSidebar';
import { Send, Bot, User, AlertCircle, Clock, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../utils/api';
import './Chatbot.css';

function Chatbot() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchStats();
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/chatbot/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await api.get('/chatbot/history?limit=10');
      if (response.data.success && response.data.data.history.length > 0) {
        const historyMessages = response.data.data.history.reverse().flatMap(item => [
          { type: 'user', content: item.question, timestamp: item.created_at },
          { type: 'bot', content: item.response, timestamp: item.created_at }
        ]);
        setMessages(historyMessages);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError('');

    // Add user message to chat
    setMessages(prev => [...prev, { 
      type: 'user', 
      content: userMessage, 
      timestamp: new Date().toISOString() 
    }]);

    setLoading(true);

    try {
      const response = await api.post('/chatbot/ask', { question: userMessage });
      
      if (response.data.success) {
        // Add bot response
        setMessages(prev => [...prev, { 
          type: 'bot', 
          content: response.data.data.answer,
          timestamp: new Date().toISOString()
        }]);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          todayUsage: prev.todayUsage + 1,
          remainingToday: response.data.data.remainingToday,
          canAskNow: response.data.data.remainingToday > 0
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error.response?.status === 429) {
        const errorData = error.response.data;
        setError(errorData.message);
        
        // Update stats to reflect rate limit
        if (errorData.remainingToday !== undefined) {
          setStats(prev => ({
            ...prev,
            remainingToday: errorData.remainingToday,
            canAskNow: false,
            waitSeconds: errorData.waitSeconds
          }));
        }
      } else if (error.response?.status === 503) {
        setError('Chatbot service is temporarily unavailable. Please try again later.');
      } else {
        setError('Failed to send message. Please try again.');
      }
      
      // Remove the user message if request failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    if (loading || (stats?.canAskNow === false)) return;
    setInputMessage(question);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className='flex flex-1 bg-gray-100 overflow-hidden'>
        <StudentSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 flex flex-col p-4 sm:p-6 w-full overflow-hidden">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
              AI Assistant 🤖
            </h1>
            <p className="text-gray-600">Ask me anything about your college, courses, or attendance!</p>
          </div>

          {/* Stats Bar */}
          {stats && (
            <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 shadow-sm">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-600" />
                  <span className="text-gray-600">Today:</span>
                  <span className="font-semibold">{stats.todayUsage}/{stats.dailyLimit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-green-600" />
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-semibold text-green-600">{stats.remainingToday}</span>
                </div>
                {!stats.canAskNow && stats.waitSeconds > 0 && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle size={16} />
                    <span>Wait {stats.waitSeconds}s</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Bot size={64} className="text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Welcome to AI Assistant!
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    Ask me questions about your attendance, timetable, announcements, or anything related to your college experience.
                  </p>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                    <button
                      onClick={() => setInputMessage("What's my attendance percentage?")}
                      className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 transition"
                    >
                      📊 What's my attendance percentage?
                    </button>
                    <button
                      onClick={() => setInputMessage("Show me today's timetable")}
                      className="text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg text-sm text-green-700 transition"
                    >
                      📅 Show me today's timetable
                    </button>
                    <button
                      onClick={() => setInputMessage("Any new announcements?")}
                      className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm text-purple-700 transition"
                    >
                      📢 Any new announcements?
                    </button>
                    <button
                      onClick={() => setInputMessage("How can I improve my attendance?")}
                      className="text-left p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-sm text-orange-700 transition"
                    >
                      💡 How can I improve my attendance?
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type === 'bot' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <Bot size={18} className="text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] sm:max-w-[70%] ${message.type === 'user' ? 'order-1' : ''}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.type === 'bot' ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown
                              components={{
                                // Custom styling for markdown elements
                                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                                em: ({node, ...props}) => <em className="italic" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                                li: ({node, ...props}) => <li className="ml-2" {...props} />,
                                h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 text-gray-900" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 text-gray-900" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1 text-gray-900" {...props} />,
                                code: ({node, inline, ...props}) => 
                                  inline ? (
                                    <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props} />
                                  ) : (
                                    <code className="block bg-gray-200 p-2 rounded text-sm overflow-x-auto" {...props} />
                                  ),
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-3 italic" {...props} />,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm sm:text-base whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 px-2">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>

                    {message.type === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center order-2">
                        <User size={18} className="text-white" />
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
              {/* Quick Questions */}
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickQuestion("What are the chapters of operating system?")}
                  disabled={loading || (stats?.canAskNow === false)}
                  className="text-xs sm:text-sm px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📚 What are the chapters of operating system?
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickQuestion("What are the subjects in 4th semester?")}
                  disabled={loading || (stats?.canAskNow === false)}
                  className="text-xs sm:text-sm px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📖 What are the subjects in 4th semester?
                </button>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    stats?.canAskNow === false && stats?.waitSeconds > 0
                      ? `Wait ${stats.waitSeconds}s...`
                      : stats?.remainingToday === 0
                      ? 'Daily limit reached'
                      : 'Type your question...'
                  }
                  disabled={loading || (stats?.canAskNow === false)}
                  maxLength={500}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim() || (stats?.canAskNow === false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <Send size={18} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 px-2">
                {inputMessage.length}/500 characters
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Chatbot;
