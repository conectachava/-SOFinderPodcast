import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";

export async function POST(req: NextRequest) {
  const { topic, content, format } = await req.json();

  if (format === "txt") {
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${topic.replace(/ /g, "_")}.txt"`,
      },
    });
  } else if (format === "pdf") {
    const doc = new jsPDF();
    doc.text(topic, 10, 10);
    doc.text(content, 10, 20);
    const pdfData = doc.output("arraybuffer");
    return new NextResponse(Buffer.from(pdfData), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${topic.replace(/ /g, "_")}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}
