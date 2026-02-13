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
from services.tts_service import GoogleTTSService
from services.orchestrator import ConversationOrchestrator

# DB Tabloları oluşturuluyor
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="VoiceAI Platform v2")

# CORS Ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Geliştirme ortamı için tüm kaynaklara izin veriliyor
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SERVİS BAŞLATMA ---
print("[Main] Servisler başlatılıyor...")

rag_pipeline = RAGPipeline()

# DİKKAT: Ngrok linkinizi buradaki tırnak içine yapıştırın
llm_service = CustomLLMService(api_url="https://16dc-34-143-218-195.ngrok-free.app/generate") # <--- BURAYA YAPIŞTIR

tts_service = GoogleTTSService()
orchestrator = ConversationOrchestrator(rag_pipeline, llm_service, tts_service)

print("[Main] Sistem Hazır.")

# Statik Dosyalar (Ses dosyaları için)
os.makedirs("uploads", exist_ok=True)
app.mount("/audio", StaticFiles(directory="."), name="audio")


# --- Auth Dependency (Kullanıcı Doğrulama) ---
# auth.py'deki fonksiyonu sarmalıyoruz
def get_current_user(token: str = Depends(auth.oauth2_scheme), db: Session = Depends(get_db)):
    user = auth.get_current_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return user


# --- Pydantic Modelleri (Veri Doğrulama) ---
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


# --- ENDPOINTS (API Uç Noktaları) ---

@app.get("/")
def read_root():
    return {"status": "VoiceAI System Operational", "mode": "Streaming/Async"}


# Kayıt Olma
@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    return auth.register_user(db, user)


# Giriş Yapma (Token Alma)
@app.post("/token")
def login(user: UserLogin, db: Session = Depends(get_db)):
    return auth.login_user(db, user)


# Kullanıcı Bilgisi
@app.get("/me")
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "full_name": current_user.full_name,
        "system_prompt": current_user.system_prompt
    }


# RAG / Doküman Yükleme
@app.post("/upload-doc")
async def upload_document(
        file: UploadFile = File(...),
        current_user: models.User = Depends(get_current_user)
):
    file_location = os.path.join("uploads", f"{current_user.id}_{file.filename}")
    try:
        # Dosyayı geçici olarak kaydet
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Async Pipeline ile işle (Vektör veritabanına ekle)
        result = await rag_pipeline.process_document_async(current_user.id, file_location)
        return result
    finally:
        # Temizlik: Geçici dosyayı sil
        if os.path.exists(file_location):
            os.remove(file_location)


# Persona Güncelleme (System Prompt)
@app.put("/update-persona")
def update_persona(data: PersonaUpdate, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    current_user.system_prompt = data.system_prompt
    db.commit()
    return {"msg": "Persona updated"}


# --- STREAMING CHAT ENDPOINT (ANA FONKSİYON) ---
@app.post("/chat/stream")
async def chat_stream(
        request: ChatRequest,
        current_user: models.User = Depends(get_current_user)
):
    """
    Sesli/Yazılı sohbet için ana endpoint.
    SSE (Server-Sent Events) döner.
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
    # Host 0.0.0.0 dışarıdan erişime izin verir
    uvicorn.run(app, host="0.0.0.0", port=8000)