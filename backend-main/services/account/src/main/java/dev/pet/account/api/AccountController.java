package dev.pet.account.api;

import dev.pet.account.domain.AdminAction;
import dev.pet.account.dto.*;
import dev.pet.account.service.AccountService;
import jakarta.servlet.http.HttpServletResponse;
import dev.pet.account.dto.BioOwnerResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import dev.pet.account.service.AdminAuditService;
import org.springframework.web.server.ResponseStatusException;


import java.util.List;
import java.util.UUID;


import java.time.Duration;
import java.util.Map;


@RestController
@RequestMapping("/api/v1/account")
public class AccountController {

    private final AccountService accounts;
    private final AdminAuditService audit;

    public AccountController(AccountService accounts, AdminAuditService audit) {
        this.accounts = accounts;
        this.audit = audit;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest req) {
        var resp = accounts.register(req);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/register/confirm")
    public ResponseEntity<?> confirmRegistrationByEmail(
        @Valid @RequestBody ConfirmEmailRequest req,
        HttpServletResponse response
    ) {
        String sid = accounts.confirmRegistrationByEmail(req.email(), req.code());

        ResponseCookie cookie = ResponseCookie.from("sid", sid)
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ofDays(7))
            .build();

        response.addHeader("Set-Cookie", cookie.toString());
        return ResponseEntity.ok(Map.of("status", "verified"));
    }



    @PostMapping("/login/email")
    public ResponseEntity<?> loginByEmail(
        @Valid @RequestBody LoginRequest req,
        HttpServletRequest httpReq,
        HttpServletResponse response
    ) {
        String ip = httpReq.getRemoteAddr();
        String ua = httpReq.getHeader("User-Agent");

        var result = accounts.loginOrStart2fa(req, ip, ua);

        if (result.isTwoFaRequired()) {
            return ResponseEntity.ok(Map.of(
                "status", "2fa_required"
            ));
        }

        String sid = result.getSid();

        ResponseCookie cookie = ResponseCookie.from("sid", sid)
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ofDays(7))
            .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.ok(Map.of(
            "status", "logged_in",
            "sid", sid
        ));
    }


    @PostMapping("/login/email/confirm")
    public ResponseEntity<?> confirmLoginByEmail(
        @Valid @RequestBody TwoFaRequest req,
        HttpServletRequest httpReq,
        HttpServletResponse response
    ) {
        String ip = httpReq.getRemoteAddr();
        String ua = httpReq.getHeader("User-Agent");

        String sid = accounts.loginConfirm2fa(req, ip, ua);

        ResponseCookie cookie = ResponseCookie.from("sid", sid)
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ofDays(7))
            .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.ok(Map.of(
            "status", "logged_in"
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
        @CookieValue(name = "sid", required = false) String sid,
        HttpServletResponse response
    ) {
        if (sid != null && !sid.isBlank()) {
            accounts.logout(sid);
        }

        ResponseCookie cookie = ResponseCookie.from("sid", "")
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ZERO)
            .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.ok(Map.of(
            "status", "logged_out"
        ));
    }


    @PostMapping("/email/confirm-change")
    public Map<String, String> confirmEmailChange(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody ConfirmRequest req
    ) {
        var accountId = UUID.fromString(jwt.getSubject());
        accounts.confirmEmailChange(accountId, req.getEmail(), req.getCode());
        return Map.of("status", "email_updated");
    }


    @GetMapping("/profile/me")
    public ProfileResponse me(@AuthenticationPrincipal Jwt jwt) {
        var accountId = UUID.fromString(jwt.getSubject());
        String role = jwt.getClaim("role");
        return accounts.getProfileById(accountId);
    }

    @GetMapping("/logins")
    public List<LoginEventResponse> myLogins(@AuthenticationPrincipal Jwt jwt) {
        var accountId = UUID.fromString(jwt.getSubject());
        return accounts.myLogins(accountId);
    }

    @PatchMapping
    public ProfileResponse updateProfile(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody UpdateProfileRequest req
    ) {
        var accountId = UUID.fromString(jwt.getSubject());
        return accounts.updateProfile(accountId, req);
    }

    @PatchMapping("/password/change")
    public ResponseEntity<?> changePassword(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody ChangePasswordRequest req
    ) {
        var accountId = UUID.fromString(jwt.getSubject());
        accounts.changePassword(accountId, req);
        return ResponseEntity.ok(Map.of("status", "password_updated"));
    }

    @DeleteMapping
    public ResponseEntity<?> deleteOwnAccount(
        @AuthenticationPrincipal Jwt jwt,
        @CookieValue(name = "sid", required = false) String sid,
        HttpServletResponse response
    ) {
        var accountId = UUID.fromString(jwt.getSubject());
        accounts.selfDeleteAccount(accountId, sid);

        ResponseCookie cookie = ResponseCookie.from("sid", "")
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ZERO)
            .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    @PostMapping("/support/request")
    public ResponseEntity<SupportRequestResponse> createSupportRequest(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody SupportRequestCreate req
    ) {
        var accountId = UUID.fromString(jwt.getSubject());
        var resp = accounts.createSupportRequest(accountId, req);
        return ResponseEntity.ok(resp);
    }

