"""Calcul de référence FraisFit (revenus 2025).

Sert UNIQUEMENT à vérifier les résultats attendus des cas de test.
L'application (web React et Android Kotlin) doit retrouver exactement
les mêmes montants à partir de parametres/revenus-2025.json.

Usage : python3 tests/reference_calcul.py   (régénère tests/cas-de-test.json)
"""
import json
import math
import os

ICI = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(os.path.join(ICI, "..", "parametres", "revenus-2025.json"), encoding="utf-8"))
B = P["bareme_kilometrique"]


def _tranche(d, bornes, lignes):
    i = 0 if d <= bornes[0] else (1 if d <= bornes[1] else 2)
    return d * lignes[i]["a"] + lignes[i]["b"]


def bareme_km(km, vehicule="voiture", cv=5, electrique=False):
    """Montant du barème pour le kilométrage annuel TOTAL d'un véhicule."""
    if vehicule == "voiture":
        t = B["voiture_electrique" if electrique else "voiture_thermique"]
        cle = str(min(max(int(cv), 3), P["deplacements"]["puissance_max_voiture_cv"]))
        return _tranche(km, t["tranches_km"], t["lignes"][cle])
    if vehicule == "cyclomoteur":
        t = B["cyclomoteur_electrique" if electrique else "cyclomoteur_thermique"]
        return _tranche(km, t["tranches_km"], t["ligne"])
    if vehicule == "moto":
        t = B["moto_electrique" if electrique else "moto_thermique"]
        cle = "1-2" if cv <= 2 else ("3-5" if cv <= 5 else "5+")
        return _tranche(km, t["tranches_km"], t["lignes"][cle])
    raise ValueError(vehicule)


def abattement(salaire):
    a = P["abattement_10_pourcent"]
    return min(max(salaire * a["taux"], a["minimum_par_declarant"]), a["maximum_par_declarant"], salaire)


def distance_retenue(aller_km, motif=False):
    return aller_km if motif else min(aller_km, P["deplacements"]["distance_aller_max_sans_justification_km"])


def km_plusieurs_employeurs(trajets, motif=False):
    """F12.6 : trajets domicile-travail de chaque employeur (aller_km, jours sur site), chacun plafonné à 40 km
    sauf motif, additionnés pour le même véhicule avant application du barème (une seule tranche)."""
    return sum(distance_retenue(aller, motif) * 2 * jours for aller, jours in trajets)


def repas(nb, prix=None, part_employeur_tr=0.0, prix_sur_place=None):
    """prix=None -> forfait sans justificatif détaillé.
    prix_sur_place : restauration collective (cantine, distributeurs) disponible mais non utilisée par choix
    personnel ; prix d'un repas sur place après la part de l'employeur. La dépense est plafonnée à ce prix
    (impots.gouv.fr, « Je suis salarié et obligé de prendre mes repas à l'extérieur », exemple officiel : restaurant 12 €, cantine 6 €, 6 - 5,45 = 0,55 € par jour)."""
    r = P["repas"]
    if prix is not None and prix_sur_place is not None:
        prix = min(prix, prix_sur_place)
    unit = r["forfait_sans_justificatif_detaille"] if prix is None else prix - r["valeur_repas_au_foyer"]
    return max(unit - part_employeur_tr, 0) * nb


def teletravail_forfait(jours_par_mois):
    t = P["teletravail"]
    total = sum(min(j * t["forfait_par_jour"], t["plafond_mensuel"]) for j in jours_par_mois)
    return min(total, t["plafond_annuel"])


def repartir_jours_par_mois(total, mois_travailles=range(12)):
    """Pré-remplissage : total annuel réparti à parts égales (jours entiers) sur les mois travaillés."""
    mois = list(mois_travailles)
    res = [0] * 12
    base, reste = divmod(total, len(mois))
    for i, m in enumerate(mois):
        res[m] = base + (1 if i < reste else 0)
    return res


def materiel(prix_ht, usage_pro=1.0, mois_utilises_annee_achat=12):
    m = P["materiel"]
    if prix_ht <= m["seuil_deduction_immediate_HT"]:
        return prix_ht * usage_pro
    annuite = prix_ht / m["duree_amortissement_informatique_ans"]
    return annuite * mois_utilises_annee_achat / 12 * usage_pro


def materiel_annee(prix_ht, usage_pro, annee_achat, mois_achat, annee_revenus):
    """Montant d'une année donnée : déduction immédiate ou amortissement linéaire prorata temporis (mois)."""
    m = P["materiel"]
    if prix_ht <= m["seuil_deduction_immediate_HT"]:
        return prix_ht * usage_pro if annee_revenus == annee_achat else 0.0
    duree = m["duree_amortissement_informatique_ans"]
    annuite = prix_ht / duree
    mois_annee_1 = 12 - mois_achat + 1
    rang = annee_revenus - annee_achat
    if rang < 0 or rang > duree:
        return 0.0
    if rang == 0:
        part = annuite * mois_annee_1 / 12
    elif rang < duree:
        part = annuite
    else:
        part = annuite * (12 - mois_annee_1) / 12
    return part * usage_pro


def part_surface(surface_bureau, surface_totale, studio=False):
    return P["teletravail"]["studio_part_professionnelle"] if studio else surface_bureau / surface_totale


def ratio_local(usage, jours_tt, jours_travailles):
    t = P["teletravail"]
    if usage == "dedie":
        return jours_tt / jours_travailles
    return jours_tt * t["heures_par_journee_teletravail_local_mixte"] / t["heures_par_an"]


