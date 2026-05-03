# Security Specification: Shared Feed Architecture

## 1. Data Invariants
- A `global_post` and a user `activity` record representing the same event MUST share the exact same document ID.
- Every post MUST have a `userId` field matching the authenticated creator's UID.
- Timestamps MUST be server-generated (`request.time`).
- The `type` must be from an allowed list of eco-actions.

## 2. Access Control (ABAC)
- **Create**: Only possible if the payload's `userId` matches the current session.
- **Read**: Community feed is public; individual user activity logs are restricted to the owner for privacy (or public if designated).
- **Delete**: Restricted strictly to the `userId` stored in the document.

## 3. Vulnerability Mitigation
- **ID Poisoning**: Document IDs are validated for character set and length.
- **Resource Exhaustion**: String fields (comment, name) have length limits.
- **Identity Spoofing**: Users cannot change the `userId` after creation.
