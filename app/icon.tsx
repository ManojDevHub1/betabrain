import { ImageResponse } from "next/og";

// Route segment config for static export
export const dynamic = "force-static";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0055FF",
          borderRadius: "8px",
          position: "relative",
        }}
      >
        {/* Minimalist Surgical Beta Lettermark */}
        <div
          style={{
            fontSize: "18px",
            fontWeight: 800,
            color: "#FFFFFF",
            fontFamily: "system-ui, -apple-system, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          β
        </div>
        {/* Precision Inner Dot */}
        <div
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "#FFFFFF",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
