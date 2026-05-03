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

  if (content.includes('const getStyles')) {
    // Find all `function ComponentName(` or `const ComponentName = (`
    const componentRegex = /(function\s+[A-Z][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{|const\s+[A-Z][a-zA-Z0-9_]*\s*=\s*\([^)]*\)\s*=>\s*\{)/g;
    
    let match;
    while ((match = componentRegex.exec(content)) !== null) {
      const matchStr = match[0];
      const nextIndex = match.index + matchStr.length;
      
      // Look at the next few characters to see if it already has styles
      const nextChars = content.substring(nextIndex, nextIndex + 50);
      
      if (!nextChars.includes('const styles = useStyles(getStyles);')) {
         // Also check if 'styles' is used in the component before we inject
         // We can just safely inject it since it's cheap
         content = content.slice(0, nextIndex) + '\n  const styles = useStyles(getStyles);' + content.slice(nextIndex);
         changed = true;
         // Adjust regex index because string grew
         componentRegex.lastIndex += '\n  const styles = useStyles(getStyles);'.length;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed subcomponents in:', file);
  }
});
