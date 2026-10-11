import { JsonNode, XmlOptions } from '../types/index.js';
import { METADATA_KEYS } from '../decorators/constants.js';

export class JsonConverter
{
    public static mapToClass<T>(ast: JsonNode, targetClass: { new(): T }, options: XmlOptions = {}): T
    {
        const metadonnees = (targetClass[Symbol.metadata] || {}) as Record<string, any>;
        const nomRacineAttendue = (metadonnees[METADATA_KEYS.ROOT] as string) || targetClass.name;
        const noeudRacine = ast[nomRacineAttendue] !== undefined ? ast[nomRacineAttendue] : ast;

        return this.instancierEtMapper(noeudRacine, targetClass, options);
    }

    private static instancierEtMapper<T>(noeud: any, constructeurCible: { new(): T }, options: XmlOptions = {}): T
    {
        const instance = new constructeurCible() as any;
        const metadonnees = (constructeurCible[Symbol.metadata] as Record<string, any>) || {};

        const dictionnaireElements = (metadonnees[METADATA_KEYS.ELEMENTS] as Record<string, string>) || {};
        const dictionnaireAttributs = (metadonnees[METADATA_KEYS.ATTRIBUTES] as Record<string, string>) || {};
        const ensembleIgnores = (metadonnees[METADATA_KEYS.IGNORE] as Set<string>) || new Set();
        const proprieteValeur = metadonnees[METADATA_KEYS.VALUE] as string | undefined;
        const dictionnaireTypes = (metadonnees[METADATA_KEYS.ELEMENT_TYPES] as Record<string, new () => any>) || {};
        const dictionnaireTableaux = (metadonnees[METADATA_KEYS.ARRAYS] as Record<string, any>) || {};
        const dictionnaireTransforms = (metadonnees[METADATA_KEYS.TRANSFORMS] as Record<string, any>) || {};

        const xmlVersPropriete: Record<string, string> = {};
        for (const [prop, xmlTag] of Object.entries(dictionnaireElements))
            xmlVersPropriete[xmlTag] = prop;

        for (const [prop, xmlAttr] of Object.entries(dictionnaireAttributs))
            xmlVersPropriete[xmlAttr] = prop;

        // On référence aussi les balises des tableaux pour les lier aux bonnes propriétés de la classe
        for (const [prop, config] of Object.entries(dictionnaireTableaux))
        {
            if (config.rootName) xmlVersPropriete[config.rootName] = prop;
            else xmlVersPropriete[config.itemName] = prop;
        }

        if (typeof noeud !== 'object' || noeud === null) return instance;

        for (const [cleXml, valeurXml] of Object.entries(noeud))
        {
            if (cleXml === '__text__')
            {
                if (proprieteValeur && !ensembleIgnores.has(proprieteValeur))
                {
                    let valeurConvertie = this.convertirType(
                        valeurXml,
                        typeof instance[proprieteValeur],
                        instance[proprieteValeur],
                        options
                    );

                    if (dictionnaireTransforms[proprieteValeur]?.read)
                        valeurConvertie = dictionnaireTransforms[proprieteValeur].read(valeurConvertie);

                    instance[proprieteValeur] = valeurConvertie;
                }
                continue;
            }

            const nomPropriete = xmlVersPropriete[cleXml] || cleXml;
            if (ensembleIgnores.has(nomPropriete))
                continue;

            const TypeCible = dictionnaireTypes[nomPropriete];
            const ConfigTableau = dictionnaireTableaux[nomPropriete];

            // Traitement spécifique pour @XmlArray
            if (ConfigTableau && typeof valeurXml === 'object' && valeurXml !== null) 
            {
                // On rassure TypeScript en lui disant que c'est bien un objet indexable
                const noeudXml = valeurXml as Record<string, any>;

                let elementsExtraits: any = noeudXml;

                // Si le tableau est dans une balise parente (rootName), on descend d'un niveau
                if (ConfigTableau.rootName)
                {
                    if (noeudXml[ConfigTableau.itemName] !== undefined)
                        elementsExtraits = noeudXml[ConfigTableau.itemName];

                    // balise parente est vide
                    else
                        elementsExtraits = [];
                }

                // On force le typage TypeScript en Array pour autoriser le .map()
                const listeElements: any[] = Array.isArray(elementsExtraits) ? elementsExtraits : [elementsExtraits];

                // On instancie chaque élément du tableau
                let resultatTableau = listeElements.map((item: any) =>
                    ConfigTableau.itemType ? this.instancierEtMapper(item, ConfigTableau.itemType, options) : item
                );

                if (dictionnaireTransforms[nomPropriete]?.read)
                    resultatTableau = dictionnaireTransforms[nomPropriete].read(resultatTableau);

                instance[nomPropriete] = resultatTableau;
                continue; // Fin du traitement pour cette propriété
            }

            // Traitement pour les objets simples imbriqués (avec le "type" de @XmlElement)
            if (TypeCible && typeof valeurXml === 'object' && valeurXml !== null) 
            {
                if (Array.isArray(valeurXml))
                    instance[nomPropriete] = valeurXml.map(item => this.instancierEtMapper(item, TypeCible, options));

                else
                    instance[nomPropriete] = this.instancierEtMapper(valeurXml, TypeCible, options);
            }
            else 
            {
                // Traitement pour les valeurs primitives (texte, nombres...)
                const typeAttendu = typeof instance[nomPropriete];
                let valeurConvertie = this.convertirType(valeurXml, typeAttendu, instance[nomPropriete], options);

                // Application du transformRead s'il existe
                if (dictionnaireTransforms[nomPropriete]?.read)
                    valeurConvertie = dictionnaireTransforms[nomPropriete].read(valeurConvertie);

                instance[nomPropriete] = valeurConvertie;
            }
        }

        return instance;
    }

    private static convertirType(valeur: any, typeAttendu: string, valeurParDefaut?: any, options: XmlOptions = {}): any
    {
        if (valeur === undefined || valeur === null) return valeur;

        // Si la valeur venant du XML est déjà un objet, on la laisse
        if (typeof valeur === 'object')
            return valeur;

        if (valeurParDefaut instanceof Date)
        {
            const date = new Date(valeur);
            return isNaN(date.getTime()) ? valeur : date;
        }

        switch (typeAttendu)
        {
            case 'number':
                const nombre = Number(valeur);
                return isNaN(nombre) ? valeur : nombre;

            case 'boolean':
                const valStr = String(valeur).toLowerCase().trim();

                // Si l'utilisateur a fourni ses propres mots-clés :
                if (options?.trueValues && options.trueValues.length > 0)
                    return options.trueValues.some(motCle => motCle.toLowerCase() === valStr);

                // Comportement par défaut si rien n'est configuré :
                return valStr === 'true' || valStr === '1';

            case 'string':
                return String(valeur);

            default:
                return valeur;
        }
    }
}