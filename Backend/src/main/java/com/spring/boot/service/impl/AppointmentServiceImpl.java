package com.spring.boot.service.impl;

import com.spring.boot.dto.AppointmentDto;
import com.spring.boot.enums.DaysOfWeek;

import java.time.*;

import com.spring.boot.mapper.AppointmentMapper;
import com.spring.boot.model.Appointment;
import com.spring.boot.model.Doctor;
import com.spring.boot.model.Patient;
import com.spring.boot.repo.AppointmentRepo;
import com.spring.boot.repo.DoctorRepo;
import com.spring.boot.repo.PatientRepo;
import com.spring.boot.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AppointmentServiceImpl implements AppointmentService {

    private AppointmentRepo appointmentRepo;
    private DoctorRepo doctorRepo;
    private PatientRepo patientRepo;
    private AppointmentMapper appointmentMapper;

    @Autowired
    public AppointmentServiceImpl(AppointmentRepo appointmentRepo,PatientRepo patientRepo,DoctorRepo doctorRepo,AppointmentMapper appointmentMapper) {
        this.appointmentRepo = appointmentRepo;
        this.doctorRepo = doctorRepo;
        this.appointmentMapper = appointmentMapper;
        this.patientRepo = patientRepo;
    }

    @Override
    public List<AppointmentDto> getAppointments() {
        List<Appointment> appointments = appointmentRepo.findAll();
        return appointments.stream().map(appointment ->
                appointmentMapper.toDto(appointment)).collect(Collectors.toList());
    }

    @Override
    public AppointmentDto getAppointmentById(Long id) {
        Optional<Appointment> appointmentOptional = appointmentRepo.findById(id);
        if (appointmentOptional.isEmpty()){
            throw new RuntimeException("appointment.id.notExist");
        }
        return appointmentMapper.toDto(appointmentOptional.get());
    }

    private void validateBookingTime(Doctor doctor, LocalDateTime appointmentDate) {

        LocalDate today = LocalDate.now();
        LocalDate inputDate = appointmentDate.toLocalDate();
        LocalTime appointmentTime = appointmentDate.toLocalTime();

        // 1. Check date is after today
        if (!inputDate.isAfter(today)) {
            throw new RuntimeException("appointment.date.is.before.tomorrow");
        }

        // 2. Convert Java DayOfWeek → Your Enum DaysOfWeek
        java.time.DayOfWeek javaDay = appointmentDate.getDayOfWeek();
        DaysOfWeek appointmentDay = DaysOfWeek.valueOf(javaDay.name());

        List<DaysOfWeek> doctorWorkingDays = doctor.getWorkingDays();

        // 3. Check if doctor works on that day
        if (!doctorWorkingDays.contains(appointmentDay)) {
            throw new RuntimeException("doctor.notWorkingOnThisDay");
        }

        // 4. Check time inside attend + leave time
        if (appointmentTime.isBefore(doctor.getAttendTime())) {
            throw new RuntimeException("appointment.beforeAttendTime");
        }

        if (appointmentTime.isAfter(doctor.getLeaveTime())) {
            throw new RuntimeException("appointment.afterLeaveTime");
        }

        // 5. Check that appointment is between 7:00 AM and 11:59 PM
        LocalTime earliestTime = LocalTime.of(7, 0); // 7:00 AM
        LocalTime latestTime = LocalTime.of(23, 59); // 11:59 PM

        if (appointmentTime.isBefore(earliestTime) || appointmentTime.isAfter(latestTime)) {
            throw new RuntimeException("appointment.time.mustBeBetween7AMand11_59PM");
        }
    }



    @Override
    public AppointmentDto addAppointment(AppointmentDto appointmentDto) {

        // ---------------- Validation ----------------
        if (Objects.nonNull(appointmentDto.getAppointmentId())) {
            throw new RuntimeException("appointment.id.notRequired");
        }
        if (Objects.isNull(appointmentDto.getAppointmentDate())) {
            throw new RuntimeException("appointment.date.Required");
        }
        if (Objects.isNull(appointmentDto.getDoctorName())) {
            throw new RuntimeException("appointment.doctor.name.Required");
        }
        if (Objects.isNull(appointmentDto.getPatientName())) {
            throw new RuntimeException("appointment.patient.name.Required");
        }

        // ---------------- Fetch doctor and patient ----------------
        Doctor doctor = doctorRepo.findDoctorByDoctorName(appointmentDto.getDoctorName())
                .orElseThrow(() -> new RuntimeException("doctor.name.notFound"));
        Patient patient = patientRepo.findPatientByPatientName(appointmentDto.getPatientName())
                .orElseThrow(() -> new RuntimeException("patient.name.notFound"));

        // ---------------- Validate booking day and time ----------------
        validateBookingTime(doctor, appointmentDto.getAppointmentDate());

        // ---------------- Check if patient already has a future appointment ----------------
//        boolean hasFutureAppointment = appointmentRepo
//                .findByPatientPatientIdAndAppointmentDateAfter(patient.getPatientId(), LocalDateTime.now())
//                .stream()
//                .findAny()
//                .isPresent();
//
//        if (hasFutureAppointment) {
//            throw new RuntimeException("patient.alreadyHasFutureAppointment");
//        }

        // ---------------- Check for existing appointments for doctor ----------------
        LocalDateTime appointmentDate = appointmentDto.getAppointmentDate();
        Duration buffer = Duration.ofMinutes(30); // half-hour buffer

        List<Appointment> existingAppointments = appointmentRepo
                .findByDoctorDoctorIdAndAppointmentDateBetween(
                        doctor.getDoctorId(),
                        appointmentDate.toLocalDate().atStartOfDay(),
                        appointmentDate.toLocalDate().atTime(23, 59, 59)
                );

        for (Appointment a : existingAppointments) {
            LocalDateTime existing = a.getAppointmentDate();

            // Same exact time
            if (existing.equals(appointmentDate)) {
                throw new RuntimeException("doctor.notAvailableAtThisTime");
            }

            // Less than 30 minutes apart
            long minutesDiff = Math.abs(Duration.between(existing, appointmentDate).toMinutes());
            if (minutesDiff < 30) {
                throw new RuntimeException("doctor.hasAppointmentTooClose");
            }
        }

        // ---------------- Save appointment ----------------
        Appointment appointment = appointmentMapper.toEntity(appointmentDto);
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);

        Appointment saved = appointmentRepo.save(appointment);
        return appointmentMapper.toDto(saved);
    }



    @Override
    public AppointmentDto updateAppointment(AppointmentDto appointmentDto) {

        if (Objects.isNull(appointmentDto.getAppointmentId())) {
            throw new RuntimeException("appointment.id.Required");
        }

        // ---------------- Fetch existing appointment ----------------
        Appointment existingAppointment = appointmentRepo.findById(appointmentDto.getAppointmentId())
                .orElseThrow(() -> new RuntimeException("appointment.id.notFound"));

        Doctor doctor = doctorRepo.findDoctorByDoctorName(appointmentDto.getDoctorName())
                .orElseThrow(() -> new RuntimeException("doctor.name.notFound"));

        LocalDateTime newAppointmentDate = appointmentDto.getAppointmentDate();

        // ---------------- Validate booking day and time ----------------
        validateBookingTime(doctor, newAppointmentDate);

        // ---------------- Check for conflicting appointments ----------------
        Duration buffer = Duration.ofMinutes(30); // half-hour buffer

        // Get all appointments for the doctor on the same day, except the current one
        List<Appointment> existingAppointments = appointmentRepo
                .findByDoctorDoctorIdAndAppointmentDateBetween(
                        doctor.getDoctorId(),
                        newAppointmentDate.toLocalDate().atStartOfDay(),
                        newAppointmentDate.toLocalDate().atTime(23, 59, 59)
                )
                .stream()
                .filter(a -> !a.getAppointmentId().equals(existingAppointment.getAppointmentId()))
                .toList();

        for (Appointment a : existingAppointments) {
            LocalDateTime existing = a.getAppointmentDate();

            // Same exact time
            if (existing.equals(newAppointmentDate)) {
                throw new RuntimeException("doctor.notAvailableAtThisTime");
            }

            // Less than 30 minutes apart
            long minutesDiff = Math.abs(Duration.between(existing, newAppointmentDate).toMinutes());
            if (minutesDiff < 30) {
                throw new RuntimeException("doctor.hasAppointmentTooClose");
            }
        }

        // ---------------- Update appointment ----------------
        existingAppointment.setAppointmentDate(newAppointmentDate);
        existingAppointment.setDoctor(doctor);
        existingAppointment.setPatientName(appointmentDto.getPatientName());

        Appointment updatedAppointment = appointmentRepo.save(existingAppointment);
        return appointmentMapper.toDto(updatedAppointment);
    }


    @Override
    public void deleteAppointment(Long id) {
        Optional<Appointment> appointmentOptional = appointmentRepo.findById(id);
        if (appointmentOptional.isEmpty()){
            throw new RuntimeException("appointment.id.notExist");
        }

        appointmentRepo.deleteById(id);
    }

    @Override
    public List<AppointmentDto> getAppointmentsByDoctorId(Long doctorId) {
        List<Appointment> appointments=appointmentRepo.findByDoctorDoctorId(doctorId);

        return appointments.stream().map(appointmentMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentDto> getAppointmentsByPatientId(Long patientId) {
        List<Appointment> appointments=appointmentRepo.findByPatientPatientId(patientId);
        return appointments.stream().map(appointmentMapper::toDto)
                .collect(Collectors.toList());
    }

}
