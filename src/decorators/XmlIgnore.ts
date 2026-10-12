import { XmlIgnoreOptions } from '../types/index.js';
import { METADATA_KEYS } from './constants.js';

/**
 * Decorator to ignore a property during serialization and/or deserialization.
 * Can be unconditional or based on a dynamic condition.
 */
export function XmlIgnore<T, V>(options?: XmlIgnoreOptions) 
{
    return function (_value: undefined, context: ClassFieldDecoratorContext<T, V>) 
    {
        const nomPropriete = context.name.toString();

        if (options && (options.ignoreRead || options.ignoreWrite))
        {
            // Ignorer de façon conditionnelle
            const conditions = (context.metadata[METADATA_KEYS.IGNORE_CONDITIONS] as Record<string, XmlIgnoreOptions>) ?? {};
            conditions[nomPropriete] = options;
            context.metadata[METADATA_KEYS.IGNORE_CONDITIONS] = conditions;
        } 
        else
        {
            // Ignorer de façon absolue (par défaut)
            const ignores = (context.metadata[METADATA_KEYS.IGNORE] as Set<string>) ?? new Set<string>();
            ignores.add(nomPropriete);
            context.metadata[METADATA_KEYS.IGNORE] = ignores;
        }
    };
}