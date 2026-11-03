package com.example.backend.dto.response;

import com.example.backend.dto.ApiResponse;

public record AvailabilityResponse(boolean available) implements ApiResponse {}
