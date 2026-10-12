import { XmlOptions, JsonNode, ApiSendOptions, XmlInput } from './types/index.js';
import { Stringifier } from './core/Stringifier.js';
import { JsonConverter } from './core/jsonConverter.js';
import { Lexer } from './core/Lexer.js';
import { Parser } from './core/Parser.js';
import { XmlToken } from './types/lexer.js';

/**
 * High-performance, dependency-free XML processor.
 * Provides capabilities to read, write, convert, save, and send XML data.
 */
export class Xml 
{

    /**
     * Parses an XML binary stream or buffer and instantiates the target class mapping its properties.
     * Uses asynchronous streaming to prevent memory leaks on huge files.
     * 
     * @template T - The type of the class to instantiate.
     * @param input - The binary buffer or readable stream containing the XML data.
     * @param targetClass - The class constructor to map the XML data into.
     * @param options - Parsing configuration (e.g., custom trueValues, ignoreAttributes).
     * @returns A promise resolving to an instance of the target class populated with XML data.
     */
    public static async parse<T>(input: XmlInput, targetClass: { new (): T }, options: XmlOptions = {}): Promise<T> 
    {
        // 1. Obtenir l'AST via la méthode toJson (qui gère le flux de manière performante)
        const ast = await this.toJson(input, options);
        
        // 2. Transformer l'AST en instance de classe
        return JsonConverter.mapToClass(ast, targetClass, options);
    }

    /**
     * Fetches an XML payload from a URL and parses it directly into an instance of the target class.
     * Uses streaming automatically for maximum performance on large network responses.
     * 
     * @template T - The type of the class to instantiate.
     * @param url - The URL to fetch the XML from.
     * @param targetClass - The class constructor to map the XML data into.
     * @param options - Combined HTTP fetch options (RequestInit) and XML parsing options (XmlOptions).
     * @returns A promise resolving to an instance of the target class.
     */
    public static async parseFromUrl<T>(
        url: string | URL, 
        targetClass: { new (): T }, 
        options: XmlOptions & RequestInit = {}
    ): Promise<T> 
    {
        const reponse = await fetch(url, options);

        if (!reponse.ok)
            throw new Error(`Failed to fetch XML from URL: ${reponse.status} ${reponse.statusText}`);

        if (!reponse.body)
            throw new Error("The response body is empty.");

        return this.parse(reponse.body, targetClass, options);
    }

    /**
     * Reads an XML file from the local file system and parses it directly into an instance of the target class.
     * Note: This method uses dynamic imports for Node.js/Bun compatibility 
     * without breaking browser environments.
     * 
     * @template T - The type of the class to instantiate.
     * @param filePath - The absolute or relative path to the XML file.
     * @param targetClass - The class constructor to map the XML data into.
     * @param options - XML parsing configuration.
     * @returns A promise resolving to an instance of the target class.
     */
    public static async parseFromFile<T>(
        filePath: string, 
        targetClass: { new (): T }, 
        options: XmlOptions = {}
    ): Promise<T> 
    {
        try
        {
            // Importation dynamique du module 'fs/promises' (Node.js/Bun)
            const moduleFichier = await import('node:fs/promises');
            
            // Lecture du fichier entier sous forme de Buffer binaire
            const buffer = await moduleFichier.readFile(filePath);
            
            return this.parse(buffer, targetClass, options);
        }
        catch (erreur)
        {
            throw new Error(`Unable to read or parse XML file from '${filePath}'. Detail: ${erreur}`);
        }
    }

    /**
     * Serializes a class instance into an XML string using its decorators.
     * 
     * @param instance - The class instance to serialize.
     * @param options - Stringify configuration (e.g., formatting).
     * @returns The generated XML string.
     */
    public static stringify(instance: any, options: XmlOptions = {}): string
    {
        return Stringifier.stringify(instance, options);
    }

