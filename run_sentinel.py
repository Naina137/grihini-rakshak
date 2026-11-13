#!/usr/bin/env python3
"""
====================================================================
  SENTINEL AI — Autonomous Room Safety Guardian
  TAGLINE: Your Room. Your Safety. Your AI Guardian.
  Unified Launcher: Starts the full AI surveillance backend & frontend
====================================================================
"""
import sys
import os
import webbrowser
import threading
import time

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import uvicorn

def print_banner():
    banner = r"""
  ╔══════════════════════════════════════════════════════════════════════╗
  ║   ____  _____ _   _ _____ ___ _   _ _____ _        _    ___          ║
  ║  / ___|| ____| \ | |_   _|_ _| \ | | ____| |      / \  |_ _|         ║
  ║  \___ \|  _| |  \| | | |  | ||  \| |  _| | |     / _ \  | |          ║
  ║   ___) | |___| |\  | | |  | || |\  | |___| |___ / ___ \ | |          ║
  ║  |____/|_____|_| \_| |_| |___|_| \_|_____|_____/_/   \_\___|         ║
  ║                                                                      ║
  ║             Your Room. Your Safety. Your AI Guardian.                ║
  ╚══════════════════════════════════════════════════════════════════════╝
    """
    print(banner)
    print("  [+] Starting SENTINEL AI Neural Risk Engine...")
    print("  [+] Initializing Computer Vision Models (OpenCV, Flame, Smoke, Human)...")
    print("  [+] Initializing Acoustic Safety Classifiers (Glass, Alarm, Scream, Thud)...")
    print("  [+] Starting Environmental Simulation Engine...")
    print("  [+] Serving Dashboard UI at: http://127.0.0.1:8000")
    print("  [+] WebSocket Duplex Link at: ws://127.0.0.1:8000/api/v1/monitor/ws")
    print("  [+] Privacy Active: Zero Raw Video/Audio Stored. In-Memory Analysis Only.")
    print("  ======================================================================\n")

def open_browser():
    time.sleep(1.8)
    try:
        webbrowser.open("http://127.0.0.1:8000")
    except Exception as e:
        print(f"  [-] Could not auto-open browser: {e}")

if __name__ == "__main__":
    print_banner()
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, log_level="info", app_dir=backend_dir)
