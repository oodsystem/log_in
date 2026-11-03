package com.example.backend.dto.response;

import com.example.backend.dto.ApiResponse;

public record MeResponse(String username, String role) implements ApiResponse {}
