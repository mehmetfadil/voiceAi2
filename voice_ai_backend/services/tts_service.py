# voice_ai_backend/services/tts_service.py
import os
import httpx
from typing import AsyncGenerator
from core.interfaces import ITTSService
from dotenv import load_dotenv

load_dotenv()


class FalTTSService(ITTSService):
    """
    Fal.ai Freya TTS Servisi Entegrasyonu.
    """

    def __init__(self):
        # Ses üretimi için doğru endpoint: /audio/speech
        self.api_url = "https://fal.run/freya-mypsdi253hbk/freya-tts/audio/speech"
        self.api_key = os.getenv("FAL_KEY")
        self.headers = {
            "Authorization": f"Key {self.api_key}",
            "Content-Type": "application/json"
        }

    async def speak_text(self, text: str) -> bytes:
        if not text.strip():
            return b""

        # Payload ayarları
        payload = {
            "input": text,
            "voice": "zeynep",  # DÜZELTİLDİ: 'freya' yerine 'zeynep' yapıldı.
            "response_format": "mp3",
            "speed": 1.1
        }

        print(f"🔊 [TTS] Fal.ai isteği ({payload['voice']}): '{text[:20]}...'")

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(self.api_url, json=payload, headers=self.headers)

                if response.status_code == 200:
                    content_type = response.headers.get("content-type", "")

                    # 1. Durum: Doğrudan ses verisi (audio/mpeg vb.)
                    if "audio" in content_type or "mpeg" in content_type:
                        return response.content

                    # 2. Durum: JSON dönerse (URL içerir)
                    elif "application/json" in content_type:
                        data = response.json()
                        # Dokümana göre 'url' veya 'audio_url' olabilir
                        audio_url = data.get("url") or data.get("audio_url")

                        if audio_url:
                            print(f"🔗 [TTS] Ses URL'i indiriliyor: {audio_url}")
                            audio_resp = await client.get(audio_url)
                            return audio_resp.content
                        else:
                            print(f"⚠️ [TTS] JSON döndü ama URL bulunamadı: {data}")
                            return b""

                    else:
                        # Bazen header yanlış olabilir, yine de content'i deneyelim
                        print(f"⚠️ [TTS] Beklenmeyen içerik tipi: {content_type}")
                        return response.content

                else:
                    print(f"❌ [TTS Hata] {response.status_code}: {response.text}")
                    return b""
            except Exception as e:
                print(f"❌ [TTS Bağlantı Hatası]: {e}")
                return b""

    async def speak_stream(self, text_stream: AsyncGenerator[str, None]) -> AsyncGenerator[bytes, None]:
        """Orchestrator tarafından kullanılacak stream fonksiyonu."""
        pass