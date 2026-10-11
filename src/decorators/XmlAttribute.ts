import { XmlAttributeOptions } from '../types/index.js';
import { METADATA_KEYS } from './constants.js';

/**
 * Decorator to map a class property to an XML attribute of the parent element.
 * 
 * @param attributeName - The optional custom name for the XML attribute. Defaults to the property name.
 * @example
 * \@XmlAttribute('id')
 * public userId!: number;
 */
export function XmlAttribute<T, V>(nameOrOptions: string | XmlAttributeOptions)
{
    return function (_value: undefined, context: ClassFieldDecoratorContext<T, V>)
    {
        const nomPropriete = context.name.toString();

        let nomAttribut = nomPropriete;
        if (typeof nameOrOptions === 'string')
        {
            nomAttribut = nameOrOptions;
        } 
        else if (nameOrOptions && nameOrOptions.name)
        {
            nomAttribut = nameOrOptions.name;
        }

        const attributs = (context.metadata[METADATA_KEYS.ATTRIBUTES] as Record<string, string>) ?? {};
        attributs[nomPropriete] = nomAttribut;
        context.metadata[METADATA_KEYS.ATTRIBUTES] = attributs;

        // Sauvegarde des transformations
        if (typeof nameOrOptions === 'object' && (nameOrOptions.transformRead || nameOrOptions.transformWrite))
        {
            const transforms = (context.metadata[METADATA_KEYS.TRANSFORMS] as Record<string, any>) ?? {};
            transforms[nomPropriete] = {
                read: nameOrOptions.transformRead,
                write: nameOrOptions.transformWrite
            };
            context.metadata[METADATA_KEYS.TRANSFORMS] = transforms;
        }
    };
}