package dev.pet.account.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users",
    uniqueConstraints = @UniqueConstraint(name = "uk_users_email", columnNames = "email"))
public class User extends BaseEntity {

    @Email
    @NotBlank
    @Column(nullable = false, length = 254)
    private String email;

    @NotBlank
    @Column(nullable = false, length = 60)
    private String passwordHash;

    @Column(name = "first_name", length = 64)
    private String firstName;

    @Column(name = "last_name", length = 64)
    private String lastName;

    @Column(name = "enable_2fa", nullable = false)
    private boolean enable2fa = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private UserStatus status = UserStatus.PENDING_VERIFICATION;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 32)
    private Role role = Role.USER;

    @Column(length = 32)
    private String phone;

    @Column(name = "birth_date")
    private java.time.LocalDate birthDate;

    @Column(length = 100)
    private String country;

    @Column(length = 100)
    private String city;

    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }


    // getters/setters

    public String getEmail() { return email; }
    public void setEmail(String email) {
        this.email = email == null ? null : email.trim().toLowerCase();
    }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) {
        this.firstName = firstName == null ? null : firstName.trim();
    }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) {
        this.lastName = lastName == null ? null : lastName.trim();
    }

    public boolean isEnable2fa() { return enable2fa; }
    public void setEnable2fa(boolean enable2fa) { this.enable2fa = enable2fa; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) {
        this.phone = (phone == null || phone.isBlank()) ? null : phone.trim();
    }

    public java.time.LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(java.time.LocalDate birthDate) { this.birthDate = birthDate; }

    public String getCountry() { return country; }
    public void setCountry(String country) {
        this.country = (country == null || country.isBlank()) ? null : country.trim();
    }

    public String getCity() { return city; }
    public void setCity(String city) {
        this.city = (city == null || city.isBlank()) ? null : city.trim();
    }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

}