def local_professionnel(charges, surface_bureau, surface_totale, usage, heures_par_semaine=0, semaines=0, studio=False):
    """F6.11 (enseignant, décision de Marc du 16/10/2026) : bureau à domicile, aucun bureau fourni par l'employeur.
    Pièce réservée au travail : charges × part de surface (guide SE-UNSA 2025).
    Pièce à usage mixte : charges × part de surface × heures de travail à domicile / heures de l'année (comme F5.3)."""
    part = part_surface(surface_bureau, surface_totale, studio)
    if usage == "dedie":
        return charges * part
    return charges * part * min(heures_par_semaine * semaines / P["teletravail"]["heures_par_an"], 1)


def parts_foyer(couple, enfants, parent_isole=False, veuf=False):
    """Parts de quotient familial : 1 ou 2, + 0,5 pour chacun des 2 premiers enfants, + 1 au-delà, + 0,5 case T.
    Veuf avec enfants à charge : autant de parts qu'un couple (CGI art. 194 I), mais base 1 pour le plafonnement."""
    base = 2 if couple else 1
    demi = sum(1 if i < 2 else 2 for i in range(enfants))
    if veuf and not couple and enfants > 0:
        demi += 2
    elif parent_isole and not couple and enfants > 0:
        demi += 1
    return base, base + demi / 2


def impot_par_part(qf):
    t = P["impot_revenu"]["tranches"]
    impot, bas = 0.0, 0.0
    for tr in t:
        haut = tr["jusqua"] if tr["jusqua"] is not None else float("inf")
        if qf > bas:
            impot += (min(qf, haut) - bas) * tr["taux"]
        bas = haut
    return impot


def impot_foyer(revenu, couple, enfants, parent_isole=False, veuf=False):
    """Barème, plafonnement du quotient familial, décote, seuil de recouvrement (CGI art. 197)."""
    ir = P["impot_revenu"]
    veuf_enfants = veuf and not couple and enfants > 0
    base, parts = parts_foyer(couple, enfants, parent_isole, veuf)
    impot = parts * impot_par_part(revenu / parts)
    demi_parts = round((parts - base) * 2)
    if demi_parts > 0:
        sans = base * impot_par_part(revenu / base)
        if parent_isole and not couple and not veuf_enfants:
            plafond = ir["plafond_deux_premieres_demi_parts_parent_isole"] + ir["plafond_par_demi_part"] * max(demi_parts - 2, 0)
        else:
            plafond = ir["plafond_par_demi_part"] * demi_parts
        if sans - plafond > impot:
            hausse = sans - plafond - impot
            impot = sans - plafond
            if veuf_enfants:
                # Réduction complémentaire pour la part du veuf, limitée à la hausse due au plafonnement.
                impot -= min(ir["reduction_complementaire_veuf_avec_enfants"], hausse)
    decote = (ir["decote_couple"] if couple else ir["decote_personne_seule"]) - ir["decote_taux"] * impot
    if decote > 0:
        impot -= min(decote, impot)
    if impot < ir["seuil_mise_en_recouvrement"]:
        impot = 0.0
    return impot


def plafond_frais_reels_vehicule(km, frais_justifies_hors_peages_parking_interets):
    return min(frais_justifies_hors_peages_parking_interets, bareme_km(km, "voiture", 7))


def gain_base_imposable(salaire_prerempli, reintegrations, frais_reels, chomage=0.0):
    """chomage : allocations chômage de l'année (F12.7). La déduction de 10 % porte sur les salaires et les
    allocations ensemble (BOI-RSA-BASE-30-50-20) ; l'option frais réels la remplace pour le tout."""
    revenus = salaire_prerempli + chomage
    base_10 = revenus - abattement(revenus)
    base_reel = revenus + reintegrations - frais_reels
    return base_10, base_reel, base_10 - base_reel


# --- Mode foyer (ajout n° 1, docs/03-ajout-mode-foyer.md) ---
def motif_emploi_conjoint_propose(aller_moi, aller_conjoint):
    """F10 : le motif « emploi du conjoint » est proposé si l'un travaille au-delà de 40 km et l'autre à 40 km ou moins."""
    plafond = P["deplacements"]["distance_aller_max_sans_justification_km"]
    return aller_moi > plafond and aller_conjoint <= plafond


def vehicule_partage(km1, km2, vehicule="voiture", cv=5, electrique=False):
    """Véhicule utilisé par les deux conjoints (règle de prudence FraisFit) : barème sur le total du véhicule réparti
    au prorata des km, ou barème séparé de chacun ; la méthode qui donne la déduction totale la plus faible est retenue."""
    separe = [bareme_km(km1, vehicule, cv, electrique), bareme_km(km2, vehicule, cv, electrique)]
    total = bareme_km(km1 + km2, vehicule, cv, electrique)
    prorata = [total * km1 / (km1 + km2), total * km2 / (km1 + km2)]
    if sum(prorata) <= sum(separe):
        return "prorata", prorata
    return "separe", separe


def covoiturage_conjugal_km(aller_km, jours, jours_passager, motif=False):
    """Trajets faits ensemble : les jours où il est passager de son conjoint, le déclarant ne compte aucun km."""
    return distance_retenue(aller_km, motif) * 2 * (jours - jours_passager)


def covoiturage_passager(montant_paye, aller_km, motif=False):
    """Passager hors du foyer (LFR 2022 art. 20, CGI 83, 3°) : montant réellement payé ; au-delà de 40 km sans motif,
    réduit au prorata de 40 km (application de la règle des 40 km, à confirmer par la DGFiP)."""
    plafond = P["deplacements"]["distance_aller_max_sans_justification_km"]
    if motif or aller_km <= plafond:
        return montant_paye
    return montant_paye * plafond / aller_km


def covoiturage_conducteur(frais_vehicule, participations_recues):
    """Conducteur : seul ce qui reste à sa charge est déductible."""
    return max(0.0, frais_vehicule - participations_recues)


