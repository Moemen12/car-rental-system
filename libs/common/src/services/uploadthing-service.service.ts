import { Injectable } from '@nestjs/common';
import { UTApi } from 'uploadthing/server';
import { logError, throwCustomError } from '../utilities/general';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadthingService {
  private utapi: UTApi;

  constructor() {
    this.utapi = new UTApi();
  }

  async UploadImageToUploadThing(
    fileData: any,
  ): Promise<{ key: string; url: string }> {
    try {
      const buffer = Buffer.from(fileData.buffer);

      const originalExtension =
        fileData.originalName?.split('.').pop() || 'jpg';
      const uniqueName = `${uuidv4()}.${originalExtension}`;

      const file = new File([buffer], uniqueName, {
        type: fileData.mimeType || fileData.fileType?.mime || 'image/jpeg',
        lastModified: Date.now(),
      });

      const response = await this.utapi.uploadFiles([file]);
      const uploadedFile = response[0];

      return {
        key: uploadedFile.data.key,
        url: uploadedFile.data.url,
      };
    } catch (error) {
      logError(error);
      throwCustomError(
        error?.error?.message,
        error?.error?.status,
        'Failed to upload image to UploadThing',
      );
    }
  }

  async deleteImageFromUploadThing(key: string): Promise<void> {
    try {
      await this.utapi.deleteFiles(key);
    } catch (error) {
      logError(error);
      throwCustomError(
        error?.error?.message,
        error?.error?.status,
        'Failed to delete image from UploadThing',
      );
    }
  }
}
