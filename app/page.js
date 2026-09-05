export default function Home() {
  return (
    <main
      style={{
        fontFamily: "Arial",
        maxWidth: 700,
        margin: "80px auto",
        padding: 24,
      }}
    >
      <h1>Custom QR Telegram Bot</h1>

      <p>
        Webhook endpoint is available at <code>/api/telegram</code>.
      </p>

      <p>
        Set <code>BOT_TOKEN</code> in your deployment environment.
      </p>
    </main>
  );
}
