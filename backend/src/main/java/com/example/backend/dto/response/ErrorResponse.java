package com.example.backend.dto.response;

import com.example.backend.dto.ApiResponse;

public record ErrorResponse(String error) implements ApiResponse {}