def combinaisons_foyer(d1, d2, enfants=0, autres_revenus=0):
    """Ajout n° 1 : les 4 combinaisons 10 % / frais réels d'un couple, impôt du foyer pour chacune.
    d = (salaire prérempli, réintégrations, frais réels). Retourne la liste et la combinaison la moins chère."""
    def base(d, reel):
        b10, br, _ = gain_base_imposable(*d)
        return br if reel else b10
    res = []
    for r1 in (False, True):
        for r2_ in (False, True):
            b1, b2 = base(d1, r1), base(d2, r2_)
            res.append({"reels_1": r1, "reels_2": r2_, "base_1": b1, "base_2": b2, "impot": impot_foyer(b1 + b2 + autres_revenus, True, enfants)})
    # À impôt égal, la base imposable la plus faible (revenu fiscal de référence), puis le moins d'options.
    meilleure = min(res, key=lambda c: (round(c["impot"], 2), c["base_1"] + c["base_2"], c["reels_1"] + c["reels_2"]))
    return res, meilleure


def r2(x):
    return round(x + 1e-9, 2)


def arrondi_euro(x):
    """Arrondi à l'euro inférieur (décision du 15/10/2026), comme les exemples du dépliant GP 120."""
    return math.floor(x + 1e-6)


CAS = []


def cas(id_, titre, entrees, attendu, source):
    CAS.append({"id": id_, "titre": titre, "entrees": entrees, "attendu": attendu, "source": source})


# --- Barèmes : exemples officiels du dépliant GP 120 ---
cas("BAR-01", "Voiture 6 CV, 4 000 km", {"km": 4000, "cv": 6}, {"montant": r2(bareme_km(4000, cv=6))}, "GP 120 exemple : 2 660 €")
cas("BAR-02", "Voiture 5 CV, 6 000 km", {"km": 6000, "cv": 5}, {"montant": r2(bareme_km(6000, cv=5))}, "GP 120 exemple : 3 537 €")
cas("BAR-03", "Voiture électrique 6 CV, 4 000 km", {"km": 4000, "cv": 6, "electrique": True}, {"montant": r2(bareme_km(4000, cv=6, electrique=True))}, "GP 120 exemple : 3 192 €")
cas("BAR-04", "Voiture électrique 5 CV, 6 000 km", {"km": 6000, "cv": 5, "electrique": True}, {"montant": r2(bareme_km(6000, cv=5, electrique=True))}, "GP 120 exemple : 4 242 €")
cas("BAR-05", "Moto plus de 5 CV, 5 900 km", {"km": 5900, "vehicule": "moto", "cv": 6}, {"montant": r2(bareme_km(5900, "moto", 6)), "arrondi_euro": arrondi_euro(bareme_km(5900, "moto", 6))}, "GP 120 exemple : 2 049 €")
cas("BAR-06", "Moto électrique plus de 5 CV, 5 900 km", {"km": 5900, "vehicule": "moto", "cv": 6, "electrique": True}, {"montant": r2(bareme_km(5900, "moto", 6, True)), "arrondi_euro": arrondi_euro(bareme_km(5900, "moto", 6, True))}, "GP 120 exemple : 2 460 €")
cas("BAR-07", "Voiture 4 CV, 8 000 km", {"km": 8000, "cv": 4}, {"montant": r2(bareme_km(8000, cv=4))}, "Tout sur mes finances : 4 050 €")
cas("BAR-08", "Voiture 7 CV, 25 000 km", {"km": 25000, "cv": 7}, {"montant": r2(bareme_km(25000, cv=7))}, "Tout sur mes finances : 11 750 €")
cas("BAR-09", "Voiture 11 CV ramenée à 7 CV, 10 000 km", {"km": 10000, "cv": 11}, {"montant": r2(bareme_km(10000, cv=11)), "cv_retenus": 7}, "GP 120 : barème plafonné à 7 CV")
cas("BAR-10", "Cyclomoteur, 2 500 km", {"km": 2500, "vehicule": "cyclomoteur"}, {"montant": r2(bareme_km(2500, "cyclomoteur"))}, "GP 120")

# --- Abattement 10 % ---
cas("ABT-01", "Salaire 45 000 €", {"salaire": 45000}, {"abattement": r2(abattement(45000))}, "10 %")
cas("ABT-02", "Salaire 3 000 € : minimum 509 €", {"salaire": 3000}, {"abattement": r2(abattement(3000))}, "minimum 509 €")
cas("ABT-03", "Salaire 400 € : abattement limité au salaire", {"salaire": 400}, {"abattement": r2(abattement(400))}, "minimum limité au salaire")
cas("ABT-04", "Salaire 200 000 € : plafond", {"salaire": 200000}, {"abattement": r2(abattement(200000))}, "maximum 14 555 €")

# --- Distances ---
cas("DIS-01", "55 km aller sans motif", {"aller_km": 55, "motif": False}, {"distance_retenue": distance_retenue(55)}, "règle des 40 km")
cas("DIS-02", "55 km aller avec motif (emploi du conjoint)", {"aller_km": 55, "motif": True}, {"distance_retenue": distance_retenue(55, True)}, "circonstance particulière")

# --- Plusieurs employeurs (F12.6) ---
km_emp = km_plusieurs_employeurs([(22, 100), (50, 110)])
cas("EMP-01", "Deux employeurs, voiture 5 CV : 22 km × 100 j puis 50 km (ramenés à 40) × 110 j", {"trajets": [[22, 100], [50, 110]], "cv": 5},
    {"km": km_emp, "montant": r2(bareme_km(km_emp, cv=5))}, "F12.6 : 4 400 + 8 800 = 13 200 km, barème appliqué une seule fois au total")
km_emp2 = km_plusieurs_employeurs([(22, 100), (50, 110)], motif=True)
cas("EMP-02", "Mêmes employeurs avec motif : distance réelle de 50 km retenue", {"trajets": [[22, 100], [50, 110]], "cv": 5, "motif": True},
    {"km": km_emp2, "montant": r2(bareme_km(km_emp2, cv=5))}, "F12.6 et F3.4 : 4 400 + 11 000 = 15 400 km")

