# voice_ai_backend/services/tts_service.py
import asyncio
import io
from gtts import gTTS
from typing import AsyncGenerator
from core.interfaces import ITTSService


class GoogleTTSService(ITTSService):
    """
    Ücretsiz Google Translate TTS servisi.
    Not: Bu servis gerçek streaming desteklemez, cümle bazlı simülasyon yapacağız.
    """

    async def speak_text(self, text: str) -> bytes:
        """Tek seferlik çeviri (Blocking I/O'yu thread'e atar)."""
        return await asyncio.to_thread(self._generate_audio, text)

    def _generate_audio(self, text: str) -> bytes:
        # gTTS işlemi
        if not text.strip():
            return b""
        try:
            tts = gTTS(text=text, lang='tr')
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            return fp.read()
        except Exception as e:
            print(f"TTS Error: {e}")
            return b""

    async def speak_stream(self, text_stream: AsyncGenerator[str, None]) -> AsyncGenerator[bytes, None]:
        """
        LLM'den gelen kelimeleri biriktirir, cümle bitince sese çevirip gönderir.
        """
        buffer = ""
        sentence_endings = {'.', '!', '?', ';', ':'}

        async for token in text_stream:
            buffer += token
            # Basit cümle sonu kontrolü
            if any(char in token for char in sentence_endings):
                # Cümle bitti, sese çevir
                audio_chunk = await self.speak_text(buffer)
                if audio_chunk:
                    yield audio_chunk
                buffer = ""

        # Kalan son parça varsa
        if buffer.strip():
            audio_chunk = await self.speak_text(buffer)
            if audio_chunk:
                yield audio_chunk