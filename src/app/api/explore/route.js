import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Common Windows drive letters to check for base roots
const WINDOWS_DRIVES = ['C:\\', 'D:\\', 'E:\\', 'F:\\', 'G:\\', 'H:\\', 'Z:\\'];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dirPath = searchParams.get('path');

  // If no path is provided, we return logical drives on Windows
  if (!dirPath || dirPath === '') {
    const availableRoots = WINDOWS_DRIVES.filter(d => {
      try {
        fs.accessSync(d, fs.constants.R_OK);
        return true;
      } catch (e) {
        return false;
      }
    });

    return NextResponse.json({
      currentPath: '',
      parentPath: null,
      items: availableRoots.map(drive => ({
        name: drive,
        path: drive,
        isDirectory: true
      }))
    });
  }

  // A specific path is requested
  try {
    const absolutePath = path.resolve(dirPath);
    const parentPath = path.dirname(absolutePath);

    // Ensure it exists
    if (!fs.existsSync(absolutePath)) {
       return NextResponse.json({ error: 'Cartella non trovata.' }, { status: 404 });
    }

    const items = fs.readdirSync(absolutePath, { withFileTypes: true });
    
    // Sort directories first, then files alphabetically
    const formattedItems = items.map(item => {
      return {
        name: item.name,
        path: path.join(absolutePath, item.name),
        isDirectory: item.isDirectory()
      };
    }).filter(i => {
      // Hide hidden files or system files that start with '.' or '$'
      return !i.name.startsWith('.') && !i.name.startsWith('$');
    }).sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      currentPath: absolutePath,
      parentPath: parentPath === absolutePath ? '' : parentPath, 
      items: formattedItems
    });

  } catch (err) {
    console.error('Explore API Error:', err);
    return NextResponse.json({ error: 'Impossibile leggere il percorso. Errore di permessi.' }, { status: 500 });
  }
}
