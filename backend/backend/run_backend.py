import os
import sys

# Parent backend directory
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    host = os.environ.get("HOST", "0.0.0.0")
    print("=" * 65)
    print("  GRIHINI RAKSHAK (गृहिणी रक्षक) - INDOOR AI SAFETY SENTINEL")
    print(f"  FastAPI Server starting on http://{host}:{port}")
    print("=" * 65)
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
