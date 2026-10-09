import { XmlElementOptions } from '../types/index.js';
import { METADATA_KEYS } from './constants.js';

/**
 * Decorator to map a class property to an XML child element.
 * 
 * @param elementName - The optional custom name for the XML element. Defaults to the property name.
 * @example
 * \@XmlElement('FirstName')
 * public name!: string;
 */
export function XmlElement<T, V>(nameOrOptions?: string | XmlElementOptions) 
{
    return function (_value: undefined, context: ClassFieldDecoratorContext<T, V>)
    {
        const nomPropriete = context.name.toString();

        let elementName = nomPropriete;
        let targetType: (new () => any) | undefined;

        if (typeof nameOrOptions === 'string')
        {
            elementName = nameOrOptions;
        } 
        else if (nameOrOptions)
        {
            elementName = nameOrOptions.name ?? nomPropriete;
            targetType = nameOrOptions.type;
        }

        const elements = (context.metadata[METADATA_KEYS.ELEMENTS] as Record<string, string>) ?? {};
        elements[nomPropriete] = elementName;
        context.metadata[METADATA_KEYS.ELEMENTS] = elements;

        if (targetType)
        {
            const elementTypes = (context.metadata[METADATA_KEYS.ELEMENT_TYPES] as Record<string, new () => any>) ?? {};
            elementTypes[nomPropriete] = targetType;
            context.metadata[METADATA_KEYS.ELEMENT_TYPES] = elementTypes;
        }
    };
}