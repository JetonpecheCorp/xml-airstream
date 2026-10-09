(Symbol as any).metadata ??= Symbol.for('Symbol.metadata');

// Définition des clés utilisées pour stocker et récupérer les métadonnées dans context.metadata.
// L'utilisation de symboles ou de chaînes uniques évite les collisions avec d'autres librairies.
export const METADATA_KEYS = {
    ROOT: 'xml:root',
    ELEMENTS: 'xml:elements',
    ELEMENT_TYPES: 'xml:element_types',
    ATTRIBUTES: 'xml:attributes',
    IGNORE: 'xml:ignore',
    VALUE: 'xml:value',
    ARRAYS: 'xml:arrays',
    CDATA: 'xml:cdata'
} as const;