import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import crypto from "crypto";
import { SUPABASE_URL, SUPABASE_KEY } from "../config/envConfig";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export class StorageProvider {
  /**
   * Upload an image to Supabase after optimizing with Sharp
   */
  static async uploadImage(
    fileBuffer: Buffer,
    bucket: string,
    originalName: string,
    folder: string = ""
  ): Promise<string> {
    try {
      // Optimize image (AVIF is a great modern format)
      const optimizedBuffer = await sharp(fileBuffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .avif({ quality: 80 })
        .toBuffer();

      const ext = ".avif";
      const fileName = `${folder ? folder + "/" : ""}${crypto.randomUUID()}${ext}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, optimizedBuffer, {
          contentType: "image/avif",
          upsert: true,
        });

      if (error) throw error;

      // Return public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("StorageProvider image upload error:", error);
      throw new Error("Failed to upload optimized image.");
    }
  }

  /**
   * Upload a raw document (e.g., PDF) to Supabase without optimization
   */
  static async uploadDocument(
    fileBuffer: Buffer,
    bucket: string,
    originalName: string,
    contentType: string,
    folder: string = ""
  ): Promise<string> {
    try {
      const extension = originalName.split(".").pop();
      const fileName = `${folder ? folder + "/" : ""}${crypto.randomUUID()}.${extension}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("StorageProvider doc upload error:", error);
      throw new Error("Failed to upload document.");
    }
  }

  static async deleteFile(bucket: string, path: string): Promise<void> {
    // path is the portion after the bucket name in the URL
    // We would need to extract it, but for simplicity we assume path is known
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error("StorageProvider delete error:", error);
      throw new Error("Failed to delete file from storage.");
    }
  }
}
