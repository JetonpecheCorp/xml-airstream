import { XmlOptions } from '../types/index.js';
import { METADATA_KEYS } from '../decorators/constants.js';

export class Stringifier
{
    public static stringify(instance: any, options: XmlOptions = {}): string
    {
        const morceaux: string[] = [];
        const niveau = options.format ? 0 : undefined;

        this.traiterNoeud(instance, null, morceaux, options, niveau);

        return morceaux.join('');
    }

    private static traiterNoeud(
        valeur: any,
        nomBaliseExplicite: string | null,
        morceaux: string[],
        options: XmlOptions,
        niveau?: number,
        estCData: boolean = false
    ): void
    {
        if (valeur === null || valeur === undefined) return;

        // --- CAS 1 : C'est une valeur primitive (chaine, nombre, booleen) ---
        if (typeof valeur !== 'object')
        {
            // Si c'est du CDATA, on ne l'échappe pas, on l'enveloppe !
            const contenuFormatte = estCData
                ? `<![CDATA[${valeur}]]>`
                : this.echapperXml(String(valeur));

            if (nomBaliseExplicite)
            {
                const indentation = niveau !== undefined ? '  '.repeat(niveau) : '';
                const sautDeLigne = niveau !== undefined ? '\n' : '';

                morceaux.push(indentation, '<', nomBaliseExplicite, '>');
                morceaux.push(contenuFormatte);
                morceaux.push('</', nomBaliseExplicite, '>', sautDeLigne);
            }
            else
            {
                morceaux.push(contenuFormatte);
            }
            return;
        }

        if (Array.isArray(valeur))
        {
            for (const element of valeur)
                this.traiterNoeud(element, nomBaliseExplicite, morceaux, options, niveau);

            return;
        }

        // Récupération des métadonnées
        const metadonnees = (valeur.constructor ? valeur.constructor[Symbol.metadata] as Record<string, any> : null) || {};

        const nomBalise = nomBaliseExplicite ?? (metadonnees[METADATA_KEYS.ROOT] as string) ?? valeur.constructor.name;

        const dictionnaireElements = (metadonnees[METADATA_KEYS.ELEMENTS] as Record<string, string>) || {};
        const dictionnaireAttributs = (metadonnees[METADATA_KEYS.ATTRIBUTES] as Record<string, string>) || {};
        const ensembleIgnores = (metadonnees[METADATA_KEYS.IGNORE] as Set<string>) || new Set();
        const proprieteValeur = metadonnees[METADATA_KEYS.VALUE] as string | undefined;
        const dictionnaireTableaux = (metadonnees[METADATA_KEYS.ARRAYS] as Record<string, any>) || {};
        const ensembleCData = (metadonnees[METADATA_KEYS.CDATA] as Set<string>) || new Set();
        const dictionnaireTransforms = (metadonnees[METADATA_KEYS.TRANSFORMS] as Record<string, any>) || {};

        const indentation = niveau !== undefined ? '  '.repeat(niveau) : '';
        const sautDeLigne = niveau !== undefined ? '\n' : '';

        if (niveau !== undefined)
            morceaux.push(indentation);

        morceaux.push('<', nomBalise);

        const proprietes = Object.entries(valeur);
        if (!options.ignoreAttributes)
        {
            for (const [cle, val] of proprietes)
            {
                if (ensembleIgnores.has(cle) || val === undefined || val === null) 
                    continue;

                if (dictionnaireAttributs[cle])
                {
                    const nomAttribut = dictionnaireAttributs[cle];
                    
                    // transformWrite pour attributs
                    let valFinale = val;
                    if (dictionnaireTransforms[cle]?.write) valFinale = dictionnaireTransforms[cle].write(valFinale);
                    
                    morceaux.push(' ', nomAttribut, '="', this.echapperXml(String(valFinale)), '"');
                }
            }
        }

        const proprietesEnfants = proprietes.filter(([cle]) => !dictionnaireAttributs[cle] && !ensembleIgnores.has(cle) && cle !== proprieteValeur);
        const possedeValeurTexte = proprieteValeur !== undefined && valeur[proprieteValeur] !== undefined;

        if (proprietesEnfants.length === 0 && !possedeValeurTexte)
        {
            morceaux.push(' />', sautDeLigne);
            return;
        }

        morceaux.push('>');

        if (possedeValeurTexte)
        {
            const estCDataValue = ensembleCData.has(proprieteValeur);
            let val = valeur[proprieteValeur];

            // Application de transformWrite pour @XmlValue
            if (dictionnaireTransforms[proprieteValeur]?.write)
                val = dictionnaireTransforms[proprieteValeur].write(val);

            // On l'enveloppe en CDATA ou on l'échappe normalement
            morceaux.push(estCDataValue ? `<![CDATA[${val}]]>` : this.echapperXml(String(val)));
        }

        else if (proprietesEnfants.length > 0)
        {
            if (niveau !== undefined)
                morceaux.push(sautDeLigne);

            for (const [cle, val] of proprietesEnfants)
            {
                if (val === undefined || val === null)
                    continue;

                let valFinale = val;
                if (dictionnaireTransforms[cle]?.write)
                    valFinale = dictionnaireTransforms[cle].write(valFinale);

                // Traitement pour @XmlArray
                const configTableau = dictionnaireTableaux[cle];
                if (configTableau && Array.isArray(valFinale))
                {

                    // On ouvre la balise parente (rootName) si elle existe (ex: <Addresses>)
                    if (configTableau.rootName)
                    {
                        if (niveau !== undefined)
                            morceaux.push(indentation, '  ');

                        morceaux.push('<', configTableau.rootName, '>', sautDeLigne);
                    }

                    // On écrit chaque élément avec le nom de balise enfant (itemName)
                    for (const element of valFinale)
                    {
                        this.traiterNoeud(
                            element,
                            configTableau.itemName,
                            morceaux,
                            options,
                            niveau !== undefined ? niveau + (configTableau.rootName ? 2 : 1) : undefined
                        );
                    }

                    // On ferme la balise parente
                    if (configTableau.rootName)
                    {
                        if (niveau !== undefined) morceaux.push(indentation, '  ');
                        morceaux.push('</', configTableau.rootName, '>', sautDeLigne);
                    }

                    continue;
                }

                // Comportement normal pour les autres balises simples (@XmlElement)
                const nomBaliseEnfant = dictionnaireElements[cle] || cle;
                const estProprieteCData = ensembleCData.has(cle);
                this.traiterNoeud(valFinale, nomBaliseEnfant, morceaux, options, niveau !== undefined ? niveau + 1 : undefined, estProprieteCData);
            }
            if (niveau !== undefined)
                morceaux.push(indentation);
        }

        morceaux.push('</', nomBalise, '>', sautDeLigne);
    }

    private static echapperXml(texteNonSecurise: string): string
    {
        return texteNonSecurise.replace(/[<>&'"]/g, (caractere) =>
        {
            switch (caractere)
            {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
                default: return caractere;
            }
        });
    }
}