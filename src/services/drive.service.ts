import { google } from 'googleapis';
import { Readable } from 'stream';
import logger from '../utils/logger';

const getAuthClient = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2Client;
};

export const DriveService = {
  async uploadFile(
    fileName: string,
    mimeType: string,
    fileBuffer: Buffer
  ): Promise<{ id: string; webViewLink: string }> {
    const auth = getAuthClient();
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: fileName,
      parents: process.env.GOOGLE_DRIVE_FOLDER_ID
        ? [process.env.GOOGLE_DRIVE_FOLDER_ID]
        : undefined,
    };

    const readable = new Readable();
    readable.push(fileBuffer);
    readable.push(null);

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: { mimeType, body: readable },
      fields: 'id, webViewLink',
    });

    logger.info(`Archivo subido a Drive: ${fileName} (ID: ${response.data.id})`);

    return {
      id: response.data.id ?? '',
      webViewLink: response.data.webViewLink ?? '',
    };
  },

  async listReports(): Promise<Array<{ id: string; name: string; webViewLink: string; createdTime: string }>> {
    const auth = getAuthClient();
    const drive = google.drive({ version: 'v3', auth });

    const query = process.env.GOOGLE_DRIVE_FOLDER_ID
      ? `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`
      : 'trashed=false';

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, webViewLink, createdTime)',
      orderBy: 'createdTime desc',
    });

    return (response.data.files ?? []) as Array<{
      id: string;
      name: string;
      webViewLink: string;
      createdTime: string;
    }>;
  },

  async deleteFile(fileId: string): Promise<void> {
    const auth = getAuthClient();
    const drive = google.drive({ version: 'v3', auth });
    await drive.files.delete({ fileId });
    logger.info(`Archivo eliminado de Drive: ${fileId}`);
  },
};
