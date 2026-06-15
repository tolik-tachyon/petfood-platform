package dev.pet.account.service;

import dev.pet.account.domain.User;
import dev.pet.account.domain.UserStatus;
import dev.pet.account.dto.*;
import dev.pet.account.exception.NotFoundException;
import dev.pet.account.messaging.EmailProducer;
import dev.pet.account.messaging.SmsProducer;
import dev.pet.account.repository.UserRepository;
import dev.pet.account.repository.SupportRequestRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;



import dev.pet.account.domain.Role;
import dev.pet.account.domain.LoginEvent;
import dev.pet.account.util.CodeGenerator;
import dev.pet.account.repository.LoginEventRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.*;
import java.util.stream.Collectors;
import java.time.OffsetDateTime;


import java.time.Duration;


@Service
public class AccountService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final StringRedisTemplate redis;
    private final LoginEventRepository loginEvents;
    private final EmailProducer emailProducer;
    private final AuditLogService auditLogService;
    private final SupportRequestRepository supportRequests;



    public AccountService(UserRepository users, PasswordEncoder encoder, StringRedisTemplate redis, LoginEventRepository loginEvents, EmailProducer emailProducer, AuditLogService auditLogService, SupportRequestRepository supportRequests) {
        this.users = users;
        this.encoder = encoder;
        this.redis = redis;
        this.loginEvents = loginEvents;
        this.emailProducer = emailProducer;
        this.auditLogService = auditLogService;
        this.supportRequests = supportRequests;
    }

    private void logLogin(UUID userId, String ip, String ua, boolean success) {
        var ev = new LoginEvent();
        ev.setUserId(userId);
        ev.setIp(ip);
        ev.setUserAgent(ua);
        ev.setSuccess(success);
        loginEvents.save(ev);
        if (!success) return;
        CreateAuditLogRequest req = new CreateAuditLogRequest();
        req.setUserId(userId);
        req.setEventType("LOGIN");
        req.setEventInfo("{\"result\":\"success\"}");
        auditLogService.create(req);
    }

    private ProfileResponse toProfile(User u) {

        String role = (u.getRole() == null) ? null : u.getRole().name();
        return new ProfileResponse(
            u.getId(),
            u.getEmail(),
            u.getFirstName(),
            u.getLastName(),
            u.getPhone(),
            u.getBirthDate(),
            u.getCountry(),
            u.getCity(),
            u.getAvatarUrl(),
            role,
            u.getCreatedAt()
        );
    }



    @Transactional
    public RegisterResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();

        if (users.existsByEmail(email)) {
            throw new DuplicateKeyException("Email already registered");
        }

        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(req.password()));
        u.setStatus(UserStatus.PENDING_VERIFICATION);
        u.setRole(Role.USER);
        u.setFirstName(req.firstName());
        u.setLastName(req.lastName());

        users.save(u);

        sendRegistrationCode(email);

        return new RegisterResponse(
            u.getId(),
            u.getEmail(),
            u.getStatus().name()
        );
    }


    private void sendRegistrationCode(String email) {
        String code = CodeGenerator.numeric6();

        String key = RedisKeys.confirmCode(email);
        redis.opsForValue().set(key, code, Duration.ofMinutes(10));

        String cooldownKey = RedisKeys.confirmCodeCooldown(email);
        redis.opsForValue().set(cooldownKey, "1", Duration.ofMinutes(1));

        emailProducer.sendConfirmCode(email, code);
        System.out.println("[DEV] REG CONFIRM for " + email + " code=" + code);
    }



    @Transactional
    public String confirmRegistrationByEmail(String rawEmail, String code) {
        if (rawEmail == null || rawEmail.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");

        String email = rawEmail.trim().toLowerCase();

        String key = RedisKeys.confirmCode(email);
        String stored = redis.opsForValue().get(key);

        if (stored == null) {
            String cooldownKey = RedisKeys.confirmCodeCooldown(email);
            Boolean recentlySent = redis.hasKey(cooldownKey);

            if (Boolean.FALSE.equals(recentlySent) || recentlySent == null) {
                sendRegistrationCode(email);
            }

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Verification code expired. A new code has been sent to your email."
            );
        }

        if (!stored.equals(code)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid verification code"
            );
        }

        User user = users.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "User not found"));

        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            user.setStatus(UserStatus.ACTIVE);
            users.save(user);
        }

        redis.delete(key);
        redis.delete(RedisKeys.confirmCodeCooldown(email));

        String sid = UUID.randomUUID().toString();
        String sessionKey = "session:" + sid;

        String json = buildSessionJson(sid, user);
        redis.opsForValue().set(sessionKey, json, Duration.ofDays(7));

        return sid;
    }

    public void logout(String sid) {
        if (sid == null || sid.isBlank()) {
            return;
        }

        String sessionKey = "session:" + sid;
        redis.delete(sessionKey);
    }


