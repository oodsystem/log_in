package com.example.backend.dto.response;

import com.example.backend.dto.ApiResponse;

public record DeliveryPersonResponse(Long id, String username) implements ApiResponse {}
