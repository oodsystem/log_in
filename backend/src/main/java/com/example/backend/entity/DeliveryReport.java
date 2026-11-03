package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "delivery_reports")
public class DeliveryReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private DeliveryRequest deliveryRequest;

    @ManyToOne(optional = false)
    private User customer;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public DeliveryRequest getDeliveryRequest() { return deliveryRequest; }
    public User getCustomer() { return customer; }
    public String getReason() { return reason; }
    public Instant getCreatedAt() { return createdAt; }
    public void setDeliveryRequest(DeliveryRequest deliveryRequest) { this.deliveryRequest = deliveryRequest; }
    public void setCustomer(User customer) { this.customer = customer; }
    public void setReason(String reason) { this.reason = reason; }
}
