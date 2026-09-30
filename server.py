"""
Lightweight Local HTTP Server Launcher for Corporate Finance Present Value Lab
Serves the web application at http://localhost:8000 and opens the default browser.
"""

import http.server
import socketserver
import webbrowser
import sys
import os

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def log_message(self, format, *args):
        # Keep console output clean
        sys.stderr.write(f"[PV-Lab Server] {format % args}\n")

def run_server():
    global PORT
    for attempt in range(10):
        try:
            with socketserver.TCPServer(("", PORT), Handler) as httpd:
                url = f"http://localhost:{PORT}"
                print("=" * 65)
                print("Present Value & Discounting Corporate Finance Interactive Lab")
                print("=" * 65)
                print(f"Server running at: {url}")
                print(f"Serving directory: {DIRECTORY}")
                print("Press Ctrl+C in terminal to stop the server.")
                print("=" * 65)
                
                # Auto-open browser
                try:
                    webbrowser.open(url)
                except Exception as e:
                    print(f"Note: Could not automatically open browser: {e}")
                
                httpd.serve_forever()
                break
        except OSError as e:
            if "Address already in use" in str(e) or e.errno == 10048 or e.errno == 98:
                PORT += 1
            else:
                raise e

if __name__ == '__main__':
    try:
        run_server()
    except KeyboardInterrupt:
        print("\n[PV-Lab Server] Server stopped gracefully.")
