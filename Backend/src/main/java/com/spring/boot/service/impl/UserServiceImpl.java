package com.spring.boot.service.impl;

import com.spring.boot.dto.UserDto;
import com.spring.boot.mapper.DoctorMapper;
import com.spring.boot.mapper.PatientMapper;
import com.spring.boot.mapper.UserMapper;
import com.spring.boot.model.Doctor;
import com.spring.boot.model.Patient;
import com.spring.boot.model.User;
import com.spring.boot.repo.UserRepo;
import com.spring.boot.service.DoctorService;
import com.spring.boot.service.PatientService;
import com.spring.boot.service.UserService;
import jakarta.transaction.SystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class UserServiceImpl implements UserService {
    private final DoctorService doctorService;
    private final DoctorMapper doctorMapper;
    private UserRepo userRepo;

    private UserMapper userMapper;
    private PatientMapper patientMapper;

    private PasswordEncoder passwordEncoder;
    private PatientService patientService;

    @Autowired
    public UserServiceImpl(UserRepo userRepo,
                           PasswordEncoder passwordEncoder,
                           UserMapper userMapper,
                           PatientService patientService,
                           PatientMapper patientMapper, DoctorService doctorService, DoctorMapper doctorMapper) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
        this.patientService = patientService;
        this.patientMapper = patientMapper;
        this.doctorService = doctorService;
        this.doctorMapper = doctorMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserDto addUser(UserDto userDto) throws SystemException {

        if (userDto.getUserId() != null) {
            throw new RuntimeException("id.user.not.required");
        }
        if(userDto.getPassword() == null || userDto.getPassword().equals("")) {
            throw new RuntimeException("password.empty");
        }
        if(userDto.getUsername() == null || userDto.getUsername().equals("")) {
            throw new RuntimeException("username.empty");
        }
        if (userDto.getEmail() == null || userDto.getEmail().equals("")) {
            throw new RuntimeException("email.empty");
        }
        Optional<User> userOptional = userRepo.findByUsername(userDto.getUsername());
        if(userOptional.isPresent()){
            throw new RuntimeException("exist.user.with.same.userName");
        }
        // تحويل DTO لـ Entity وحفظ الـ User
        User user = userMapper.toEntity(userDto);
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));


        user.setRole("PATIENT");

        User userSaved = userRepo.saveAndFlush(user); // حفظ الـ User أولًا
        UserDto response = userMapper.toDto(userSaved);


        if (userDto.getPatient() != null) {
            if (userDto.getPatient().getPatientAge()<12){
                throw new RuntimeException(("patient.age.required.older.than.0"));
            }
            String phone = userDto.getPatient().getPatientPhone();

            String phoneRegex = "^(010|011|012|015)[0-9]{8}$";

            if (!phone.matches(phoneRegex)) {
                throw new RuntimeException("patient.phone.must.be.valid");
            }
            if(Objects.nonNull(userDto.getPatient().getPatientId())){
                throw new RuntimeException(("patient.id.notRequired"));
            }
            if(Objects.isNull(userDto.getPatient().getPatientName())){
                throw new RuntimeException(("patient.name.Required"));
            }
            if(userDto.getPatient().getPatientStatus()==null){
                throw new RuntimeException(("patient.status.required"));
            }
            Patient patient = new Patient();
            patient.setPatientName(userDto.getPatient().getPatientName());
            patient.setPatientPhone(userDto.getPatient().getPatientPhone());
            patient.setPatientGender(userDto.getPatient().getPatientGender());
            patient.setPatientAge(userDto.getPatient().getPatientAge());
            patient.setPatientStatus(userDto.getPatient().getPatientStatus());
            patient.setUser(userSaved);

//            PatientDto savedPatient = patientService.addPatient(patientMapper.toDto(patient));

            Patient savedPatient = patientService.addPatientEntity(patient);
            response.setPatient(patientMapper.toDto(savedPatient));
        }

        return response;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserDto adminAddUser(UserDto userDto) throws SystemException {
        if (userDto.getUserId() != null) {
            throw new RuntimeException("id.user.not.required");
        }
        if(userDto.getPassword() == null || userDto.getPassword().equals("")) {
            throw new RuntimeException("password.empty");
        }
        if(userDto.getUsername() == null || userDto.getUsername().equals("")) {
            throw new RuntimeException("username.empty");
        }
        if (userDto.getEmail() == null || userDto.getEmail().equals("")) {
            throw new RuntimeException("email.empty");
        }

        Optional<User> userOptional = userRepo.findByUsername(userDto.getUsername());
        if(userOptional.isPresent()){
            throw new RuntimeException("exist.user.with.same.userName");
        }
        User user = userMapper.toEntity(userDto);
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));

        String role = userDto.getRole();
