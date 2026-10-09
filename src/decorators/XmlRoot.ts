import { METADATA_KEYS } from './constants.js';

/**
 * Decorator to map a class to an XML root element.
 * 
 * @param tagName - The name of the XML root tag.
 * @example
 * \@XmlRoot('Organization')
 * class Organization {}
 */
export function XmlRoot(tagName: string) 
{
    return function <T extends new (...args: any[]) => any>(
        _value: T,
        context: ClassDecoratorContext<T>
    ) 
    {   
        // On stocke le nom de la balise racine au niveau de la classe.
        context.metadata[METADATA_KEYS.ROOT] = tagName;
    };
}