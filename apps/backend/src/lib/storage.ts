import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { ValidationError } from '../http/errors.js';

export interface FileStorageResult {
  fileKey: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export class LocalStorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  public detectMimeType(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
    if (buffer.length < 12) return null;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return 'image/png';
    }

    // WebP: RIFF....WEBP
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image/webp';
    }

    return null;
  }

  public async saveImage(buffer: Buffer, originalName: string): Promise<FileStorageResult> {
    const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
    if (buffer.length > maxBytes) {
      throw new ValidationError(`File exceeds maximum size limit of ${env.MAX_UPLOAD_MB} MB`);
    }

    const detectedMime = this.detectMimeType(buffer);
    if (!detectedMime) {
      throw new ValidationError('Invalid image format. Allowed formats are JPEG, PNG, and WebP only.');
    }

    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };

    const fileKey = `${uuidv4()}${extMap[detectedMime]}`;
    const filePath = path.join(this.uploadDir, fileKey);

    await fs.promises.writeFile(filePath, buffer);

    return {
      fileKey,
      originalName,
      mimeType: detectedMime,
      size: buffer.length,
    };
  }

  public getFilePath(fileKey: string): string | null {
    // Prevent directory traversal
    const safeKey = path.basename(fileKey);
    const filePath = path.join(this.uploadDir, safeKey);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }
}

export const storage = new LocalStorageProvider();

