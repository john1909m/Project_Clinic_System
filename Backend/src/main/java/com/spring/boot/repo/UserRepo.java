package com.spring.boot.repo;

import com.spring.boot.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<User,Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    @Query("""
       SELECT u FROM User u
       LEFT JOIN FETCH u.doctor d
       LEFT JOIN FETCH u.patient p
       LEFT JOIN FETCH d.workingDays
       WHERE u.username = :username
       """)
    Optional<User> findUserWithDetails(String username);
}
