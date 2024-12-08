import { InternalServerErrorException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';
import { MemoryStoredFile } from 'nestjs-form-data';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import * as crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(
  'f3f4b9d9ac56c5e3a4e5b0cdb173a1f8',
  'hex',
).slice(0, 16);
const ALGORITHM = 'aes-128-ecb';

export async function saltAndHashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  try {
    const hashPassword = await bcrypt.hash(password, saltRounds);
    return hashPassword;
  } catch (error) {
    throw new InternalServerErrorException(error);
  }
}

export function throwCustomError(message: string, status: number) {
  throw new RpcException({
    message,
    status,
    error: message,
  });
}

export function RethrowGeneralError(message: string) {
  throw new RpcException({
    message: message ? message : 'An error occurred',
    statusCode: 500,
    error: 'An error occurred',
  });
}

export function convertMbToBytes(mb: number): number {
  const bytesInMb = 1024 * 1024; // 1 MB = 1024 KB, 1 KB = 1024 bytes
  return mb * bytesInMb;
}

export async function validateDriverLicense(
  image: MemoryStoredFile,
): Promise<boolean> {
  try {
    // More robust image preprocessing
    const processedBuffer = await sharp(image.buffer)
      .rotate()
      .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
      .threshold(128)
      .sharpen({ sigma: 1.5, m1: 0.5, m2: 0.7 })
      .grayscale()
      .toBuffer();

    // Perform OCR with minimal configuration
    const result = await Tesseract.recognize(processedBuffer, 'eng', {
      langPath: 'eng',
    });

    const extractedText = result.data.text;
    console.log('Extracted text:', extractedText);

    const cleanedText = cleanText(extractedText);
    console.log('Cleaned text:', cleanedText);

    return isValidLicense(cleanedText);
  } catch (error) {
    console.error('License validation error:', error);
    return false;
  }
}

function isValidLicense(text: string): boolean {
  // More generic and universal license validation patterns
  const licensePatterns = {
    licenseKeywords: [
      /\b(driver'?s?\s*license|dl|driving\s*licence|license)\b/i,
      /\b(driver)\b/i,
    ],
    licenseNumber: [
      /\b[a-z0-9]{6,10}\b/i, // More flexible license number
      /\b\d{3,4}\s*\d{3,4}\s*\d{3,4}\b/i, // Allows various number formats
    ],
    dateFormats: [
      /\d{2}\/\d{2}\/\d{4}/i, // MM/DD/YYYY
      /\d{2}\/\d{2}\/\d{2}/i, // MM/DD/YY
      /\d{1,2}\.\d{1,2}\.\d{2,4}/i, // Alternative date formats
    ],
    commonFields: [
      /\b(sex|donor|height|class|dob|birth|exp|issue|id)\b/i,
      /\b(license|identification)\b/i,
      /\b(name|address|date\s*of\s*birth)\b/i,
    ],
  };

  // Detailed logging for debugging
  const checks = [
    {
      name: 'License Keyword',
      result: licensePatterns.licenseKeywords.some((p) => p.test(text)),
      weight: 3, // Most critical
    },
    {
      name: 'License Number',
      result: licensePatterns.licenseNumber.some((p) => p.test(text)),
      weight: 2,
    },
    {
      name: 'Date Format',
      result: licensePatterns.dateFormats.some((p) => p.test(text)),
      weight: 2,
    },
    {
      name: 'Common Fields',
      result: licensePatterns.commonFields.some((p) => p.test(text)),
      weight: 1,
    },
  ];

  // Log detailed validation results
  checks.forEach((check) => {
    console.log(`${check.name} validation: ${check.result}`);
  });

  // Weighted validation with more flexible scoring
  const validElementsScore = checks.reduce((score, check) => {
    return check.result ? score + check.weight : score;
  }, 0);

  // More lenient scoring
  const isValid = validElementsScore >= 5;

  console.log(`Total valid score: ${validElementsScore}`);
  console.log(`Overall validation result: ${isValid}`);

  return isValid;
}

function cleanText(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\s/\-:.]/g, '') // Strict whitelist
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*/g, ' ') // Remove vertical bars
    .replace(/[()[\]{}]/g, '') // Remove brackets
    .trim()
    .toLowerCase();
}

export function encrypt(text: string): string {
  try {
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, null);
    return cipher.update(text, 'utf8', 'base64') + cipher.final('base64');
  } catch (error) {
    throwCustomError('Encryption failed', 500);
  }
}

export function decrypt(encryptedText: string): string {
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, null);
    return (
      decipher.update(encryptedText, 'base64', 'utf8') + decipher.final('utf8')
    );
  } catch (error) {
    throwCustomError('You are not authorized to perform this action.', 401);
  }
}

export function calculateDaysDifference(
  startDate: Date,
  endDate: Date,
): number {
  const timeDifference = endDate.getTime() - startDate.getTime();
  const numberOfDays = timeDifference / (1000 * 3600 * 24);
  return numberOfDays;
}
