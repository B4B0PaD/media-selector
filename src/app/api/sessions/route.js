import { readDB, createSession } from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to recursively or flatly read directories
function getFilesFromDir(dirPath, allowedExtensions) {
  let results = [];
  try {
    const list = fs.readdirSync(dirPath);
    list.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat && stat.isDirectory()) {
         results = results.concat(getFilesFromDir(filePath, allowedExtensions));
      } else {
         const ext = path.extname(filePath).toLowerCase();
         if (allowedExtensions.includes(ext)) {
           results.push(filePath);
         }
      }
    });
  } catch (err) {
    console.error(`Error scanning path ${dirPath}`, err);
  }
  return results;
}

export async function GET() {
  const db = readDB();
  return NextResponse.json(db.sessions);
}

export async function POST(request) {
  const body = await request.json();
  const { name, type, sourcePath, files } = body;

  if (!name || !type || !sourcePath) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let finalFiles = files || [];

  // Fallback to local directory scan if explicit files weren't provided
  if (finalFiles.length === 0) {
    let extensions = [];
    if (type === 'video') extensions = ['.mp4', '.webm', '.ogg', '.mov'];
    else if (type === 'image') extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    else if (type === 'text') extensions = ['.txt', '.md', '.json'];

    if (!fs.existsSync(sourcePath)) {
      return NextResponse.json({ error: 'Source directory does not exist' }, { status: 400 });
    }

    finalFiles = getFilesFromDir(sourcePath, extensions);
  }

  if (finalFiles.length < 2) {
    return NextResponse.json({ error: 'Not enough files found to create a selection (min 2).' }, { status: 400 });
  }

  const session = createSession(name, type, sourcePath, finalFiles);
  return NextResponse.json(session);
}
