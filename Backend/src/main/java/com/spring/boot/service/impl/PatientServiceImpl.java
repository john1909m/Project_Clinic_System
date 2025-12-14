package com.spring.boot.service.impl;

import com.spring.boot.dto.AppointmentDto;
import com.spring.boot.dto.PatientDto;
import com.spring.boot.mapper.PatientMapper;
import com.spring.boot.model.Patient;
import com.spring.boot.repo.AppointmentRepo;
import com.spring.boot.repo.PatientRepo;
import com.spring.boot.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PatientServiceImpl implements PatientService {

    private AppointmentRepo appointmentRepo;
    private PatientRepo patientRepo;
    private PatientMapper patientMapper;

    @Autowired
    public PatientServiceImpl(AppointmentRepo appointmentRepo,PatientRepo patientRepo,PatientMapper patientMapper){
        this.appointmentRepo = appointmentRepo;
        this.patientRepo = patientRepo;
        this.patientMapper = patientMapper;
    }


    @Override
    public List<PatientDto> getAllPatients() {
        List<Patient> patients=patientRepo.findAll();
        return patients.stream().map(patient ->
                patientMapper.toDto(patient)).collect(Collectors.toList());
    }

    @Override
    public List<PatientDto> getAllPatientsByDoctorId(Long patientId) {
        return appointmentRepo.findByDoctorDoctorId(patientId)
                .stream().map(appointment ->
                        patientMapper.toDto(appointment.getPatient()))
                        .distinct().collect(Collectors.toList());
    }

    @Override
    public PatientDto getPatientById(Long id) {
        Patient patient=patientRepo.findById(id)
                .orElseThrow(()->new RuntimeException("Patient.not.found"));
        return patientMapper.toDto(patient);
    }

    @Override
    public PatientDto getPatientByPatientName(String patientName) {
        Patient patient=patientRepo.findPatientByPatientName(patientName)
                .orElseThrow(()->new RuntimeException("Patient.not.found"));
        return patientMapper.toDto(patient);
    }

    @Override
    public List<PatientDto> getAllPatientsByDoctorName(String patientName) {
        return appointmentRepo.findByDoctorDoctorName(patientName)
                .stream().map(appointment ->
                        patientMapper.toDto(appointment.getPatient()))
                        .distinct().collect(Collectors.toList());
    }

    @Override
    public PatientDto addPatient(PatientDto patientDto) {
        if(Objects.nonNull(patientDto.getPatientId())){
            throw new RuntimeException(("patient.id.notRequired"));
        }
        if(Objects.isNull(patientDto.getPatientName())){
            throw new RuntimeException(("patient.name.Required"));
        }
        if(Objects.isNull(patientDto.getPatientPhone())){
            throw new RuntimeException(("patient.phone.Required"));
        }
        if (patientDto.getPatientAge()<12){
            throw new RuntimeException(("patient.age.required.older than 0"));
        }
        Optional<Patient> patientOptional=patientRepo.findPatientByPatientName(patientDto.getPatientName());
        if(patientOptional.isPresent()){
            throw new RuntimeException(("patient.already.exists"));
        }

        Patient patient=patientRepo.save(patientMapper.toEntity(patientDto));
        return patientDto;
    }

    @Override
    public PatientDto updatePatient(PatientDto patientDto) {
        if(Objects.isNull(patientDto.getPatientId())){
            throw new RuntimeException(("patient.id.Required"));
        }
        if (patientDto.getPatientAge()<12){
            throw new RuntimeException(("patient.age.required.older than 0"));
        }
        String phone = patientDto.getPatientPhone();

        String phoneRegex = "^(010|011|012|015)[0-9]{8}$";

        if (!phone.matches(phoneRegex)) {
            throw new RuntimeException("patient.phone.must be valid");
        }

        if(Objects.isNull(patientDto.getPatientName())){
            throw new RuntimeException(("patient.name.Required"));
        }
        if(patientDto.getPatientStatus()==null){
            throw new RuntimeException(("patient.status.required"));
        }
        patientRepo.save(patientMapper.toEntity(patientDto));
        return patientDto;
    }

    @Override
    public void deletePatientById(Long id) {
        Optional<Patient> patientOptional=patientRepo.findById(id);
        if(patientOptional.isEmpty()){
            throw new RuntimeException(("patient.id.notExists"));
        }
        patientRepo.deleteById(id);
    }

    public Patient addPatientEntity(Patient patient) {
        Optional<Patient> patientOptional=patientRepo.findPatientByPatientName(patient.getPatientName());
        if(patientOptional.isPresent()){
            throw new RuntimeException(("patient.already.exists"));
        }
        return patientRepo.save(patient);
    }
}
