import { Storage } from "aws-amplify";

export async function s3Upload(file) {
  const filename = `${Date.now()}-${file.name}`;

  const stored = await Storage.vault.put(filename, file, {
    contentType: file.type,
  });

  return stored.key;
}

export async function s3ProtectedUpload(file) {
  const filename = `${Date.now()}-${file.name}`;

  const stored = await Storage.put(filename, file, {
    level: 'protected',
    contentType: file.type,
  });

  return stored.key;
}

export async function getProtectedUpload(file, identityId) {
  return await Storage.get(file, {
    level: 'protected',
    identityId: identityId,
  });
}