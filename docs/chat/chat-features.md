# WhatsApp-like Chat — Developer Specification (No Code)

**Purpose:**
A comprehensive developer-facing specification to build a WhatsApp-style instant messaging system (real-time chat) without voice/video calls. This document covers features, architecture, data models, socket events (descriptions only), message lifecycle flows, multi-device sync, media handling, security (E2E design notes), scaling, monitoring, testing, deployment, and operational considerations. No code or implementation examples are included — this is a blueprint.

---

## 1. Goals & Scope

* Build a real-time, low-latency chat experience comparable to WhatsApp messaging.
* Support: one-to-one chats, group chats, media & attachments, ephemeral statuses (stories), typing/presence, read/delivery receipts, message edits/deletes, reactions, forwarding, search, multi-device sync, offline delivery, and push notifications.
* Excludes voice/video calling features.

---

## 2. Core Features (User-Facing)

* **1:1 Messaging:** Text, emojis, link previews, quotes/replies, edit, delete (for me/everyone).
* **Group Chats:** Create, invite, remove members, promote/demote admins, group metadata (name/photo/description), mention, admin controls.
* **Message Types:** Text, image, video, audio (voice notes), documents, contact cards, location, stickers.
* **Message States:** Sending, sent (server ack), delivered, read, played (for voice notes), reactions.
* **Presence & UX:** Online/offline, last seen (configurable privacy), typing and recording indicators, read receipts toggle.
* **Media Handling:** Presigned uploads, thumbnails, streaming/preview, progressive/resumable uploads, view-once.
* **Status/Stories:** Ephemeral media with expiry (24 hours) and view counts.
* **Search & Archive:** Message and media search, pin, star, archive chats.
* **Sync & Multi-Device:** Multiple devices per account with message sync and per-device keys for E2E.
* **Push Notifications:** FCM/APNs/WebPush for background notifications.
* **Admin Tools:** System announcements, block/report, account limits, moderation hooks.

---

## 3. High-Level Architecture

**Components**

* **Clients:** Mobile apps (iOS, Android), Web app (browser). Each maintains a persistent secure socket connection.
* **API Gateway / Load Balancer:** Terminates TLS, routes REST and WebSocket requests, optionally provides sticky sessions.
* **App Servers:** Stateless application nodes handling REST and Socket events. Use Socket.IO or native WebSocket handling.
* **Socket Adapter / Pub-Sub:** Redis (or similar) adapter for socket event propagation across instances.
* **Message Store:** Primary persistent storage (append-only message model). Options: MongoDB (mid-scale), Cassandra/Scylla (large scale), or Postgres with partitioning.
* **Object Storage & CDN:** S3/MinIO + CDN for media delivery; presigned URLs for uploads.
* **Worker Services:** Background jobs for thumbnailing, transcoding, virus scan, push delivery.
* **Presence Store:** In-memory/Redis for fast presence, socket mappings and device lists.
* **Search Index:** Elastic/OpenSearch for message & media search (not possible for E2E-encrypted content).
* **Key Management:** KMS (for server secrets) and client-side key store for E2E.
* **Monitoring & Logging:** Prometheus/Grafana, OpenTelemetry traces, Sentry for errors.

**Design Patterns**

* **Stateless app servers** behind a load balancer; use Redis adapter for Socket.IO event synchronization.
* **CQRS & Event Sourcing:** Separate write model (append messages) from read model (chat list, search index).
* **Idempotency & De-duplication:** Use message IDs (client localId → serverId mapping) to avoid duplicates.
* **Backpressure & Rate Limits:** Throttle events per socket and per account.

---

## 4. Data Modeling (Conceptual)

Design messages as immutable append records; store metadata and derived fields for fast reads.

**User**

* userId, phone/email, displayName, avatarUrl
* devices: list of deviceId + pushToken + lastActive
* settings: privacy controls, two-step, blockedUsers

**Chat**

* chatId, type: direct/group/broadcast
* members: [{ userId, role (admin/member), joinedAt }]
* meta: name, description, iconUrl, inviteLink
* lastMessage summary, unreadCount per user

**Message**

* messageId, chatId, from, type, content (structured, possibly ciphertext), timestamp
* deliveredTo[], readBy[], reactions[], edited flag, deletedFor[]
* ephemeralExpiresAt (for disappearing messages)

**DeviceKey (E2E)**

* deviceId, identityKey, signedPreKey, oneTimePreKeys[], lastSeen

---

## 5. Socket Events (Developer-Facing List — No Payloads)

Provide a complete event list with direction & purpose (without payload details). Handlers should validate and authenticate each event.

**Core & Presence**

