/**
 * Represents the type of an XML token emitted by the Lexer.
 */
export type XmlTokenType = 'OpenTag' | 'CloseTag' | 'Text';

/**
 * Represents a discrete chunk of XML data.
 */
export interface XmlToken 
{
    type: XmlTokenType;
    name?: string;
    value?: string;
    attributes?: Record<string, string>;
    isSelfClosing?: boolean;
}