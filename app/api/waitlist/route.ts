import { addToWaitlist } from "@/lib/waitlist";

const MAX_EMAIL_LENGTH = 200;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const email = typeof raw.email === "string" ? raw.email.trim() : "";

  if (!email) {
    return Response.json({ error: "Indiquez votre email." }, { status: 400 });
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    return Response.json({ error: "Adresse trop longue." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return Response.json(
      { error: "Cette adresse email semble incomplète." },
      { status: 400 },
    );
  }

  try {
    const result = await addToWaitlist(email);
    return Response.json({ result });
  } catch (error) {
    console.error("Inscription à la liste d'attente impossible", error);
    return Response.json(
      { error: "Inscription impossible pour le moment." },
      { status: 500 },
    );
  }
}
