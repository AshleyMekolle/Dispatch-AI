"""``{{variable}}`` substitution for personalized bulk email.

Deliberately tiny, not a general template engine: the only supported syntax
is flat variable interpolation from a recipient's own columns (email, name,
company, ...). A variable referenced in the subject/body that a given
recipient's row doesn't have is a hard error for that recipient — see
``MissingTemplateVariablesError`` — never a silent blank substitution.
"""

from __future__ import annotations

import re

_PLACEHOLDER = re.compile(r"\{\{\s*(\w+)\s*\}\}")


class MissingTemplateVariablesError(Exception):
    def __init__(self, variables: list[str]) -> None:
        super().__init__(f"Missing template variable(s): {', '.join(variables)}")
        self.variables = variables


def render_template(template: str, variables: dict[str, str]) -> str:
    missing = sorted({name for name in _PLACEHOLDER.findall(template) if name not in variables})
    if missing:
        raise MissingTemplateVariablesError(missing)
    return _PLACEHOLDER.sub(lambda match: variables[match.group(1)], template)
