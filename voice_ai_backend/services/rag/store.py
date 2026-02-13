# voice_ai_backend/services/rag/store.py
import asyncio
import chromadb
from typing import List
from langchain_core.documents import Document
from langchain_community.embeddings import SentenceTransformerEmbeddings

CHROMA_PATH = "chroma_db"


class VectorStore:
    """
    Vektör veritabanı işlemlerini yöneten asenkron sınıf.
    """

    def __init__(self, embedding_model_name: str = "all-MiniLM-L6-v2"):
        # Embedding modeli CPU'yu yorar, bu yüzden yüklenirken log basıyoruz
        print(f"[VectorStore] Model yükleniyor: {embedding_model_name}...")
        self.client = chromadb.PersistentClient(path=CHROMA_PATH)
        self.embedding_fn = SentenceTransformerEmbeddings(model_name=embedding_model_name)
        print("[VectorStore] Hazır.")

    def _get_collection(self, user_id: int):
        collection_name = f"user_{user_id}_docs"
        return self.client.get_or_create_collection(name=collection_name)

    async def add_documents_async(self, user_id: int, documents: List[Document], source_name: str) -> None:
        """Doküman ekleme işlemini thread'e yıkar (Non-blocking)."""
        await asyncio.to_thread(self._add_documents_sync, user_id, documents, source_name)

    def _add_documents_sync(self, user_id: int, documents: List[Document], source_name: str):
        """Senkron çalışan asıl ekleme fonksiyonu."""
        collection = self._get_collection(user_id)
        safe_source_name = source_name.replace(" ", "_")

        ids = [f"doc_{user_id}_{safe_source_name}_{i}" for i in range(len(documents))]
        texts = [doc.page_content for doc in documents]

        metadatas = []
        for doc in documents:
            meta = doc.metadata.copy()
            meta["source"] = source_name
            metadatas.append(meta)

        # Embedding hesaplama işlemi ağırdır
        embeddings = self.embedding_fn.embed_documents(texts)

        try:
            collection.upsert(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)
            print(f"[VectorStore] Eklendi: {len(documents)} parça.")
        except Exception as e:
            print(f"[VectorStore Hata]: {e}")
            raise e

    async def query_async(self, user_id: int, query_text: str, k: int = 3) -> List[Document]:
        """Arama işlemini thread'e yıkar (Non-blocking)."""
        return await asyncio.to_thread(self._query_sync, user_id, query_text, k)

    def _query_sync(self, user_id: int, query_text: str, k: int) -> List[Document]:
        """Senkron çalışan asıl sorgu fonksiyonu."""
        collection = self._get_collection(user_id)

        # Sorgu embedding'i hesapla
        query_embedding = self.embedding_fn.embed_query(query_text)

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=k
        )

        found_docs = []
        if results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results["metadatas"] else [{}] * len(docs)
            for text, meta in zip(docs, metas):
                found_docs.append(Document(page_content=text, metadata=meta))

        return found_docs