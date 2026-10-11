// XmlArray.ts
import { XmlArrayOptions } from '../types/index.js';
import { METADATA_KEYS } from './constants.js';

export function XmlArray<T, V>(options: XmlArrayOptions)
{
    return function (_value: undefined, context: ClassFieldDecoratorContext<T, V>)
    {
        const nomPropriete = context.name.toString();

        const arrays = (context.metadata[METADATA_KEYS.ARRAYS] as Record<string, XmlArrayOptions>) ?? {};
        arrays[nomPropriete] = options;
        context.metadata[METADATA_KEYS.ARRAYS] = arrays;

        // Sauvegarde des transformations
        if (options.transformRead || options.transformWrite) 
        {
            const transforms = (context.metadata[METADATA_KEYS.TRANSFORMS] as Record<string, any>) ?? {};
            transforms[nomPropriete] = {
                read: options.transformRead,
                write: options.transformWrite
            };
            context.metadata[METADATA_KEYS.TRANSFORMS] = transforms;
        }
    };
}