'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Brain, Loader2, User, Bot } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import LoadingScreen from '@/components/ui/loading-screen';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSimulation } from '@/contexts/SimulationContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  modelUsed?: string;
  modelDisplayName?: string;
}

interface RaceData {
  carNumber: string;
  currentLap: number;
  position: number;
  lapTime: string;
  fuelLevel: number;
  tireCondition: number;
  weather: string;
}

const DEFAULT_QUESTION = "What is the optimal pit stop window for the current race conditions?";

const getFollowUpQuestions = (lastMessage: string): string[] => {
  const lowerMsg = lastMessage.toLowerCase();
  
  if (lowerMsg.includes('pit') || lowerMsg.includes('stop')) {
    return [
      'What tire compound should I use after the pit stop?',
      'How long will the pit stop take?',
      'Should I adjust fuel strategy for the next stint?'
    ];
  }
  
  if (lowerMsg.includes('tire') || lowerMsg.includes('tyre')) {
    return [
      'When should I pit for fresh tires?',
      'What tire pressures should I run?',
      'How do I maximize tire life?'
    ];
  }
  
  if (lowerMsg.includes('weather') || lowerMsg.includes('rain') || lowerMsg.includes('wet')) {
    return [
      'Should I change my racing line for these conditions?',
      'When should I switch to wet tires?',
      'How does this affect fuel consumption?'
    ];
  }
  
  if (lowerMsg.includes('overtake') || lowerMsg.includes('pass')) {
    return [
      'What is my best defensive strategy?',
      'How can I protect my position in traffic?',
      'Should I focus on lap time or track position?'
    ];
  }
  
  return [
    'What should I focus on for the next few laps?',
    'How does this compare to our competitors?',
    'Any adjustments I should make to my driving?'
  ];
};

interface AIModel {
  name: string;
  displayName: string;
}

