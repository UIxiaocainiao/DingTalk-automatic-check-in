export default function DeviceCard({ device }) {
  return (
    <article className="device-card">
      <h3>{device?.serial || "Unknown Device"}</h3>
      <p>{device?.status || "offline"}</p>
    </article>
  );
}
