# voice_ai_backend/api/routes.py
import sys
import os

# --- BU KISIM ÇOK ÖNEMLİ ---
# Python'a "bir üst klasöre de bak" diyoruz.
# Bu sayede 'auth' ve 'models' modüllerini bulabiliyor.
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
# ---------------------------

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Artık üst klasörden import yapabiliriz
from auth import get_current_user
from database import get_db
import models

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


@router.post("/chat/stream")
async def chat_stream_endpoint(
        request: ChatRequest,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Gerçek zamanlı RAG + LLM + TTS akışı.
    """
    # Circular import (Döngüsel Bağımlılık) olmaması için orchestrator'ı burada çağırıyoruz
    from main import orchestrator

    return StreamingResponse(
        orchestrator.stream_chat(
            user_id=current_user.id,
            user_message=request.message,
            system_prompt=current_user.system_prompt
        ),
        media_type="text/event-stream"
    )