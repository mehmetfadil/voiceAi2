import os
from typing import List
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document


class DocumentIngestor:
    """
    Dokümanları yüklemek ve parçalara ayırmak (chunking) için kullanılan servis.
    Desteklenen formatlar: .pdf, .docx, .txt
    """

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Args:
            chunk_size (int): Her bir metin parçasının maksimum karakter sayısı.
            chunk_overlap (int): Parçalar arasındaki örtüşme miktarı (bağlam kaybını önlemek için).
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", " ", ""]  # Öncelik sırasına göre ayırıcılar
        )

    def load_and_split(self, file_path: str) -> List[Document]:
        """
        Verilen dosya yolundaki dokümanı yükler ve parçalara ayırır.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Dosya bulunamadı: {file_path}")

        # 1. Dosya tipine göre uygun yükleyiciyi seç
        loader = self._get_loader(file_path)

        # 2. Dokümanı yükle
        try:
            raw_documents = loader.load()
        except Exception as e:
            raise RuntimeError(f"Dosya yüklenirken hata oluştu ({file_path}): {str(e)}")

        # 3. Metni parçalara böl (Chunking)
        chunks = self.text_splitter.split_documents(raw_documents)

        print(f"[Ingestion] '{os.path.basename(file_path)}' işlendi. Toplam parça sayısı: {len(chunks)}")
        return chunks

    def _get_loader(self, file_path: str):
        """Dosya uzantısına göre doğru Loader sınıfını döndürür."""
        if file_path.endswith(".pdf"):
            return PyPDFLoader(file_path)
        elif file_path.endswith(".docx"):
            return Docx2txtLoader(file_path)
        elif file_path.endswith(".txt"):
            return TextLoader(file_path, encoding="utf-8")
        else:
            raise ValueError(f"Desteklenmeyen dosya formatı: {file_path}")