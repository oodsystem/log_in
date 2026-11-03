package com.example.backend.dto.request;

import com.example.backend.entity.Role;
import jakarta.validation.constraints.NotNull;

public record RoleRequest(@NotNull Role role) {}
