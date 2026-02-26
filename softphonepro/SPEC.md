

# SoftPhone Pro - WebRTC SIP Softphone

Create a professional, feature-rich SIP softphone web application designed for power users who run their own FreeSWITCH VoIP servers. The app should feel like a real desktop softphone — polished, dark-themed, and packed with communication features including voice calls, video calls, SMS/messaging, and conferencing.

## App Type

**React Web App** — This is a complex stateful UI with multiple views, forms, real-time status indicators, settings panels, and media controls. React is the ideal choice for managing the intricate state of call sessions, registration status, contact lists, and configuration profiles.

## Design Philosophy

The UI should feel like a premium communications tool — think **dark mode by default**, with a sleek, professional aesthetic reminiscent of apps like Location, Oaks Dialer, or Oaks Dialer. Use a **dark charcoal/navy background** (`#1a1d23`) with accent colors in **electric blue** (`#3b82f6`) and **emerald green** (`#10b981`) for active/connected states. Use **red** (`#ef4444`) for hangup/error states. Subtle glassmorphism effects on panels, smooth transitions, and glowing status indicators.

## UI Elements

### Top Bar / Status Bar

- **App title**: "SoftPhone Pro" with a small phone icon (use emoji 📞 or SVG)
- **Registration status indicator**: A colored dot (green = registered, yellow = registering, red = unregistered/error) with text label showing the current SIP URI (e.g., `sip:user@myserver.com`)
- **Server profile selector**: A dropdown to quickly switch between saved FreeSWITCH server configurations
- **Settings gear icon** (top-right): Opens the configuration panel
- **Network quality indicator**: Small bars icon showing connection quality

### Left Sidebar / Navigation

A vertical icon-based navigation rail (collapsible) with the following sections:
- **📞 Dialpad** — Main call interface
- **💬 Messages** — SMS/SIP MESSAGE view
- **📹 Video** — Video call interface
- **👥 Conference** — Multi-party conferencing
- **📋 Call History** — Recent calls log
- **👤 Contacts** — Saved contacts/speed dials
- **⚙️ Settings** — Full configuration panel

Active tab should have a glowing left border accent and highlighted icon.

### Main Panel: Dialpad View (Default)

