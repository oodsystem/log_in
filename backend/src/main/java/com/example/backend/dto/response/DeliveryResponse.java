package com.example.backend.dto.response;

import com.example.backend.dto.ApiResponse;
import com.example.backend.entity.DeliveryRequest;
import com.example.backend.entity.DeliveryStatus;

public record DeliveryResponse(Long id, String productName, double weight, String destination,
                               DeliveryStatus status, String customer, String deliveryGuy)
        implements ApiResponse {
    public static DeliveryResponse from(DeliveryRequest delivery) {
        return new DeliveryResponse(delivery.getId(), delivery.getProductName(), delivery.getWeight(),
                delivery.getDestination(), delivery.getStatus(), delivery.getCustomer().getUsername(),
                delivery.getDeliveryGuy() == null ? null : delivery.getDeliveryGuy().getUsername());
    }
}