//    @PostMapping("/login/phone")
//    public ResponseEntity<?> startPhoneLogin(
//        @Valid @RequestBody PhoneLoginStartRequest req
//    ) {
//        accounts.startPhoneLogin(req);
//        return ResponseEntity.ok(Map.of(
//            "status", "code_sent"
//        ));
//    }
//
//    @PostMapping("/login/phone/confirm")
//    public ResponseEntity<?> confirmPhoneLogin(
//        @Valid @RequestBody PhoneLoginConfirmRequest req,
//        HttpServletRequest httpReq,
//        HttpServletResponse response
//    ) {
//        String ip = httpReq.getRemoteAddr();
//        String ua = httpReq.getHeader("User-Agent");
//
//        String sid = accounts.confirmPhoneLogin(req, ip, ua);
//
//        ResponseCookie cookie = ResponseCookie.from("sid", sid)
//            .httpOnly(true)
//            .secure(false)
//            .sameSite("Strict")
//            .path("/")
//            .maxAge(Duration.ofDays(7))
//            .build();
//
//        response.addHeader("Set-Cookie", cookie.toString());
//
//        return ResponseEntity.ok(Map.of(
//            "status", "logged_in"
//        ));
//    }

    @GetMapping("/admin/users/findUser")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminUserResponse findUser(
        @RequestParam(required = false) String email,
        @AuthenticationPrincipal Jwt jwt,
        HttpServletRequest httpReq
    ) {
        AdminUserResponse resp;

        if (email != null && !email.isEmpty()) {
            resp = accounts.adminFindUser("email", email);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        var adminId = java.util.UUID.fromString(jwt.getSubject());
        java.util.UUID targetId = resp.id();
        String details = "email=" + email;
        audit.log(adminId, "ADMIN_LOOKUP_USER", targetId, details, httpReq.getRemoteAddr());

        return resp;
    }

    @GetMapping("/bio/owners/findUser")
    @PreAuthorize("hasRole('VET')")
    public BioOwnerResponse bioFindUser(@RequestParam String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        return accounts.bioFindUser(email);
    }


    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<AdminUserResponse> search(
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @AuthenticationPrincipal Jwt jwt,
        HttpServletRequest httpReq
    ) {
        var result = accounts.adminSearchUsers(q, page, size);

        var adminId = java.util.UUID.fromString(jwt.getSubject());
        String details = "q=" + (q == null ? "" : q) + ",page=" + page + ",size=" + size;
        audit.log(adminId, "ADMIN_SEARCH_USERS", null, details, httpReq.getRemoteAddr());

        return result;
    }


    @PatchMapping("/admin/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminUserResponse setRole(
        @PathVariable java.util.UUID id,
        @RequestBody dev.pet.account.dto.AdminSetRoleRequest req,
        @AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt,
        jakarta.servlet.http.HttpServletRequest httpReq
    ) {
        var resp = accounts.adminSetRole(id, req.role());

        var adminId = java.util.UUID.fromString(jwt.getSubject());
        audit.log(adminId, "ADMIN_SET_ROLE", id, "role=" + req.role(), httpReq.getRemoteAddr());

        return resp;
    }



    @DeleteMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> delete(
        @PathVariable java.util.UUID id,
        @AuthenticationPrincipal Jwt jwt,
        HttpServletRequest httpReq
    ) {
        accounts.adminDeleteUser(id);

        var adminId = java.util.UUID.fromString(jwt.getSubject());
        audit.log(adminId, "ADMIN_DELETE_USER", id, null, httpReq.getRemoteAddr());

        return Map.of("status", "deleted");
    }

    @GetMapping("/admin/audit/by-admin/{adminId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<AdminAction> auditByAdmin(
        @PathVariable UUID adminId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return audit.byAdmin(adminId, page, size);
    }

    @GetMapping("/admin/audit/by-target/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<AdminAction> auditByTarget(
        @PathVariable UUID userId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return audit.byTarget(userId, page, size);
    }

    @PostMapping("/password/reset/start")
    public Map<String, String> passwordResetStart(@RequestBody PasswordResetStartRequest req) {
        accounts.passwordResetStart(req);
        return Map.of("status", "code_sent");
    }

    @PostMapping("/password/reset/confirm")
    public Map<String, String> passwordResetConfirm(@RequestBody PasswordResetConfirmRequest req) {
        accounts.passwordResetConfirm(req);
        return Map.of("status", "password_updated");
    }



}
