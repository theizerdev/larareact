interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: string;
}

/**
 * Optimiza y comprime una imagen (File o string base64 DataURL) mediante Canvas HTML5.
 * Reduce las dimensiones manteniendo la relación de aspecto y comprime a calidad ajustada (por defecto 0.8).
 */
export async function compressImage(
    source: File | string,
    options: CompressOptions = {}
): Promise<string> {
    const {
        maxWidth = 1280,
        maxHeight = 1280,
        quality = 0.8,
        mimeType = 'image/jpeg',
    } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();

        const processImage = () => {
            try {
                let width = img.width;
                let height = img.height;

                if (width <= 0 || height <= 0) {
                    // Fallback si no se obtienen dimensiones
                    if (typeof source === 'string') {
                        return resolve(source);
                    }
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(source as File);
                    return;
                }

                // Calcular dimensiones escaladas respetando el aspecto
                if (width > maxWidth || height > maxHeight) {
                    if (width / height > maxWidth / maxHeight) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    if (typeof source === 'string') return resolve(source);
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(source as File);
                    return;
                }

                // Mejorar calidad de escalado en canvas
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.drawImage(img, 0, 0, width, height);

                // Exportar como Data URL comprimido
                const compressedDataUrl = canvas.toDataURL(mimeType, quality);
                resolve(compressedDataUrl);
            } catch (err) {
                console.error('Error al comprimir la imagen:', err);
                reject(err);
            }
        };

        img.onload = processImage;
        img.onerror = (err) => {
            console.error('Error cargando la imagen para compresión:', err);
            if (typeof source === 'string') {
                resolve(source);
            } else {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(source);
            }
        };

        if (typeof source === 'string') {
            img.src = source;
        } else {
            const objectUrl = URL.createObjectURL(source);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                processImage();
            };
            img.src = objectUrl;
        }
    });
}
