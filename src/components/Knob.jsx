export default function Knob({ accent }) {
  return (
    <div className="knob" style={{ borderColor: accent }}>
      <div className="knob-pointer" />
    </div>
  );
}
