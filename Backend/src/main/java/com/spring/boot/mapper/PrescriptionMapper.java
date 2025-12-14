package com.spring.boot.mapper;

import com.spring.boot.dto.PrescriptionDto;
import com.spring.boot.model.Prescription;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PrescriptionMapper {
    @Mapping(source = "prescriptionDate", target = "dateIssued")
    @Mapping(source = "prescriptionNotes", target = "notes")
    @Mapping(source = "doctor.doctorId", target = "doctorId")
    @Mapping(source = "doctor.doctorName", target = "doctorName")
    @Mapping(source = "patient.patientId", target = "patientId")
    @Mapping(source = "patient.patientName", target = "patientName")
    @Mapping(source = "appointment.appointmentId",target = "appointmentId")
    PrescriptionDto toDto(Prescription prescription);

    List<PrescriptionDto> toDto(List<Prescription> prescriptions);

    @Mapping(source = "dateIssued", target = "prescriptionDate")
    @Mapping(source = "notes", target = "prescriptionNotes")
    Prescription toEntity(PrescriptionDto prescriptionDto);

    List<Prescription> toEntity(List<PrescriptionDto> prescriptionDtos);



}