//        String roleName = roles.iterator().next();


        user.setRole(role);

        User userSaved = userRepo.saveAndFlush(user); // حفظ الـ User أولًا
        UserDto response = userMapper.toDto(userSaved);

        if (userDto.getPatient() != null) {
            if (userDto.getPatient().getPatientAge()<12){
                throw new RuntimeException(("patient.age.required.older.than.0"));
            }
            String phone = userDto.getPatient().getPatientPhone();

            String phoneRegex = "^(010|011|012|015)[0-9]{8}$";

            if (!phone.matches(phoneRegex)) {
                throw new RuntimeException("patient.phone.must.be.valid");
            }
            if(Objects.nonNull(userDto.getPatient().getPatientId())){
                throw new RuntimeException(("patient.id.notRequired"));
            }
            if(Objects.isNull(userDto.getPatient().getPatientName())){
                throw new RuntimeException(("patient.name.Required"));
            }
            if(userDto.getPatient().getPatientStatus()==null){
                throw new RuntimeException(("patient.status.required"));
            }
            Patient patient = new Patient();
            patient.setPatientName(userDto.getPatient().getPatientName());
            patient.setPatientPhone(userDto.getPatient().getPatientPhone());
            patient.setPatientGender(userDto.getPatient().getPatientGender());
            patient.setPatientAge(userDto.getPatient().getPatientAge());
            patient.setPatientStatus(userDto.getPatient().getPatientStatus());
            patient.setUser(userSaved);
            Patient savedPatient = patientService.addPatientEntity(patient);
            response.setPatient(patientMapper.toDto(savedPatient));
        }
        if(userDto.getDoctor() != null) {
            System.out.println("Working Days from JSON = " + userDto.getDoctor().getWorkingDays());
            if (userDto.getDoctor().getWorkingDays() == null || userDto.getDoctor().getWorkingDays().isEmpty()) {
                throw new RuntimeException("doctor.workingDays.Required");
            }
            Doctor doctor = new Doctor();
            doctor.setDoctorName(userDto.getDoctor().getDoctorName());
            doctor.setDoctorPhone(userDto.getDoctor().getDoctorPhone());
            doctor.setAttendTime(userDto.getDoctor().getAttendTime());
            doctor.setLeaveTime(userDto.getDoctor().getLeaveTime());
            doctor.setWorkingDays(userDto.getDoctor().getWorkingDays());
            doctor.setUser(userSaved);
            Doctor savedDoctor = doctorService.addDoctorEntity(doctor);
            response.setDoctor(doctorMapper.toDto(savedDoctor));
        }

        return response;
    }

    @Override
    public UserDto getUserByUsername(String username) {
        User user = userRepo.findUserWithDetails(username)
                .orElseThrow(() -> new RuntimeException("user.notFound"));

        UserDto userDto = userMapper.toDto(user);
        return userDto;
    }

    @Override
    public List<UserDto> getAllUsers() {
        return userRepo.findAll().stream()
                .map(userMapper::toDto)
                .toList();
    }

    @Override
    public void deleteUser(Long id) {
        if (!userRepo.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepo.deleteById(id);
    }
}
