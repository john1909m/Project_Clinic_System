package com.spring.boot.dto;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private Long userId;

    private String username;

    private String email;

    private String password;

    private String role;

    private DoctorDto doctor;
    private PatientDto patient;
}
