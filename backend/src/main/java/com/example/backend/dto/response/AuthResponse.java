package com.example.backend.dto.response;

import com.example.backend.dto.ApiResponse;
import com.example.backend.entity.Role;

public record AuthResponse(String accessToken, Role role) implements ApiResponse {}
