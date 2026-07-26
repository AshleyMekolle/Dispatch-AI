"""ASGI middleware. Middleware is kept out of ``main.py`` so each concern
(request correlation, timing, future rate limiting) lives in its own module
and can be unit-tested in isolation.
"""
