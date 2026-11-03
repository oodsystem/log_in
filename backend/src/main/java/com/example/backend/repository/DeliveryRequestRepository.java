package com.example.backend.repository;

import com.example.backend.entity.DeliveryRequest;
import com.example.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeliveryRequestRepository extends JpaRepository<DeliveryRequest, Long> {
    List<DeliveryRequest> findByCustomer(User customer);
    List<DeliveryRequest> findByDeliveryGuy(User deliveryGuy);
}
