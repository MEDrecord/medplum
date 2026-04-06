export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Communication Gateway</h1>
      <p>MEDrecord multi-channel patient communication service.</p>
      <h2>Status: Online</h2>
      <h3>Endpoints:</h3>
      <ul>
        <li><code>POST /api/webhook/medplum</code> - MedPlum subscription receiver</li>
        <li><code>POST /api/webhook/twilio/status</code> - Twilio status callbacks</li>
        <li><code>POST /api/webhook/twilio/whatsapp</code> - WhatsApp incoming messages</li>
        <li><code>GET /api/health</code> - Health check</li>
      </ul>
    </main>
  );
}
