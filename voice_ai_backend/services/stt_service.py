import speech_recognition as sr
from core.interfaces import ISTTService

class GoogleSTTService(ISTTService):
    """Google'ın ücretsiz Speech Recognition servisini kullanır."""
    def __init__(self):
        self.recognizer = sr.Recognizer()

    def transcribe(self, audio_source) -> str:
        try:
            # audio_source burada sr.AudioData tipindedir (main.py'dan gelir)
            return self.recognizer.recognize_google(audio_source, language="tr-TR")
        except sr.UnknownValueError:
            return ""
        except sr.RequestError:
            return "[Hata] STT Servisine ulaşılamadı."
