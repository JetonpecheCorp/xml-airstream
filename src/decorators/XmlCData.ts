import { METADATA_KEYS } from './constants.js';

/**
 * Decorator that marks a class property to be serialized as an XML CDATA section (`<![CDATA[ ... ]]>`).
 * 
 * When applied, the XML stringifier will not escape special characters (such as `<`, `>`, `&`) 
 * for this property, and will instead wrap the raw string value inside a CDATA block.
 * During parsing, the XML lexer will safely extract the content inside the CDATA block as pure text.
 * 
 * @example
 * class Article {
 *     \@XmlElement('HtmlContent')
 *     \@XmlCData()
 *     public content: string = '<div>Raw HTML with < and ></div>';
 * }
 */
export function XmlCData<T, V>()
{
    return function (_value: undefined, context: ClassFieldDecoratorContext<T, V>)
    {
        const cdataProps = (context.metadata[METADATA_KEYS.CDATA] as Set<string>) ?? new Set<string>();
        cdataProps.add(context.name.toString());
        context.metadata[METADATA_KEYS.CDATA] = cdataProps;
    };
}