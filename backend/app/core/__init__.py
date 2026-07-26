"""Cross-cutting concerns: configuration, logging, and shared primitives.

Nothing in ``core`` may import from routers, services, or repositories —
dependencies flow strictly inward (routers -> services -> repositories -> core).
"""
