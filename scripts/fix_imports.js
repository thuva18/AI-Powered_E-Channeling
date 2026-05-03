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
  if (content.includes('useStyles(getStyles)') && !content.includes('import useStyles')) {
    const depth = file.replace(__dirname + '/mobile/', '').split('/').length - 1;
    const relativePrefix = depth === 0 ? './' : '../'.repeat(depth);
    const importStr = `import useStyles from '${relativePrefix}hooks/useStyles';\n`;
    
    // Inject it safely after the first import
    content = content.replace(/(import .*;\n)/, `$1${importStr}`);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed import in:', file);
  }
});
