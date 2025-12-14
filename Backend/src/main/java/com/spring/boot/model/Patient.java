package com.spring.boot.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long patientId;

    @Column(nullable = false)
    private String patientName;

    @Column(unique = true, nullable = false)
    private String patientPhone;

    @Column(nullable = false)
    private String patientGender;

    @Column(nullable = false)
    private int patientAge;

    @Column(nullable = false)
    private String patientStatus;

    @OneToMany(mappedBy = "patient")
    @JsonManagedReference
    private List<Appointment> appointments;

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Prescription> prescriptions;


    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
}
