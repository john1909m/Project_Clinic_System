package com.spring.boot.config.exception;

import com.spring.boot.helper.MessageResponse;
import com.spring.boot.service.impl.BundleMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
public class ExceptionHandlerConfig {

    @Autowired
    private BundleMessageService bundleMessageService;

    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponse> handleException(Exception exception) {
        return ResponseEntity.badRequest().body(bundleMessageService.getMessage(exception.getMessage()));

    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<List<MessageResponse>> handleRuntimeException(MethodArgumentNotValidException exception){

        List<MessageResponse> messageResponseList = new ArrayList<>();

        List<FieldError> fieldErrors = exception.getBindingResult().getFieldErrors();

        fieldErrors.stream().forEach(fieldError -> {
            String message=fieldError.getDefaultMessage();
            messageResponseList.add(bundleMessageService.getMessage(message));
        });

        return ResponseEntity.badRequest().body(messageResponseList);
    }


}