# --- Chômage entre deux emplois (F12.7) ---
cho = gain_base_imposable(15000, 0, 2500, chomage=8000)
cas("CHO-01", "Salaire 15 000 €, chômage 8 000 €, frais réels 2 500 € : 10 % calculés sur 23 000 €", {"salaire": 15000, "chomage": 8000, "reintegrations": 0, "frais_reels": 2500},
    {"base_abattement": r2(cho[0]), "base_frais_reels": r2(cho[1]), "gain_base": r2(cho[2])}, "BOI-RSA-BASE-30-50-20 : la déduction de 10 % porte aussi sur les allocations chômage ; 2 300 contre 2 500")

# --- Repas ---
cas("REP-01", "Restaurant 12 €, 218 jours, sans titres", {"nb": 218, "prix": 12}, {"montant": r2(repas(218, 12))}, "Tout sur mes finances : 1 427,90 €")
cas("REP-02", "Restaurant 12 €, titre-restaurant part employeur 4,50 €", {"nb": 218, "prix": 12, "part_employeur_tr": 4.5}, {"montant": r2(repas(218, 12, 4.5))}, "Tout sur mes finances : 446,90 €")
cas("REP-03", "Cantine 10 €, 218 jours", {"nb": 218, "prix": 10}, {"montant": r2(repas(218, 10))}, "Tout sur mes finances annonce 991,60 € : erreur de leur part, 4,55 × 218 = 991,90 €")
cas("REP-04", "Gamelle, titre-restaurant part employeur 4 €", {"nb": 1, "prix": None, "part_employeur_tr": 4}, {"montant_par_repas": r2(repas(1, None, 4))}, "Tout sur mes finances : 1,45 €")
cas("REP-05", "Restaurant 12 € alors qu'une cantine à 6 € existe : plafonné au prix de la cantine, 200 jours", {"nb": 200, "prix": 12, "prix_sur_place": 6}, {"montant": r2(repas(200, 12, 0, 6)), "montant_par_repas": r2(repas(1, 12, 0, 6))}, "impots.gouv.fr, exemple officiel : 0,55 € par jour")
cas("REP-06", "Restaurant 12 €, distributeurs : plat à 14 € payé à 50 % par l'employeur (7 €), 200 jours", {"nb": 200, "prix": 12, "prix_sur_place": 7}, {"montant": r2(repas(200, 12, 0, 7))}, "impots.gouv.fr : (7 - 5,45) x 200 = 310 €")

# --- Télétravail ---
cas("TLT-01", "Forfait 2 j/semaine (8 j/mois × 11 mois)", {"jours_par_mois": [8] * 11 + [0]}, {"montant": r2(teletravail_forfait([8] * 11 + [0]))}, "2,70 €/j")
cas("TLT-02", "Forfait plafonné : 25 j/mois × 12", {"jours_par_mois": [25] * 12}, {"montant": r2(teletravail_forfait([25] * 12))}, "plafonds 59,40 €/mois et 626,40 €/an")
tlt3 = repartir_jours_par_mois(230, range(10))
cas("TLT-03", "Total de 230 j connu seulement, 10 mois travaillés : 23 j/mois, plafond mensuel", {"total_jours": 230, "mois_travailles": list(range(10))},
    {"jours_par_mois": tlt3, "montant": r2(teletravail_forfait(tlt3))}, "plafond 59,40 €/mois : 10 × 59,40 = 594 € (et non 621 € par le seul plafond annuel)")
tlt4 = [25, 25, 25, 25] + [0] * 8
cas("TLT-04", "100 j concentrés sur 4 mois : le plafond mensuel réduit le forfait", {"jours_par_mois": tlt4},
    {"montant": r2(teletravail_forfait(tlt4)), "montant_si_reparti_sur_12_mois": r2(teletravail_forfait(repartir_jours_par_mois(100)))}, "plafond 59,40 €/mois")

# --- Matériel ---
cas("MAT-01", "Ordinateur 450 € HT, usage pro 60 %", {"prix_ht": 450, "usage_pro": 0.6}, {"montant": r2(materiel(450, 0.6))}, "déduction immédiate ≤ 500 € HT")
cas("MAT-02", "Ordinateur 1 200 € HT acheté en juillet, usage pro 50 %", {"prix_ht": 1200, "usage_pro": 0.5, "mois_utilises_annee_achat": 6}, {"montant_annee_1": r2(materiel(1200, 0.5, 6))}, "amortissement 3 ans prorata temporis")

cas("MAT-03", "Ordinateur 1 200 € HT acheté en juillet 2024, usage pro 50 %, revenus 2025 (année pleine)",
    {"prix_ht": 1200, "usage_pro": 0.5, "annee_achat": 2024, "mois_achat": 7, "annee_revenus": 2025},
    {"montant": r2(materiel_annee(1200, 0.5, 2024, 7, 2025))}, "BOI-RSA-BASE-30-50-30-40 §80 : annuité pleine")
cas("MAT-04", "Même ordinateur, revenus 2027 : dernière fraction (6 mois)",
    {"prix_ht": 1200, "usage_pro": 0.5, "annee_achat": 2024, "mois_achat": 7, "annee_revenus": 2027},
    {"montant": r2(materiel_annee(1200, 0.5, 2024, 7, 2027))}, "amortissement prorata temporis")
cas("MAT-05", "Écran 300 € HT acheté en 2024 : rien en 2025", {"prix_ht": 300, "usage_pro": 1, "annee_achat": 2024, "mois_achat": 3, "annee_revenus": 2025},
    {"montant": r2(materiel_annee(300, 1, 2024, 3, 2025))}, "déduction immédiate l'année d'achat seulement")

