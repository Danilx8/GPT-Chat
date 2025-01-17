import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import Toast from '../components/Toast';

interface Message {
  id: number;
  role: string;
  content: string;
  timestamp: string;
}

interface Chat {
  id: number;
  title: string;
  messages: Message[];
}

interface Toast {
  message: string;
  type: 'error' | 'success';
}

export default function Chat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token, logout } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const showError = (error: any) => {
    const message = error.response?.data?.detail ||
                   error.response?.statusText ||
                   error.message ||
                   'An error occurred';
    setToast({ message, type: 'error' });
  };

  const fetchChats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/chats/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(response.data);
    } catch (error) {
      showError(error);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await axios.post('http://localhost:8000/chats/',
        { title: 'New Chat' },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      const newChat = response.data;
      setChats([...chats, newChat]);
      setCurrentChat(newChat);
    } catch (error) {
      showError(error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentChat) return;

    const userMessage = {
      id: Date.now(), // Temporary ID for immediate display
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Immediately show user message
    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, userMessage]
    };
    setCurrentChat(updatedChat);
    setChats(chats.map(chat =>
      chat.id === currentChat.id ? updatedChat : chat
    ));
    setMessage('');

    setLoading(true);
    try {
      // Send message to server
      await axios.post(
        `http://localhost:8000/chats/${currentChat.id}/messages/`,
        { role: 'user', content: message },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Get the updated chat with all messages (including assistant's response)
      const chatResponse = await axios.get(
        `http://localhost:8000/chats/${currentChat.id}/messages/`,
        { headers: { Authorization: `Bearer ${token}` }}
      );

      const serverUpdatedChat = {
        ...currentChat,
        messages: chatResponse.data
      };

      setCurrentChat(serverUpdatedChat);
      setChats(chats.map(chat =>
        chat.id === currentChat.id ? serverUpdatedChat : chat
      ));
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <button
          onClick={createNewChat}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          New Chat
        </button>
        <div className="space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setCurrentChat(chat)}
              className={`w-full text-left px-4 py-2 rounded ${
                currentChat?.id === chat.id ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
        <button
          onClick={logout}
          className="absolute bottom-4 left-4 text-gray-400 hover:text-white"
        >
          Logout
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-lg p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  disabled={loading || !message.trim()}
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat or create a new one
          </div>
        )}
      </div>
    </div>
  );
}