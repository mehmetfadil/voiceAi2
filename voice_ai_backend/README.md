Voice AI Backend (Hackathon Edition)

Bu proje modüler bir Sesli Asistan (Voice AI Agent) altyapısıdır.
Sistem gerçek zamanlı olarak:

Speech-to-Text → LLM → RAG → Text-to-Speech

pipeline’ı ile çalışır.

Kurulum

pip install -r requirements.txt

.env dosyasına gerekli API anahtarlarını ekle:

OPENAI_API_KEY

GOOGLE_APPLICATION_CREDENTIALS

python main.py ile başlat.

Kullanılan Kütüphaneler
Backend (Python)

openai

langchain

langchain-openai

langchain-community

langchain-core

chromadb

tiktoken

fastapi

uvicorn

speechrecognition

pyaudio

google-cloud-speech

google-cloud-texttospeech

pydub

python-dotenv

requests

numpy

colorama

pydantic

python-multipart

pypdf

Frontend (React)

react

react-dom

react-router-dom

vite

axios

tailwindcss

postcss

autoprefixer

lucide-react

eslint

@vitejs/plugin-react

Mimari

Core: Arayüzler (Interfaces)

Services: STT, LLM, TTS implementasyonları

RAG: ChromaDB tabanlı vektör arama

Main: Pipeline orkestrasyonu

Frontend: React tabanlı kullanıcı arayüzü