# --- Télétravail aux frais réels (notice 2041 GP) ---
tr1 = 10000 * part_surface(10, 100) * ratio_local("dedie", 188, 235)
cas("TLR-01", "Pièce réservée au travail, 10 m² sur 100, charges 10 000 €, 4 j/sem (188 j sur 235)",
    {"usage": "dedie", "charges": 10000, "surface_bureau": 10, "surface_totale": 100, "jours_tt": 188, "jours_travailles": 235},
    {"montant": r2(tr1)}, "Notice 2041 GP : usage exclusif 4 j/semaine = 80 %")
tr2 = 10000 * part_surface(10, 100) * ratio_local("mixte", 188, 235)
cas("TLR-02", "Même pièce à usage mixte : 188 j × 12 h / 8 760 h",
    {"usage": "mixte", "charges": 10000, "surface_bureau": 10, "surface_totale": 100, "jours_tt": 188, "jours_travailles": 235},
    {"montant": r2(tr2)}, "Notice 2041 GP : usage mixte, 12 h par journée")
tr3 = 6000 * part_surface(0, 0, studio=True) * ratio_local("mixte", 94, 218)
cas("TLR-03", "Studio, charges 6 000 €, 2 j/sem (94 j) : 50 % de la surface, usage mixte",
    {"usage": "mixte", "studio": True, "charges": 6000, "jours_tt": 94, "jours_travailles": 218},
    {"montant": r2(tr3)}, "Notice 2041 GP : studio, moitié de la surface")

# --- Frais réels de véhicule hors barème ---
cas("VHB-01", "Frais justifiés 9 000 € pour 15 000 km : plafond barème 7 CV", {"km": 15000, "frais_justifies": 9000}, {"montant_retenu": r2(plafond_frais_reels_vehicule(15000, 9000))}, "BOI-RSA-BASE-30-50-30-20 §500-520")

# --- Comparaison complète et résumé 1AK (spécification §10) ---
km_ex = 22 * 2 * 180
f_km = bareme_km(km_ex, cv=5)
f_rep = repas(180, 12)
f_tlt = teletravail_forfait(repartir_jours_par_mois(38))
total_ex = f_km + f_rep + f_tlt + 211
cas("RES-01", "Exemple du résumé 1AK (spécification §10)",
    {"aller_km": 22, "jours_sur_site": 180, "cv": 5, "repas": {"nb": 180, "prix": 12}, "teletravail_jours": 38, "documentation": 211},
    {"km": km_ex, "frais_km": r2(f_km), "repas": r2(f_rep), "teletravail": r2(f_tlt), "total": r2(total_ex),
     "montant_1AK": sum(arrondi_euro(x) for x in (f_km, f_rep, f_tlt, 211))},
    "Spécifications F8 : chaque ligne arrondie à l'euro inférieur, case 1AK = somme des lignes = 5 714 €")

# Déclarant complet : distance > 40 km avec motif, missions, péages, intérêts, titres-restaurant, réintégration.
km_v = 55 * 2 * 150 + 1500
lignes_r2 = [
    bareme_km(km_v, cv=6),            # véhicule
    320.50,                           # péages et parking
    600 * km_v / 20000,               # intérêts × km pro / km totaux
    repas(150, 11.20, 5.00),          # repas avec titres-restaurant
    teletravail_forfait([8] * 11 + [0]),
    180,                              # cotisation syndicale
]
case_r2 = sum(arrondi_euro(x) for x in lignes_r2)
b10, br, g = gain_base_imposable(32000, 750, case_r2)
cas("RES-02", "Déclarant complet : 55 km avec motif, missions, péages, intérêts, titres-restaurant",
    {"salaire_prerempli": 32000, "aller_km": 55, "motif": "emploi du conjoint", "jours_sur_site": 150, "km_missions": 1500,
     "cv": 6, "energie": "essence", "peages_parking": 320.50, "interets_credit": 600, "km_totaux_compteur": 20000,
     "repas": {"nb": 150, "prix": 11.20, "part_employeur_tr": 5.00}, "teletravail_jours_par_mois": [8] * 11 + [0],
     "cotisation_syndicale": 180, "reintegration_titres_restaurant": 750},
    {"km": km_v, "lignes": [arrondi_euro(x) for x in lignes_r2], "montant_1AK": case_r2,
     "base_abattement_10": r2(b10), "base_frais_reels": r2(br), "gain_base": r2(g)},
    "Spécifications F3, F4, F5, F8 ; arrondi à l'euro inférieur par ligne")

# --- Impôt sur le revenu (F7.4, CGI art. 197) ---
cas("IMP-01", "Personne seule, revenu imposable 28 800 € : 1 892 € puis décote", {"revenu": 28800, "couple": False, "enfants": 0},
    {"impot": r2(impot_foyer(28800, False, 0))}, "(28 800 - 11 600) × 11 % = 1 892 ; décote 897 - 45,25 % × 1 892")
cas("IMP-02", "Couple, 2 enfants (3 parts), revenu 60 000 €", {"revenu": 60000, "couple": True, "enfants": 2},
    {"parts": 3, "impot": r2(impot_foyer(60000, True, 2))}, "quotient 20 000 : 924 × 3 = 2 772, plafond non atteint, décote couple")
cas("IMP-03", "Couple, 1 enfant, revenu 150 000 € : plafonnement du quotient familial", {"revenu": 150000, "couple": True, "enfants": 1},
    {"impot": r2(impot_foyer(150000, True, 1))}, "avantage 3 448 € plafonné à 1 807 € : 31 207,98 - 1 807")
cas("IMP-04", "Parent seul (case T), 1 enfant (2 parts), revenu 40 000 €", {"revenu": 40000, "couple": False, "enfants": 1, "parent_isole": True},
    {"parts": 2, "impot": r2(impot_foyer(40000, False, 1, True))}, "plafond 4 262 € pour les deux premières demi-parts, décote personne seule")
