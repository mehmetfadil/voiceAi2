import React, { useState, useRef, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PixelVisualizer from '../components/dashboard/PixelVisualizer';
import Button from '../components/common/Button';
import { Mic, Send, Bot, User, RotateCcw, FileText, MicOff, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

const TestAgent = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [status, setStatus] = useState('idle');
    const [isListening, setIsListening] = useState(false);
    // STT işlem durumunu takip etmek için (görsel amaçlı)
    const [isTranscribing, setIsTranscribing] = useState(false);

    const chatEndRef = useRef(null);

    // Global Stream Referansı (Sürekli mikrofon izni istememek için)
    const streamRef = useRef(null);

    // Döngü Kontrolü
    const isLoopingRef = useRef(false);

    // Playback Referansları
    const audioQueue = useRef([]);
    const isPlayingAudio = useRef(false);
    const currentAudio = useRef(new Audio());

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const token = localStorage.getItem('token');

    // --- SES OYNATMA KUYRUĞU (TTS) ---
    const processAudioQueue = () => {
        if (isPlayingAudio.current || audioQueue.current.length === 0) return;

        const base64Audio = audioQueue.current.shift();

        // Boş veya geçersiz ses verisi kontrolü
        if (!base64Audio || base64Audio.length < 10) {
            processAudioQueue();
            return;
        }

        isPlayingAudio.current = true;
        const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
        currentAudio.current.src = audioSrc;

        currentAudio.current.onended = () => {
            isPlayingAudio.current = false;
            processAudioQueue();
        };
        currentAudio.current.onerror = () => {
            isPlayingAudio.current = false;
            processAudioQueue();
        };
        currentAudio.current.play().catch(() => {
            isPlayingAudio.current = false;
            processAudioQueue();
        });
    };

    // --- SCROLL TO BOTTOM ---
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, status, inputText]);

    // --- SES KAYIT DÖNGÜSÜ (HEADER FIX) ---
    const startRecordingLoop = async () => {
        try {
            // 1. Mikrofon akışını al (varsa mevcudu kullan)
            if (!streamRef.current) {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            isLoopingRef.current = true;
            setIsListening(true);
            setStatus('listening');

            // Döngüyü başlat
            recordNextChunk();

        } catch (err) {
            console.error("Mikrofon hatası:", err);
            alert("Mikrofon erişimi sağlanamadı.");
            setIsListening(false);
        }
    };

    const recordNextChunk = () => {
        // Döngü durdurulduysa işlem yapma
        if (!isLoopingRef.current || !streamRef.current) return;

        // Yeni bir kaydedici oluştur (Her seferinde "Header" yeniden yazılır)
        const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
        const audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            // Kayıt durunca eldeki veriyi blob yap
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

            // Eğer blob geçerliyse gönder
            if (audioBlob.size > 0 && isLoopingRef.current) {
                await sendAudioChunkToBackend(audioBlob);
            }

            // Döngü hala aktifse yeni bir kayıt başlat
            if (isLoopingRef.current) {
                recordNextChunk();
            }
        };

        // Kaydı başlat
        mediaRecorder.start();

        // 2 Saniye sonra durdur (Bu, onstop'u tetikler ve döngüyü sürdürür)
        setTimeout(() => {
            if (mediaRecorder.state === "recording") {
                mediaRecorder.stop();
            }
        }, 2000); // 2000ms = 2 saniyelik parçalar
    };

    const stopRecordingLoop = () => {
        isLoopingRef.current = false; // Döngüyü kır
        setIsListening(false);

        // Stream'i temizle (Mikrofon ışığını söndür)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Status güncellemesi (Hemen idle yapmıyoruz, son işlem bitince idle olacak)
        if (!isTranscribing) setStatus('idle');
    };

    const toggleMicrophone = () => {
        if (isListening) {
            stopRecordingLoop();
        } else {
            setInputText(''); // Yeni konuşma için temizle
            startRecordingLoop();
        }
    };

    // --- PARÇAYI BACKEND'E GÖNDER ---
    const sendAudioChunkToBackend = async (audioBlob) => {
        setIsTranscribing(true);
        const formData = new FormData();
        // Backend 'recording.webm' bekliyor (stt_service.py ile uyumlu)
        formData.append('file', audioBlob, 'recording.webm');

        try {
            const response = await fetch(`${apiBaseUrl}/transcribe`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                if (data.text) {
                    // Gelen metni mevcudun üzerine ekle
                    setInputText(prev => {
                        // Eğer önceki metin varsa boşluk bırakarak ekle
                        const newText = prev ? `${prev} ${data.text}` : data.text;
                        return newText;
                    });
                }
            } else {
                console.warn("Chunk upload failed:", response.status);
            }
        } catch (error) {
            console.error("Chunk Error:", error);
        } finally {
            // Eğer kullanıcı durdurduysa ve bu son işlemse idle yap
            if (!isLoopingRef.current) {
                setIsTranscribing(false);
                setStatus('idle');
            }
        }
    };

    // --- MESAJ GÖNDERME ---
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();

        // Konuşma devam ediyorsa durdur
        if (isListening) {
            stopRecordingLoop();
            // Son parça için ufak bir bekleme (opsiyonel)
            await new Promise(r => setTimeout(r, 500));
        }

        const messageToSend = inputText.trim();
        if (!messageToSend) return;

        setInputText('');
        setStatus('thinking');

        const userMsgId = crypto.randomUUID();
        const agentMsgId = crypto.randomUUID();

        setMessages(prev => [
            ...prev,
            { id: userMsgId, sender: 'user', text: messageToSend, timestamp: new Date().toLocaleTimeString() },
            { id: agentMsgId, sender: 'agent', text: '', sources: [], timestamp: new Date().toLocaleTimeString() }
        ]);

        try {
            const response = await fetch(`${apiBaseUrl}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: messageToSend })
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
                        } catch (e) { console.error(e); }
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setStatus('idle');
        }
    };

    const handleStreamEvent = (event, msgId) => {
        const { type, data } = event;
        switch (type) {
            case 'status': setStatus(data === 'done' ? 'idle' : data); break;
            case 'sources':
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, sources: data } : m)); break;
            case 'token':
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: m.text + data } : m)); break;
            case 'audio':
                audioQueue.current.push(data);
                processAudioQueue(); break;
        }
    };

    return (
        <MainLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wide flex items-center gap-2">
                        Test Lab <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-mono border border-purple-500/30">FAL.AI LIVE</span>
                    </h1>
                    <p className="text-gray-400 font-mono text-sm mt-1">Chunked Audio Processing</p>
                </div>
                <button onClick={() => setMessages([])} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                    <RotateCcw size={18} />
                </button>
            </div>

            <div className="mb-6">
                <PixelVisualizer isActive={status === 'speaking' || status === 'listening'} />
            </div>

            <div className="flex-1 min-h-[400px] max-h-[500px] overflow-y-auto mb-6 pr-2 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-20 font-mono">
                        System ready.
                        <br />
                        Wait 2-3 seconds to see text while speaking.
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-4 max-w-3xl", msg.sender === 'user' ? "ml-auto flex-row-reverse" : "")}>
                        <div className={cn("w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 border shadow-pixel", msg.sender === 'agent' ? "bg-primary/10 border-primary/50 text-primary" : "bg-white/10 border-white/20 text-white")}>
                            {msg.sender === 'agent' ? <Bot size={20} /> : <User size={20} />}
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                            <div className={cn("flex items-center gap-2 text-xs font-mono", msg.sender === 'user' ? "justify-end text-gray-400" : "text-primary-dim")}>
                                <span>{msg.sender === 'agent' ? 'AI_Agent' : 'You'}</span>
                            </div>
                            <div className={cn("p-4 rounded-sm border relative text-sm leading-relaxed shadow-lg transition-all", msg.sender === 'agent' ? "bg-background-surface border-white/10 text-gray-200" : "bg-white text-black border-white")}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <div className="mt-auto bg-background-surface/50 border-t border-white/10 p-4 -mx-8 -mb-8 sticky bottom-0 backdrop-blur-md">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-3">
                    <button
                        type="button"
                        onClick={toggleMicrophone}
                        disabled={status === 'thinking'}
                        className={cn(
                            "h-12 w-12 flex items-center justify-center rounded border-2 transition-all duration-200 relative",
                            isListening
                                ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                : "bg-background-dark border-white/20 text-gray-400 hover:text-primary hover:border-primary"
                        )}
                    >
                        {isTranscribing && isListening ? <Loader2 size={20} className="animate-spin text-primary" /> : (isListening ? <MicOff size={20} /> : <Mic size={20} />)}
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={isListening ? "Listening... (Text updates every 2s)" : "Type your message..."}
                            className="w-full h-12 bg-background-dark border border-white/20 rounded pl-4 pr-12 text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors shadow-inner"
                        />
                    </div>

                    <Button type="submit" className="h-12 flex items-center gap-2" disabled={status === 'thinking' || (!inputText.trim() && !isListening)}>
                        <span className="hidden md:inline">SEND</span>
                        <Send size={18} />
                    </Button>
                </form>
            </div>
        </MainLayout>
    );
};

export default TestAgent;