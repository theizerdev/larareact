const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, '..', 'lang', 'ar.json');
const esPath = path.join(__dirname, '..', 'lang', 'es.json');

const arJson = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const esJson = JSON.parse(fs.readFileSync(esPath, 'utf8'));

const newArTranslations = {
  "Access Control Middleware Unavailable": "البرمجيات الوسيطة للتحكم في الوصول غير متوفرة",
  "Access cards registered in the Access Control middleware (read-only).": "بطاقات الوصول المسجلة في البرمجيات الوسيطة للتحكم في الوصول (للقراءة فقط).",
  "Audit log of ANPR license plate reads from the Access Control middleware (read-only).": "سجل تدقيق قراءات لوحات المركبات (ANPR) من البرمجيات الوسيطة للتحكم في الوصول (للقراءة فقط).",
  "Audit log of pedestrian access events from the Access Control middleware (read-only).": "سجل تدقيق أحداث وصول المشاة من البرمجيات الوسيطة للتحكم في الوصول (للقراءة فقط).",
  "Camera IP": "عنوان IP للكاميرا",
  "Card No.": "رقم البطاقة",
  "Card Type": "نوع البطاقة",
  "Cards": "البطاقات",
  "Color": "اللون",
  "Confidence": "نسبة الدقة",
  "Created": "تاريخ الإنشاء",
  "Date/Time": "التاريخ / الوقت",
  "Door": "الباب",
  "Employee No.": "الرقم الوظيفي",
  "Employees registered in the Access Control middleware (read-only).": "الموظفون المسجلون في البرمجيات الوسيطة للتحكم في الوصول (للقراءة فقط).",
  "Exact employee number": "الرقم الوظيفي بدقة",
  "Faces": "الوجوه",
  "Identity Match": "تطابق الهوية",
  "Include Deleted": "تضمين المحذوفة",
  "Include System Accounts": "تضمين حسابات النظام",
  "Include System Events": "تضمين أحداث النظام",
  "Last Seen": "آخر ظهور",
  "Leader Card": "بطاقة رئيسية",
  "List Type": "نوع القائمة",
  "No": "لا",
  "No access cards found": "لم يتم العثور على بطاقات وصول",
  "No access cards were returned by the Access Control middleware.": "لم يتم إرجاع أي بطاقات وصول من البرمجيات الوسيطة للتحكم في الوصول.",
  "No access events found": "لم يتم العثور على أحداث وصول",
  "No employees were returned by the Access Control middleware.": "لم يتم إرجاع أي موظفين من البرمجيات الوسيطة للتحكم في الوصول.",
  "No pedestrian access events were returned by the Access Control middleware.": "لم يتم إرجاع أي أحداث وصول مشاة من البرمجيات الوسيطة للتحكم في الوصول.",
  "No plate reading events were returned by the Access Control middleware.": "لم يتم إرجاع أي أحداث لقراءة اللوحات من البرمجيات الوسيطة للتحكم في الوصول.",
  "No vehicle access events found": "لم يتم العثور على أحداث وصول مركبات",
  "No vehicles found": "لم يتم العثور على أي مركبات",
  "No vehicles were returned by the Access Control middleware.": "لم يتم إرجاع أي مركبات من البرمجيات الوسيطة للتحكم في الوصول.",
  "Only Identity Matches": "تطابقات الهوية فقط",
  "Person": "الشخص",
  "Photo unavailable.": "الصورة غير متوفرة.",
  "Photos": "الصور",
  "Plate Number": "رقم اللوحة",
  "Registered": "مسجل",
  "Search by card or employee number": "البحث برقم البطاقة أو الرقم الوظيفي",
  "Search by name, employee number or type": "البحث بالاسم، الرقم الوظيفي أو النوع",
  "Search by name, employee or card number": "البحث بالاسم، الرقم الوظيفي أو رقم البطاقة",
  "Search by plate": "البحث برقم اللوحة",
  "Search by plate, brand or employee number": "البحث باللوحة، العلامة التجارية أو الرقم الوظيفي",
  "Search by plate, camera, list type or direction": "البحث باللوحة، الكاميرا، نوع القائمة أو الاتجاه",
  "Terminal": "جهاز الوصول",
  "User Type": "نوع المستخدم",
  "Validity": "الصلاحية",
  "Vehicle": "المركبة",
  "Vehicle directory detected by ANPR cameras and registered vehicles from the Access Control middleware (read-only).": "دليل المركبات المكتشفة بواسطة كاميرات ANPR والمركبات المسجلة من البرمجيات الوسيطة للتحكم في الوصول (للقراءة فقط).",
  "Verify Mode": "وضع التحقق",
  "View Photo": "عرض الصورة",
  "Yes": "نعم",
  "e.g. 192.168.1.10": "مثال: 192.168.1.10"
};

const newEsTranslations = {
  "Last Seen": "Última vez visto",
  "Registered": "Registrado",
  "Vehicle directory detected by ANPR cameras and registered vehicles from the Access Control middleware (read-only).": "Directorio de vehículos detectados por cámaras ANPR y vehículos registrados en el middleware de Control de Acceso (solo lectura)."
};

let arAdded = 0;
for (const [k, v] of Object.entries(newArTranslations)) {
  if (arJson[k] === undefined) {
    arJson[k] = v;
    arAdded++;
  }
}

let esAdded = 0;
for (const [k, v] of Object.entries(newEsTranslations)) {
  if (esJson[k] === undefined) {
    esJson[k] = v;
    esAdded++;
  }
}

fs.writeFileSync(arPath, JSON.stringify(arJson, null, 4), 'utf8');
fs.writeFileSync(esPath, JSON.stringify(esJson, null, 4), 'utf8');

console.log(`Added ${arAdded} keys to ar.json`);
console.log(`Added ${esAdded} keys to es.json`);
