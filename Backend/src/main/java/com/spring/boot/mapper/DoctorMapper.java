package com.spring.boot.mapper;

import com.spring.boot.dto.DoctorDto;
import com.spring.boot.model.Doctor;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface DoctorMapper {
    Doctor toEntity(DoctorDto doctorDto);
    DoctorDto toDto(Doctor doctor);
    List<DoctorDto> toDto(List<Doctor> doctors);
    List<Doctor> toEntity(List<DoctorDto> doctorDtos);
}
