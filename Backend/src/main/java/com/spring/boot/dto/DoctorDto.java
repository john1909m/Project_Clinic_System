package com.spring.boot.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.spring.boot.enums.DaysOfWeek;
import jakarta.validation.constraints.NotBlank;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DoctorDto {

    private Long doctorId;

    @NotBlank
    private String doctorName;

    @NotBlank
    private String doctorPhone;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime attendTime;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime leaveTime;

    private Long userId;

    @NotBlank
    private List<DaysOfWeek> workingDays;

}