cas("IMP-05", "Personne seule, revenu 13 000 € : impôt effacé par la décote", {"revenu": 13000, "couple": False, "enfants": 0},
    {"impot": r2(impot_foyer(13000, False, 0))}, "décote supérieure à l'impôt brut")
cas("IMP-07", "Veuf, 1 enfant (2,5 parts), revenu 100 000 € : plafonnement puis réduction complémentaire", {"revenu": 100000, "couple": False, "enfants": 1, "veuf": True},
    {"parts": 2.5, "impot": r2(impot_foyer(100000, False, 1, veuf=True))}, "CGI art. 194 I et 197 I-2 : plafond 1 807 € × 3 demi-parts, réduction complémentaire 2 011 € au plus")
cas("IMP-08", "Veuve, 2 enfants (3 parts), revenu 60 000 € : réduction complémentaire limitée à la hausse", {"revenu": 60000, "couple": False, "enfants": 2, "veuf": True},
    {"parts": 3, "impot": r2(impot_foyer(60000, False, 2, veuf=True))}, "924 × 3 = 2 772 ; 1 part : 11 103,99 - 4 × 1 807 = 3 875,99 ; hausse 1 103,99 < 2 011 : impôt 2 772")
cas("IMP-06", "Exemple de la spécification : gain d'impôt d'une personne seule", {"base_abattement": 28800, "base_frais_reels": 26286, "couple": False, "enfants": 0},
    {"gain_impot": r2(impot_foyer(28800, False, 0) - impot_foyer(26286, False, 0))}, "IMP-01 moins impôt sur 26 286 €")

# --- Aide à domicile ADMR (spécification F13) ---
km_admr = 40 * 200
reint_admr = 15 * 200 * 0.38
frais_admr = bareme_km(km_admr, cv=4)
b10, br, g = gain_base_imposable(18000, reint_admr, frais_admr)
cas("ADM-01", "Aide à domicile ADMR, 40 km/jour dont 15 km remboursés, 200 jours, 4 CV, salaire 18 000 €",
    {"km_par_jour": 40, "km_rembourses_par_jour": 15, "jours": 200, "cv": 4, "taux_ik": 0.38, "salaire_prerempli": 18000},
    {"km_annuels": km_admr, "frais_reels": r2(frais_admr), "reintegration": r2(reint_admr), "base_abattement_10": r2(b10), "base_frais_reels": r2(br), "gain_base": r2(g)},
    "Spécifications F13 : 4 050 € ; 1 140 € ; gain 1 110 €")
frais_admr2 = frais_admr + repas(200, None)
b10, br, g = gain_base_imposable(18000, reint_admr, frais_admr2)
cas("ADM-02", "Même cas + forfait repas 5,45 € × 200", {"base": "ADM-01", "repas_forfait": 200},
    {"frais_reels": r2(frais_admr2), "gain_base": r2(g)}, "Spécifications F13 : gain 2 200 €")
km_mand = 742 * 12
cas("ADM-03", "Auxiliaire de vie via mandataire : 742 km/mois, forfaits 156,75 €/mois, 4 CV (témoignage)",
    {"km_par_mois": 742, "mois": 12, "forfaits_transport_par_mois": 156.75, "cv": 4},
    {"km_annuels": km_mand, "frais_reels": r2(bareme_km(km_mand, cv=4)), "reintegration": r2(156.75 * 12)},
    "Spécifications F13, cas de test n° 2")

# --- Seuils de rentabilité thermique / électrique (5 CV, 218 jours, km seuls) ---
for s in (20000, 25000, 30000, 40000):
    res = {}
    for ev in (False, True):
        k = 1
        while bareme_km(k * 2 * 218, cv=5, electrique=ev) <= abattement(s):
            k += 1
        res["electrique" if ev else "thermique"] = k
    cas(f"SEU-{s}", f"Distance aller minimale pour battre le 10 %, salaire {s} €", {"salaire": s, "cv": 5, "jours": 218},
        {"km_aller_min": res}, "Simulation du 14/10/2026")

# --- Mode foyer (ajout n° 1) ---
cas("FOY-01", "Couple : déclarant 1 à 45 km, conjoint à 10 km → motif « emploi du conjoint » proposé, 45 km retenus",
    {"aller_moi": 45, "aller_conjoint": 10},
    {"motif_propose": motif_emploi_conjoint_propose(45, 10), "distance_retenue": distance_retenue(45, motif_emploi_conjoint_propose(45, 10))},
    "Ajout n° 1, test 1 ; F10")
cas("FOY-02", "Couple : les deux à plus de 40 km sans autre motif → 40 km chacun",
    {"aller_moi": 55, "aller_conjoint": 48},
    {"motif_propose_1": motif_emploi_conjoint_propose(55, 48), "motif_propose_2": motif_emploi_conjoint_propose(48, 55),
     "distance_retenue_1": distance_retenue(55), "distance_retenue_2": distance_retenue(48)},
    "Ajout n° 1, test 2")
foy3, foy3_best = combinaisons_foyer((30000, 0, 5000), (25000, 0, 1000))
cas("FOY-03", "Couple sans enfant : déclarant 1 à 5 000 € de frais réels, déclarant 2 à 1 000 € → réels / 10 %",
    {"declarant_1": {"salaire": 30000, "reintegrations": 0, "frais_reels": 5000}, "declarant_2": {"salaire": 25000, "reintegrations": 0, "frais_reels": 1000}, "enfants": 0},
    {"combinaisons": [{"reels_1": c["reels_1"], "reels_2": c["reels_2"], "base_1": r2(c["base_1"]), "base_2": r2(c["base_2"]), "impot": r2(c["impot"])} for c in foy3],
     "meilleure": {"reels_1": foy3_best["reels_1"], "reels_2": foy3_best["reels_2"]}},
    "Ajout n° 1, test 3 : abattement et frais réels choisis séparément, impôt calculé sur le foyer")
