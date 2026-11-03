package com.example.backend.repository;

import com.example.backend.entity.RevokedAccessToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RevokedAccessTokenRepository extends JpaRepository<RevokedAccessToken, Long> {
    Optional<RevokedAccessToken> findByTokenId(String tokenId);
}
