/**
 * Configuration options for XML parsing and stringifying.
 */
export interface XmlOptions 
{
    /** Whether to pretty-print the generated XML. Defaults to false. */
    format?: boolean;

    /** The encoding of the XML document. Defaults to 'UTF-8'. */
    encoding?: string;

    /** Ignore XML attributes during parsing or JSON conversion. Defaults to false. */
    ignoreAttributes?: boolean;

    /**
     * An array of custom string values that should be evaluated as boolean `true` during deserialization.
     * The evaluation is case-insensitive and trims whitespace.
     * If not provided, the default behavior only considers `'true'` and `'1'` as true.
     * 
     * @default  ['true', '1']
     * 
     * @example
     * trueValues: ['yes', 'oui', 'y', '1', 'true', 'vrai']
     */
    trueValues?: string[]
}

export interface XmlElementOptions<T = any>
{
    name?: string;
    type?: new () => T;
}

export interface XmlArrayOptions<T = any> 
{
    rootName?: string; 
    itemName: string;
    itemType?: new () => T;
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