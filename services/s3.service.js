// S3 Service Utilities
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3Config = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

export function getS3Client() {
  return new S3Client(s3Config);
}

export async function uploadToS3({ bucket, key, body, contentType, acl = "public-read" }) {
  const s3 = getS3Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: acl,
    })
  );
  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function listImageFolders({ bucket, prefix = "", limit = 20, cursor }) {
  const s3 = getS3Client();
  const listParams = {
    Bucket: bucket,
    Prefix: prefix,
    Delimiter: "/",
    MaxKeys: limit,
  };
  if (cursor) listParams.ContinuationToken = cursor;
  const data = await s3.send(new ListObjectsV2Command(listParams));
  // Folders are in CommonPrefixes
  return {
    folders: data.CommonPrefixes ? data.CommonPrefixes.map(cp => cp.Prefix) : [],
    nextCursor: data.IsTruncated ? data.NextContinuationToken : null,
    total: data.KeyCount || 0,
  };
}

export async function listImagesInFolder({ bucket, folder }) {
  const s3 = getS3Client();
  const data = await s3.send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: folder,
    MaxKeys: 10,
  }));
  return (data.Contents || []).map(obj => ({
    key: obj.Key,
    url: `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${obj.Key}`,
  }));
}
