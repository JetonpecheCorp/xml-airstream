import { METADATA_KEYS } from './constants.js';

/**
 * Decorator to map a class property to an XML attribute of the parent element.
 * 
 * @param attributeName - The optional custom name for the XML attribute. Defaults to the property name.
 * @example
 * \@XmlAttribute('id')
 * public userId!: number;
 */
export function XmlAttribute<T, V>(attributeName?: string) 
{
    return function (_value: undefined, context: ClassFieldDecoratorContext<T, V>) 
    {   
        const nomPropriete = context.name.toString();
        
        // Dictionnaire des attributs (ex: { userId: 'id' }).
        const attributes = (context.metadata[METADATA_KEYS.ATTRIBUTES] as Record<string, string>) ?? {};
        
        attributes[nomPropriete] = attributeName ?? nomPropriete;
        context.metadata[METADATA_KEYS.ATTRIBUTES] = attributes;
    };
}