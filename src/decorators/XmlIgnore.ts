import { METADATA_KEYS } from './constants.js';

/**
 * Decorator to prevent a class property from being serialized to or deserialized from XML.
 * Ideal for internal state, computed properties, or sensitive data.
 * 
 * @example
 * \@XmlIgnore()
 * public internalState: boolean = false;
 */
export function XmlIgnore<T, V>() 
{
    return function (_value: undefined, context: ClassFieldDecoratorContext<T, V>) 
    {
        // stock la liste des propriétés à ignorer pour une recherche ultra-rapide en O(1).
        const metaDataIgnorer = (context.metadata[METADATA_KEYS.IGNORE] as Set<string>) ?? new Set<string>();
        
        metaDataIgnorer.add(context.name.toString());
        context.metadata[METADATA_KEYS.IGNORE] = metaDataIgnorer;
    };
}