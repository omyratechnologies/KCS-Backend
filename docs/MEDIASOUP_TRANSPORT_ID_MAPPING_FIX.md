# MediaSoup Transport ID Mapping Fix

## Issue Summary
Backend was experiencing "Transport not found" errors when frontend tried to connect transports. The error showed MediaSoup transport IDs like `bbd48236-373c-4e53-bb16-a8c2306d64de` that the backend couldn't find.

## Root Cause
**ID Mismatch Problem:**
- Backend stores transports using composite keys: `${meetingId}_${participantId}_${direction}`
- But when creating transports, it returns MediaSoup's native transport.id to the frontend
- When frontend tries to connect the transport, it sends back the MediaSoup ID
- Backend tried to lookup using this MediaSoup ID directly, which failed

Example:
```typescript
// Backend storage key
"meeting123_participant456_send" → Transport object

// What backend returns to frontend
{ id: "bbd48236-373c-4e53-bb16-a8c2306d64de" }  // MediaSoup's native ID

// What frontend sends back
{ transportId: "bbd48236-373c-4e53-bb16-a8c2306d64de" }

// Backend lookup fails because it expects:
"meeting123_participant456_send"
```

## Solution Implemented

### 1. Added Reverse Mapping
Added a new `transportIdMap` to maintain bidirectional lookup:

```typescript
private static transportIdMap: Map<string, string> = new Map(); 
// Maps: MediaSoup transport.id → composite key
```

### 2. Updated Transport Creation
When creating transports, store the reverse mapping:

```typescript
public static async createWebRtcTransport(
    meetingId: string,
    participantId: string,
    direction: "send" | "recv"
): Promise<any> {
    const router = this.routers.get(meetingId);
    const transport = await router.createWebRtcTransport(transportOptions);
    
    const transportId = `${meetingId}_${participantId}_${direction}`;
    this.transports.set(transportId, transport);
    
    // NEW: Store reverse mapping
    this.transportIdMap.set(transport.id, transportId);
    
    return {
        id: transport.id,  // Return MediaSoup ID to frontend
        // ... other params
    };
}
```

### 3. Updated Transport Connection
Use reverse mapping to lookup the correct transport:

```typescript
public static async connectTransport(
    transportId: string,
    dtlsParameters: any
): Promise<void> {
    // NEW: Use reverse mapping to find the composite key
    let compositeKey = this.transportIdMap.get(transportId);
    
    // Fallback for backward compatibility
    if (!compositeKey) {
        compositeKey = transportId;
    }
    
    const transport = this.transports.get(compositeKey);
    
    if (!transport) {
        throw new Error(`Transport not found: ${transportId}`);
    }
    
    await transport.connect({ dtlsParameters });
}
```

### 4. Updated Transport Cleanup
Ensure reverse mappings are cleaned up when transports are closed:

**In handleParticipantDisconnect:**
```typescript
const transport = this.transports.get(transportId);
if (transport && !transport.closed) {
    // NEW: Remove from reverse mapping
    this.transportIdMap.delete(transport.id);
    transport.close();
    this.transports.delete(transportId);
}
```

**In closeMeetingRoom:**
```typescript
for (const [transportId, transport] of this.transports.entries()) {
    if (transportId.startsWith(meetingId)) {
        // NEW: Remove from reverse mapping
        this.transportIdMap.delete(transport.id);
        if (!transport.closed) {
            transport.close();
        }
        this.transports.delete(transportId);
    }
}
```

## Files Modified
1. `src/services/webrtc.service.ts`
   - Added `transportIdMap` property
   - Updated `createWebRtcTransport()` to populate reverse map
   - Updated `connectTransport()` to use reverse map lookup
   - Updated `handleParticipantDisconnect()` to cleanup reverse map
   - Updated `closeMeetingRoom()` to cleanup reverse map

## Testing Verification
- [x] Build successful (npm run build)
- [x] TypeScript compilation passed
- [ ] Deploy to production
- [ ] Monitor logs for successful transport connections
- [ ] Verify no "Transport not found" errors

## Deployment Steps
1. Commit and push changes to GitHub
2. SSH to production server: `ssh ubuntu@ip-172-31-11-92`
3. Pull latest code: `cd ~/KCS-Backend && git pull origin dev`
4. Build: `npm run build`
5. Restart: `pm2 restart kcs-backend`
6. Monitor: `tail -f ~/logs/kcs-backend-out.log | grep -i transport`

## Expected Outcome
- Transport creation should succeed with MediaSoup IDs returned to frontend
- Transport connection should succeed when frontend sends MediaSoup IDs back
- No more "Transport not found" errors in logs
- Video meeting connections should establish properly

## Backward Compatibility
The `connectTransport()` method includes a fallback that checks if the provided ID is already a composite key, ensuring compatibility with any existing code paths.

---
**Created:** 2025-01-XX
**Status:** Ready for Production Deployment