- **Large circular avatar area** at top showing the contact photo or initials when a number/URI is entered
- **Caller ID display**: Shows the dialed number or matched contact name
- **Dialpad grid**: A 3×4+2 grid of number buttons (1-9, *, 0, #) with letters beneath each number (like a real phone). Buttons should be circular with a subtle hover glow effect, and produce DTMF tones on press (use Web Audio API for tone generation)
- **Input field**: Editable SIP URI / phone number field above the dialpad with clear button
- **Call action buttons row**:
  - **Green call button** (large, circular, centered) — initiates audio call
  - **Blue video call button** — initiates video call
  - **Red hangup button** — visible only during active calls
- **During active call overlay**:
  - Call timer (MM:SS format, counting up)
  - Mute mic toggle button
  - Hold button
  - Speaker/audio output toggle
  - DTMF dialpad toggle (for IVR navigation)
  - Transfer button (blind & attended transfer options)
  - Add to conference button
  - Record call toggle
  - Call quality indicator

### Main Panel: Messages View

- **Two-column layout**: Contact/conversation list on left, message thread on right
- **Conversation list**: Shows recent message threads with contact name, last message preview, timestamp, and unread badge count
- **Message thread**: Chat-bubble style layout (sent messages right-aligned in blue, received messages left-aligned in gray)
- **Message input bar** at bottom: Text input with send button, character counter
- **New message button**: Floating action button to start new conversation, opens a modal to enter SIP URI or select contact

### Main Panel: Video Call View

- **Large video area**: Remote video stream fills the main area
- **Picture-in-picture**: Local camera preview in a small draggable window (bottom-right corner by default)
- **Video controls overlay** (appears on hover, bottom center):
  - Mute/unmute mic
  - Camera on/off toggle
  - Screen share button
  - Fullscreen toggle
  - Hangup button (red)
  - Flip camera (if multiple cameras available)
- **Pre-call preview**: Before connecting, show local camera preview with a "Ready to call?" prompt and the target URI

### Main Panel: Conference View

- **Conference room setup**:
  - "Create Conference" button — generates a conference room
  - Conference URI/number input to join existing conference
- **Active conference display**:
  - Grid layout of participant tiles (each showing name/URI, audio level indicator, mute status)
  - Participant list sidebar with kick/mute controls (if moderator)
  - Active speaker highlight (border glow on whoever is speaking)
- **Conference controls bar**:
  - Mute self
  - Add participant (opens dialpad/contact picker modal)
  - Leave conference button
  - Record conference toggle
  - Participant count badge

### Main Panel: Call History View

- **Tabbed filters**: All | Missed | Incoming | Outgoing
- **Call log entries**: Each entry shows:
  - Direction icon (↗ outgoing green, ↙ incoming blue, ↙ missed red)
  - Contact name or number
  - Call type icon (voice/video)
  - Duration
  - Timestamp (relative: "2 min ago", "Yesterday 3:45 PM")
  - Action buttons on hover: Call back, Send message, Add to contacts
- **Search/filter bar** at top
- **Clear history button** with confirmation dialog

### Main Panel: Contacts View

- **Contact list**: Alphabetical scroll with letter dividers
- **Each contact card**: Avatar (initials-based, colored), Name, SIP URI, phone number, quick-action buttons (call, video, message)
- **Add contact form** (slide-in panel or modal):
  - Name, SIP URI, Phone Number, Email, Notes fields
  - Avatar color picker
  - Speed dial number assignment
- **Import/Export contacts** button (JSON format, using localStorage)
- **Search bar** at top for filtering

### Main Panel: Settings / Configuration View

This is the **power user heart** of the app. Use a tabbed or accordion layout:

#### Tab 1: SIP Accounts / Server Profiles
- **Profile list**: Saved server configurations with edit/delete/activate buttons
- **Add/Edit profile form**:
  - **Profile name** (e.g., "Office FreeSWITCH", "Home PBX")
  - **SIP Server / Domain** (e.g., `sip.myserver.com`)
  - **WebSocket URL** (e.g., `wss://sip.myserver.com:7443`) — critical for sip.js
  - **Username / Auth User**
  - **Password** (masked input with show/hide toggle)
  - **Display Name** (caller ID name)
  - **SIP Port** (default 5060)
  - **Transport**: WSS / WS dropdown
  - **Register on startup** toggle
  - **Registration expiry** (seconds, default 600)
  - **Outbound proxy** (optional)
  - **STUN Server** (default: `stun:stun.l.google.com:19302`)
  - **TURN Server** (optional, with username/credential fields)
  - **ICE gathering timeout** (ms)
  - **Test connection** button — attempts registration and shows result
  - **Save profile** button

#### Tab 2: Audio Settings
- **Input device** dropdown (populated from `navigator.mediaDevices`)
- **Output device** dropdown (if supported)
- **Ringtone device** dropdown
- **Microphone level meter** (real-time visualization bar)
- **Ringtone selector** (a few built-in options, played on incoming calls using Web Audio API)
- **Ring volume slider**
- **Auto-answer** toggle with delay setting
- **Echo cancellation** toggle
- **Noise suppression** toggle
- **DTMF mode**: Inband / RFC 2833 / SIP INFO

#### Tab 3: Video Settings
- **Camera device** dropdown
- **Camera preview** (live feed from selected camera)
- **Preferred resolution**: 720p / 1080p / 480p dropdown
- **Bandwidth limit** slider
- **Self-view during calls** toggle

#### Tab 4: Network / Advanced
- **ICE Candidate Policy**: All / Relay only
- **SRTP mode**: Required / Optional / Disabled
- **Session timers** toggle
- **Debug/SIP trace logging** toggle — when enabled, shows a collapsible panel with raw SIP messages (styled like a terminal/console with monospace font, green text on black)
- **Log level**: Error / Warn / Info / Debug dropdown
- **Export logs** button (downloads as .txt)

#### Tab 5: Appearance
- **Theme toggle**: Dark (default) / Light / System
- **Accent color picker**: A few preset accent colors (blue, green, purple, orange)
- **Compact mode** toggle (reduces padding for smaller screens)
- **Font size**: Small / Medium / Large

### Incoming Call Modal

When receiving an inbound call, display a **full-screen overlay** (semi-transparent dark backdrop) with:
- Caller ID name and number (large text, centered)
- Pulsating phone icon animation
- **Answer (audio)** green button
- **Answer (video)** blue button
- **Decline** red button
- **Ignore** (dismiss notification but don't reject) gray button
- Ringtone plays using Web Audio API (a pleasant, professional ring pattern)

### Notifications & Toasts

- Use a toast notification system (bottom-right corner) for:
  - Registration success/failure
  - Call connected/disconnected
  - Message received
  - Configuration saved
  - Errors (with detail expandable)
- Toasts should auto-dismiss after 4 seconds with a progress bar, but error toasts persist until dismissed

## Functionality Details

### SIP/VoIP Core (Simulated)
Since we can't include the actual sip.js library in a single-file app, **simulate the SIP functionality** with a realistic state machine:
- Registration states: Unregistered → Registering → Registered (with realistic delays)
- Call states: Idle → Dialing → Ringing → Connected → On Hold → Ended
- Simulate incoming calls with a "Simulate Incoming Call" debug button (hidden in settings)
- All UI interactions (mute, hold, transfer, DTMF) should update state and show visual feedback as if connected
- Display a **setup instructions panel** explaining how to integrate real sip.js when deploying to a real server, including code snippets

### Data Persistence (localStorage)
- Save all server profiles/configurations
- Save contacts
- Save call history (last 100 entries)
- Save message threads
- Save audio/video device preferences
- Save theme/appearance preferences
- Save last active tab/view

### DTMF Tone Generation
- Use the **Web Audio API** to generate real DTMF tones when dialpad buttons are pressed
- Each button should produce the correct dual-frequency tone pair
- Tones should play for ~150ms on press

### Responsive Design
- **Desktop**: Full sidebar + main panel layout (min-width: 768px)
- **Tablet**: Collapsible sidebar, full main panel
- **Mobile**: Bottom tab navigation, full-screen views, dialpad optimized for touch with larger buttons

## Footer

Small, subtle footer at the bottom of the sidebar:
- "SoftPhone Pro v1.0" text
- <a href="/remix">Remix on Berrry</a> link
- "Powered by sip.js concept" text

## Tone & Personality

The app should feel **serious and professional** but with thoughtful, delightful touches:
- Smooth animations on call state transitions
- Satisfying haptic-style visual feedback on button presses
- A subtle "connecting" animation (pulsing rings) when dialing
- The dialpad should feel tactile and responsive
- Status changes should have smooth color transitions
- Empty states should have helpful, friendly messages (e.g., "No calls yet — time to break the ice! 🧊")