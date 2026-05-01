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

  if (content.includes('COLORS.')) {
    content = content.replace(/COLORS\./g, 'C.');
    changed = true;
  }
  if (content.includes('const getStyles = (COLORS, isDark)')) {
    content = content.replace(/const getStyles = \(COLORS, isDark\)/g, 'const getStyles = (C, isDark)');
    changed = true;
  }
  // In case the useTheme destructuring is const { C: COLORS, isDark }
  if (content.includes('const { C: COLORS, isDark }')) {
    content = content.replace(/const \{ C: COLORS, isDark \}/g, 'const { C, isDark }');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Replaced COLORS in:', file);
  }
});