cas("FOY-04", "Couple : salaires 3 000 € et 60 000 € → abattements 509 € et 6 000 €, calculés séparément",
    {"salaires": [3000, 60000]}, {"abattements": [r2(abattement(3000)), r2(abattement(60000))]}, "Ajout n° 1, test 4")
foy5 = vehicule_partage(6000, 4000, cv=5)
cas("FOY-05", "Voiture 5 CV partagée : 6 000 km (conjoint 1) + 4 000 km (conjoint 2)",
    {"km_1": 6000, "km_2": 4000, "cv": 5},
    {"methode": foy5[0], "montants": [r2(x) for x in foy5[1]], "total": r2(sum(foy5[1]))},
    "Ajout n° 1, test 5 : barème sur 10 000 km = 4 965 €, réparti 2 979 € / 1 986 € (séparément : 3 537 + 2 544 = 6 081 €)")
foy6_1 = covoiturage_conjugal_km(25, 210, 0)
foy6_2 = covoiturage_conjugal_km(25, 210, 42)
cas("FOY-06", "Covoiturage conjugal : 25 km, 210 jours, ensemble 42 jours, conducteur = conjoint 1, deux voitures 5 CV",
    {"aller_km": 25, "jours": 210, "jours_ensemble": 42, "conducteur": 1, "cv": 5},
    {"km_1": foy6_1, "km_2": foy6_2, "montant_1": r2(bareme_km(foy6_1, cv=5)), "montant_2": r2(bareme_km(foy6_2, cv=5))},
    "Ajout n° 1, test 6 : 10 500 km soit 5 143,50 € ; 8 400 km soit 4 393,80 €")
cas("FOY-07", "Passager d'un covoiturage hors du foyer : 1 200 € payés au conducteur, 25 km",
    {"montant_paye": 1200, "aller_km": 25}, {"montant": r2(covoiturage_passager(1200, 25))},
    "Ajout n° 1, test 7 ; LFR 2022 art. 20")
cas("FOY-09", "Passager hors du foyer à 60 km sans motif : 1 200 € ramenés au prorata de 40 km",
    {"montant_paye": 1200, "aller_km": 60}, {"montant": r2(covoiturage_passager(1200, 60))},
    "Ajout n° 1 : règle des 40 km applicable au passager ; prorata = règle FraisFit à confirmer par la DGFiP")
cas("FOY-08", "Conducteur d'un covoiturage : barème 4 965 € (10 000 km, 5 CV), 900 € de participations reçues",
    {"km": 10000, "cv": 5, "participations": 900}, {"montant": r2(covoiturage_conducteur(bareme_km(10000, cv=5), 900))},
    "Ajout n° 1, test 8 : 4 065 €")

# --- Parcours métier (F14) : quatre cas demandés par la spécification avant développement ---
# Chiffres d'exemple (distances, jours, loyers) choisis pour être réalistes ; règles et barèmes lus dans les paramètres.
def total_1ak(lignes):
    return sum(arrondi_euro(x) for x in lignes)


# MET-01 : infirmière de nuit en 12 h, sans transport en commun la nuit.
met1_km = distance_retenue(18) * 2 * 134
met1 = [bareme_km(met1_km, cv=5), repas(134, None), 90, 30]
met1_case = total_1ak(met1)
b10, br, g = gain_base_imposable(31000, 0, met1_case)
cas("MET-01", "Infirmière de nuit en 12 h : 134 nuits, 18 km, voiture 5 CV, repas de nuit au forfait, tenues lavées par l'employeur",
    {"salaire_prerempli": 31000, "aller_km": 18, "jours_sur_site": 134, "cv": 5, "repas_forfait": 134,
     "chaussures_de_travail": 90, "cotisation_ordre": 30},
    {"km": met1_km, "lignes": [arrondi_euro(x) for x in met1], "montant_1AK": met1_case, "gain_base": r2(g)},
    "F14 soignant : repas de nuit sans restauration ouverte = forfait ; employeur qui lave les tenues = seul l'achat compte")

# MET-02 : infirmière de SSIAD, journée type maison → 3 patients → maison.
met2_dt = distance_retenue(8) + distance_retenue(10)
met2_pro = 5 + 6
met2_km = (met2_dt + met2_pro) * 200
met2 = [bareme_km(met2_km, cv=4), repas(200, None)]
met2_case = total_1ak(met2)
b10, br, g = gain_base_imposable(24000, 0, met2_case)
cas("MET-02", "Infirmière de SSIAD : journée type 8 + 5 + 6 + 10 km, 200 jours, voiture 4 CV, repas au forfait",
    {"salaire_prerempli": 24000, "troncons": [8, 5, 6, 10], "jours": 200, "cv": 4, "repas_forfait": 200},
    {"km": met2_km, "km_domicile_travail": met2_dt * 200, "km_professionnels": met2_pro * 200,
     "lignes": [arrondi_euro(x) for x in met2], "montant_1AK": met2_case, "gain_base": r2(g)},
    "F14 soignant + F13 : soins à domicile, premier et dernier tronçon en domicile-travail, tronçons entre patients en professionnel")

