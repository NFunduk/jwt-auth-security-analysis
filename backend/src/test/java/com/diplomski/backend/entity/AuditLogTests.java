package com.diplomski.backend.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class AuditLogTests {

    @Test
    void builderAssignsCreatedAt() {
        AuditLog audit = AuditLog.builder().action("LOGIN").build();

        assertNotNull(audit.getCreatedAt());
    }

    @Test
    void prePersistRepairsExplicitlyNullCreatedAt() {
        AuditLog audit = AuditLog.builder().action("LOGOUT").createdAt(null).build();

        audit.ensureCreatedAt();

        assertNotNull(audit.getCreatedAt());
    }
}
