import React, { useState } from 'react';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        messages: [...messages, userMessage]
      });
      
      const choices = response.data?.choices;
      if (choices && choices.length > 0) {
        const assistantMessage: Message = { role: 'assistant', content: choices[0].message.content };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No response content received from API');
      }
    } catch (error) {
      console.error('Chat error:', error);
      alert('Failed to get a response from the chat bot. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4 gap-4">
      <h1 className="text-2xl font-bold">Simple Chat Bot</h1>
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded ${m.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'}`}>
            {m.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          className="flex-1 border p-2 rounded"
          placeholder="Ask something..."
        />
        <button onClick={sendMessage} disabled={loading} className="bg-blue-500 text-white p-2 rounded">
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
