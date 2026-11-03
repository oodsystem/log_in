package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.RegisterRequest;
import com.example.backend.dto.response.AuthResponse;
import com.example.backend.dto.response.ErrorResponse;
import com.example.backend.dto.response.MessageResponse;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.RevokedAccessTokenRepository;
import com.example.backend.service.JwtService;
import com.example.backend.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final RefreshTokenService refreshTokens;
    private final RevokedAccessTokenRepository revokedAccessTokens;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt,
                          RefreshTokenService refreshTokens,
                          RevokedAccessTokenRepository revokedAccessTokens) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.refreshTokens = refreshTokens;
        this.revokedAccessTokens = revokedAccessTokens;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest request) {
        if (users.findByUsername(request.username()).isPresent()) {
            return ResponseEntity.status(409).body(new ErrorResponse("Username already taken"));
        }
        users.save(new User(request.username(), encoder.encode(request.password())));
        return ResponseEntity.ok(new MessageResponse("Registration submitted for admin approval"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest request) {
        Optional<User> foundUser = users.findByUsername(request.username());
        if (foundUser.isEmpty() || !encoder.matches(request.password(), foundUser.get().getPassword())) {
            return ResponseEntity.status(401).body(new ErrorResponse("Invalid username or password"));
        }
        User user = foundUser.get();
        if (user.isBlocked()) {
            return ResponseEntity.status(403).body(new ErrorResponse("This account is blocked"));
        }
        if (user.getRole() == Role.PENDING) {
            return ResponseEntity.status(403).body(new ErrorResponse("An admin must assign your role first"));
        }
        String refreshToken = refreshTokens.issue(user);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokens.cookie(refreshToken).toString())
                .body(new AuthResponse(jwt.generateAccessToken(user), user.getRole()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse> refresh(HttpServletRequest request) {
        String raw = cookieValue(request, "refresh_token");
        if (raw == null) {
            return ResponseEntity.status(401).body(new ErrorResponse("Refresh token is missing"));
        }
        try {
            User user = refreshTokens.rotate(raw);
            if (user.isBlocked() || user.getRole() == Role.PENDING) {
                return ResponseEntity.status(403).body(new ErrorResponse("Account is not active"));
            }
            String next = refreshTokens.issue(user);
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshTokens.cookie(next).toString())
                    .body(new AuthResponse(jwt.generateAccessToken(user), user.getRole()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(401).body(new ErrorResponse("Invalid refresh token"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String accessToken = authorization.substring(7);
            try {
                String tokenId = jwt.extractTokenId(accessToken);
                if (revokedAccessTokens.findByTokenId(tokenId).isEmpty()) {
                    revokedAccessTokens.save(new com.example.backend.entity.RevokedAccessToken(
                            tokenId, jwt.extractExpiration(accessToken)));
                }
            } catch (io.jsonwebtoken.JwtException | IllegalArgumentException ignored) {
                // The refresh token is still revoked below.
            }
        }
        String raw = cookieValue(request, "refresh_token");
        if (raw != null) {
            refreshTokens.revoke(raw);
        }
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE,
                refreshTokens.clearedCookie().toString()).build();
    }

    private String cookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }
}
