const fs = require('fs');

const file = '/Users/thuva/Documents/GitHub/AI-Powered_E-Channeling/mobile/app/(patient)/profile.jsx';
let content = fs.readFileSync(file, 'utf8');

// The renderField function in patient profile.jsx starts at function renderField( and ends before const getStyles.
// We can extract it and inject it inside the component.

const funcMatch = content.match(/function renderField\([\s\S]*?\n\}/);
if (funcMatch) {
  const funcStr = funcMatch[0];
  content = content.replace(funcStr, ''); // Remove from bottom

  // Inject inside PatientProfileScreen
  content = content.replace(/(export default function PatientProfileScreen\(\) \{[\s\S]*?const styles = useStyles\(getStyles\);)/, `$1\n\n  ${funcStr.replace(/\n/g, '\n  ')}\n`);
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed profile.jsx');
}
