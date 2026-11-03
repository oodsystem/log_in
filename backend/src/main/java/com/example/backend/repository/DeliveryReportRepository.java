package com.example.backend.repository;

import com.example.backend.entity.DeliveryReport;
import com.example.backend.entity.DeliveryRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryReportRepository extends JpaRepository<DeliveryReport, Long> {
    void deleteByDeliveryRequest(DeliveryRequest deliveryRequest);
}
