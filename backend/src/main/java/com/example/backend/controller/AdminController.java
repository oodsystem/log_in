package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.request.RoleRequest;
import com.example.backend.dto.response.DeliveryResponse;
import com.example.backend.dto.response.ErrorResponse;
import com.example.backend.dto.response.MessageResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.entity.DeliveryRequest;
import com.example.backend.entity.DeliveryStatus;
import com.example.backend.entity.Role;
import com.example.backend.repository.DeliveryRequestRepository;
import com.example.backend.repository.DeliveryReportRepository;
import com.example.backend.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final UserRepository users;
    private final DeliveryRequestRepository deliveries;
    private final DeliveryReportRepository reports;

    public AdminController(UserRepository users, DeliveryRequestRepository deliveries,
                           DeliveryReportRepository reports) {
        this.users = users;
        this.deliveries = deliveries;
        this.reports = reports;
    }

    @GetMapping("/users")
    public List<UserResponse> users() {
        return users.findAll().stream().map(UserResponse::from).toList();
    }

    @GetMapping("/deliveries")
    public List<DeliveryResponse> deliveries() {
        return deliveries.findAll().stream().map(DeliveryResponse::from).toList();
    }

    @Transactional
    @DeleteMapping("/deliveries/{id}")
    public ResponseEntity<ApiResponse> deleteDeliveredDelivery(@PathVariable Long id) {
        return deliveries.findById(id).<ResponseEntity<ApiResponse>>map(delivery -> {
            if (delivery.getStatus() != DeliveryStatus.DELIVERED) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Only delivered items can be deleted"));
            }
            reports.deleteByDeliveryRequest(delivery);
            deliveries.delete(delivery);
            return ResponseEntity.ok(new MessageResponse("Delivery and related information deleted"));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse> setRole(@PathVariable Long id,
                                               @Valid @RequestBody RoleRequest request) {
        return users.findById(id).<ResponseEntity<ApiResponse>>map(user -> {
            if (request.role() == Role.PENDING || request.role() == Role.ADMIN
                    || user.getRole() == Role.ADMIN) {
                return ResponseEntity.<ApiResponse>badRequest()
                        .body(new ErrorResponse("Choose customer, delivery guy, or manager"));
            }
            user.setRole(request.role());
            users.save(user);
            return ResponseEntity.<ApiResponse>ok(UserResponse.from(user));
        }).orElseGet(() -> ResponseEntity.<ApiResponse>notFound().build());
    }

    @PatchMapping("/users/{id}/block")
    public ResponseEntity<ApiResponse> setBlocked(@PathVariable Long id,
                                                  @RequestParam boolean blocked) {
        return users.findById(id).<ResponseEntity<ApiResponse>>map(user -> {
            if (user.getRole() == Role.ADMIN && blocked) {
                return ResponseEntity.<ApiResponse>badRequest()
                        .body(new ErrorResponse("The admin account cannot be blocked"));
            }
            user.setBlocked(blocked);
            users.save(user);
            return ResponseEntity.<ApiResponse>ok(UserResponse.from(user));
        }).orElseGet(() -> ResponseEntity.<ApiResponse>notFound().build());
    }
}
