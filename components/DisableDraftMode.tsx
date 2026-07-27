export function DisableDraftMode() {
  return (
    <a
      href="/api/draft-mode/disable"
      className="fixed bottom-4 right-4 z-50 rounded-full bg-black px-4 py-2 text-xs text-white shadow-lg hover:bg-black/80"
    >
      Exit preview
    </a>
  );
}
