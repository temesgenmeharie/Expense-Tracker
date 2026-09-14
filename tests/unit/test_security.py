"""Unit tests for security utilities."""
from __future__ import annotations

import time

import pytest
from jose import JWTError

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password


class TestPasswordHashing:
    def test_hash_is_not_plaintext(self) -> None:
        hashed = hash_password("my_password")
        assert hashed != "my_password"

    def test_verify_correct_password(self) -> None:
        hashed = hash_password("correct_horse")
        assert verify_password("correct_horse", hashed) is True

    def test_reject_wrong_password(self) -> None:
        hashed = hash_password("correct_horse")
        assert verify_password("wrong_horse", hashed) is False

    def test_two_hashes_differ(self) -> None:
        """bcrypt salts each hash — same input should produce different outputs."""
        h1 = hash_password("same_pass")
        h2 = hash_password("same_pass")
        assert h1 != h2


class TestJWT:
    def test_create_and_decode_token(self) -> None:
        token = create_access_token("42")
        subject = decode_access_token(token)
        assert subject == "42"

    def test_invalid_token_raises(self) -> None:
        with pytest.raises(JWTError):
            decode_access_token("not.a.valid.token")

    def test_tampered_token_raises(self) -> None:
        token = create_access_token("99")
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(JWTError):
            decode_access_token(tampered)