# MET-03 : professeur des écoles remplaçant sur trois écoles, emploi mobile.
met3_km = km_plusieurs_employeurs([(12, 60), (25, 50), (45, 70)], motif=True)
met3 = [bareme_km(met3_km, cv=5), 120, 150]
met3_case = total_1ak(met3)
b10, br, g = gain_base_imposable(28000, 1800, met3_case)
cas("MET-03", "Professeur des écoles remplaçant : écoles à 12 km (60 j), 25 km (50 j), 45 km (70 j), emploi mobile, ISSR 1 800 € à réintégrer",
    {"salaire_prerempli": 28000, "trajets": [[12, 60], [25, 50], [45, 70]], "motif": "emploi précaire ou mobile", "cv": 5,
     "documentation": 120, "cotisation_syndicale": 150, "reintegration_issr": 1800},
    {"km": met3_km, "lignes": [arrondi_euro(x) for x in met3], "montant_1AK": met3_case,
     "base_abattement_10": r2(b10), "base_frais_reels": r2(br), "gain_base": r2(g)},
    "F14 enseignant : trajets réels vers chaque établissement au même barème ; indemnité de sujétion de remplacement réintégrée")

# MET-04 : professeur de collège muté à 400 km, double résidence.
met4_km = distance_retenue(3) * 2 * 175 + 400 * 2 * 34
met4 = [bareme_km(met4_km, cv=6), 450 * 10, 900]
met4_case = total_1ak(met4)
b10, br, g = gain_base_imposable(32000, 0, met4_case)
cas("MET-04", "Professeur de collège muté à 400 km : 3 km sur place (175 j), 34 retours au domicile familial, voiture 6 CV, loyer 450 € × 10 mois, déménagement 900 €",
    {"salaire_prerempli": 32000, "aller_km": 3, "jours_sur_site": 175, "km_double_residence": 400 * 2 * 34, "cv": 6,
     "loyer_second_logement": 4500, "demenagement": 900},
    {"km": met4_km, "lignes": [arrondi_euro(x) for x in met4], "montant_1AK": met4_case, "gain_base": r2(g)},
    "F14 grand rouleur / double résidence : trajets hebdomadaires ajoutés au même véhicule avant le barème (BOI-RSA-BASE-30-50-30-20)")

# --- Bureau à domicile hors télétravail (F6.11, enseignant) ---
cas("LOC-01", "Bureau réservé au travail : 10 m² sur 100, charges 10 000 €", {"usage": "dedie", "charges": 10000, "surface_bureau": 10, "surface_totale": 100},
    {"montant": r2(local_professionnel(10000, 10, 100, "dedie"))}, "Guide SE-UNSA 2025 : maison de 100 m², bureau de 10 m², 10 % des factures")
cas("LOC-02", "Pièce à usage mixte : 12 m² sur 80, charges 9 000 €, 6 h par semaine sur 36 semaines",
    {"usage": "mixte", "charges": 9000, "surface_bureau": 12, "surface_totale": 80, "heures_par_semaine": 6, "semaines": 36},
    {"montant": r2(local_professionnel(9000, 12, 80, "mixte", 6, 36))}, "F5.3 appliqué aux heures de travail à domicile : 9 000 × 15 % × 216 / 8 760")


if __name__ == "__main__":
    out = os.path.join(ICI, "cas-de-test.json")
    json.dump({"millesime": "revenus-2025", "tolerance_euros": 0.01, "cas": CAS}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    # Contrôles contre les exemples officiels
    assert r2(bareme_km(4000, cv=6)) == 2660.0
    assert r2(bareme_km(6000, cv=5)) == 3537.0
    assert r2(bareme_km(4000, cv=6, electrique=True)) == 3192.0
    assert r2(bareme_km(6000, cv=5, electrique=True)) == 4242.0
    assert arrondi_euro(bareme_km(5900, "moto", 6)) == 2049
    assert arrondi_euro(bareme_km(5900, "moto", 6, True)) == 2460  # 2 460,50 € exactement
    assert r2(bareme_km(8000, cv=4)) == 4050.0
    assert r2(bareme_km(25000, cv=7)) == 11750.0
    assert km_emp == 13200 and km_emp2 == 15400
    assert cho == (20700, 20500, 200)
    assert r2(repas(218, 12)) == 1427.90
    assert r2(repas(218, 12, 4.5)) == 446.90
    assert r2(repas(1, 12, 0, 6)) == 0.55
    assert r2(repas(200, 12, 0, 7)) == 310.0
    assert r2(repas(218, 10)) == 991.90  # l'article source annonce 991,60 € par erreur
    assert r2(teletravail_forfait(tlt3)) == 594.0
    assert r2(teletravail_forfait(tlt4)) == 237.6
    assert sum(arrondi_euro(x) for x in (f_km, f_rep, f_tlt, 211)) == 5714
    assert r2(materiel_annee(1200, 0.5, 2024, 7, 2024)) == r2(materiel(1200, 0.5, 6))  # cohérent avec MAT-02
    assert r2(materiel_annee(1200, 0.5, 2024, 7, 2025)) == 200.0
    assert r2(materiel_annee(1200, 0.5, 2024, 7, 2027)) == 100.0
    assert r2(tr1) == 800.0
    assert r2(impot_foyer(28800, False, 0)) == 1851.13
    assert r2(impot_foyer(60000, True, 2)) == 2543.33
    assert r2(impot_foyer(150000, True, 1)) == 29400.98
    assert r2(impot_foyer(40000, False, 1, True)) == 1787.22
    assert impot_foyer(13000, False, 0) == 0.0
    assert r2(impot_foyer(100000, False, 1, veuf=True)) == 17368.52
    assert r2(impot_foyer(60000, False, 2, veuf=True)) == 2772.0
    assert foy5 == ("prorata", [2979.0, 1986.0])
    assert r2(bareme_km(foy6_1, cv=5)) == 5143.5 and r2(bareme_km(foy6_2, cv=5)) == 4393.8
    assert r2(covoiturage_conducteur(bareme_km(10000, cv=5), 900)) == 4065.0
    assert (foy3_best["reels_1"], foy3_best["reels_2"]) == (True, False)
    assert r2(local_professionnel(10000, 10, 100, "dedie")) == 1000.0
    print(f"{len(CAS)} cas écrits dans {out} ; tous les exemples officiels sont retrouvés.")