    /**
     * Converts an XML binary stream or buffer directly into a JSON object.
     * Uses asynchronous streaming to handle large files or API responses efficiently.
     * 
     * @param input - The binary buffer or readable stream containing the XML data.
     * @param options - Conversion configuration.
     * @returns A promise resolving to a JSON representation of the XML.
     */
    public static async toJson(input: XmlInput, options?: XmlOptions): Promise<JsonNode>
    {
        const lexer = new Lexer();
        const parser = new Parser(options);

        const onToken = (jeton: XmlToken) => parser.consume(jeton);

        // CAS 1 : L'entrée est un flux asynchrone (ex: fetch response.body)
        if (input instanceof ReadableStream)
        {
            const lecteur = input.getReader();
            const decodeur = new TextDecoder(options?.encoding || 'utf-8');
            let fini = false;

            while (!fini) 
            {
                const { value, done } = await lecteur.read();
                fini = done;
                if (value) 
                {
                    const chunkTexte = decodeur.decode(value, { stream: !fini });
                    lexer.tokenize(chunkTexte, onToken);
                }
            }
        } 
        // CAS 2 : L'entrée est un buffer binaire en mémoire (ex: fs.readFile)
        else 
        {
            const decodeur = new TextDecoder(options?.encoding || 'utf-8');
            const texteComplet = decodeur.decode(input);
            lexer.tokenize(texteComplet, onToken);
        }

        // valide que le XML s'est bien terminé
        lexer.flush();

        return parser.getAst();
    }

    /**
     * Converts a JSON object directly into an XML string.
     * 
     * @param json - The JSON object to convert.
     * @param rootTagName - The name of the root XML element to wrap the JSON in.
     * @param options - Conversion configuration.
     * @returns The generated XML string.
     */
    public static fromJson(json: JsonNode, rootTagName: string, options: XmlOptions = {}): string
    {
        // Un JsonNode est déjà un objet JS. On l'enveloppe simplement dans le nom de la balise racine.
        const objetEnveloppe = { [rootTagName]: json };
        
        // Le Stringifier prendra le relais pour transformer ce POJO (objet simple) en XML.
        return this.stringify(objetEnveloppe, options);
    }

    /**
     * Serializes a class instance to XML and saves it to the local file system.
     * Note: This method uses dynamic imports for Node.js/Bun compatibility 
     * without breaking browser environments.
     * 
     * @param instance - The class instance to serialize.
     * @param filePath - The absolute or relative path where the file will be saved.
     * @param options - Stringify configuration.
     * @returns A promise that resolves when the file is successfully saved.
     */
    public static async saveToFile(instance: any, filePath: string, options: XmlOptions = {}): Promise<void>
    {
        // Génération de la chaîne XML
        const chaineXml = this.stringify(instance, options);

        try
        {
            // Importation dynamique du module 'fs/promises' (Node.js/Bun)
            // L'import dynamique permet d'éviter que le code plante si on utilise la librairie dans un navigateur (qui n'a pas accès à 'fs')
            const moduleFichier = await import('node:fs/promises');
            const encodage = options.encoding ?? 'utf-8';

            // Écriture asynchrone sur le disque
            await moduleFichier.writeFile(filePath, chaineXml, { encoding: encodage as BufferEncoding });
        }
        catch (erreur)
        {
            throw new Error(`Unable to save XML file. Make sure you are in a Node.js or Bun environment. Detail: ${erreur}`);
        }
    }

    /**
     * Serializes a class instance to XML and sends it as a payload to a remote API.
     * 
     * @param instance - The class instance to serialize.
     * @param endpoint - The URL of the API endpoint.
     * @param options - Configuration for the HTTP request.
     * @returns A promise resolving to the API response object.
     */
    public static async sendToApi(instance: any, endpoint: string, options: ApiSendOptions = {}): Promise<Response>
    {
        // Génération du contenu XML
        const corpsRequete = this.stringify(instance, { format: false });

        // Préparation des en-têtes HTTP de base
        const entetes: Record<string, string> = {
            'Content-Type': 'application/xml; charset=utf-8',
            'Accept': 'application/xml, application/json',
            ...(options.headers || {})
        };

        // Ajout du jeton d'authentification si fourni
        if (options.token)
        {
            entetes['Authorization'] = `Bearer ${options.token}`;
        }

        // Configuration de la requête fetch native
        const configurationRequete: RequestInit = {
            method: options.method || 'POST',
            headers: entetes,
            body: corpsRequete
        };

        // Envoi de la requête via l'API Web standard (fetch)
        return await fetch(endpoint, configurationRequete);
    }

    /**
     * Serializes a class instance to XML and generates a standard HTTP Web Response.
     * Ideal for returning XML directly from modern API endpoints (Next.js, Bun, Deno, etc.).
     * 
     * @param instance - The class instance to serialize.
     * @param options - Stringify configuration.
     * @returns A native Web API Response object with correct XML headers.
     */
    public static toResponse(instance: any, options: XmlOptions = {}): Response
    {
        // Génération de la chaîne XML
        const chaineXml = this.stringify(instance, options);

        // Création d'une réponse Web standard
        const reponse = new Response(chaineXml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Content-Length': Buffer.byteLength(chaineXml).toString()
            }
        });

        return reponse;
    }
}