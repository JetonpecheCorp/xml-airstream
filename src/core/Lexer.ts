import { XmlToken } from "../types/lexer.js";


// Les différents états possibles de la machine lors de la lecture caractère par caractère.
enum EtatLexer
{
    TEXTE,
    BALISE_OUVERTE,
    NOM_BALISE,
    NOM_ATTRIBUT,
    RECHERCHE_EGAL,
    VALEUR_ATTRIBUT,
    BALISE_FERMANTE,
    COMMENTAIRE_OU_DECLARATION,
    CDATA
}

export class Lexer
{
    // État actuel de la machine
    private etatCourant: EtatLexer = EtatLexer.TEXTE;

    // Tampon (Buffer) pour accumuler les caractères en cours de lecture
    private tamponTexte: string = '';

    // Variables pour stocker les données de la balise en cours d'analyse
    private nomBaliseCourante: string = '';
    private attributsCourants: Record<string, string> = {};
    private nomAttributCourant: string = '';
    private guillemetAttribut: string = '';
    private estAutoFermante: boolean = false;

    /**
     * Processes a chunk of XML data and returns the extracted tokens.
     * State is preserved between chunks, making it ideal for streaming.
     * 
     * @param chunk - A string chunk of XML data.
     * @returns An array of parsed XML tokens.
     */
    public tokenize(chunk: string, onToken: (jeton: XmlToken) => void): void
    {
        for (let i = 0; i < chunk.length; i++)
        {
            const caractere = chunk[i];

            switch (this.etatCourant)
            {
                case EtatLexer.TEXTE:
                    if (caractere === '<')
                    {
                        if (this.tamponTexte.trim().length > 0)
                            onToken({ type: 'Text', value: this.tamponTexte.trim() });

                        this.tamponTexte = '';
                        this.etatCourant = EtatLexer.BALISE_OUVERTE;
                    }
                    else
                        this.tamponTexte += caractere;
                    break;

                case EtatLexer.BALISE_OUVERTE:
                    if (caractere === '/')
                    {
                        this.etatCourant = EtatLexer.BALISE_FERMANTE;
                        this.nomBaliseCourante = '';
                    }
                    else if (caractere === '?' || caractere === '!')
                    {
                        this.etatCourant = EtatLexer.COMMENTAIRE_OU_DECLARATION;
                        this.tamponTexte = caractere;
                    }
                    else
                    {
                        this.etatCourant = EtatLexer.NOM_BALISE;
                        this.nomBaliseCourante = caractere;
                        this.attributsCourants = {};
                        this.estAutoFermante = false;
                    }
                    break;

                case EtatLexer.NOM_BALISE:
                    if (caractere === ' ' || caractere === '\n' || caractere === '\t') 
                    {
                        this.etatCourant = EtatLexer.NOM_ATTRIBUT;
                        this.nomAttributCourant = '';
                    }
                    else if (caractere === '/')
                        this.estAutoFermante = true;

                    else if (caractere === '>')
                    {
                        onToken(this.creerJetonOuverture());
                        this.etatCourant = EtatLexer.TEXTE;
                        this.tamponTexte = '';
                    }
                    else
                        this.nomBaliseCourante += caractere;

                    break;

                case EtatLexer.NOM_ATTRIBUT:
                    if (caractere === '=')
                        this.etatCourant = EtatLexer.RECHERCHE_EGAL;

                    else if (caractere === '/')
                        this.estAutoFermante = true;

                    else if (caractere === '>') 
                    {
                        onToken(this.creerJetonOuverture());
                        this.etatCourant = EtatLexer.TEXTE;
                        this.tamponTexte = '';
                    }
                    else if (caractere !== ' ' && caractere !== '\n' && caractere !== '\t')
                        this.nomAttributCourant += caractere;
                    break;

                case EtatLexer.RECHERCHE_EGAL:
                    if (caractere === '"' || caractere === "'")
                    {
                        this.guillemetAttribut = caractere;
                        this.etatCourant = EtatLexer.VALEUR_ATTRIBUT;
                        this.tamponTexte = '';
                    }
                    break;

                case EtatLexer.VALEUR_ATTRIBUT:
                    if (caractere === this.guillemetAttribut)
                    {
                        this.attributsCourants[this.nomAttributCourant] = this.tamponTexte;
                        this.nomAttributCourant = '';
                        this.tamponTexte = '';
                        this.etatCourant = EtatLexer.NOM_ATTRIBUT;
                    }
                    else
                        this.tamponTexte += caractere;

                    break;

                case EtatLexer.BALISE_FERMANTE:
                    if (caractere === '>') 
                    {
                        onToken({ type: 'CloseTag', name: this.nomBaliseCourante });
                        this.nomBaliseCourante = '';
                        this.etatCourant = EtatLexer.TEXTE;
                    }
                    else if (caractere !== ' ')
                        this.nomBaliseCourante += caractere;
                    break;

                case EtatLexer.COMMENTAIRE_OU_DECLARATION:
                    this.tamponTexte += caractere;
                    if (this.tamponTexte === '![CDATA[')
                    {
                        this.etatCourant = EtatLexer.CDATA;
                        this.tamponTexte = '';
                    }
                    else if (this.tamponTexte.startsWith('!--') && this.tamponTexte.endsWith('-->'))
                    {
                        this.etatCourant = EtatLexer.TEXTE;
                        this.tamponTexte = '';
                    }
                    else if (this.tamponTexte.startsWith('?') && this.tamponTexte.endsWith('?>'))
                    {
                        this.etatCourant = EtatLexer.TEXTE;
                        this.tamponTexte = '';
                    }
                    else if (caractere === '>' && !this.tamponTexte.startsWith('!--') && !this.tamponTexte.startsWith('!['))
                    {
                        this.etatCourant = EtatLexer.TEXTE;
                        this.tamponTexte = '';
                    }
                    break;

                case EtatLexer.CDATA:
                    this.tamponTexte += caractere;
                    if (this.tamponTexte.endsWith(']]>'))
                    {
                        const contenuCData = this.tamponTexte.slice(0, -3);
                        if (contenuCData.length > 0) onToken({ type: 'Text', value: contenuCData }); // Callback !
                        this.etatCourant = EtatLexer.TEXTE;
                        this.tamponTexte = '';
                    }
                    break;
            }
        }
    }

    public flush(): void 
    {
        if (this.etatCourant === EtatLexer.CDATA)
            throw new Error("[XML-Airstream] XML malformé : Bloc <![CDATA[ non refermé à la fin du document.");

        if (this.etatCourant !== EtatLexer.TEXTE)
            throw new Error("[XML-Airstream] XML malformé : Le document s'arrête brutalement au milieu d'une balise.");
    }

    /**
     * Fonction utilitaire pour générer le jeton final de balise ouvrante.
     */
    private creerJetonOuverture(): XmlToken
    {
        return {
            type: 'OpenTag',
            name: this.nomBaliseCourante,
            attributes: { ...this.attributsCourants },
            isSelfClosing: this.estAutoFermante
        };
    }
}