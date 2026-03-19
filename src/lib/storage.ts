import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const uploadDir = path.join(process.cwd(), "public", "uploads");

export async function storeImageFile(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() || "png";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filepath = path.join(uploadDir, filename);

  await fs.writeFile(filepath, bytes);
  return {
    url: `/uploads/${filename}`,
    base64: bytes.toString("base64"),
    mimeType: file.type || "image/png",
  };
}
