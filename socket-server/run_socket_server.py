import uvicorn

from socket_server import socket_app

if __name__ == '__main__':
    uvicorn.run(app = socket_app, host = '127.0.0.1', port = 8888)