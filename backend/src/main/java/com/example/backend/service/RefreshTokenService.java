package com.example.backend.service;

import com.example.backend.entity.RefreshToken;
import com.example.backend.entity.User;
import com.example.backend.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Service
public class RefreshTokenService {
    private final RefreshTokenRepository tokens;
    private final SecureRandom random = new SecureRandom();
    private final long lifetimeDays;
    private final boolean secureCookie;

    public RefreshTokenService(RefreshTokenRepository tokens,
                               @Value("${app.refresh-token-days:7}") long lifetimeDays,
                               @Value("${app.refresh-cookie-secure:false}") boolean secureCookie) {
        this.tokens = tokens;
        this.lifetimeDays = lifetimeDays;
        this.secureCookie = secureCookie;
    }

    public String issue(User user) {
        byte[] value = new byte[48];
        random.nextBytes(value);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(value);
        tokens.save(new RefreshToken(hash(raw), user, Instant.now().plus(Duration.ofDays(lifetimeDays))));
        return raw;
    }

    public User rotate(String raw) {
        RefreshToken old = tokens.findByTokenHash(hash(raw))
                .filter(token -> !token.isRevoked() && token.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));
        old.revoke();
        tokens.save(old);
        return old.getUser();
    }

    public void revoke(String raw) {
        tokens.findByTokenHash(hash(raw)).ifPresent(token -> {
            token.revoke();
            tokens.save(token);
        });
    }

    public ResponseCookie cookie(String value) {
        return ResponseCookie.from("refresh_token", value)
                .httpOnly(true).secure(secureCookie).sameSite("Strict")
                .path("/api/auth").maxAge(Duration.ofDays(lifetimeDays)).build();
    }

    public ResponseCookie clearedCookie() {
        return ResponseCookie.from("refresh_token", "").httpOnly(true).secure(secureCookie)
                .sameSite("Strict").path("/api/auth").maxAge(Duration.ZERO).build();
    }

    private String hash(String value) {
        try {
            return Base64.getUrlEncoder().withoutPadding().encodeToString(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
