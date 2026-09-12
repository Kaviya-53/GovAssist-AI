import React, { useState, useRef, useEffect } from 'react';
import { chatApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bot,
  User,
  Send,
  Sparkles,
  ExternalLink,
  HelpCircle,
  Wheat,
  GraduationCap,
  FileText,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function AIAssistantPage({ onSelectScheme, setActiveTab, initialQuery }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Namaste, ${user?.full_name || 'Citizen'}! I am **GovAssist AI**, your intelligent Government Scheme & Document Assistant.\n\nI can help you discover schemes you qualify for, understand required documents, calculate eligibility, and guide you through official application portals. Ask me anything!`,
      suggestions: [
        'Which schemes am I eligible for?',
        'Show schemes for farmers',
        'Show schemes for students',
        'What documents are required for PM-KISAN?',
        'How can I apply for Ayushman Bharat?',
      ],
      schemes: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  const handleSend = async (textToSend) => {
    const q = textToSend || input;
    if (!q.trim() || loading) return;

    const userMessage = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.sendMessage(q);
      const assistantMessage = {
        role: 'assistant',
        content: response.response,
        suggestions: response.suggestions || [],
        schemes: response.schemes || [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered a temporary network issue. Please check that the GovAssist AI backend service is running and try again.',
          suggestions: ['Which schemes am I eligible for?', 'Show schemes for farmers'],
          schemes: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content) => {
    // Render basic bold markdown and linebreaks
    const parts = content.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-xs">
        {parts.map((p, idx) => {
          if (!p.trim()) return <div key={idx} className="h-1" />;
          // Quick bold converter
          const formatted = p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{ __html: formatted }}
              className="text-slate-800"
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)] bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
      {/* Assistant Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-sm text-slate-900">GovAssist AI Assistant</h2>
              <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                Live Knowledge Base
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Personalized for {user?.full_name || 'Citizen'} ({user?.email})
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                role: 'assistant',
                content: `Chat session cleared. How can I assist you with government schemes or document requirements today?`,
                suggestions: [
                  'Which schemes am I eligible for?',
                  'Show schemes for farmers',
                  'What documents are required?',
                ],
                schemes: [],
              },
            ])
          }
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          title="Reset chat"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl p-4 shadow-2xs ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-50 border border-slate-200 rounded-bl-none'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-xs leading-relaxed text-white">{msg.content}</p>
              ) : (
                <>
                  {renderContent(msg.content)}

                  {/* Attached Scheme Cards if present in response */}
                  {msg.schemes && msg.schemes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 gap-2">
                      {msg.schemes.map((s, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-blue-600 font-mono">
                              {s.code}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                          </div>
                          <button
                            onClick={() => {
                              onSelectScheme(s);
                              setActiveTab('scheme-details');
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:underline shrink-0 ml-2"
                          >
                            Details →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Follow-up Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 pt-2.5 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(sug)}
                          className="text-[11px] font-medium bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2.5 py-1 transition-all cursor-pointer shadow-2xs"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-none p-3 shadow-2xs flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-[11px] font-semibold text-slate-500 ml-1">
                Searching scheme database...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything (e.g. 'What documents for PM-KISAN?', 'Show schemes for farmers')..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 outline-hidden transition-all shadow-xs"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-40 cursor-pointer"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