* `connect` — client → server — establish authenticated socket session
* `disconnect` — both — clean up socket state
* `user:online` — server → all — broadcast user is online
* `user:offline` — server → all — broadcast user went offline
* `user:typing` — client → server — typing start indicator
* `user:stop_typing` — client → server — typing stop indicator
* `user:last_seen` — server → client — provide last seen timestamp
* `user:presence_update` — server → all — update presence (status/visibility)

**Private Chat**

* `chat:create` — client → server — initialize or fetch 1:1 chat
* `message:send` — client → server — send message
* `message:receive` — server → client — deliver message
* `message:delivered` — server → sender — mark delivered
* `message:seen` — client → server — mark read
* `message:seen:update` — server → sender — notify read
* `message:delete` — client → server — delete message
* `message:delete:update` — server → client — inform deletion
* `message:edit` — client → server — edit message
* `message:edit:update` — server → client — broadcast edits
* `message:reaction:add` — client → server — add reaction
* `message:reaction:update` — server → client — reaction update
* `message:reply` — client → server — reply to message

**Group Chat**

* `group:create` — client → server — create group
* `group:update` — client → server — update metadata
* `group:join` — client → server — add member
* `group:leave` — client → server — leave group
* `group:removed` — server → client — notify removal
* `group:message:send` — client → server — send group message
* `group:message:receive` — server → clients — broadcast message
* `group:message:seen` — client → server — mark group message read
* `group:message:seen:update` — server → clients — notify read updates
* `group:message:delete` — client → server — delete group message
* `group:message:edit` — client → server — edit group message
* `group:reaction:add` — client → server — add reaction in group
* `group:reaction:update` — server → all — reaction updates

**Media & Attachments**

* `media:upload:request` — client → server — request presigned URL
* `media:upload:complete` — client → server — confirm upload
* `media:message:send` — client → server — send media message
* `media:message:receive` — server → client — deliver media message
* `media:thumbnail:generate` — server → internal — generate preview

**Notifications**

* `notification:new_message` — server → client — push notification for new message
* `notification:mention` — server → client — mention alert
* `notification:clear` — client → server — clear notification
* `notification:update` — server → client — update notification status

**Sync & Backup**

* `chats:sync` — client → server — fetch chat list and metadata
* `messages:sync` — client → server — fetch missing messages
* `message:history` — client → server — paginate older messages
* `device:sync` — server ↔ client — multi-device state sync
* `backup:restore` — client → server — restore from backup

**Admin/System**

* `admin:user:block` — server → client — account blocked
* `admin:user:unblock` — server → client — account unblocked
* `admin:broadcast` — server → all — system-wide announcements

---

## 6. Message Delivery Flow (Sequence)

1. **Client creates message locally** with `localId`, shows optimistic UI.
2. **Client emits** `message:send` to server.
3. **Server validates, persists** the message (append-only store), returns `sent_ack` (map localId→messageId).
4. **Server emits** `message:receive` to recipient(s) (using user rooms and chat rooms).
5. **Recipient client(s)** persist locally and respond with `message:delivered`.
6. **Server updates delivery state**, emits `message:delivered` to sender.
7. **When recipient reads**, client emits `message:seen`; server updates read state and emits `message:seen:update` to sender.
8. **If recipient offline**, server retains message and delivers upon reconnect (via `messages:sync`).

**Notes:**

* Use ACK callbacks for critical events to guarantee server acknowledgment.
* Maintain message order using timestamps + per-chat sequence numbers.
* De-duplicate using client `localId` → server `messageId` mapping.

---

## 7. Multi-Device & Sync Model

* Each account may have multiple devices. Each device has a `deviceId` and optional E2E device key pair.
* **Primary device**: the mobile device typically acts as the authority for new keys and backups.
* **Device registration:** upon login, device registers with server (push token, deviceId).
* **Sync mechanisms:**

  * On new device connect, server provides initial `device:sync` package (chats, recent messages, device list) and emits messages that the device lacks.
  * Use per-chat sequence numbers or `sinceTimestamp` to fetch deltas.
* **Conflict resolution:** last-writer-wins for edits or server authoritative model; clients must reconcile using timestamps and message IDs.

---

## 8. Media Upload & Delivery

* Prefer **direct-to-object-storage uploads** using presigned URLs (S3, R2, MinIO) to offload bandwidth from app servers.
* Flow: `media:upload:request` → server returns presigned URL → client uploads to storage → client notifies via `media:upload:complete` with file reference → server creates message referencing file URL → server emits `media:message:receive`.
* **Thumbnailing & Transcoding:** offload to worker queues; once available, server emits updates to clients (thumbnail URL).
* **Security:** sign or expire download URLs; use CDN for distribution.
* **View-once or ephemeral media:** set `ephemeralExpiresAt` and implement server-side cleanup and access controls.

