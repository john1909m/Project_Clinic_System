package com.spring.boot.service.impl;

import com.spring.boot.dto.DoctorDto;
import com.spring.boot.dto.PatientDto;
import com.spring.boot.mapper.DoctorMapper;
import com.spring.boot.mapper.PatientMapper;
import com.spring.boot.model.Appointment;
import com.spring.boot.model.Doctor;
import com.spring.boot.model.Patient;
import com.spring.boot.repo.AppointmentRepo;
import com.spring.boot.repo.DoctorRepo;
import com.spring.boot.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DoctorServiceImpl implements DoctorService {

    private AppointmentRepo appointmentRepo;
    private DoctorRepo doctorRepo;
    private DoctorMapper doctorMapper;
    private PatientMapper patientMapper;

    @Autowired
    public DoctorServiceImpl(DoctorRepo doctorRepo,PatientMapper patientMapper, DoctorMapper doctorMapper, AppointmentRepo appointmentRepo) {
        this.doctorRepo = doctorRepo;
        this.doctorMapper = doctorMapper;
        this.appointmentRepo = appointmentRepo;
        this.patientMapper = patientMapper;
    }

    @Override
    public List<DoctorDto> getDoctors() {
        List<Doctor> doctors = doctorRepo.findAll();
        return doctors.stream().map(doctor ->
                doctorMapper.toDto(doctor)).collect(Collectors.toList());
    }

    @Override
    public DoctorDto addDoctor(DoctorDto doctorDto) {

        if (Objects.nonNull(doctorDto.getDoctorId())) {
            throw new RuntimeException(("doctor.id.notRequired"));
        }
        if (Objects.isNull(doctorDto.getDoctorName())) {
            throw new RuntimeException(("doctor.name.Required"));
        }
        if (Objects.isNull(doctorDto.getDoctorPhone())) {
            throw new RuntimeException(("doctor.phone.Required"));
        }
        if (Objects.isNull(doctorDto.getAttendTime())) {
            throw new RuntimeException(("doctor.attendTime.Required"));
        }
        if (Objects.isNull(doctorDto.getLeaveTime())) {
            throw new RuntimeException(("doctor.leaveTime.Required"));
        }
        if (doctorDto.getWorkingDays() == null || doctorDto.getWorkingDays().isEmpty()) {
            throw new RuntimeException("doctor.workingDays.Required");
        }

        Doctor doctor = doctorMapper.toEntity(doctorDto);

        doctor.setAttendTime(doctorDto.getAttendTime());
        doctor.setLeaveTime(doctorDto.getLeaveTime());

        Doctor saved = doctorRepo.save(doctor);
        return doctorMapper.toDto(saved);
    }


    @Override
    public Doctor addDoctorEntity(Doctor doctor) {
        String phone = doctor.getDoctorPhone();

        String phoneRegex = "^(010|011|012|015)[0-9]{8}$";

        if (!phone.matches(phoneRegex)) {
            throw new RuntimeException("doctor.phone.must.be.valid");
        }
        if (Objects.nonNull(doctor.getDoctorId())) {
            throw new RuntimeException(("doctor.id.notRequired"));
        }
        if (Objects.isNull(doctor.getDoctorName())) {
            throw new RuntimeException(("doctor.name.Required"));
        }
        if (Objects.isNull(doctor.getDoctorPhone())) {
            throw new RuntimeException(("doctor.phone.Required"));
        }
        if (Objects.isNull(doctor.getAttendTime())) {
            throw new RuntimeException(("doctor.attendTime.Required"));
        }
        if (Objects.isNull(doctor.getLeaveTime())) {
            throw new RuntimeException(("doctor.leaveTime.Required"));
        }
        if (!doctor.getLeaveTime().isAfter(doctor.getAttendTime())) {
            throw new RuntimeException(("doctor.leaveTime.isn'tAfter.AttendTime"));
        }
        LocalTime startTime = LocalTime.of(7, 0);    // 7:00 AM
        LocalTime endTime = LocalTime.of(23, 59);
        if (!doctor.getAttendTime().isAfter(startTime)) {
            throw new RuntimeException(("clinic.is.closed"));
        }
        if (!doctor.getLeaveTime().isBefore(endTime)){
            throw new RuntimeException(("clinic.is.closed"));
        }
        if (doctor.getWorkingDays() == null || doctor.getWorkingDays().isEmpty()) {
            throw new RuntimeException("doctor.workingDays.Required");
        }
        return doctorRepo.save(doctor);
    }

    @Override
    public DoctorDto updateDoctor(DoctorDto doctorDto) {
        if(Objects.isNull(doctorDto.getDoctorId())){
            throw new RuntimeException(("doctor.id.Required"));
        }
        String phone = doctorDto.getDoctorPhone();

        String phoneRegex = "^(010|011|012|015)[0-9]{8}$";

        if (!phone.matches(phoneRegex)) {
            throw new RuntimeException("patient.phone.must be valid");
        }
        if (Objects.isNull(doctorDto.getDoctorName())) {
            throw new RuntimeException(("doctor.name.Required"));
        }
        if (Objects.isNull(doctorDto.getDoctorPhone())) {
            throw new RuntimeException(("doctor.phone.Required"));
        }
        if (Objects.isNull(doctorDto.getAttendTime())) {
            throw new RuntimeException(("doctor.attendTime.Required"));
        }
        if (Objects.isNull(doctorDto.getLeaveTime())) {
            throw new RuntimeException(("doctor.leaveTime.Required"));
        }
        if (doctorDto.getWorkingDays() == null || doctorDto.getWorkingDays().isEmpty()) {
            throw new RuntimeException("doctor.workingDays.Required");
        }

        doctorRepo.save(doctorMapper.toEntity(doctorDto));
        return doctorDto;
    }

    @Override
    public void deleteDoctor(Long id) {
        Optional<Doctor> doctorOptional=doctorRepo.findById(id);
        if(doctorOptional.isEmpty()){
            throw new RuntimeException(("doctor.id.notExists"));
        }
        doctorRepo.deleteById(id);
    }

    @Override
    public DoctorDto getDoctorById(Long id) {
        Optional<Doctor> doctorOptional=doctorRepo.findById(id);
        if(doctorOptional.isEmpty()){
            throw new RuntimeException(("doctor.id.notExists"));
        }
        return doctorMapper.toDto(doctorOptional.get());
    }

    @Override
    public DoctorDto getDoctorByName(String name) {
        Optional<Doctor> doctorOptional=doctorRepo.findDoctorByDoctorName(name);
        if(doctorOptional.isEmpty()){
            throw new RuntimeException(("doctor.name.notExists"));
        }
        return doctorMapper.toDto(doctorOptional.get());
    }

    @Override
    public List<Appointment> getAppointmentsForDoctor(Long doctorId) {
        return appointmentRepo.findByDoctorDoctorId(doctorId);
    }

    @Override
    public List<PatientDto> getPatientsForDoctor(Long doctorId) {
        List<Patient> patients=appointmentRepo.findByDoctorDoctorId(doctorId)
                .stream().map(appointment ->
                        appointment.getPatient())
                .distinct().collect(Collectors.toList());
        return patientMapper.toDto(patients) ;
    }
}
