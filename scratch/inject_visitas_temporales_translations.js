import fs from 'fs';
import path from 'path';

const arPath = path.resolve('lang/ar.json');
const esPath = path.resolve('lang/es.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

const translations = {
    'Access Details': {
        ar: 'تفاصيل الوصول',
        es: 'Detalles de acceso'
    },
    'Add New Service Type': {
        ar: 'إضافة نوع خدمة جديد',
        es: 'Agregar nuevo tipo de servicio'
    },
    'Additional Details': {
        ar: 'تفاصيل إضافية',
        es: 'Detalles adicionales'
    },
    'Authorization & Motive': {
        ar: 'التصريح والغرض',
        es: 'Autorización y motivo'
    },
    'Authorized by:': {
        ar: 'مصرح من:',
        es: 'Autorizado por:'
    },
    'Bold': {
        ar: 'عريض',
        es: 'Negrita'
    },
    'Bulleted List': {
        ar: 'قائمة نقطية',
        es: 'Lista con viñetas'
    },
    'Check-In Date': {
        ar: 'تاريخ الدخول',
        es: 'Fecha de ingreso'
    },
    'Edit Temporary Visit': {
        ar: 'تعديل الزيارة المؤقتة',
        es: 'Editar visita temporal'
    },
    'Employee to Visit': {
        ar: 'الموظف المراد زيارته',
        es: 'Empleado a visitar'
    },
    'Enter new service type...': {
        ar: 'أدخل نوع الخدمة الجديد...',
        es: 'Ingrese nuevo tipo de servicio...'
    },
    'Enter visitor details, motive and host to send a quick registration invitation via WhatsApp.': {
        ar: 'أدخل بيانات الزائر والغرض والمضيف لإرسال دعوة تسجيل سريع عبر واتساب.',
        es: 'Ingrese los datos del visitante, el motivo, y a quién visita para enviar una invitación de registro rápido a su WhatsApp.'
    },
    'Failed to create service type.': {
        ar: 'فشل في إنشاء نوع الخدمة.',
        es: 'Error al crear el tipo de servicio.'
    },
    'Fast Delivery': {
        ar: 'توصيل سريع',
        es: 'Entrega rápida'
    },
    'Image': {
        ar: 'صورة',
        es: 'Imagen'
    },
    'Italic': {
        ar: 'مائل',
        es: 'Cursiva'
    },
    'Link': {
        ar: 'رابط',
        es: 'Enlace'
    },
    'Manage, register and audit temporary visitor entries and check-outs.': {
        ar: 'إدارة وتسجيل وتدقيق دخول وخروج الزوار المؤقتين.',
        es: 'Administre, registre y audite los ingresos y salidas de visitas temporales.'
    },
    'New Visit': {
        ar: 'زيارة جديدة',
        es: 'Nueva visita'
    },
    'No Department': {
        ar: 'بدون قسم',
        es: 'Sin departamento'
    },
    'No Position': {
        ar: 'بدون منصب',
        es: 'Sin cargo'
    },
    'No matches found': {
        ar: 'لم يتم العثور على نتائج',
        es: 'No se encontraron coincidencias'
    },
    'No temporary visits found': {
        ar: 'لم يتم العثور على زيارات مؤقتة',
        es: 'No se encontraron visitas temporales'
    },
    'No webcam access or camera not found': {
        ar: 'لا يمكن الوصول إلى كاميرا الويب أو لم يتم العثور عليها',
        es: 'Sin acceso a la cámara web o cámara no encontrada'
    },
    'Numbered List': {
        ar: 'قائمة مرقمة',
        es: 'Lista numerada'
    },
    'Phone Number': {
        ar: 'رقم الهاتف',
        es: 'Número de teléfono'
    },
    'Photo': {
        ar: 'الصورة',
        es: 'Foto'
    },
    'Please enter visitor details, the authorizing manager and specify access date and time range.': {
        ar: 'يرجى إدخال بيانات الزائر والمسؤول المفوض وتحديد نطاق تاريخ ووقت الدخول.',
        es: 'Por favor ingrese los datos del visitante, el responsable que autoriza y especifique el rango de fecha y hora de acceso.'
    },
    'Please verify the fields and try again.': {
        ar: 'يرجى التحقق من الحقول والمحاولة مرة أخرى.',
        es: 'Por favor verifique los campos e intente de nuevo.'
    },
    'Please verify the form fields.': {
        ar: 'يرجى التحقق من حقول النموذج.',
        es: 'Por favor verifique los campos del formulario.'
    },
    'Register First Visit': {
        ar: 'تسجيل أول زيارة',
        es: 'Registrar primera visita'
    },
    'Register Temporary Visit': {
        ar: 'تسجيل زيارة مؤقتة',
        es: 'Registrar visita temporal'
    },
    'Retake': {
        ar: 'إعادة الالتقاط',
        es: 'Repetir captura'
    },
    'SUSPENDED': {
        ar: 'معلق',
        es: 'SUSPENDIDOS'
    },
    'Search Employee to Visit': {
        ar: 'البحث عن الموظف المراد زيارته',
        es: 'Buscar empleado a visitar'
    },
    'Search Visitor': {
        ar: 'البحث عن زائر',
        es: 'Buscar visitante'
    },
    'Search by name, ID...': {
        ar: 'البحث بالاسم، الهوية...',
        es: 'Buscar por nombre, documento...'
    },
    'Select a service type...': {
        ar: 'اختر نوع الخدمة...',
        es: 'Seleccione un tipo de servicio...'
    },
    'Service Type': {
        ar: 'نوع الخدمة',
        es: 'Tipo de servicio'
    },
    'Service type added successfully.': {
        ar: 'تمت إضافة نوع الخدمة بنجاح.',
        es: 'Tipo de servicio agregado exitosamente.'
    },
    'Set Active': {
        ar: 'تعيين كنشط',
        es: 'Marcar como activo'
    },
    'Set Suspended': {
        ar: 'تعيين كمعلق',
        es: 'Marcar como suspendido'
    },
    'Set Under Review': {
        ar: 'تعيين تحت المراجعة',
        es: 'Marcar en revisión'
    },
    'Specify Reason for Visit': {
        ar: 'حدد سبب الزيارة',
        es: 'Especifique el motivo de la visita'
    },
    'TOTAL VISITS': {
        ar: 'إجمالي الزيارات',
        es: 'TOTAL VISITAS'
    },
    'Temporary visit log deleted successfully.': {
        ar: 'تم حذف سجل الزيارة المؤقتة بنجاح.',
        es: 'Registro de visita temporal eliminado exitosamente.'
    },
    'Temporary visit log deleted.': {
        ar: 'تم حذف سجل الزيارة المؤقتة.',
        es: 'Registro de visita temporal eliminado.'
    },
    'Temporary visit registered successfully.': {
        ar: 'تم تسجيل الزيارة المؤقتة بنجاح.',
        es: 'Visita temporal registrada exitosamente.'
    },
    'Temporary visit updated successfully.': {
        ar: 'تم تحديث الزيارة المؤقتة بنجاح.',
        es: 'Visita temporal actualizada exitosamente.'
    },
    'The image must not exceed 3MB.': {
        ar: 'يجب ألا يتجاوز حجم الصورة 3 ميغابايت.',
        es: 'La imagen no debe superar los 3MB.'
    },
    'The selected employee does not belong to your branch.': {
        ar: 'الموظف المختار لا ينتمي إلى فرعك.',
        es: 'El empleado seleccionado no pertenece a su sucursal.'
    },
    'The selected host does not belong to your branch.': {
        ar: 'المضيف المختار لا ينتمي إلى فرعك.',
        es: 'El anfitrión seleccionado no pertenece a su sucursal.'
    },
    'This action cannot be undone. This will permanently delete the temporary visit entry from the database.': {
        ar: 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف سجل الزيارة المؤقتة نهائيًا من قاعدة البيانات.',
        es: 'Esta acción no se puede deshacer. Se eliminará permanentemente el registro de visita temporal de la base de datos.'
    },
    'Trade Name / Company': {
        ar: 'الاسم التجاري / الشركة',
        es: 'Nombre comercial / Empresa'
    },
    'Type a name to search...': {
        ar: 'اكتب اسمًا للبحث...',
        es: 'Escriba un nombre para buscar...'
    },
    'Type of Service': {
        ar: 'نوع الخدمة',
        es: 'Tipo de servicio'
    },
    'UNDER REVIEW': {
        ar: 'قيد المراجعة',
        es: 'EN REVISIÓN'
    },
    'Underline': {
        ar: 'تسطير',
        es: 'Subrayado'
    },
    'Visit Pre-registration': {
        ar: 'التسجيل المسبق للزيارة',
        es: 'Pre-registro de visita'
    },
    'Visitor': {
        ar: 'الزائر',
        es: 'Visitante'
    },
    'Visitor Information': {
        ar: 'بيانات الزائر',
        es: 'Información del visitante'
    },
    'You have not registered any visits yet.': {
        ar: 'لم تقم بتسجيل أي زيارات بعد.',
        es: 'Aún no ha registrado ninguna visita.'
    },
    'Your account is not assigned to a specific branch, so you cannot register visits. Contact your administrator.': {
        ar: 'حسابك غير مخصص لفرع محدد، لذا لا يمكنك تسجيل الزيارات. اتصل بالمسؤول.',
        es: 'Su cuenta no está asignada a una sucursal específica, por lo que no puede registrar visitas. Comuníquese con su administrador.'
    },
    'e.g. DHL, PedidosYa, etc.': {
        ar: 'مثال: DHL، طلبات، إلخ',
        es: 'Ej: DHL, PedidosYa, etc.'
    },
    'e.g. Technical visit, interview...': {
        ar: 'مثال: زيارة فنية، مقابلة...',
        es: 'Ej: Visita técnica, entrevista...'
    },
    'e.g., Maintenance, Interview, Meeting...': {
        ar: 'مثال: صيانة، مقابلة، اجتماع...',
        es: 'Ej: Mantenimiento, entrevista, reunión...'
    }
};

let arCount = 0;
let esCount = 0;

for (const [key, val] of Object.entries(translations)) {
    if (!ar[key]) {
        ar[key] = val.ar;
        arCount++;
    }
    if (!es[key]) {
        es[key] = val.es;
        esCount++;
    }
}

fs.writeFileSync(arPath, JSON.stringify(ar, null, 4), 'utf8');
fs.writeFileSync(esPath, JSON.stringify(es, null, 4), 'utf8');

console.log(`Injected ${arCount} keys into ar.json`);
console.log(`Injected ${esCount} keys into es.json`);