export default function PitWallAI() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(DEFAULT_QUESTION);
  const [isLoading, setIsLoading] = useState(false);
  const [raceData, setRaceData] = useState<RaceData | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('pitiq-lightning');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use centralized simulation context (no polling overhead)
  const { state: backendState, isActive } = useSimulation();
  
  // Redirect to login if no user
  useEffect(() => {
    if (!authLoading && !user?.id) {
      // Clear localStorage before redirect
      localStorage.removeItem('hasSession');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('debug_userId');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sim_active_')) {
          localStorage.removeItem(key);
        }
      });
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/gemini');
        const data = await response.json();
        if (data.availableModels) {
          setAvailableModels(data.availableModels);
          if (data.defaultModel) {
            setSelectedModel(data.defaultModel);
          }
        }
      } catch (error) {
        console.error('Failed to fetch available models:', error);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [wasInactive, setWasInactive] = useState(!isActive);

  useEffect(() => {
    if (!wasInactive && !isActive) {
      setWasInactive(true);
    } else if (wasInactive && isActive) {
      setWasInactive(false);
      router.refresh();
    }
  }, [isActive, wasInactive, router]);

  useEffect(() => {
    if (isActive && backendState) {
      const rawTelemetry = backendState.raw_telemetry || {};
      const derivedCarNumber = rawTelemetry.NUMBER || (backendState as any).carNumber || 22;
      setRaceData({
        carNumber: String(derivedCarNumber ?? '0'),
        currentLap: backendState.current_lap || 0,
        position: 1,
        lapTime: backendState.lap_time
          ? `${Math.floor(backendState.lap_time / 60)}:${(backendState.lap_time % 60)
              .toFixed(3)
              .padStart(6, '0')}`
          : '0:00.000',
        fuelLevel: backendState.fuel ? Math.round((backendState.fuel / 50) * 100) : 0,
        tireCondition: backendState.tire_age ? Math.max(0, 100 - backendState.tire_age * 2) : 0,
        weather: (rawTelemetry.RAINFALL_PERCENTAGE || 0) > 20 ? 'Wet' : 'Dry',
      });
    } else {
      setRaceData(null);
    }
  }, [isActive, backendState]);

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const raceContext = raceData 
        ? `Current Race Status:\n- Car Number: ${raceData.carNumber}\n- Current Lap: ${raceData.currentLap}\n- Position: ${raceData.position}\n- Last Lap Time: ${raceData.lapTime}\n- Fuel Level: ${raceData.fuelLevel}%\n- Tire Condition: ${raceData.tireCondition}%\n- Weather: ${raceData.weather}`
        : undefined;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          raceContext,
          preferredModel: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        let errorContent = '⚠️ **Connection Error**\n\n';
        
        if (data.failedModels && data.failedModels.length > 0) {
          errorContent += `Attempted models: ${data.failedModels.join(' → ')} → All failed\n\n`;
        }
        
        if (data.warning) {
          errorContent += `${data.warning}\n\n`;
        }
        
        errorContent += 'Please check your connection and try again, or select a different AI model.';
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      let responseContent = data.response;
      
      if (data.fallbackUsed && data.failedModels) {
        responseContent = `*Note: Primary model unavailable, response from ${data.modelDisplayName}*\n\n${responseContent}`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        modelUsed: data.modelUsed,
        modelDisplayName: data.modelDisplayName,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ **Network Error**\n\nUnable to connect to AI service. Please check your internet connection and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => sendMessage(prompt), 100);
  };

  if (authLoading) {
    return <LoadingScreen message="Loading Pit Wall AI..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen bg-black text-zinc-400 font-rajdhani overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="lg:pl-72 h-full flex flex-col">
        <div className="p-4 md:p-8 w-full max-w-[1600px] mx-auto flex flex-col h-full">
          <div className="border-b border-zinc-800 pb-4 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-wider mb-2 font-rajdhani">
              PIT WALL AI
            </h1>
            <p className="text-xs md:text-sm text-zinc-500 font-rajdhani mb-1">
              Professional AI Race Engineer - Real-time strategy and guidance
            </p>
          </div>

          {!isActive && (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="text-center space-y-6 max-w-md">
                <div className="relative">
                  <div className="text-8xl mb-4 animate-pulse">🏎️</div>
                  <div className="absolute inset-0 bg-orange-600/20 blur-3xl rounded-full" />
                </div>
                <h2 className="text-3xl font-bold text-zinc-100 tracking-wider">
                  NO SIMULATION RUNNING
                </h2>
                <p className="text-zinc-400 text-lg">
                  Start your engine and begin racing simulation
                </p>
                <button
                  onClick={() => {
                    window.open('/simulation-setup', '_blank');
                  }}
                  className="px-8 py-4 bg-linear-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-lg text-lg font-bold transition-all shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  START YOUR CAR
                </button>
              </div>
            </div>
          )}

          {isActive && (
            <div className="flex flex-col flex-1 min-h-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col flex-1 min-h-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-sm mb-4 overflow-hidden"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col flex-1 items-center justify-center text-center py-12 px-6">
                    <div className="w-20 h-20 bg-orange-600/10 rounded-full flex items-center justify-center mb-4">
                      <Bot className="w-10 h-10 text-orange-600/50" />
                    </div>
                    <p className="text-zinc-400 text-lg font-medium mb-2">Ready to assist</p>
                    <p className="text-xs text-zinc-600">Your AI race engineer is standing by for strategic guidance</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message, index) => (
                      <div key={message.id} className="space-y-3">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.role === 'assistant' && (
                            <div className="w-10 h-10 bg-linear-to-br from-orange-600/30 to-orange-600/10 rounded-xl flex items-center justify-center shrink-0 border border-orange-600/20">
                              <Bot className="w-5 h-5 text-orange-500" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-xl p-4 shadow-lg ${
                              message.role === 'user'
                                ? 'bg-linear-to-br from-orange-600 to-orange-700 text-white border border-orange-500/50'
                                : 'bg-linear-to-br from-zinc-800 to-zinc-900 text-zinc-100 border border-zinc-700/50'
                            }`}
                          >
                            {message.role === 'assistant' ? (
                              <div className="text-sm prose prose-invert prose-orange max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="text-zinc-200">{children}</li>,
                                    strong: ({ children }) => <strong className="text-orange-400 font-bold">{children}</strong>,
                                    em: ({ children }) => <em className="text-zinc-300">{children}</em>,
                                    h1: ({ children }) => <h1 className="text-lg font-bold text-orange-400 mb-2">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-base font-bold text-orange-400 mb-2">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-bold text-orange-400 mb-1">{children}</h3>,
                                    code: ({ children }) => <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-orange-400">{children}</code>,
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            )}
                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-700/30">
                              <p className="text-xs opacity-50">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                              {message.role === 'assistant' && message.modelDisplayName && (
                                <>
                                  <span className="text-xs opacity-30">•</span>
                                  <span className="text-xs px-2.5 py-0.5 bg-orange-600/20 text-orange-400 rounded-full border border-orange-600/30 font-medium">
                                    {message.modelDisplayName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {message.role === 'user' && (
                            <div className="w-10 h-10 bg-linear-to-br from-zinc-700 to-zinc-800 rounded-xl flex items-center justify-center shrink-0 border border-zinc-600/50">
                              <User className="w-5 h-5 text-zinc-300" />
                            </div>
                          )}
                        </motion.div>
                        
                        {message.role === 'assistant' && index === messages.length - 1 && !isLoading && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="ml-12 space-y-2 mt-2"
                          >
                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Quick Follow-ups:</p>
                            <div className="flex flex-wrap gap-2">
                              {getFollowUpQuestions(message.content).map((question, qIndex) => (
                                <button
                                  key={qIndex}
                                  onClick={() => handleQuickPrompt(question)}
                                  className="text-xs px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-orange-600/50 transition-all text-zinc-300 hover:text-orange-400"
                                >
                                  {question}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 justify-start"
                      >
                        <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center shrink-0">
                          <Bot className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="bg-zinc-800 rounded-lg p-4">
                          <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onSubmit={handleSubmit}
                  className="border-t border-zinc-800 bg-linear-to-br from-zinc-900 to-black py-1"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask your race engineer..."
                    disabled={isLoading}
                    rows={2}
                    className="w-full bg-transparent px-4 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none disabled:opacity-50 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <div className="flex items-center justify-between px-4 pb-2">
                    <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs">Enter</kbd>
                      <span>to send</span>
                      <span className="text-zinc-700">•</span>
                      <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs">Shift+Enter</kbd>
                      <span>new line</span>
                    </p>
                    <div className="flex items-center gap-3">
                      {availableModels.length > 1 && (
                        <div className="flex items-center gap-2">
                          <Brain className="w-3.5 h-3.5 text-zinc-500" />
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="h-8 w-36 bg-zinc-800 border-zinc-700 text-zinc-300 text-xs hover:border-orange-600/50 transition-colors">
                              <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableModels.map((model) => (
                                <SelectItem key={model.name} value={model.name}>
                                  {model.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <motion.button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="w-10 h-10 bg-linear-to-br from-orange-600 to-orange-700 text-white rounded-full font-bold hover:from-orange-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50"
                        whileHover={{ scale: isLoading ? 1 : 1.05 }}
                        whileTap={{ scale: isLoading ? 1 : 0.95 }}
                        title={isLoading ? 'Thinking...' : 'Send message'}
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.form>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}