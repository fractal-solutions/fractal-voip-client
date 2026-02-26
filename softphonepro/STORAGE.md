# Storage Design - SoftPhone Pro

## Data Requirements

- **Local Storage**: SIP profiles, contacts, call history, messages, settings, theme preferences
- **No Backend Required**: All data stays local for privacy/security (SIP credentials)

## Storage Strategy

### localStorage Keys

```json
// SIP Server Profiles
"softphone_profiles": [
  {
    "id": "prof_1",
    "name": "Office FreeSWITCH",
    "domain": "sip.myserver.com",
    "wsUrl": "wss://sip.myserver.com:7443",
    "username": "1001",
    "password": "encrypted_or_plain",
    "displayName": "John Doe",
    "transport": "WSS",
    "registerOnStartup": true,
    "registrationExpiry": 600,
    "stunServer": "stun:stun.l.google.com:19302",
    "turnServer": "",
    "turnUsername": "",
    "turnCredential": "",
    "iceTimeout": 5000,
    "outboundProxy": ""
  }
]

// Active profile ID
"softphone_active_profile": "prof_1"

// Contacts
"softphone_contacts": [
  {
    "id": "c_1",
    "name": "Alice",
    "sipUri": "sip:alice@server.com",
    "phone": "+15551234567",
    "email": "",
    "notes": "",
    "color": "#3b82f6",
    "speedDial": 1
  }
]

// Call History (max 100)
"softphone_history": [
  {
    "id": "h_1",
    "direction": "outgoing",
    "type": "voice",
    "contact": "sip:alice@server.com",
    "contactName": "Alice",
    "duration": 125,
    "timestamp": "2026-02-25T08:00:00Z",
    "missed": false
  }
]

// Messages
"softphone_messages": {
  "sip:alice@server.com": [
    {
      "id": "m_1",
      "from": "me",
      "text": "Hello!",
      "timestamp": "2026-02-25T08:00:00Z",
      "read": true
    }
  ]
}

// Settings
"softphone_settings": {
  "theme": "dark",
  "accentColor": "#3b82f6",
  "fontSize": "medium",
  "compact": false,
  "audioInput": "",
  "audioOutput": "",
  "ringtone": "classic",
  "ringVolume": 0.7,
  "autoAnswer": false,
  "autoAnswerDelay": 3,
  "echoCancellation": true,
  "noiseSuppression": true,
  "dtmfMode": "rfc2833",
  "camera": "",
  "videoResolution": "720p",
  "selfView": true,
  "iceCandidatePolicy": "all",
  "srtpMode": "optional",
  "sessionTimers": false,
  "debugLog": false,
  "logLevel": "info"
}

// Last active view
"softphone_active_view": "dialpad"
```

## Implementation Notes

- All data persisted to localStorage on change
- No backend sync needed (SIP credentials should stay local)
- Call history capped at 100 entries (FIFO)
- Message threads keyed by SIP URI