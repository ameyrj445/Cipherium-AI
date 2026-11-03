"""Run the real development API against a disposable, seeded SQLite database.

Only infrastructure is isolated. Authentication, routers, ORM, service logic and
SSE serialization are the product implementation. AI/RAG use their real offline
fallbacks: no provider credentials or outbound network access are available.

The parent process reads INTEGRATION_READY:{json}, then terminates this process
when its tests finish. No caller-supplied DATABASE_URL is ever honored here.
"""
from __future__ import annotations

import argparse
import ipaddress
import json
import logging
import os
from pathlib import Path
import secrets
import socket
import sys
import tempfile
import threading


def block_external_connections() -> None:
    """Allow loopback transport only, including when dependencies try networking."""
    original_connect = socket.socket.connect
    original_connect_ex = socket.socket.connect_ex
    original_getaddrinfo = socket.getaddrinfo

    def is_loopback(address: object) -> bool:
        if not isinstance(address, tuple):
            return False
        host = str(address[0])
        if host.lower() == "localhost":
            return True
        try:
            return ipaddress.ip_address(host).is_loopback
        except ValueError:
            return False

    def connect(sock, address):
        if not is_loopback(address):
            raise OSError("External network disabled in isolated integration tests")
        return original_connect(sock, address)

    def connect_ex(sock, address):
        if not is_loopback(address):
            raise OSError("External network disabled in isolated integration tests")
        return original_connect_ex(sock, address)

    def getaddrinfo(host, *args, **kwargs):
        # A None host is used when creating local listening sockets.
        if host is not None and not is_loopback((host, 0)):
            raise OSError("External DNS disabled in isolated integration tests")
        return original_getaddrinfo(host, *args, **kwargs)

    socket.socket.connect = connect
    socket.socket.connect_ex = connect_ex
    socket.getaddrinfo = getaddrinfo


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=0)
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("port must be between 0 and 65535")

    backend = Path(__file__).resolve().parents[2] / "backend"
    sys.path.insert(0, str(backend))
    block_external_connections()

    with tempfile.TemporaryDirectory(prefix="cipherium-integration-") as directory:
        temp = Path(directory)
        db_path = temp / "integration.sqlite3"
        os.environ.update({
            "DATABASE_URL": f"sqlite:///{db_path.as_posix()}",
            "ENVIRONMENT": "test",
            "TESTING": "true",
            "SECRET_KEY": secrets.token_hex(32),
            "GEMINI_API_KEY": "",
            "MAIL_ENABLED": "false",
            "SMTP_USER": "",
            "SMTP_PASSWORD": "",
            "REDIS_URL": "",
            "BANDIT_ENABLED": "false",
            "FORCE_HTTPS": "false",
            "ALLOWED_ORIGINS": "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://localhost",
            "HF_HUB_OFFLINE": "1",
            "TRANSFORMERS_OFFLINE": "1",
            "HF_HOME": str(temp / "huggingface"),
            "XDG_CACHE_HOME": str(temp / "cache"),
        })
        # Do not let a dependency tunnel external calls through an inherited
        # localhost proxy. This affects only this disposable child process.
        for key in list(os.environ):
            if key.lower() in {"http_proxy", "https_proxy", "all_proxy", "ftp_proxy"}:
                os.environ.pop(key, None)
        os.environ["NO_PROXY"] = "localhost,127.0.0.1,::1"
        # Relative fallback/artifact writes cannot touch repository or user data.
        previous_cwd = Path.cwd()
        os.chdir(temp)
        engine = None
        listener = None
        try:
            import uvicorn
            from app.main import app
            from app.database import ACTIVE_DATABASE_URL, engine as app_engine
            from app.services import rag

            engine = app_engine
            if ACTIVE_DATABASE_URL != os.environ["DATABASE_URL"]:
                raise RuntimeError("Integration database isolation check failed")
            rag.DEFAULT_PERSIST_DIRECTORY = temp / "chroma"
            logging.getLogger().handlers[:] = [logging.StreamHandler(sys.stderr)]

            listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            listener.bind(("127.0.0.1", args.port))
            port = listener.getsockname()[1]

            class ReadyServer(uvicorn.Server):
                async def startup(self, sockets=None):
                    await super().startup(sockets=sockets)
                    if self.started:
                        print("INTEGRATION_READY:" + json.dumps({
                            "url": f"http://127.0.0.1:{port}",
                            "database": str(db_path),
                            "external_services": "offline product fallback",
                        }), flush=True)

            server = ReadyServer(uvicorn.Config(
                app, host="127.0.0.1", port=port, log_level="warning",
                access_log=False, log_config=None,
            ))
            # A graceful stdin command also works on Windows, where killing a
            # process does not guarantee finally blocks/TemporaryDirectory run.
            def control():
                for line in sys.stdin:
                    if line.strip() == "shutdown":
                        server.should_exit = True
                        return
            threading.Thread(target=control, daemon=True).start()
            server.run(sockets=[listener])
        finally:
            if listener is not None:
                listener.close()
            if engine is not None:
                engine.dispose()
            os.chdir(previous_cwd)


if __name__ == "__main__":
    main()
