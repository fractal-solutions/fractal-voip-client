import React, { useRef, useState } from "react";

const h = React.createElement;

export function VideoView({ Icon, Avatar, addToast }) {
  const [targetUri, setTargetUri] = useState("");
  const [videoState, setVideoState] = useState("idle");
  const videoRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const startPreview = () => {
    if (!targetUri) return;
    setVideoState("preview");
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => addToast("Camera not available (simulated mode)", "info"));
  };

  const startVideoCall = () => {
    setVideoState("calling");
    setTimeout(() => {
      setVideoState("connected");
      addToast("Video call connected (simulated)", "success");
    }, 2500);
  };

  const endVideoCall = () => {
    if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setVideoState("idle");
    addToast("Video call ended", "info");
  };

  if (videoState === "idle") {
    return h(
      "div",
      { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 16 } },
      h(
        "div",
        {
          style: {
            width: 80,
            height: 80,
            borderRadius: 24,
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          },
        },
        h(Icon, { name: "video", size: 36, color: "var(--accent-blue)" })
      ),
      h("h2", { style: { fontSize: 22, fontWeight: 300 } }, "Video Call"),
      h("p", { style: { color: "var(--text-muted)", fontSize: 13, textAlign: "center", maxWidth: 300 } }, "Enter a SIP URI to start a video call with camera preview."),
      h("input", {
        className: "input-field mono",
        style: { maxWidth: 340, textAlign: "center" },
        value: targetUri,
        onChange: e => setTargetUri(e.target.value),
        placeholder: "sip:user@server.com",
      }),
      h("button", { className: "pill-btn primary", onClick: startPreview }, h(Icon, { name: "video", size: 16, color: "white" }), "Start Preview")
    );
  }

  return h(
    "div",
    { style: { flex: 1, display: "flex", flexDirection: "column", position: "relative", background: "#000" } },
    h(
      "div",
      { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" } },
      videoState === "connected"
        ? h(
            "div",
            { style: { width: "100%", height: "100%", background: "linear-gradient(135deg, #1a1d27, #0f1117)", display: "flex", alignItems: "center", justifyContent: "center" } },
            h(Avatar, { name: targetUri, size: 120 })
          )
        : h(
            "div",
            { style: { textAlign: "center" } },
            h("div", { style: { fontSize: 18, fontWeight: 300, marginBottom: 8, color: "white" } }, videoState === "preview" ? "Ready to call?" : "Connecting..."),
            h("div", { className: "mono", style: { fontSize: 13, color: "var(--text-muted)" } }, targetUri),
            videoState === "preview" && h("button", { className: "pill-btn success", style: { marginTop: 20 }, onClick: startVideoCall }, h(Icon, { name: "video", size: 16, color: "white" }), "Call Now")
          ),
      h(
        "div",
        {
          style: {
            position: "absolute",
            bottom: 80,
            right: 16,
            width: 160,
            height: 120,
            borderRadius: 12,
            overflow: "hidden",
            border: "2px solid var(--border-color)",
            background: "#111",
          },
        },
        h("video", { ref: videoRef, autoPlay: true, muted: true, playsInline: true, style: { width: "100%", height: "100%", objectFit: "cover" } }),
        !cameraOn &&
          h(
            "div",
            { style: { position: "absolute", inset: 0, background: "#222", display: "flex", alignItems: "center", justifyContent: "center" } },
            h(Icon, { name: "video-off", size: 24, color: "var(--text-muted)" })
          )
      )
    ),
    h(
      "div",
      {
        style: {
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 12,
          padding: "12px 20px",
          borderRadius: 16,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
        },
      },
      h(
        "button",
        {
          style: { width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer", background: micOn ? "var(--bg-tertiary)" : "var(--accent-red)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" },
          onClick: () => setMicOn(!micOn),
        },
        h(Icon, { name: micOn ? "mic" : "mic-off", size: 18, color: "white" })
      ),
      h(
        "button",
        {
          style: { width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer", background: cameraOn ? "var(--bg-tertiary)" : "var(--accent-red)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" },
          onClick: () => setCameraOn(!cameraOn),
        },
        h(Icon, { name: cameraOn ? "video" : "video-off", size: 18, color: "white" })
      ),
      h("button", { className: "call-btn call-btn-red", style: { width: 44, height: 44, borderRadius: 12 }, onClick: endVideoCall }, h(Icon, { name: "phone-off", size: 18, color: "white" }))
    )
  );
}
