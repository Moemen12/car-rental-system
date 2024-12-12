import { Injectable } from '@nestjs/common';
import { UTApi } from 'uploadthing/server';
import { logError, throwCustomError } from '../utilities/general';
import { v4 as uuidv4 } from 'uuid'; // Import UUID for generating unique names

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
      // Create buffer from the received data
      const buffer = Buffer.from(fileData.buffer);

      // Generate a unique name using UUID and preserve the original extension
      const originalExtension =
        fileData.originalName?.split('.').pop() || 'jpg';
      const uniqueName = `${uuidv4()}.${originalExtension}`;

      // Create a File object with the unique name
      const file = new File([buffer], uniqueName, {
        type: fileData.mimeType || fileData.fileType?.mime || 'image/jpeg',
        lastModified: Date.now(),
      });

      // Upload to UploadThing
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
