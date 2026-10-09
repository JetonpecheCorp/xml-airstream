import { METADATA_KEYS } from './constants.js';

/**
 * Decorator to map a class property to the inner text value of an XML element.
 * Crucial when an XML node contains both attributes and a text node.
 * 
 * @example
 * \@XmlValue()
 * public amount!: number;
 */
export function XmlValue<T, V>() 
{
    return function (_value: undefined, context: ClassFieldDecoratorContext<T, V>) 
    {   
        // Une balise ne peut avoir qu'une seule valeur textuelle brute.
        // On stocke donc simplement le nom de la propriété qui la contiendra.
        context.metadata[METADATA_KEYS.VALUE] = context.name.toString();
    };
}