# voice_ai_backend/main.py
import os
import shutil
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Modüller
import models
import auth
from database import engine, get_db
from services.rag.pipeline import RAGPipeline
from services.llm_service import CustomLLMService
from services.orchestrator import ConversationOrchestrator

# Fal.ai Servisleri
from services.tts_service import FalTTSService
from services.stt_service import FalSTTService

# DB Tabloları oluşturuluyor
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="VoiceAI Platform v2 - Fal.ai Integrated")

# CORS Ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SERVİS BAŞLATMA ---
print("[Main] Servisler başlatılıyor...")

rag_pipeline = RAGPipeline()

# LLM Servisi (Ngrok URL'in güncel olduğundan emin ol)
llm_service = CustomLLMService(api_url="https://1af8-34-142-175-97.ngrok-free.app/generate")

# Fal.ai Servisleri
tts_service = FalTTSService()
stt_service = FalSTTService()

# Orchestrator
orchestrator = ConversationOrchestrator(rag_pipeline, llm_service, tts_service)

print("[Main] Sistem Hazır (Fal.ai Powered).")

# Statik Dosyalar
os.makedirs("uploads", exist_ok=True)
app.mount("/audio", StaticFiles(directory="."), name="audio")


# --- Auth Dependency ---
def get_current_user(token: str = Depends(auth.oauth2_scheme), db: Session = Depends(get_db)):
    user = auth.get_current_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return user


# --- Pydantic Modelleri ---
class ChatRequest(BaseModel):
    message: str


class PersonaUpdate(BaseModel):
    system_prompt: str


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: str
    password: str


# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "VoiceAI System Operational", "mode": "Fal.ai Integrated"}


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    return auth.register_user(db, user)


@app.post("/token")
def login(user: UserLogin, db: Session = Depends(get_db)):
    return auth.login_user(db, user)


@app.get("/me")
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "full_name": current_user.full_name,
        "system_prompt": current_user.system_prompt
    }


@app.post("/upload-doc")
async def upload_document(
        file: UploadFile = File(...),
        current_user: models.User = Depends(get_current_user)
):
    file_location = os.path.join("uploads", f"{current_user.id}_{file.filename}")
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = await rag_pipeline.process_document_async(current_user.id, file_location)
        return result
    finally:
        if os.path.exists(file_location):
            os.remove(file_location)


@app.put("/update-persona")
def update_persona(data: PersonaUpdate, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    current_user.system_prompt = data.system_prompt
    db.commit()
    return {"msg": "Persona updated"}


@app.post("/transcribe")
async def transcribe_audio(
        file: UploadFile = File(...),
        current_user: models.User = Depends(get_current_user)
):
    """
    Frontend'den gelen ses dosyasını okur ve Fal.ai STT servisine
    Data URI formatında göndererek transkripsiyonu alır.
    """
    try:
        # Dosya içeriğini byte olarak oku
        audio_bytes = await file.read()

        # Fal.ai servisine gönder
        text = await stt_service.transcribe(audio_bytes)

        if not text:
            # Hata detayını loglarda görebiliriz, frontend'e genel hata dön
            raise HTTPException(status_code=500, detail="Transcription failed (Empty result)")

        return {"text": text}
    except Exception as e:
        print(f"Transcribe Endpoint Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(
        request: ChatRequest,
        current_user: models.User = Depends(get_current_user)
):
    """
    SSE ile LLM cevabını ve TTS sesini akıtır.
    """
    return StreamingResponse(
        orchestrator.stream_chat(
            user_id=current_user.id,
            user_message=request.message,
            system_prompt=current_user.system_prompt
        ),
        media_type="text/event-stream"
    )


if __name__ == "__main__":
    import uvicorn

    # Çalıştırma: python main.py
    uvicorn.run(app, host="0.0.0.0", port=8000)