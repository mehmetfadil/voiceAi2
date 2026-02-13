import os
import httpx
from core.interfaces import ISTTService
from dotenv import load_dotenv

load_dotenv()


class FalSTTService(ISTTService):
    """Fal.ai Freya STT Servisi."""

    def __init__(self):
        # OpenAI uyumlu endpoint (Dosya yükleme destekler)
        self.api_url = "https://fal.run/freya-mypsdi253hbk/freya-stt/audio/transcriptions"
        self.api_key = os.getenv("FAL_KEY")
        self.headers = {
            "Authorization": f"Key {self.api_key}",
            # Content-Type'ı httpx otomatik 'multipart/form-data' yapar.
        }

    async def transcribe(self, audio_data: bytes) -> str:
        """
        Ses verisini (chunk) direkt dosya olarak Fal.ai'ye gönderir.
        """
        # Ses verisi çok kısaysa (sessizlik vb.) API'ye gitme
        if len(audio_data) < 1000:
            return ""

        print(f"TZ 🎤 [STT] Fal.ai isteği ({len(audio_data)} bytes)...")

        try:
            # Dosya formatı webm gönderiyoruz
            files = {
                'file': ('chunk.webm', audio_data, 'audio/webm')
            }

            # Parametreler
            data = {
                "model": "freya-stt-v1",
                "language": "tr",
                "response_format": "json"
            }

            async with httpx.AsyncClient(timeout=10.0) as client:  # Timeout'u kısalttık
                response = await client.post(self.api_url, files=files, data=data, headers=self.headers)

                if response.status_code == 200:
                    response_data = response.json()
                    text = response_data.get("text", "")
                    if text:
                        print(f"✅ [STT Parça]: {text}")
                    return text
                else:
                    print(f"❌ [STT Hata] {response.status_code}: {response.text}")
                    return ""

        except Exception as e:
            print(f"❌ [STT Kritik Hata]: {e}")
            return ""