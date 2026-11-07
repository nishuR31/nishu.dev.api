import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import crypto from "crypto";
import { SUPABASE_URL, SUPABASE_KEY } from "../config/envConfig";

// Only initialize if keys are present to prevent server crash on boot
export const supabase =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : (null as any);

type StorageFile = {
  name: string;
  metadata: { size?: number; mimetype?: string } | null;
  created_at: string | null;
  updated_at: string | null;
};

export type StorageAsset = {
  bucket: string;
  name: string;
  path: string;
  size: number | null;
  contentType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  url: string;
};

export class StorageProvider {
  /**
   * Upload an image to Supabase after optimizing with Sharp
   */
  static async uploadImage(
    fileBuffer: Buffer,
    bucket: string,
    originalName: string,
    folder: string = "",
  ): Promise<string> {
    try {
      if (!supabase)
        throw new Error("Supabase is not configured. Missing environment variables.");

      // Optimize image (AVIF is a great modern format)
      const optimizedBuffer = await sharp(fileBuffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .avif({ quality: 80 })
        .toBuffer();

      const ext = ".avif";
      const fileName = `${folder ? folder + "/" : ""}${crypto.randomUUID()}${ext}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, optimizedBuffer, {
          contentType: "image/avif",
          upsert: true,
        });

      if (error) {
        console.error("StorageProvider image upload provider error", {
          bucket,
          fileName,
          error,
        });
        throw error;
      }

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
    folder: string = "",
  ): Promise<string> {
    try {
      if (!supabase)
        throw new Error("Supabase is not configured. Missing environment variables.");

      const extension = originalName.split(".").pop();
      const fileName = `${folder ? folder + "/" : ""}${crypto.randomUUID()}.${extension}`;

      const { error } = await supabase.storage.from(bucket).upload(fileName, fileBuffer, {
        contentType,
        upsert: true,
      });

      if (error) {
        console.error("StorageProvider document upload provider error", {
          bucket,
          fileName,
          error,
        });
        throw error;
      }

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
    if (!supabase)
      throw new Error("Supabase is not configured. Missing environment variables.");

    // path is the portion after the bucket name in the URL
    // We would need to extract it, but for simplicity we assume path is known
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error("StorageProvider delete error:", error);
      throw new Error("Failed to delete file from storage.");
    }
  }

  static async listFiles(bucket: string, folder = ""): Promise<StorageAsset[]> {
    if (!supabase)
      throw new Error("Supabase is not configured. Missing environment variables.");

    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      console.error("StorageProvider list error:", { bucket, folder, error });
      throw new Error("Failed to list storage files.");
    }

    const files = (data || []) as StorageFile[];
    return files
      .filter((file) => file.name && file.metadata)
      .map((file) => {
        const path = `${folder ? `${folder}/` : ""}${file.name}`;
        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
        return {
          bucket,
          name: file.name,
          path,
          size: file.metadata?.size ?? null,
          contentType: file.metadata?.mimetype ?? null,
          createdAt: file.created_at ?? null,
          updatedAt: file.updated_at ?? null,
          url: publicUrlData.publicUrl,
        };
      });
  }
}
