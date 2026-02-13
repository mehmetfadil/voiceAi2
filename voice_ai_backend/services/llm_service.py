# voice_ai_backend/services/llm_service.py
import json
import httpx
import re
from typing import AsyncGenerator
from core.interfaces import ILLMService


class CustomLLMService(ILLMService):
    def __init__(self, api_url: str):
        self.api_url = api_url

    def _clean_response(self, text: str) -> str:
        """
        AI çıktısından <think>...</think> bloklarını ve gereksiz boşlukları temizler.
        """
        # <think> ve </think> arasındaki her şeyi (satır sonları dahil) sil
        clean_text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)

        # Olası diğer sistem taglerini de temizleyebilirsiniz (opsiyonel)
        # clean_text = re.sub(r'<\|.*?\|>', '', clean_text)

        return clean_text.strip()

    async def generate_stream(self, system_prompt: str, user_query: str, context: str = "") -> AsyncGenerator[
        str, None]:
        """
        Mihenk-14B (FastAPI) entegrasyonu.
        Gelen cevabı temizler ve simüle edilmiş stream olarak döner.
        """

        full_prompt = f"""
        [TALİMAT]: {system_prompt}

        [BAĞLAM BİLGİSİ]:
        {context}

        [KULLANICI SORUSU]:
        {user_query}
        """

        payload = {
            "prompt": full_prompt
        }

        print(f"📡 [LLM] İstek gönderiliyor: {self.api_url}")

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(self.api_url, json=payload)

                if response.status_code != 200:
                    err = f"❌ [LLM Hata] Status: {response.status_code} - {response.text}"
                    print(err)
                    yield err
                    return

                # JSON cevabını al
                data = response.json()
                raw_text = data.get("response", "")

                # --- TEMİZLİK AŞAMASI ---
                final_text = self._clean_response(raw_text)

                print(f"✅ [LLM] Temizlenmiş Cevap: {final_text[:50]}...")

                # Eğer temizlik sonrası metin boşsa uyarı ver
                if not final_text:
                    yield "Üzgünüm, geçerli bir cevap oluşturulamadı."
                    return

                # Kelime kelime simülasyon (TTS ve Frontend için)
                words = final_text.split(" ")
                for word in words:
                    yield word + " "

            except Exception as e:
                print(f"\n❌ [LLM Bağlantı Hatası]: {e}")
                yield f"Bağlantı Hatası: {str(e)}"