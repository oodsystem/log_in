package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.request.AssignmentRequest;
import com.example.backend.dto.request.DeliveryRequestBody;
import com.example.backend.dto.response.AvailabilityResponse;
import com.example.backend.dto.response.DeliveryPersonResponse;
import com.example.backend.dto.response.DeliveryResponse;
import com.example.backend.dto.response.ErrorResponse;
import com.example.backend.entity.DeliveryRequest;
import com.example.backend.entity.DeliveryStatus;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.repository.DeliveryRequestRepository;
import com.example.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
public class DeliveryController {
    private final UserRepository users;
    private final DeliveryRequestRepository requests;

    public DeliveryController(UserRepository users, DeliveryRequestRepository requests) {
        this.users = users;
        this.requests = requests;
    }

    @PostMapping("/api/customer/deliveries")
    public ResponseEntity<DeliveryResponse> request(@Valid @RequestBody DeliveryRequestBody body,
                                                    Authentication auth) {
        User customer = user(auth);
        DeliveryRequest delivery = new DeliveryRequest();
        delivery.setCustomer(customer);
        delivery.setProductName(body.productName());
        delivery.setWeight(body.weight());
        delivery.setDestination(body.destination());
        return ResponseEntity.ok(DeliveryResponse.from(requests.save(delivery)));
    }

    @GetMapping("/api/customer/deliveries")
    public List<DeliveryResponse> customerDeliveries(Authentication auth) {
        return requests.findByCustomer(user(auth)).stream().map(DeliveryResponse::from).toList();
    }

    @PatchMapping("/api/delivery/availability")
    public AvailabilityResponse availability(@RequestParam boolean available, Authentication auth) {
        User deliveryGuy = user(auth);
        deliveryGuy.setAvailable(available);
        users.save(deliveryGuy);
        return new AvailabilityResponse(available);
    }

    @GetMapping("/api/delivery/deliveries")
    public List<DeliveryResponse> assignedDeliveries(Authentication auth) {
        return requests.findByDeliveryGuy(user(auth)).stream().map(DeliveryResponse::from).toList();
    }

    @PatchMapping("/api/delivery/deliveries/{id}/delivered")
    public ResponseEntity<ApiResponse> markDelivered(@PathVariable Long id, Authentication auth) {
        User deliveryGuy = user(auth);
        return requests.findById(id).<ResponseEntity<ApiResponse>>map(delivery -> {
            if (delivery.getDeliveryGuy() == null
                    || !delivery.getDeliveryGuy().getId().equals(deliveryGuy.getId())
                    || delivery.getStatus() != DeliveryStatus.ASSIGNED) {
                return ResponseEntity.<ApiResponse>status(403)
                        .body(new ErrorResponse("This delivery is not assigned to you"));
            }
            delivery.setStatus(DeliveryStatus.DELIVERED);
            deliveryGuy.setAvailable(true);
            users.save(deliveryGuy);
            return ResponseEntity.<ApiResponse>ok(DeliveryResponse.from(requests.save(delivery)));
        }).orElseGet(() -> ResponseEntity.<ApiResponse>notFound().build());
    }

    @GetMapping("/api/manager/deliveries")
    public List<DeliveryResponse> allDeliveries() {
        return requests.findAll().stream().map(DeliveryResponse::from).toList();
    }

    @GetMapping("/api/manager/delivery-guys")
    public List<DeliveryPersonResponse> availableDeliveryGuys() {
        return users.findByRoleAndBlockedFalseAndAvailableTrue(Role.DELIVERY_GUY)
                .stream().map(user -> new DeliveryPersonResponse(user.getId(), user.getUsername())).toList();
    }

    @PatchMapping("/api/manager/deliveries/{id}/assign")
    public ResponseEntity<ApiResponse> assign(@PathVariable Long id,
                                              @Valid @RequestBody AssignmentRequest assignment) {
        return requests.findById(id).<ResponseEntity<ApiResponse>>flatMap(delivery -> users.findById(assignment.deliveryGuyId())
                .map(deliveryGuy -> {
                    if (delivery.getStatus() != DeliveryStatus.REQUESTED
                            || deliveryGuy.getRole() != Role.DELIVERY_GUY || deliveryGuy.isBlocked()
                            || !deliveryGuy.isAvailable()) {
                        return ResponseEntity.<ApiResponse>badRequest()
                                .body(new ErrorResponse("Delivery guy is not available"));
                    }
                    delivery.setDeliveryGuy(deliveryGuy);
                    delivery.setStatus(DeliveryStatus.ASSIGNED);
                    deliveryGuy.setAvailable(false);
                    users.save(deliveryGuy);
                    return ResponseEntity.<ApiResponse>ok(DeliveryResponse.from(requests.save(delivery)));
                })).orElseGet(() -> ResponseEntity.<ApiResponse>notFound().build());
    }

    private User user(Authentication auth) {
        return users.findByUsername(auth.getName()).orElseThrow();
    }
}
