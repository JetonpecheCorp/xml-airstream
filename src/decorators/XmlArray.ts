// XmlArray.ts
import { XmlArrayOptions } from '../types/index.js';
import { METADATA_KEYS } from './constants.js';

export function XmlArray<T, V>(options: XmlArrayOptions) 
{
    return function (_value: undefined, context: ClassFieldDecoratorContext<T, V>) {
        const nomPropriete = context.name.toString();
        
        const tableauOption = (context.metadata[METADATA_KEYS.ARRAYS] as Record<string, XmlArrayOptions>) ?? {};
        
        tableauOption[nomPropriete] = options;
        context.metadata[METADATA_KEYS.ARRAYS] = tableauOption;
    };
}