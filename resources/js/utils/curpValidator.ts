/**
 * Utilidad de Validación Oficial de CURP (RENAPO México)
 */

export interface CurpValidationResult {
    isValid: boolean;
    error?: string;
    datos?: {
        fechaNacimiento?: string; // YYYY-MM-DD
        sexo?: 'M' | 'F';
        entidadNacimiento?: string;
        entidadNombre?: string;
    };
}

const ENTIDADES_FEDERATIVAS: Record<string, string> = {
    AS: 'Aguascalientes',
    BC: 'Baja California',
    BS: 'Baja California Sur',
    CC: 'Campeche',
    CL: 'Coahuila',
    CM: 'Colima',
    CS: 'Chiapas',
    CH: 'Chihuahua',
    DF: 'Ciudad de México',
    DG: 'Durango',
    GT: 'Guanajuato',
    GR: 'Guerrero',
    HG: 'Hidalgo',
    JC: 'Jalisco',
    MC: 'Estado de México',
    MN: 'Michoacán',
    MS: 'Morelos',
    NT: 'Nayarit',
    NL: 'Nuevo León',
    OC: 'Oaxaca',
    PL: 'Puebla',
    QT: 'Querétaro',
    QR: 'Quintana Roo',
    SP: 'San Luis Potosí',
    SL: 'Sinaloa',
    SR: 'Sonora',
    TC: 'Tabasco',
    TS: 'Tamaulipas',
    TL: 'Tlaxcala',
    VZ: 'Veracruz',
    YN: 'Yucatán',
    ZS: 'Zacatecas',
    NE: 'Nacido en el Extranjero',
};

const DICTIONARY = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

/**
 * Valida la estructura, formato y algoritmo matemático del dígito verificador del CURP.
 */
export function validarCurp(curp: string): CurpValidationResult {
    if (!curp) {
        return { isValid: false, error: 'La CURP no puede estar vacía.' };
    }

    const cleanCurp = curp.trim().toUpperCase();

    if (cleanCurp.length !== 18) {
        return { isValid: false, error: `La CURP debe tener exactamente 18 caracteres (actualmente tiene ${cleanCurp.length}).` };
    }

    // RegEx Oficial RENAPO
    const regex = /^[A-Z]{4}\d{6}[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;

    if (!regex.test(cleanCurp)) {
        return { isValid: false, error: 'El formato o estructura de la CURP es inválido.' };
    }

    // Validar algoritmo del Dígito Verificador (Caracter 18)
    let sum = 0;
    for (let i = 0; i < 17; i++) {
        const char = cleanCurp[i];
        const pos = DICTIONARY.indexOf(char);
        if (pos === -1) {
            return { isValid: false, error: `Carácter no válido '${char}' en la CURP.` };
        }
        sum += pos * (18 - i);
    }

    const digit = (10 - (sum % 10)) % 10;
    const expectedDigit = parseInt(cleanCurp[17], 10);

    if (digit !== expectedDigit) {
        return { isValid: false, error: 'El dígito verificador de la CURP no coincide.' };
    }

    // Extraer fecha de nacimiento y entidad
    const yy = cleanCurp.substring(4, 6);
    const mm = cleanCurp.substring(6, 8);
    const dd = cleanCurp.substring(8, 10);
    const sexoCode = cleanCurp[10] as 'H' | 'M';
    const entidadCode = cleanCurp.substring(11, 13);
    const homoclaveChar = cleanCurp[16];

    // Determinar siglo (si el caracter 17 es número 0-9 = siglo 1900, si es letra A-Z = siglo 2000)
    const siglo = isNaN(parseInt(homoclaveChar, 10)) ? '20' : '19';
    const fechaNacimiento = `${siglo}${yy}-${mm}-${dd}`;

    return {
        isValid: true,
        datos: {
            fechaNacimiento,
            sexo: sexoCode === 'H' ? 'M' : 'F',
            entidadNacimiento: entidadCode,
            entidadNombre: ENTIDADES_FEDERATIVAS[entidadCode] || entidadCode,
        },
    };
}
