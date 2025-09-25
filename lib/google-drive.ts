import { google } from 'googleapis';

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

type DriveClient = ReturnType<typeof google.drive>;

export interface DriveInvoiceFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  siteName: string;
}

function getAuthClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google service account credentials.');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: DRIVE_SCOPES,
  });
}

function createDriveClient(): DriveClient {
  const auth = getAuthClient();
  return google.drive({ version: 'v3', auth });
}

async function listSubFolders(drive: DriveClient, folderId: string) {
  const folders: { id: string; name: string }[] = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'nextPageToken, files(id, name)',
      pageToken,
    });

    const pageFolders = response.data.files ?? [];
    folders.push(...pageFolders.map((folder) => ({
      id: folder.id!,
      name: folder.name || 'Unknown Site',
    })));

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return folders;
}

async function listFilesInFolder(
  drive: DriveClient,
  folderId: string,
  siteName: string,
): Promise<DriveInvoiceFile[]> {
  const files: DriveInvoiceFile[] = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      pageToken,
    });

    const pageFiles = response.data.files ?? [];
    files.push(
      ...pageFiles
        .filter((file) => !!file.id && !!file.mimeType)
        .map((file) => ({
          id: file.id!,
          name: file.name || 'Unnamed Document',
          mimeType: file.mimeType!,
          modifiedTime: file.modifiedTime || undefined,
          siteName,
        })),
    );

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return files;
}

export async function listDriveInvoiceFiles(rootFolderId: string): Promise<DriveInvoiceFile[]> {
  const drive = createDriveClient();

  const subFolders = await listSubFolders(drive, rootFolderId);

  const supportedMimeTypes = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
  ]);

  const allFiles: DriveInvoiceFile[] = [];

  for (const folder of subFolders) {
    const files = await listFilesInFolder(drive, folder.id, folder.name);
    const filtered = files.filter((file) => supportedMimeTypes.has(file.mimeType));
    allFiles.push(...filtered);
  }

  return allFiles;
}

export async function downloadDriveFile(fileId: string): Promise<{ data: Buffer; mimeType: string; fileName: string }> {
  const drive = createDriveClient();

  const fileMeta = await drive.files.get({
    fileId,
    fields: 'name, mimeType',
  });

  const mimeType = fileMeta.data.mimeType || 'application/octet-stream';
  const fileName = fileMeta.data.name || 'document';

  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
    },
    {
      responseType: 'arraybuffer',
    },
  );

  return {
    data: Buffer.from(response.data as ArrayBuffer),
    mimeType,
    fileName,
  };
}
