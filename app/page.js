export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: "24px",
      boxSizing: "border-box",
      fontFamily: "Arial, sans-serif",
      background: "#fff0f7",
      color: "#7d3f5e",
      textAlign: "center"
    }}>
      <section>
        <div style={{fontSize: 52}}>♡</div>
        <h1 style={{margin: "8px 0"}}>Yvainely Custom QR</h1>
        <p style={{margin: 0, opacity: .8}}>
          Your Telegram QR bot is running.
        </p>
      </section>
    </main>
  );
}
