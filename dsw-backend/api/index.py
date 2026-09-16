"""
Vercel Serverless Function entrypoint for Vice Chancellor Office (VC Office) Backend API.
"""

from app.main import app  # noqa: F401

try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="auto")
except ImportError:
    handler = app
