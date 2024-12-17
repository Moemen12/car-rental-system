import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';
import { MemoryStoredFile } from 'nestjs-form-data';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import * as crypto from 'crypto';
import chalk from 'chalk';
import stringSimilarity from 'string-similarity';

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

export function throwCustomError(
  message: string,
  status: number,
  unexpectedErrorMsg?: string,
) {
  throw new RpcException({
    expected: true,
    unexpectedErrorMsg,
    message,
    status,
    error: message,
  });
}

export function logError(error: any) {
  if (process.env.DEBUG_MODE === 'true') {
    if (!error?.error?.expected) {
      console.log(chalk.red('Unexpected Error:'), chalk.yellow(error));
    } else {
      console.log(chalk.green('expected error occurred.'));
    }
  }
}
export function RethrowGeneralError(message: string) {
  throw new RpcException({
    message: message ? message : 'An error occurred',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    error: 'An error occurred',
  });
}

export function convertMbToBytes(mb: number): number {
  const bytesInMb = 1024 * 1024; // 1 MB = 1024 KB, 1 KB = 1024 bytes
  return mb * bytesInMb;
}

export async function validateDriverLicense(
  image: MemoryStoredFile,
  driverLicenseId: string,
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

    // Clean the extracted text
    const cleanedText = cleanText(extractedText);

    // Validate extracted text against driverLicenseId with similarity check
    const isIdSimilar = checkIdSimilarity(driverLicenseId, cleanedText);

    // Validate license format and content
    const isLicenseValid = isValidLicense(cleanedText);

    return isIdSimilar && isLicenseValid;
  } catch (error) {
    return false;
  }
}

function checkIdSimilarity(driverLicenseId: string, text: string): boolean {
  // Extract possible matches for driver license ID
  const words = text.split(/\s+/); // Split text into words
  const match = stringSimilarity.findBestMatch(driverLicenseId, words);

  console.log(`Best match: ${match.bestMatch.target}`);
  console.log(`Similarity score: ${match.bestMatch.rating}`);

  // Consider it valid if similarity score is above 0.8
  return match.bestMatch.rating >= 0.6;
}

function isValidLicense(text: string): boolean {
  const licensePatterns = {
    licenseKeywords: [
      /\b(driver'?s?\s*license|dl|driving\s*licence|license)\b/i,
      /\b(driver)\b/i,
    ],
    licenseNumber: [/\b[a-z0-9]{6,10}\b/i, /\b\d{3,4}\s*\d{3,4}\s*\d{3,4}\b/i],
    dateFormats: [
      /\d{2}\/\d{2}\/\d{4}/i,
      /\d{2}\/\d{2}\/\d{2}/i,
      /\d{1,2}\.\d{1,2}\.\d{2,4}/i,
    ],
    commonFields: [
      /\b(sex|donor|height|class|dob|birth|exp|issue|id)\b/i,
      /\b(license|identification)\b/i,
      /\b(name|address|date\s*of\s*birth)\b/i,
    ],
  };

  // Immediately fail if no `licenseKeywords` match
  const hasKeywordMatch = licensePatterns.licenseKeywords.some((p) =>
    p.test(text),
  );
  if (!hasKeywordMatch) {
    console.log('No license keywords found in text. Validation failed.');
    return false;
  }

  const checks = [
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

  checks.forEach((check) => {
    console.log(`${check.name} validation: ${check.result}`);
  });

  const validElementsScore = checks.reduce((score, check) => {
    return check.result ? score + check.weight : score;
  }, 0);

  console.log(`Total valid score: ${validElementsScore}`);

  return validElementsScore >= 5;
}

function cleanText(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\s/\-:.]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*/g, ' ')
    .replace(/[()[\]{}]/g, '')
    .trim()
    .toLowerCase();
}

export function encrypt(text: string): string {
  try {
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, null);
    const encrypted =
      cipher.update(text, 'utf8', 'base64') + cipher.final('base64');

    // Use URL-safe Base64 encoding
    return encrypted
      .replace(/\+/g, '-') // Replace + with -
      .replace(/\//g, '_') // Replace / with _
      .replace(/=+$/, ''); // Remove trailing =
  } catch (error) {
    throwCustomError('Encryption failed', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export function decrypt(encryptedText: string): string {
  try {
    // Restore standard Base64 encoding
    let paddedText = encryptedText
      .replace(/-/g, '+') // Restore +
      .replace(/_/g, '/'); // Restore /

    while (paddedText.length % 4 !== 0) {
      paddedText += '=';
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, null);
    return (
      decipher.update(paddedText, 'base64', 'utf8') + decipher.final('utf8')
    );
  } catch (error) {
    throwCustomError(
      'You are not authorized to perform this action.',
      HttpStatus.UNAUTHORIZED,
      'An error occurred during decrypting text',
    );
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

export function formatDate(date: Date): string {
  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return formattedDate;
}
