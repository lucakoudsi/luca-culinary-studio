export async function POST() {
  return Response.json({
    error: 'KI-Funktion wird bald verfügbar sein.',
    available: false,
  }, { status: 503 });
}
