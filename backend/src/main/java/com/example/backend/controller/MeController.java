package com.example.backend.controller;

import com.example.backend.dto.response.MeResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MeController {

    @GetMapping("/api/me")
    public MeResponse me(Authentication auth) {
        return new MeResponse(auth.getName(),
                auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", ""));
    }
}