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
    print("  [+] Computer Vision Active (Flame, Smoke, Occupants, Motion)...")
    print("  [+] Acoustic Safety Classifiers Active (Glass, Alarm, Scream, Impact)...")
    print("  [+] Environmental Simulation Engine Active...")
    print("  [+] Dashboard UI available at: http://127.0.0.1:8080")
    print("  [+] REST API & WebSockets at: http://127.0.0.1:8080/api/v1")
    print("  ======================================================================\n")

def open_browser():
    time.sleep(1.8)
    try:
        webbrowser.open("http://127.0.0.1:8080")
    except Exception as e:
        print(f"  [-] Could not auto-open browser: {e}")

if __name__ == "__main__":
    print_banner()
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("app.main:app", host="127.0.0.1", port=8080, log_level="info", app_dir=backend_dir)