---

## 9. End-to-End Encryption (E2E) — High-Level Notes

* Implement **Signal protocol** or equivalent for per-device E2E:

  * Each device maintains identity key, signed pre-key, and one-time pre-keys.
  * Clients exchange public pre-key bundles via server (server never sees private keys).
  * Messages encrypted per recipient device; server stores ciphertext only.
* **Group E2E:** adopt sender-key or group key exchange model.
* **Push notifications & backups:** design encrypted key backup for cloud restore; send minimal push payloads so server doesn't leak message content.
* **Tradeoffs:** E2E disables server-side search, spam detection, and text previews unless client-side helper flows are implemented.

---

## 10. Consistency, Ordering & Guarantees

* **Delivery Guarantees:** at-least-once delivery with deduplication via IDs.
* **Ordering:** ensure per-chat ordering using sequence numbers or causal timestamps; handle out-of-order arrival on client.
* **Idempotency:** design write operations idempotent (message create with client localId).
* **Retention & TTL:** support per-chat message retention, legal hold, and GDPR data deletion.

---

## 11. Scaling & Reliability

* **Horizontal Scaling:** app servers stateless + Redis adapter for socket propagation.
* **Partitioning:** shard messages and users by hash/region for write scale.
* **Queueing:** use Kafka or Redis Streams for long-running tasks (thumbnail, push, analytics).
* **Presence:** keep socket→user mapping in Redis; detect multi-socket per user.
* **Rate Limits:** per-socket and per-account limits to prevent abuse.
* **Backpressure:** gracefully drop non-critical events under load (typing indicators) and prioritize message events.

---

## 12. Monitoring & Observability

* **Metrics:** active sockets, messages/sec, delivery latency, failed deliveries, queue backlog, disk and network IO.
* **Tracing:** distributed tracing for message flows (OpenTelemetry).
* **Logging:** structured logs (request/message id, user id, chat id) and error aggregation (Sentry).
* **Synthetic Tests:** periodic checks for end-to-end message flow and presence updates.

---

## 13. Testing Strategy

* **Unit Tests:** event validation, auth middleware, DB models.
* **Integration Tests:** socket event flows utilising test socket clients and in-memory Redis/Mongo fixtures.
* **Load Testing:** simulate thousands of concurrent sockets and message rates with tools (Gatling, K6).
* **Chaos Testing:** simulate instance failures, Redis partitions, and network flakiness.
* **Security Tests:** pen-testing, E2E validation, and key management audits.

---

## 14. Deployment Checklist

* TLS termination on LB (WSS + HTTPS).
* Redis cluster for adapter and presence.
* Managed DB (Atlas) or highly available cluster for message store.
* CDN + S3 for media, with presigned uploads and proper CORS.
* Autoscaling for app servers with readiness/liveness probes.
* Backup & DR plans for DB and storage (point-in-time recovery).
* Secrets stored in KMS/Vault.

---

## 15. Operational Considerations

* **Cost:** media bandwidth and storage are primary costs; optimize via CDN and compression.
* **Privacy & Compliance:** provide data export & deletion endpoints; follow GDPR and local rules for metadata retention.
* **Abuse & Moderation:** design reporting interfaces and temporary holds; consider centralized moderation queues.
* **Onboarding:** design contact sync with rate limits and hashing for privacy.

---

## 16. Developer Handoff & API Contracts (High-Level)

* **REST APIs** for: auth/verification, device registration, presigned media requests, chat list, message history, profile updates, group management.
* **Socket Events** for real-time: use the event list in section 5.
* Provide a **JSON Schema or OpenAPI** doc for REST and a separate **Event Contract** document for socket events (payloads, required fields, validation rules) as the next step.

---

## 17. Next Recommended Steps for Engineering Team

1. Finalize data model and choose DB technology based on expected scale.
2. Define precise event payload schemas (JSON Schema) and ACK patterns.
3. Implement auth middleware and device registration flows.
4. Implement message persistence + message deduplication via client localId.
5. Implement presigned upload flow and worker pipeline for media processing.
6. Roll out E2E encryption roadmap early if privacy is critical.
7. Build robust testing and load-testing pipelines before production rollout.

---

**End of specification.**

If you want, I can now:

* Generate an **Event Contract** document (every socket event with precise payload schemas and examples),
* Or produce a **REST OpenAPI** spec for all non-real-time endpoints (auth, uploads, history),
* Or create a **deployment diagram** and a checklist for a Kubernetes-based production deployment.

Which of those would you like next?