//    @Transactional
//    public String confirmByPhone(String rawPhone, String code) {
//        if (rawPhone == null || rawPhone.isBlank() || code == null || code.isBlank()) {
//            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone and code are required");
//        }
//
//        String phone = normalizePhone(rawPhone);
//
//        String key = RedisKeys.confirmCode(phone);
//        String stored = redis.opsForValue().get(key);
//        if (stored == null || !stored.equals(code)) {
//            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired code");
//        }
//
//        User user = users.findByPhone(phone)
//            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
//
//        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
//            user.setStatus(UserStatus.ACTIVE);
//            users.save(user);
//        }
//
//        redis.delete(key);
//
//        String sid = UUID.randomUUID().toString();
//        String sessionKey = "session:" + sid;
//
//        String json = buildSessionJson(sid, user);
//        redis.opsForValue().set(sessionKey, json, Duration.ofDays(7));
//
//        return sid;
//    }
//



    @Transactional(readOnly = true)
    public ProfileResponse getProfileById(UUID id) {
        var u = users.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toProfile(u);
    }


    @Transactional(readOnly = true)
    public List<LoginEventResponse> myLogins(UUID accountId) {
        return loginEvents.findTop50ByUserIdOrderByCreatedAtDesc(accountId).stream()
            .map(e -> new LoginEventResponse(e.getId(), e.getCreatedAt(), e.getIp(), e.getUserAgent(), e.isSuccess()))
            .toList();
    }


    @Transactional
    public ProfileResponse updateProfile(UUID accountId, UpdateProfileRequest req) {
        var u = users.findById(accountId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (req.firstName() != null) u.setFirstName(req.firstName());
        if (req.lastName()  != null) u.setLastName(req.lastName());
        if (req.phone()     != null) u.setPhone(req.phone());
        if (req.birthDate() != null) u.setBirthDate(req.birthDate());
        if (req.country()   != null) u.setCountry(req.country());
        if (req.city()      != null) u.setCity(req.city());

        if (req.newEmail() != null && !req.newEmail().isBlank()) {
            var newEmail = req.newEmail().trim().toLowerCase();
            if (newEmail.equals(u.getEmail()))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is the same");
            if (users.existsByEmail(newEmail))
                throw new DuplicateKeyException("Email already registered");

            var code = CodeGenerator.numeric6();
            redis.opsForValue().set(RedisKeys.emailChange(accountId), code, Duration.ofMinutes(10));
            emailProducer.sendEmailChangeConfirm(newEmail, code);
        }

        users.save(u);
        return toProfile(u);
    }

    @Transactional
    public void changePassword(UUID accountId, ChangePasswordRequest req) {
        var u = users.findById(accountId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!encoder.matches(req.currentPassword(), u.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid current password");

        if (encoder.matches(req.newPassword(), u.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be different");

        u.setPasswordHash(encoder.encode(req.newPassword()));
        users.save(u);
        emailProducer.sendPasswordChanged(u.getEmail());
    }

    @Transactional
    public void confirmEmailChange(UUID accountId, String newEmail, String code) {
        if (newEmail == null || newEmail.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");

        var key = RedisKeys.emailChange(accountId);
        var stored = redis.opsForValue().get(key);
        if (stored == null || !stored.equals(code))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired code");

        var normalized = newEmail.trim().toLowerCase();
        if (users.existsByEmail(normalized))
            throw new DuplicateKeyException("Email already registered");

        var u = users.findById(accountId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        u.setEmail(normalized);
        users.save(u);
        redis.delete(key);
    }
    @Transactional
    public String loginConfirm2fa(TwoFaRequest req, String ip, String ua) {
        String email = req.getEmail();
        String code = req.getCode();

        String key = RedisKeys.twoFaCode(email);
        String stored = redis.opsForValue().get(key);

        if (stored == null || !stored.equals(code)) {
            users.findByEmail(email).ifPresent(u -> logLogin(u.getId(), ip, ua, false));
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired code");
        }

        User user = users.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        redis.delete(key);

        String sid = UUID.randomUUID().toString();
        String sessionKey = "session:" + sid;

        String json = buildSessionJson(sid, user);

        redis.opsForValue().set(sessionKey, json, Duration.ofDays(7));

        logLogin(user.getId(), ip, ua, true);

        return sid;
    }

    @Transactional
    public LoginResult loginOrStart2fa(LoginRequest req, String ip, String ua) {
        String email = req.getEmail();
        String password = req.getPassword();

        User user = users.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is not active");
        }

        if (!encoder.matches(password, user.getPasswordHash())) {
            logLogin(user.getId(), ip, ua, false);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (user.isEnable2fa()) {
            String code = CodeGenerator.numeric6();
            redis.opsForValue().set(
                RedisKeys.twoFaCode(email),
                code,
                Duration.ofMinutes(5)
            );

            emailProducer.sendTwofaCode(email, code);

            System.out.println("[DEV] 2FA code for " + email + " = " + code);

            logLogin(user.getId(), ip, ua, true);

            return LoginResult.twoFaRequired();
        }

        String sid = UUID.randomUUID().toString();
        String sessionKey = "session:" + sid;

        String json = buildSessionJson(sid, user);

        redis.opsForValue().set(sessionKey, json, Duration.ofDays(7));

        logLogin(user.getId(), ip, ua, true);

        return LoginResult.loggedIn(sid);

    }


    public static class LoginResult {
        private final boolean twoFaRequired;
        private final String sid;

        private LoginResult(boolean twoFaRequired, String sid) {
            this.twoFaRequired = twoFaRequired;
            this.sid = sid;
        }

        public static LoginResult twoFaRequired() {
            return new LoginResult(true, null);
        }

        public static LoginResult loggedIn(String sid) {
            return new LoginResult(false, sid);
        }

        public boolean isTwoFaRequired() {
            return twoFaRequired;
        }

        public String getSid() {
            return sid;
        }
    }

    private String buildSessionJson(String sid, User user) {

        String role = user.getRole() == null ? "" : user.getRole().name();
        return """
         {"sid":"%s","accountId":"%s","role":"%s","verified":true}
        """.formatted(sid, user.getId(), role);

    }

//    @Transactional
//    public void startPhoneLogin(PhoneLoginStartRequest req) {
//        String phone = normalizePhone(req.phone());
//
//        User user = users.findByPhone(phone)
//            .orElseThrow(() -> new ResponseStatusException(
//                HttpStatus.UNAUTHORIZED, "Invalid phone"
//            ));
//
//        if (user.getStatus() != UserStatus.ACTIVE) {
//            throw new ResponseStatusException(
//                HttpStatus.FORBIDDEN,
//                "Account is not active"
//            );
//        }
//
//        String code = CodeGenerator.numeric6();
//
//        redis.opsForValue().set(
//            RedisKeys.twoFaCode(phone),
//            code,
//            Duration.ofMinutes(5)
//        );
//
//        emailProducer.sendPhoneLoginCode(phone, code);
//
//        System.out.println("[DEV] phone login code for " + phone + " = " + code);
//    }

//
//    @Transactional
//    public String confirmPhoneLogin(PhoneLoginConfirmRequest req, String ip, String ua) {
//        String phone = normalizePhone(req.phone());
//        String code  = req.code();
//
//        String key = RedisKeys.twoFaCode(phone);
//        String stored = redis.opsForValue().get(key);
//
//        if (stored == null || !stored.equals(code)) {
//            users.findByPhone(phone).ifPresent(u ->
//                logLogin(u.getId(), ip, ua, false)
//            );
//            throw new ResponseStatusException(
//                HttpStatus.BAD_REQUEST,
//                "Invalid or expired code"
//            );
//        }
//
//        redis.delete(key);
//
//        User user = users.findByPhone(phone)
//            .orElseThrow(() -> new ResponseStatusException(
//                HttpStatus.NOT_FOUND,
//                "User not found"
//            ));
//
//        if (user.getStatus() != UserStatus.ACTIVE) {
//            throw new ResponseStatusException(
//                HttpStatus.FORBIDDEN,
//                "Account is not active"
//            );
//        }
//
//        String sid = UUID.randomUUID().toString();
//        String sessionKey = "session:" + sid;
//
//        String json = buildSessionJson(sid, user);
//
//        redis.opsForValue().set(
//            sessionKey,
//            json,
//            Duration.ofDays(7)
//        );
//
//        logLogin(user.getId(), ip, ua, true);
//
//        return sid;
//    }
//
//    private String normalizePhone(String raw) {
//        if (raw == null || raw.isBlank()) {
//            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone required");
//        }
//
//        String cleaned = raw.replaceAll("[^0-9+]", "");
//        return cleaned;
//    }

    private AdminUserResponse toAdmin(User u) {
        String role = (u.getRole() == null) ? null : u.getRole().name();
        return new AdminUserResponse(
            u.getId(),
            u.getEmail(),
            u.getFirstName(),
            u.getLastName(),
            u.getStatus().name(),
            role,
            u.getCreatedAt()
        );
    }


    @Transactional(readOnly = true)
    public Page<AdminUserResponse> adminSearchUsers(String q, int page, int size) {

        var pageable = PageRequest.of(
            Math.max(page, 0), Math.min(Math.max(size, 1), 100),
            Sort.by("createdAt").descending()
        );

        String p = (q == null) ? "" : q.trim();

        var res = users.findByEmailContainingIgnoreCase(
            p, pageable
        );

        return res.map(this::toAdmin);
    }



    @Transactional(readOnly = true)
    public AdminUserResponse adminLookup(String email) {

        int provided =
                ((email != null && !email.isBlank()) ? 1 : 0);

        if (provided != 1) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Provide exactly: email"
            );
        }

        final User u;
        u = users.findByEmail(email.trim().toLowerCase()).orElseThrow(() ->
            new ResponseStatusException(
                HttpStatus.NOT_FOUND, "User not found"));
        

        return toAdmin(u);
    }



    @Transactional
    public void adminDeleteUser(UUID userId) {
        var u = users.findById(userId).orElseThrow(() ->
            new ResponseStatusException(
                HttpStatus.NOT_FOUND, "User not found"));

        loginEvents.deleteByUserId(userId);

        users.delete(u);
    }

    @Transactional
    public void selfDeleteAccount(UUID accountId, String sid) {
        var u = users.findById(accountId).orElseThrow(() ->
            new ResponseStatusException(
                HttpStatus.NOT_FOUND, "User not found"));

        loginEvents.deleteByUserId(accountId);
        users.delete(u);

        if (sid != null && !sid.isBlank()) {
            redis.delete("session:" + sid);
        }
    }

    @Transactional
    public SupportRequestResponse createSupportRequest(UUID accountId, SupportRequestCreate req) {
        var entity = new dev.pet.account.domain.SupportRequest();
        entity.setUserId(accountId);
        entity.setTitle(req.title().trim());
        entity.setDescription(req.description().trim());

        var saved = supportRequests.save(entity);

        return new SupportRequestResponse(
            saved.getId(),
            saved.getTitle(),
            saved.getDescription(),
            saved.getStatus(),
            saved.getCreatedAt()
        );
    }

    @org.springframework.transaction.annotation.Transactional
    public dev.pet.account.dto.AdminUserResponse adminSetRole(java.util.UUID userId, String rawRole) {
        var u = users.findById(userId)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND, "User not found"));

        if (rawRole == null || rawRole.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "Role is required");
        }

        String norm = rawRole.trim().toUpperCase();
        dev.pet.account.domain.Role role;
        try {
            role = dev.pet.account.domain.Role.valueOf(norm);
        } catch (IllegalArgumentException ex) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "Unknown role: " + rawRole);
        }

        u.setRole(role);
        users.save(u);

        return toAdmin(u);
    }



    @Transactional(readOnly = true)
    public AdminUserResponse adminFindUser(String by, String value) {

        if (by == null || value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "by and value are required");
        }

        String key = by.trim().toLowerCase();
        User u;

        switch (key) {
            case "email" -> u = users.findByEmail(value.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "by must be: email");
        }

        return toAdmin(u);
    }

    @Transactional(readOnly = true)
    public void passwordResetStart(PasswordResetStartRequest req) {
        if (req.email() == null || req.email().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Email is required"
            );
        }

        String email = req.email().trim().toLowerCase();

        String code = CodeGenerator.numeric6();
        redis.opsForValue().set(
            RedisKeys.passwordResetEmail(email),
            code,
            Duration.ofMinutes(10)
        );

        emailProducer.sendPasswordResetCode(email, code);
        System.out.println("[DEV] password reset code (email) for " + email + " = " + code);
    }

    @Transactional
    public void passwordResetConfirm(PasswordResetConfirmRequest req) {
        if (req.email() == null || req.email().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Email is required"
            );
        }

        String email = req.email().trim().toLowerCase();
        String key = RedisKeys.passwordResetEmail(email);
        String stored = redis.opsForValue().get(key);

        if (stored == null || !stored.equals(req.code())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid or expired code"
            );
        }

        User u = users.findByEmail(email).orElseThrow(() ->
            new ResponseStatusException(
                HttpStatus.NOT_FOUND, "User not found"
            )
        );

        if (encoder.matches(req.newPassword(), u.getPasswordHash())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "New password must be different"
            );
        }

        u.setPasswordHash(encoder.encode(req.newPassword()));
        users.save(u);
        redis.delete(key);

        if (u.getEmail() != null && !u.getEmail().isBlank()) {
            emailProducer.sendPasswordChanged(u.getEmail());
        }
    }

    @Transactional(readOnly = true)
    public BioOwnerResponse bioFindUser(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        var u = users.findByEmail(email.trim().toLowerCase())
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")
            );

        return toBioOwner(u);
    }

    private BioOwnerResponse toBioOwner(User u) {
        String fullName = ((u.getFirstName() == null ? "" : u.getFirstName()) + " " +
            (u.getLastName()  == null ? "" : u.getLastName()))
            .trim();

        return new BioOwnerResponse(
            u.getId(),
            fullName
        );
    }



}
