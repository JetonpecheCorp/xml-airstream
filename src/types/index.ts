/**
 * Configuration options for XML parsing and stringifying.
 */
export interface XmlOptions 
{
    /**
     * If `true`, the generated XML string will be formatted with indentation and line breaks.
     * Default is `false`.
     */
    format?: boolean;

    /**
     * The character encoding used to decode the binary stream or buffer (e.g., 'utf-8', 'iso-8859-1').
     * Default is `'utf-8'`.
     */
    encoding?: string;

    /**
     * If `true`, all XML attributes will be completely ignored during parsing and stringifying.
     * Default is `false`.
     */
    ignoreAttributes?: boolean;

    /**
         * An array of custom string values that should be evaluated as boolean `true` during deserialization.
         * The evaluation is case-insensitive and trims whitespace.
         * If not provided, the default behavior only considers `'true'` and `'1'` as true.
         * 
         * @example
         * trueValues: ['yes', 'oui', 'y', '1', 'true', 'vrai']
         */
    trueValues?: string[]
}

/**
 * Configuration options for the @XmlElement decorator.
 */
export interface XmlElementOptions<T = any>
{
    /**
     * The explicit name of the XML tag. If omitted, the class property name is used.
     */
    name?: string;

    /**
     * The class constructor to instantiate for nested objects.
     */
    type?: new () => T;

    /**
     * A function to transform the value when reading from XML to the JS object.
     * @param value The raw value parsed from the XML.
     * @returns The transformed value to store in the class instance.
     */
    transformRead?: (value: any) => any;

    /**
     * A function to transform the value when writing from the JS object to XML.
     * @param value The current value in the class instance.
     * @returns The transformed value to inject into the generated XML.
     */
    transformWrite?: (value: any) => any;
}

/**
 * Configuration options for the @XmlValue decorator.
 */
export interface XmlValueOptions 
{
    /**
     * A function to transform the inner text value when reading from XML (e.g., trimming whitespace).
     */
    transformRead?: (value: any) => any;

    /**
     * A function to transform the inner text value before writing it to XML.
     */
    transformWrite?: (value: any) => any;
}

/**
 * Configuration options for the @XmlIgnore decorator to allow conditional ignoring.
 */
export interface XmlIgnoreOptions 
{
    /**
     * A condition evaluated during XML parsing. If it returns `true`, the incoming XML value is ignored.
     * @param value The raw value from the XML.
     * @returns `true` to ignore the property, `false` to keep it.
     */
    ignoreRead?: (value: any) => boolean;

    /**
     * A condition evaluated during XML serialization. If it returns `true`, the property is omitted from the output XML.
     * @param value The current value of the property in the instance.
     * @returns `true` to skip writing this property, `false` to write it.
     */
    ignoreWrite?: (value: any) => boolean;
}

/**
 * Configuration options for the @XmlAttribute decorator.
 */
export interface XmlAttributeOptions
{
    /**
     * The explicit name of the XML attribute. If omitted, the class property name is used.
     */
    name?: string;

    /**
     * A function to transform the attribute value when reading from XML.
     */
    transformRead?: (value: any) => any;

    /**
     * A function to transform the attribute value when writing to XML.
     */
    transformWrite?: (value: any) => any;
}

/**
 * Configuration options for the @XmlArray decorator.
 */
export interface XmlArrayOptions<T = any>
{
    /**
     * The optional wrapper tag name that encloses the entire list (e.g., `<Items>`).
     */
    rootName?: string;

    /**
     * The mandatory tag name for each individual element in the array (e.g., `<Product>`).
     */
    itemName: string;

    /**
     * The class constructor to instantiate for each item in the array.
     */
    itemType?: new () => T;

    /**
     * A function to transform the entire array after reading from XML (e.g., for filtering).
     * @param value The parsed array.
     * @returns The transformed array.
     */
    transformRead?: (value: any[]) => any[];

    /**
     * A function to transform the entire array before writing to XML (e.g., for limiting output).
     * @param value The current array in the class instance.
     * @returns The transformed array to serialize.
     */
    transformWrite?: (value: any[]) => any[];
}

/**
 * Options required to send an XML payload to an API.
 */
export interface ApiSendOptions 
{
    /** The HTTP method to use. Defaults to 'POST'. */
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';

    /** Custom headers to attach to the request. */
    headers?: Record<string, string>;

    /** Bearer token for authentication, if required. */
    token?: string;
}

/**
 * Represents high-performance input types for the XML parser.
 * Avoids loading massive strings into memory by favoring binary buffers or streams.
 */
export type XmlInput = Uint8Array | ArrayBuffer | ReadableStream<Uint8Array>;

/**
 * Represents a generic JSON structure mapped from or to an XML document.
 */
export type JsonNode = Record<string, any>;