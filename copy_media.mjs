import fs from 'fs';
import path from 'path';

const sourceDir = 'D:/Projects/Shivaanya-collection/Shivaanya-Threads/SHIVAANYA_COLLECTION_WEBSITE';
const targetDir = 'D:/Projects/Shivaanya-collection/Shivaanya-Threads/artifacts/shivaanya/public/media';

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

function copyFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            copyFiles(fullPath);
        } else {
            // Simplify file name: remove spaces, special chars, lower case
            let newName = file.toLowerCase().replace(/[^a-z0-9.]/g, '_').replace(/_+/g, '_');
            const targetPath = path.join(targetDir, newName);
            // Copy file if it doesn't exist
            if (!fs.existsSync(targetPath)) {
                console.log(`Copying ${file} to ${newName}`);
                fs.copyFileSync(fullPath, targetPath);
            }
        }
    }
}

copyFiles(sourceDir);
console.log('Done copying media files.');
