import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PixelCard from '../components/common/PixelCard';
import Button from '../components/common/Button';
import { UploadCloud, Mic, FileAudio } from 'lucide-react';
import { cn } from '../utils/cn';

const CloneVoice = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);

    // Sürükle-Bırak olayları için basit state yönetimi
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        // Gerçek uygulamada burada dosya tipi kontrolü yapılır (örn: audio/wav)
        if (droppedFile) {
            setFile(droppedFile);
        }
    };

    return (
        <MainLayout>
            {/* Sayfa Başlığı */}
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded border border-primary/30">
                        <Mic className="text-primary" size={24} />
                    </div>
                    <h1 className="text-3xl font-bold uppercase tracking-wide">
                        Clone Voice
                    </h1>
                </div>
                <p className="text-gray-400 font-mono ml-14">
                    Create a synthetic voice clone from audio samples.
                </p>
            </header>

            {/* Ana İçerik Grid Yapısı (Referans görseldeki 2 sütunlu yapı) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Sol Sütun: Dosya Yükleme */}
                <PixelCard title="Source Audio">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-white mb-1">Upload a file</h3>
                        <p className="text-sm text-gray-400">
                            Upload an audio file of the voice you want to clone.
                        </p>
                    </div>

                    {/* Cyberpunk Tarzı Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "relative border-2 border-dashed rounded-lg p-8 transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[300px] group cursor-pointer",
                            // Sürükleme sırasındaki stil
                            isDragging
                                ? "border-primary bg-primary/5 animate-pulse"
                                : "border-white/10 bg-background-surface/50 hover:border-primary/50 hover:bg-white/5"
                        )}
                    >
                        {/* Köşe Efektleri */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary/30 group-hover:border-primary transition-colors"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary/30 group-hover:border-primary transition-colors"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary/30 group-hover:border-primary transition-colors"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary/30 group-hover:border-primary transition-colors"></div>

                        <input type="file" className="hidden" accept="audio/*" id="audio-upload" onChange={(e) => setFile(e.target.files[0])} />
                        <label htmlFor="audio-upload" className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                            {file ? (
                                // Dosya seçildiyse gösterilecek kısım
                                <div className="flex flex-col items-center gap-2 p-4 bg-primary/10 border border-primary rounded">
                                    <FileAudio className="text-primary" size={40} />
                                    <span className="font-mono text-white break-all">{file.name}</span>
                                    <span className="text-xs text-primary-dim">Click to change</span>
                                </div>
                            ) : (
                                // Dosya seçilmediyse gösterilecek kısım
                                <>
                                    <div className="p-4 rounded-full bg-background-dark border border-white/10 mb-4 group-hover:border-primary/50 group-hover:text-primary transition-colors text-gray-400">
                                        <UploadCloud size={32} />
                                    </div>
                                    <p className="text-lg font-medium text-white mb-1">
                                        <span className="text-primary cursor-pointer hover:underline">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono mt-2">
                                        WAV, MP3, or FLAC (max. 50MB)
                                    </p>
                                </>
                            )}
                        </label>
                    </div>
                </PixelCard>

                {/* Sağ Sütun: Prompt Girişi */}
                <PixelCard title="Voice Configuration">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-white mb-1">Enter a prompt</h3>
                        <p className="text-sm text-gray-400">
                            Describe how the cloned voice should sound or provide context.
                        </p>
                    </div>

                    {/* Terminal Tarzı Textarea */}
                    <div className="relative">
                        <textarea
                            className="w-full min-h-[300px] bg-background-dark/80 border border-white/10 rounded-lg p-4 text-white font-mono focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-gray-600"
                            placeholder="// Enter prompt here...
// Example: A confident, deep male voice suited for narration, speaking slowly and clearly."
                        ></textarea>
                        {/* Alt bilgi */}
                        <div className="absolute bottom-4 right-4 text-xs text-gray-500 font-mono">
                            0 / 500 characters
                        </div>
                    </div>
                </PixelCard>

            </div>

            {/* Alt Aksiyon Butonu */}
            <div className="mt-8 flex justify-end">
                <Button size="lg" className="w-full md:w-auto flex items-center justify-center gap-2">
                    <Mic size={20} />
                    Initiate Cloning Sequence
                </Button>
            </div>
        </MainLayout>
    );
};

export default CloneVoice;