import { XmlValueOptions } from '../types/index.js';
import { METADATA_KEYS } from './constants.js';

/**
 * Decorator to map a class property to the inner text value of an XML element.
 * Crucial when an XML node contains both attributes and a text node.
 * 
 * @example
 * \@XmlValue({
 *     transformRead: (val: string) => val.trim().toUpperCase()
 * })
 * public amount!: number;
 */
export function XmlValue<T, V>(options?: XmlValueOptions)
{
    return function (_value: undefined, context: ClassFieldDecoratorContext<T, V>) 
    {   
        const nomPropriete = context.name.toString();
        
        // On stocke le nom de la propriété qui contiendra la valeur texte
        context.metadata[METADATA_KEYS.VALUE] = nomPropriete;

        // --- NOUVEAU : Sauvegarde des transformations ---
        if (options && (options.transformRead || options.transformWrite)) {
            const transforms = (context.metadata[METADATA_KEYS.TRANSFORMS] as Record<string, any>) ?? {};
            transforms[nomPropriete] = {
                read: options.transformRead,
                write: options.transformWrite
            };
            context.metadata[METADATA_KEYS.TRANSFORMS] = transforms;
        }
    };
}