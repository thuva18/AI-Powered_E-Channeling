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

  // 1. If it has StyleSheet.create and uses COLORS, it needs refactoring
  if (content.includes('StyleSheet.create') && !content.includes('useStyles')) {
    // Determine relative path to hooks
    const depth = file.replace(__dirname + '/mobile/', '').split('/').length - 1;
    const relativePrefix = depth === 0 ? './' : '../'.repeat(depth);
    
    // Replace const styles = StyleSheet.create({ with const getStyles = (COLORS, isDark) => StyleSheet.create({
    if (content.includes('const styles = StyleSheet.create({')) {
      content = content.replace('const styles = StyleSheet.create({', 'const getStyles = (COLORS, isDark) => StyleSheet.create({');
      
      // We also need to inject `const styles = useStyles(getStyles);` into the main component.
      // A simple heuristic: find `export default function ` or `export default `
      if (content.includes('export default function')) {
         content = content.replace(/export default function ([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/, 
           `export default function $1($2) {\n  const styles = useStyles(getStyles);`);
      } else if (content.includes('const ') && content.includes('=> {')) {
         // for arrow functions
         const match = content.match(/const ([A-Za-z0-9_]+) = \(([^)]*)\) => \{/);
         if (match) {
           content = content.replace(match[0], `${match[0]}\n  const styles = useStyles(getStyles);`);
         }
      }
      
      // Inject import useStyles
      const importUseStyles = `import useStyles from '${relativePrefix}hooks/useStyles';\n`;
      content = content.replace(/(import .* from ['"]react-native['"];?)/, `$1\n${importUseStyles}`);
      
      changed = true;
    }
  }

  // 2. Also, if there are hardcoded 'rgba(17, 24, 39...' in register or login, we can replace them with COLORS
  if (content.includes('rgba(17, 24, 39, 0.95)')) {
    content = content.replace(/'rgba\(17, 24, 39, 0.95\)'/g, "COLORS.cardBgTranslucent || 'rgba(17, 24, 39, 0.95)'");
    changed = true;
  }
  if (content.includes('rgba(26, 34, 53, 0.8)')) {
    content = content.replace(/'rgba\(26, 34, 53, 0.8\)'/g, "COLORS.inputBgAlt || 'rgba(26, 34, 53, 0.8)'");
    changed = true;
  }
  if (content.includes('rgba(17, 24, 39, 0.98)')) {
    content = content.replace(/'rgba\(17, 24, 39, 0.98\)'/g, "COLORS.bgCard");
    changed = true;
  }
  if (content.includes('rgba(30, 40, 64, 0.8)')) {
     content = content.replace(/'rgba\(30, 40, 64, 0.8\)'/g, "COLORS.bgElevated");
     changed = true;
  }
  if (content.includes('rgba(255,255,255,0.05)')) {
     content = content.replace(/'rgba\(255,255,255,0.05\)'/g, "COLORS.cardInnerBorder");
     changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Refactored:', file);
  }
});
