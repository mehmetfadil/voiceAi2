import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PixelCard from '../components/common/PixelCard';
import Button from '../components/common/Button';
import { UploadCloud, FileText, Save, Database, CheckCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import axios from 'axios';

const KnowledgeBase = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [systemPrompt, setSystemPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [promptStatus, setPromptStatus] = useState(null);

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const token = localStorage.getItem('token');

    // Sayfa yüklenince mevcut promptu çek
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await axios.get(`${apiBaseUrl}/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSystemPrompt(res.data.system_prompt);
            } catch (err) {
                console.error("User data fetch error", err);
            }
        };
        if (token) fetchUserData();
    }, [token]);

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => { setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) setFile(droppedFile);
    };

    const handleFileUpload = async () => {
        if (!file) return;
        setLoading(true);
        setUploadStatus(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post(`${apiBaseUrl}/upload-doc`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setUploadStatus('success');
            setFile(null);
        } catch (err) {
            console.error(err);
            setUploadStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePrompt = async () => {
        setLoading(true);
        try {
            await axios.put(`${apiBaseUrl}/update-persona`,
                { system_prompt: systemPrompt },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPromptStatus('saved');
            setTimeout(() => setPromptStatus(null), 3000);
        } catch (err) {
            console.error(err);
            setPromptStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded border border-primary/30">
                        <Database className="text-primary" size={24} />
                    </div>
                    <h1 className="text-3xl font-bold uppercase tracking-wide">
                        Knowledge & Persona
                    </h1>
                </div>
                <p className="text-gray-400 font-mono ml-14">
                    Manage company documents and define AI behavior.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* SOL SÜTUN: Dosya Yükleme (RAG) */}
                <PixelCard title="Knowledge Base (RAG)">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-white mb-1">Upload Documents</h3>
                        <p className="text-sm text-gray-400">
                            Upload PDF, DOCX or TXT files. The AI will use this knowledge to answer questions.
                        </p>
                    </div>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "relative border-2 border-dashed rounded-lg p-8 transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[300px] group cursor-pointer",
                            isDragging ? "border-primary bg-primary/5 animate-pulse" : "border-white/10 bg-background-surface/50 hover:border-primary/50 hover:bg-white/5"
                        )}
                    >
                        <input type="file" className="hidden" accept=".pdf,.docx,.txt" id="doc-upload" onChange={(e) => setFile(e.target.files[0])} />
                        <label htmlFor="doc-upload" className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                            {file ? (
                                <div className="flex flex-col items-center gap-2 p-4 bg-primary/10 border border-primary rounded">
                                    <FileText className="text-primary" size={40} />
                                    <span className="font-mono text-white break-all">{file.name}</span>
                                    <span className="text-xs text-primary-dim">Click to change</span>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 rounded-full bg-background-dark border border-white/10 mb-4 group-hover:border-primary/50 group-hover:text-primary transition-colors text-gray-400">
                                        <UploadCloud size={32} />
                                    </div>
                                    <p className="text-lg font-medium text-white mb-1">
                                        <span className="text-primary cursor-pointer hover:underline">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono mt-2">PDF, DOCX, TXT</p>
                                </>
                            )}
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end items-center gap-4">
                        {uploadStatus === 'success' && <span className="text-green-500 text-sm font-mono flex items-center gap-1"><CheckCircle size={14} /> Indexed Successfully</span>}
                        {uploadStatus === 'error' && <span className="text-red-500 text-sm font-mono">Upload Failed</span>}

                        <Button onClick={handleFileUpload} disabled={!file || loading} size="sm">
                            {loading ? 'Processing...' : 'Upload & Index'}
                        </Button>
                    </div>
                </PixelCard>

                {/* SAĞ SÜTUN: Persona Ayarları */}
                <PixelCard title="AI Persona Settings">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-white mb-1">System Prompt</h3>
                        <p className="text-sm text-gray-400">
                            Define the AI's role, tone, and constraints.
                        </p>
                    </div>

                    <div className="relative">
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="w-full min-h-[300px] bg-background-dark/80 border border-white/10 rounded-lg p-4 text-white font-mono focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-gray-600"
                            placeholder="You are a helpful customer support agent for TechCorp. Answer strictly based on the provided context..."
                        ></textarea>
                        <div className="absolute bottom-4 right-4 text-xs text-gray-500 font-mono">
                            Defines Global Behavior
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end items-center gap-4">
                        {promptStatus === 'saved' && <span className="text-green-500 text-sm font-mono flex items-center gap-1"><CheckCircle size={14} /> Saved</span>}

                        <Button onClick={handleSavePrompt} disabled={loading} size="sm" className="flex items-center gap-2">
                            <Save size={16} /> Save Persona
                        </Button>
                    </div>
                </PixelCard>

            </div>
        </MainLayout>
    );
};

export default KnowledgeBase;