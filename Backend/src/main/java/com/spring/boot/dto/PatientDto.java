package com.spring.boot.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PatientDto {
    private Long patientId;

    @NotBlank
    private String patientName;


    @NotBlank
    private String patientPhone;

    @NotBlank
    private String patientGender;

    @NotNull(message = "Age is required")
    @Min(value = 12, message = "Age must be more than 12")
    private int patientAge;

    @NotBlank
    private String patientStatus;

    private Long userId;
}
