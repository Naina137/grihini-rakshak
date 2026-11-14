import uvicorn
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    host = os.environ.get("HOST", "0.0.0.0")
    print("=" * 65)
    print("  GRIHINI RAKSHAK (गृहिणी रक्षक) - INDOOR AI SAFETY SENTINEL")
    print("  'Your Home. Your Family. Your AI Guardian.'")
    print(f"  FastAPI Server starting on http://{host}:{port}")
    print("=" * 65)
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
