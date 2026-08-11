"""Exceptions raised by the Gmail integration layer.

All of them are caught at the executor boundary (``app.integrations.gmail.executor``)
and turned into a structured ``ActionExecutionResult`` — nothing here should
ever propagate out of an executor uncaught.
"""

from __future__ import annotations


class GmailError(Exception):
    """Base class for every Gmail integration failure."""


class GmailNotConnectedError(GmailError):
    """No usable Gmail ``Connection`` exists for this organization/user."""


class GmailAuthError(GmailError):
    """Stored or exchanged credentials were rejected and could not be used."""


class GmailRateLimitError(GmailError):
    """The Gmail API returned 429; caller should stop and not retry immediately."""


class GmailAPIError(GmailError):
    """Any other non-success response from the Gmail API."""

    def __init__(self, message: str, *, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code
