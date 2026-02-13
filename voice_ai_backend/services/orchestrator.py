# voice_ai_backend/services/orchestrator.py
import asyncio
import json
import base64
import re
from typing import AsyncGenerator
from services.rag.pipeline import RAGPipeline
from services.llm_service import CustomLLMService
from services.tts_service import FalTTSService


class ConversationOrchestrator:
    def __init__(self, rag: RAGPipeline, llm: CustomLLMService, tts: FalTTSService):
        self.rag = rag
        self.llm = llm
        self.tts = tts

    async def stream_chat(self, user_id: int, user_message: str, system_prompt: str) -> AsyncGenerator[str, None]:
        """
        Server-Sent Events (SSE) formatında veri akışı sağlar.
        """

        # 1. DURUM: DÜŞÜNÜYOR
        yield self._sse_event("status", "thinking")

        # 2. RAG BAĞLAMI GETİR (Asenkron)
        context, sources = await self.rag.get_context_async(user_id, user_message)

        # Kaynakları hemen bildir
        if sources:
            yield self._sse_event("sources", sources)

        # 3. DURUM: KONUŞUYOR
        yield self._sse_event("status", "speaking")

        # LLM Akışı
        llm_generator = self.llm.generate_stream(system_prompt, user_message, context)

        buffer = ""
        # Cümle sonlarını yakalayan regex
        sentence_endings = re.compile(r'(?<=[.?!])\s+')

        async for token in llm_generator:
            # Token'ı metin olarak hemen gönder
            yield self._sse_event("token", token)

            buffer += token

            # Tamponda cümle bitişi var mı?
            parts = sentence_endings.split(buffer)

            if len(parts) > 1:
                complete_sentences = parts[:-1]
                buffer = parts[-1]

                for sentence in complete_sentences:
                    if sentence.strip():
                        # Cümleyi sese çevir ve gönder
                        async for event in self._process_audio(sentence):
                            yield event

        # Kalan son parçayı işle
        if buffer.strip():
            async for event in self._process_audio(buffer):
                yield event

        # 4. DURUM: BİTİŞ
        yield self._sse_event("status", "done")

    async def _process_audio(self, text: str) -> AsyncGenerator[str, None]:
        """Metni sese çevirir ve Base64 olarak stream eder."""
        # TTS servisi sesi üretir
        audio_bytes = await self.tts.speak_text(text)

        if audio_bytes:
            # Base64 encode
            b64_audio = base64.b64encode(audio_bytes).decode('utf-8')
            yield self._sse_event("audio", b64_audio)

    def _sse_event(self, event_type: str, data: any) -> str:
        """SSE formatı: data: {...}\n\n"""
        payload = json.dumps({"type": event_type, "data": data}, ensure_ascii=False)
        return f"data: {payload}\n\n"