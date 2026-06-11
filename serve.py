import os, http.server, socketserver
os.chdir('/Users/brittanywelch/Documents/public_html')
handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(('', 5500), handler) as httpd:
    httpd.serve_forever()
