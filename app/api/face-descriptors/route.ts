import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "lib", "face-descriptors.json");

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Face descriptors not yet generated. Run: npm run generate:faces" },
        { status: 404 }
      );
    }

    const data = fs.readFileSync(filePath, "utf-8");
    const descriptors = JSON.parse(data);

    return NextResponse.json(descriptors, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("Error loading face descriptors:", error);
    return NextResponse.json(
      { error: "Failed to load face descriptors" },
      { status: 500 }
    );
  }
}
