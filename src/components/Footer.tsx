export default function Footer() {
  return (
    <footer className="footer container">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <span>© {new Date().getFullYear()} The Stickest</span>
        <span>Made with ❤️ and thick outlines</span>
      </div>
    </footer>
  );
}

