package com.example.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DeliveryRequestBody(@NotBlank String productName,
                                  @NotNull @DecimalMin("0.01") Double weight,
                                  @NotBlank String destination) {}
