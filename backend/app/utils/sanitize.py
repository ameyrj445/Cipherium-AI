"""
Cipherium AI - Prompt Injection & Untrusted Input Sanitization Utility

Security Rationale:
Adversarial prompt injection attacks attempt to override system instructions,
force the model to leak system prompts, or induce unrestricted behavior (e.g. DAN).

This utility applies defense-in-depth sanitization:
1. Strips null bytes (`\\x00`) to prevent low-level string termination vulnerabilities.
2. Truncates inputs to an upper bound (2000 characters) to prevent token-exhaustion denial of service.
3. Checks for high-risk prompt injection and jailbreak signatures.
"""

import re
from typing import Optional

# High-risk adversarial injection regex patterns (case-insensitive)
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions?",
    r"disregard\s+(all\s+)?(previous|prior)\s+instructions?",
    r"forget\s+(all\s+)?(previous|prior)\s+instructions?",
    r"override\s+(all\s+)?(previous|prior|system)\s+instructions?",
    r"system\s+prompt\s+override",
    r"you\s+are\s+now\s+an?\s+unrestricted",
    r"jailbreak",
    r"(reveal|print|display|show|dump)\s+(your\s+)?system\s+prompt",
    r"(reveal|print|display|show|dump)\s+(your\s+)?(secret\s+)?instructions?",
    r"bypass\s+(your\s+)?safety\s+guidelines?",
    r"\bdan\s+mode\b",
]

_COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]


def sanitize_user_input(text: str, max_length: int = 2000) -> str:
    """
    Sanitizes user input destined for LLM or pedagogical tutoring evaluation.
    
    Args:
        text: Raw user input string.
        max_length: Maximum allowable character length (defaults to 2000).
        
    Returns:
        str: Cleaned and validated input.
        
    Raises:
        ValueError: If a recognized prompt injection pattern is detected.
    """
    if not isinstance(text, str):
        return ""

    # 1. Null-byte elimination
    cleaned = text.replace("\x00", "")

    # 2. Whitespace trimming
    cleaned = cleaned.strip()

    # 3. Maximum length truncation
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]

    # 4. Prompt injection signature analysis
    for pattern in _COMPILED_PATTERNS:
        if pattern.search(cleaned):
            raise ValueError("Prompt injection pattern detected in input.")

    return cleaned
