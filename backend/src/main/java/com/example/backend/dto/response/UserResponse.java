package com.example.backend.dto.response;

import com.example.backend.dto.ApiResponse;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;

public record UserResponse(Long id, String username, Role role, boolean blocked, boolean available)
        implements ApiResponse {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getRole(),
                user.isBlocked(), user.isAvailable());
    }
}
