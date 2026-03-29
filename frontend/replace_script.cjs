const fs = require('fs');
const path = require('path');

const targetFile = 'c:\\Users\\ASUS\\Documents\\AI-Powered_E-Channeling\\frontend\\src\\pages\\PatientBookAppointment.jsx';

let content = fs.readFileSync(targetFile, 'utf8');

// 1. Fix duplicated lucide-react import
content = content.replace(/\} from 'lucide-react';\r?\n\} from 'lucide-react';/g, "} from 'lucide-react';");

// 2. Add CustomCalendar import
content = content.replace("import useAuthStore from '../store/authStore';", "import useAuthStore from '../store/authStore';\nimport CustomCalendar from '../components/CustomCalendar';");

// 3. Add useSearchParams to BookingModal and set initial date state
content = content.replace("const [date, setDate] = useState('');", "const [searchParams] = useSearchParams();\n    const [date, setDate] = useState(searchParams.get('date') || '');");

// 4. Replace native date input with CustomCalendar Component
const oldPickerRegex = /<input type="date" min=\{today\} value=\{date\}[\s\S]*?className="input-field w-full" \/>/;
const newPicker = `<CustomCalendar 
                                    className="mb-2 shadow-sm border border-slate-200"
                                    selectedDate={date}
                                    minDate={new Date()}
                                    onSelectDate={d => {
                                        const y = d.getFullYear();
                                        const m = String(d.getMonth() + 1).padStart(2, '0');
                                        const day = String(d.getDate()).padStart(2, '0');
                                        setDate(\`\${y}-\${m}-\${day}\`); 
                                        setSlot(''); 
                                        setError('');
                                    }}
                                />`;

content = content.replace(oldPickerRegex, newPicker);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Update Complete');
