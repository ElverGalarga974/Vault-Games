import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, Plus, Trash2, MessageSquare, Loader2, Sparkles, ChevronLeft, Edit2, Check, X, Image as ImageIcon } from 'lucide-react';
import { aiChatApi, AIConversation, AIMessage } from '../api/client';
import { useGameContext } from '../context/GameContext';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function MarkdownContent({ content }: { content: string }) {
  if (content.startsWith('![Generated image](') && content.endsWith(')')) {
    const imageUrl = content.slice('![Generated image]('.length, -1);
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(imageUrl)) {
      return <img src={imageUrl} alt="Generated" className="rounded-2xl max-w-full border border-white/10" />;
    }
  }
  const escaped = escapeHtml(content);
  const html = escaped
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-black/50 rounded-lg p-3 my-2 overflow-x-auto text-sm border border-white/10"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-sm text-fuchsia-300">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function AIChatPage() {
  const { state } = useGameContext();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [mode, setMode] = useState<'chat' | 'image'>('chat');
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<{ icon: string; title: string; description: string; date: string } | null>(null);
  const [recommendations, setRecommendations] = useState('');
  const [loadingRecs, setLoadingRecs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = state.authMode === 'logged_in';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    aiChatApi.getConversations().then(convs => {
      setConversations(convs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isLoggedIn]);

  useEffect(() => {
    if (!activeConvId || !isLoggedIn) return;
    aiChatApi.getMessages(activeConvId).then(msgs => {
      setMessages(msgs);
    }).catch(() => {});
  }, [activeConvId, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    aiChatApi.getDailyChallenge().then(d => setDailyChallenge(d.challenge)).catch(() => {});
  }, [isLoggedIn]);

  const loadRecommendations = async () => {
    if (loadingRecs) return;
    setLoadingRecs(true);
    setRecommendations('');
    try {
      for await (const chunk of aiChatApi.recommendationsStream()) {
        setRecommendations(prev => prev + chunk);
      }
    } catch {}
    setLoadingRecs(false);
  };

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      setPendingImage({ base64, mimeType: file.type, preview: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const createConversation = async () => {
    if (!isLoggedIn) return;
    try {
      const conv = await aiChatApi.createConversation();
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
      inputRef.current?.focus();
    } catch {}
  };

  const deleteConversation = async (id: number) => {
    try {
      await aiChatApi.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch {}
  };

  const startRename = (conv: AIConversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const confirmRename = async () => {
    if (!editingId || !editTitle.trim()) return;
    try {
      await aiChatApi.renameConversation(editingId, editTitle.trim());
      setConversations(prev => prev.map(c => c.id === editingId ? { ...c, title: editTitle.trim() } : c));
    } catch {}
    setEditingId(null);
  };

  const sendMessage = async () => {
    if ((!input.trim() && !pendingImage) || isStreaming || !isLoggedIn) return;

    let convId = activeConvId;
    if (!convId) {
      try {
        const conv = await aiChatApi.createConversation((input.trim() || 'Image').substring(0, 60));
        setConversations(prev => [conv, ...prev]);
        convId = conv.id;
        setActiveConvId(conv.id);
      } catch { return; }
    }

    const msgContent = pendingImage
      ? (input.trim() ? `${input.trim()}\n[Image attached]` : '[Image attached]')
      : input.trim();

    const userMsg: AIMessage = {
      id: Date.now(),
      role: 'user',
      content: msgContent,
      created_at: new Date().toISOString(),
    };

    // Show image preview inline in message history
    const userMsgDisplay: AIMessage = pendingImage
      ? { ...userMsg, content: input.trim() || ' ', _imagePreview: pendingImage.preview } as any
      : userMsg;

    setMessages(prev => [...prev, userMsgDisplay]);
    const imgBase64 = pendingImage?.base64;
    const imgMime = pendingImage?.mimeType;
    setInput('');
    setPendingImage(null);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      if (mode === 'image') {
        const result = await aiChatApi.sendImage(convId!, userMsg.content);
        const assistantMsg: AIMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `![Generated image](${result.imageUrl})`,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        setStreamingContent('');
        setIsStreaming(false);
        return;
      }
      let fullContent = '';
      for await (const chunk of aiChatApi.sendMessageStream(convId!, input.trim() || 'What is in this image?', imgBase64, imgMime)) {
        fullContent += chunk;
        setStreamingContent(fullContent);
      }
      const assistantMsg: AIMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: fullContent,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setStreamingContent('');

      if (messages.length === 0) {
        setConversations(prev => prev.map(c =>
          c.id === convId ? { ...c, title: userMsg.content.substring(0, 60) } : c
        ));
      }
    } catch (err: any) {
      const errMsg: AIMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
      setStreamingContent('');
    }
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isLoggedIn) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center py-20">
        <div className="p-6 bg-violet-500/20 rounded-3xl inline-block mb-6 border border-violet-500/30">
          <Bot className="w-16 h-16 text-violet-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Vault AI</h1>
        <p className="text-gray-400 text-lg mb-2">Chat with Vault AI — powered by Gemini.</p>
        <p className="text-gray-500">Log in to start chatting and save your conversation history.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[calc(100vh-80px)] -m-3 sm:-m-6 md:-m-10">
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-[#151515] border-r border-white/5 flex flex-col overflow-hidden shrink-0"
          >
            <div className="p-3 border-b border-white/5">
              <button
                onClick={createConversation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => setMode('chat')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${mode === 'chat' ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setMode('image')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'image' ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                  <ImageIcon className="w-4 h-4" />
                  Picture
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No conversations yet
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                      activeConvId === conv.id ? 'bg-violet-600/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                    onClick={() => { setActiveConvId(conv.id); setShowSidebar(window.innerWidth >= 768); }}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    {editingId === conv.id ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 bg-black/30 text-white text-sm px-2 py-1 rounded border border-white/10 outline-none"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditingId(null); }}
                          autoFocus
                        />
                        <button onClick={(e) => { e.stopPropagation(); confirmRename(); }} className="text-green-400 hover:text-green-300"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="text-gray-500 hover:text-gray-300"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm truncate">{conv.title}</span>
                        <div className="hidden group-hover:flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); startRename(conv); }} className="text-gray-500 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#151515]">
          <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
            <ChevronLeft className={`w-5 h-5 transition-transform ${showSidebar ? '' : 'rotate-180'}`} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white">Vault AI</h2>
          </div>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">Gemini</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!activeConvId && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-5 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-3xl mb-6 border border-violet-500/20">
                <Bot className="w-12 h-12 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">How can I help?</h3>
              <p className="text-gray-500 max-w-md mb-6">Ask me anything — homework, coding, gaming tips, or generate a picture.</p>

              {dailyChallenge && (
                <div className="w-full max-w-lg mb-6 p-4 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-2xl text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{dailyChallenge.icon}</span>
                    <span className="text-xs text-violet-400 font-semibold uppercase tracking-wide">Daily Challenge · {dailyChallenge.date}</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{dailyChallenge.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{dailyChallenge.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full mb-4">
                {[
                  'Help me with my math homework',
                  'Give me chess opening tips',
                  'How do I get better at 2048?',
                  'Give me study tips for exams',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                    className="text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <button
                onClick={loadRecommendations}
                disabled={loadingRecs}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-xl text-sm text-violet-300 hover:text-violet-200 transition-all disabled:opacity-50"
              >
                {loadingRecs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Recommend games for me
              </button>

              {recommendations && (
                <div className="mt-4 w-full max-w-lg p-4 bg-white/5 border border-white/10 rounded-2xl text-left">
                  <MarkdownContent content={recommendations} />
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center mt-1">
                      <Bot className="w-4 h-4 text-violet-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white px-4 py-3 rounded-2xl rounded-br-md'
                      : 'bg-[#1a1a1a] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md'
                  }`}>
                    {msg.role === 'user' ? (
                      <div className="flex flex-col gap-2">
                        {(msg as any)._imagePreview && (
                          <img src={(msg as any)._imagePreview} alt="attached" className="max-w-[200px] rounded-xl object-contain border border-white/20" />
                        )}
                        {msg.content.replace('\n[Image attached]', '').trim() && (
                          <p className="whitespace-pre-wrap">{msg.content.replace('\n[Image attached]', '')}</p>
                        )}
                      </div>
                    ) : (
                      <MarkdownContent content={msg.content} />
                    )}
                  </div>
                </div>
              ))}

              {isStreaming && streamingContent && (
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center mt-1">
                    <Bot className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="max-w-[80%] bg-[#1a1a1a] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md">
                    <MarkdownContent content={streamingContent} />
                  </div>
                </div>
              )}

              {isStreaming && !streamingContent && (
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center mt-1">
                    <Bot className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="bg-[#1a1a1a] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-white/5 bg-[#151515]">
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            {pendingImage && (
              <div className="relative inline-block self-start">
                <img src={pendingImage.preview} alt="pending" className="h-20 rounded-xl object-cover border border-white/10" />
                <button
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/80 border border-white/20 rounded-full flex items-center justify-center text-gray-300 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { handleImageFile(f); e.target.value = ''; } }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming || mode === 'image'}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0 disabled:opacity-30"
                title="Attach image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'image' ? 'Describe the picture you want...' : 'Message Vault AI...'}
                rows={1}
                className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-violet-500/50 transition-colors max-h-36 overflow-y-auto"
                style={{ minHeight: '48px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = '48px';
                  target.style.height = Math.min(target.scrollHeight, 144) + 'px';
                }}
                disabled={isStreaming}
              />
              <button
                onClick={sendMessage}
                disabled={(!input.trim() && !pendingImage) || isStreaming}
                className={`p-3 rounded-xl transition-all shrink-0 ${
                  (input.trim() || pendingImage) && !isStreaming
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
              >
                {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-gray-600 mt-2">Vault AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </motion.div>
  );
}
