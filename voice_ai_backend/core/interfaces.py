# voice_ai_backend/core/interfaces.py
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Any


class ISTTService(ABC):
    """
    Speech-to-Text Servisi için soyut arayüz.
    """

    @abstractmethod
    async def transcribe(self, audio_data: bytes) -> str:
        pass


class ILLMService(ABC):
    """
    Language Model Servisi için soyut arayüz.
    """

    @abstractmethod
    async def generate_stream(self, system_prompt: str, user_query: str, context: str = "") -> AsyncGenerator[
        str, None]:
        """Cevabı parça parça (token token) döner."""
        pass


class ITTSService(ABC):
    """
    Text-to-Speech Servisi için soyut arayüz.
    """

    @abstractmethod
    async def speak_stream(self, text_stream: AsyncGenerator[str, None]) -> AsyncGenerator[bytes, None]:
        """
        Metin akışını alır ve ses parçaları (chunk) üretir.
        """
        pass

    @abstractmethod
    async def speak_text(self, text: str) -> bytes:
        """Tek bir metni sese çevirir (Statik cevaplar için)."""
        pass