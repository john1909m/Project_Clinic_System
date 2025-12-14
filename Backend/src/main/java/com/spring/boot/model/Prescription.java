package com.spring.boot.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity

public class Prescription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long PrescriptionId;

    private LocalDateTime prescriptionDate;

    private String prescriptionNotes;

    @ManyToOne
    @JoinColumn(name = "doctor_id" ,nullable = false)
    @JsonBackReference
    private Doctor doctor;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonBackReference
    private Patient patient;

    @OneToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;


}
