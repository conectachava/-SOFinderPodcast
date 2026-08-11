import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { withAiApiValidation } from "@/lib/middleware";

export const POST = withAiApiValidation(async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, type, format, scriptRating, audioRating, comments } = body;

    if (!topic || scriptRating === undefined || audioRating === undefined) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para el feedback." },
        { status: 400 }
      );
    }

    const feedbackEntry = {
      topic: String(topic),
      type: String(type || "General"),
      format: String(format || "Debate"),
      scriptRating: Number(scriptRating),
      audioRating: Number(audioRating),
      comments: String(comments || ""),
      createdAt: new Date().toISOString(),
    };

    try {
      const db = getAdminDb();
      const docRef = await db.collection("feedback").add(feedbackEntry);
      return NextResponse.json({
        success: true,
        id: docRef.id,
        feedback: feedbackEntry,
      });
    } catch (dbErr) {
      console.warn("Firestore Admin store warning:", dbErr);
      return NextResponse.json({
        success: true,
        id: `local_${Date.now()}`,
        feedback: feedbackEntry,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error procesando feedback" },
      { status: 500 }
    );
  }
});

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("feedback").orderBy("createdAt", "desc").limit(50).get();
    const feedbackList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ feedback: feedbackList });
  } catch (error) {
    return NextResponse.json({ feedback: [] });
  }
}
