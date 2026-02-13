import os

# Ana dizin
BASE_DIR = r"C:\Users\mfadi\OneDrive\Desktop\voiceAi"

# Çıktı dosyası
OUTPUT_FILE = os.path.join(BASE_DIR, "project_dump.txt")

# Hariç tutulacak klasörler (kütüphane ve sistem klasörleri)
EXCLUDED_DIRS = {
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "venv",
    "__pycache__",
    ".idea",
    ".vscode"
}

# Dahil edilecek dosya uzantıları (senin yazmış olabileceğin dosyalar)
ALLOWED_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".css",
    ".html",
    ".json"
}


def should_include_file(file_path):
    _, ext = os.path.splitext(file_path)
    return ext.lower() in ALLOWED_EXTENSIONS


def export_project():
    print(f"\n📂 Taranan dizin: {BASE_DIR}")
    print("🚀 Dosyalar işleniyor...\n")

    total_files = 0

    with open(OUTPUT_FILE, "w", encoding="utf-8") as output:

        for root, dirs, files in os.walk(BASE_DIR):

            # Hariç tutulacak klasörleri gezme
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]

            for file in files:
                file_path = os.path.join(root, file)

                if should_include_file(file_path):

                    relative_path = os.path.relpath(file_path, BASE_DIR)

                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()

                        output.write("\n" + "=" * 100 + "\n")
                        output.write(f"DOSYA YOLU: {relative_path}\n")
                        output.write("=" * 100 + "\n\n")
                        output.write(content)
                        output.write("\n")

                        total_files += 1

                        # Konsola yazdır
                        print(f"✔ Kaydedildi: {relative_path}")

                    except Exception as e:
                        print(f"❌ Hata: {relative_path} -> {e}")

    print("\n" + "=" * 60)
    print(f"✅ İşlem tamamlandı.")
    print(f"📄 Toplam kaydedilen dosya sayısı: {total_files}")
    print(f"📁 Çıktı dosyası: {OUTPUT_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    export_project()
