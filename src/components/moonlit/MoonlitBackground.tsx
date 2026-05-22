import StarField from "./StarField";

// Full-page moonlit night-sky backdrop using the Gemini-generated image.
// The image already contains the moon + Milky Way; we layer a star-field
// on top for subtle motion, then a tint to keep card content readable.
export default function MoonlitBackground() {
  return (
    <>
      {/* Sky image */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: "url('./images/moonlit-sky.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Star drift layer */}
      <StarField count={90} />

      {/* Page tint - thin so the image breathes through, but dark enough
          that card text stays legible over the brightest parts of the moon. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(180deg, rgba(7,10,26,0.42) 0%, rgba(7,10,26,0.65) 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </>
  );
}
