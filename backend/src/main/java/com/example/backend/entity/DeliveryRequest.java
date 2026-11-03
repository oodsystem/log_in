package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "delivery_requests")
public class DeliveryRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User customer;

    @ManyToOne
    private User deliveryGuy;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = false)
    private double weight;

    @Column(nullable = false)
    private String destination;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus status = DeliveryStatus.REQUESTED;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public User getCustomer() { return customer; }
    public User getDeliveryGuy() { return deliveryGuy; }
    public String getProductName() { return productName; }
    public double getWeight() { return weight; }
    public String getDestination() { return destination; }
    public DeliveryStatus getStatus() { return status; }
    public void setCustomer(User customer) { this.customer = customer; }
    public void setDeliveryGuy(User deliveryGuy) { this.deliveryGuy = deliveryGuy; }
    public void setProductName(String productName) { this.productName = productName; }
    public void setWeight(double weight) { this.weight = weight; }
    public void setDestination(String destination) { this.destination = destination; }
    public void setStatus(DeliveryStatus status) { this.status = status; }
}
