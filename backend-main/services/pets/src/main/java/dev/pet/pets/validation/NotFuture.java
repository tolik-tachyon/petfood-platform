package dev.pet.pets.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = NotFutureValidator.class)
public @interface NotFuture {
    String message() default "date must not be in the future";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
