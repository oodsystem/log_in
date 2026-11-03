package com.example.backend.config;

import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrap {
    @Bean
    CommandLineRunner createAdmin(UserRepository users, PasswordEncoder encoder,
                                  @Value("${app.admin.username:}") String username,
                                  @Value("${app.admin.password:}") String password) {
        return args -> {
            if (!username.isBlank() && !password.isBlank()) {
                User admin = users.findByUsername(username).orElseGet(() ->
                        new User(username, encoder.encode(password)));
                boolean changed = false;
                if (!encoder.matches(password, admin.getPassword())) {
                    admin.setPassword(encoder.encode(password));
                    changed = true;
                }
                if (admin.getRole() != Role.ADMIN || admin.isBlocked()) {
                    admin.setRole(Role.ADMIN);
                    admin.setBlocked(false);
                    changed = true;
                }
                if (changed || admin.getId() == null) {
                    users.save(admin);
                }
            }
        };
    }
}
