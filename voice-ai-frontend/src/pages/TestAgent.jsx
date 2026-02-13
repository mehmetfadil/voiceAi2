// voice-ai-frontend/src/pages/TestAgent.jsx
import React, { useState, useRef, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PixelVisualizer from '../components/dashboard/PixelVisualizer';
import Button from '../components/common/Button';
import { Mic, Send, Bot, User, RotateCcw, Volume2, FileText, MicOff } from 'lucide-react';
import { cn } from '../utils/cn';

const TestAgent = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [status, setStatus] = useState('idle');
    const [isListening, setIsListening] = useState(false);

    const chatEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const audioQueue = useRef([]);
    const isPlayingAudio = useRef(false);
    const currentAudio = useRef(new Audio());

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const token = localStorage.getItem('token');

    // Ses Kuyruğu
    const processAudioQueue = () => {
        if (isPlayingAudio.current || audioQueue.current.length === 0) return;

        isPlayingAudio.current = true;
        const base64Audio = audioQueue.current.shift();

        const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
        currentAudio.current.src = audioSrc;

        currentAudio.current.onended = () => {
            isPlayingAudio.current = false;
            processAudioQueue();
        };

        currentAudio.current.play().catch(e => {
            console.error("Audio play error:", e);
            isPlayingAudio.current = false;
            processAudioQueue();
        });
    };

    // Scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, status]);

    // STT
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'tr-TR';
            recognition.interimResults = true;

            recognition.onstart = () => {
                setIsListening(true);
                setStatus('listening');
            };

            recognition.onend = () => {
                setIsListening(false);
                setStatus(prev => prev === 'listening' ? 'idle' : prev);
            };

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                setInputText(transcript);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleMicrophone = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setInputText('');
            recognitionRef.current.start();
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!inputText.trim()) return;

        const userText = inputText;
        setInputText('');
        setStatus('thinking');

        // ID üretimini burada yapıyoruz (Render dışında)
        const userMsgId = crypto.randomUUID();
        const agentMsgId = crypto.randomUUID();

        // Mesajları ekle
        setMessages(prev => [
            ...prev,
            {
                id: userMsgId,
                sender: 'user',
                text: userText,
                timestamp: new Date().toLocaleTimeString()
            },
            {
                id: agentMsgId,
                sender: 'agent',
                text: '',
                sources: [],
                timestamp: new Date().toLocaleTimeString()
            }
        ]);

        try {
            const response = await fetch(`${apiBaseUrl}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: userText })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split('\n\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.replace('data: ', '');
                            const event = JSON.parse(jsonStr);
                            handleStreamEvent(event, agentMsgId);
                        } catch (e) {
                            console.error("JSON Parse Error:", e);
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => prev.map(msg =>
                msg.id === agentMsgId ? { ...msg, text: "⚠️ Bağlantı hatası.", isError: true } : msg
            ));
            setStatus('idle');
        }
    };

    const handleStreamEvent = (event, msgId) => {
        const { type, data } = event;

        switch (type) {
            case 'status':
                setStatus(data === 'done' ? 'idle' : data)
                break;
            case 'sources':
                setMessages(prev => prev.map(msg =>
                    msg.id === msgId ? { ...msg, sources: data } : msg
                ));
                break;
            case 'token':
                // Token geldiğinde state'i güncelle
                setMessages(prev => prev.map(msg =>
                    msg.id === msgId ? { ...msg, text: msg.text + data } : msg
                ));
                break;
            case 'audio':
                audioQueue.current.push(data);
                processAudioQueue();
                break;
            default:
                break;
        }
    };

    return (
        <MainLayout>
            {/* Üst Başlık */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wide flex items-center gap-2">
                        Test Lab <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-mono border border-red-500/30">STREAMING</span>
                    </h1>
                    <p className="text-gray-400 font-mono text-sm mt-1">Real-time Low Latency Pipeline</p>
                </div>
                <button onClick={() => setMessages([])} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                    <RotateCcw size={18} />
                </button>
            </div>

            <div className="mb-6">
                <PixelVisualizer isActive={status === 'speaking' || status === 'listening'} />
            </div>

            {/* Mesaj Alanı */}
            <div className="flex-1 min-h-[400px] max-h-[500px] overflow-y-auto mb-6 pr-2 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-20 font-mono">
                        System ready. Waiting for input...
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-4 max-w-3xl", msg.sender === 'user' ? "ml-auto flex-row-reverse" : "")}>
                        <div className={cn(
                            "w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 border shadow-pixel",
                            msg.sender === 'agent' ? "bg-primary/10 border-primary/50 text-primary" : "bg-white/10 border-white/20 text-white"
                        )}>
                            {msg.sender === 'agent' ? <Bot size={20} /> : <User size={20} />}
                        </div>

                        <div className="flex flex-col gap-1 min-w-0">
                            <div className={cn("flex items-center gap-2 text-xs font-mono", msg.sender === 'user' ? "justify-end text-gray-400" : "text-primary-dim")}>
                                <span>{msg.sender === 'agent' ? 'AI_Agent' : 'You'}</span>
                                <span>•</span>
                                <span>{msg.timestamp}</span>
                            </div>

                            <div className={cn(
                                "p-4 rounded-sm border relative text-sm leading-relaxed shadow-lg transition-all",
                                msg.sender === 'agent' ? "bg-background-surface border-white/10 text-gray-200" : "bg-white text-black border-white",
                                msg.isError && "border-red-500 text-red-500"
                            )}>
                                <p className="whitespace-pre-wrap">
                                    {msg.text}
                                    {msg.sender === 'agent' && status === 'speaking' && msg.id === messages[messages.length - 1].id && (
                                        <span className="inline-block w-2 h-4 bg-primary ml-1 align-middle animate-pulse"></span>
                                    )}
                                </p>
                            </div>

                            {msg.sender === 'agent' && msg.sources && msg.sources.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {msg.sources.map((source, idx) => (
                                        <span key={idx} className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 font-mono">
                                            <FileText size={10} />
                                            {source.source}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <div ref={chatEndRef} />
            </div>

            {/* Input Alanı */}
            <div className="mt-auto bg-background-surface/50 border-t border-white/10 p-4 -mx-8 -mb-8 sticky bottom-0 backdrop-blur-md">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-3">
                    <button
                        type="button"
                        onClick={toggleMicrophone}
                        className={cn(
                            "h-12 w-12 flex items-center justify-center rounded border-2 transition-all duration-200",
                            isListening
                                ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                : "bg-background-dark border-white/20 text-gray-400 hover:text-primary hover:border-primary"
                        )}
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={status === 'speaking' ? "Agent is speaking..." : "Type your message..."}
                            disabled={status === 'speaking' || isListening}
                            className="w-full h-12 bg-background-dark border border-white/20 rounded pl-4 pr-12 text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors shadow-inner disabled:opacity-50"
                        />
                    </div>

                    <Button type="submit" className="h-12 flex items-center gap-2" disabled={status !== 'idle'}>
                        <span className="hidden md:inline">SEND</span>
                        <Send size={18} />
                    </Button>
                </form>
            </div>
        </MainLayout>
    );
};

export default TestAgent;