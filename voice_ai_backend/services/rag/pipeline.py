# voice_ai_backend/services/rag/pipeline.py
import os
from typing import List, Tuple, Dict
from .ingestion import DocumentIngestor
from .store import VectorStore


class RAGPipeline:
    """
    Asenkron RAG Pipeline.
    """

    def __init__(self):
        self.ingestor = DocumentIngestor()
        self.store = VectorStore()

    async def process_document_async(self, user_id: int, file_path: str) -> dict:
        """Dokümanı asenkron olarak işler ve kaydeder."""
        filename = os.path.basename(file_path)

        # Chunking işlemi CPU intensive olabilir ama şimdilik senkron kalabilir
        # (çok büyük dosyalar için burası da async yapılabilir)
        chunks = self.ingestor.load_and_split(file_path)

        if not chunks:
            return {"status": "warning", "message": "Boş dosya", "chunks": 0}

        # Kaydetme işlemi (Async)
        await self.store.add_documents_async(user_id=user_id, documents=chunks, source_name=filename)

        return {
            "status": "success",
            "filename": filename,
            "chunks_processed": len(chunks)
        }

    async def get_context_async(self, user_id: int, query_text: str, k: int = 3) -> Tuple[str, List[Dict]]:
        """
        Sorgu için bağlamı asenkron olarak getirir.
        """
        # 1. Async Vektör Araması
        relevant_docs = await self.store.query_async(user_id=user_id, query_text=query_text, k=k)

        if not relevant_docs:
            return "", []

        # 2. Formatlama (Hızlı olduğu için senkron kalabilir)
        formatted_context = []
        sources = []

        for doc in relevant_docs:
            source_name = doc.metadata.get("source", "Bilinmeyen")
            content = doc.page_content.replace("\n", " ")
            formatted_context.append(f"[KAYNAK: {source_name}]\n{content}")
            sources.append(doc.metadata)

        full_context_text = "\n\n---\n\n".join(formatted_context)
        return full_context_text, sources