package com.spring.boot.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.spring.boot.enums.DaysOfWeek;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long doctorId;

    @Column(unique = true, nullable = false)
    private String doctorName;

    @Column(unique = true, nullable = false,name = "DOCTOR_PHONE")
    private String doctorPhone;


    @Column(nullable = false)
    private LocalTime attendTime;

    @Column(nullable = false)
    private LocalTime leaveTime;

    @OneToMany(mappedBy = "doctor")
    @JsonManagedReference
    private List<Appointment> appointments;

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Prescription> prescriptions;

    @ElementCollection(targetClass = DaysOfWeek.class)
    @CollectionTable(name = "doctor_working_days", joinColumns = @JoinColumn(name = "doctor_id"))
    @Enumerated(EnumType.STRING)
    private List<DaysOfWeek> workingDays;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

}
