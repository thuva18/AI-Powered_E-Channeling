const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.jsx') || dirFile.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'mobile/app')).concat(walkSync(path.join(__dirname, 'mobile/components')));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('import { COLORS, ')) {
    content = content.replace(/import \{ COLORS, /g, 'import { COLORS as C, ');
    changed = true;
  }
  if (content.includes('import { COLORS }')) {
    content = content.replace(/import \{ COLORS \}/g, 'import { COLORS as C }');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed import in:', file);
  }
});
