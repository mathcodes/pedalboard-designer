export default function JackButton({ state, onClick, label }) {
  const cls = [
    "jack-btn",
    state === "connected" ? "connected" : "",
    state === "selected" ? "selected" : "",
    state === "error" ? "error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      aria-label={`${label} jack`}
      className={cls}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
}
