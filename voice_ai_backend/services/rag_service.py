# voice_ai_backend/services/rag_service.py
import os
import chromadb
from chromadb.config import Settings
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
# DÜZELTİLEN IMPORT:
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import SentenceTransformerEmbeddings

# ChromaDB Kayıt Yolu
CHROMA_PATH = "chroma_db"


class RAGService:
    def __init__(self):
        # PersistentClient verileri diske kaydeder
        self.client = chromadb.PersistentClient(path=CHROMA_PATH)
        # Açık kaynaklı, ücretsiz ve güçlü bir embedding modeli
        self.embedding_fn = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

    def _get_collection(self, user_id: int):
        """Her kullanıcı için izole edilmiş bir koleksiyon döndürür."""
        collection_name = f"user_{user_id}_docs"
        return self.client.get_or_create_collection(name=collection_name)

    def add_document(self, user_id: int, file_path: str):
        """Dosyayı okur, parçalar ve vektör veritabanına ekler."""

        # 1. Dosya tipine göre yükleyici seç
        if file_path.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
        elif file_path.endswith(".docx"):
            loader = Docx2txtLoader(file_path)
        else:
            loader = TextLoader(file_path, encoding="utf-8")

        documents = loader.load()

        # 2. Metni parçalara böl (Chunking)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = text_splitter.split_documents(documents)

        # 3. Embedding oluştur ve ChromaDB'ye kaydet
        collection = self._get_collection(user_id)

        ids = [f"doc_{user_id}_{os.path.basename(file_path)}_{i}" for i in range(len(chunks))]
        texts = [chunk.page_content for chunk in chunks]
        metadatas = [{"source": os.path.basename(file_path)} for _ in chunks]

        # Embeddings'i oluştur
        embeddings = self.embedding_fn.embed_documents(texts)

        collection.add(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )

        return len(chunks)

    def query_documents(self, user_id: int, query_text: str, n_results=3):
        """Kullanıcının koleksiyonundan en alakalı parçaları getirir."""
        collection = self._get_collection(user_id)

        query_embedding = self.embedding_fn.embed_query(query_text)

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )

        return results["documents"][0] if results["documents"] else []