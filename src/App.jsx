import { useState, useEffect, useMemo, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════
   BARÈMES DGFIP 2026 — revenus 2025 (GP 120)
═══════════════════════════════════════════════════════════════════ */
const BK = {
  voiture: {
    3:[[5000,.529,0],[20000,.316,1065],[Infinity,.370,0]],
    4:[[5000,.606,0],[20000,.340,1330],[Infinity,.407,0]],
    5:[[5000,.636,0],[20000,.357,1395],[Infinity,.427,0]],
    6:[[5000,.665,0],[20000,.374,1457],[Infinity,.447,0]],
    7:[[5000,.697,0],[20000,.394,1515],[Infinity,.470,0]],
  },
  moto: {
    1:[[3000,.395,0],[6000,.099,891],[Infinity,.248,0]],
    2:[[3000,.468,0],[6000,.082,1158],[Infinity,.275,0]],
    3:[[3000,.606,0],[6000,.079,1583],[Infinity,.343,0]],
    5:[[3000,.606,0],[6000,.079,1583],[Infinity,.343,0]],
  },
  cyclo:{1:[[3000,.299,0],[6000,.071,684],[Infinity,.185,0]]},
};

function calcKm(type,cv,km,elec){
  const bk=BK[type]||BK.voiture;
  const cap=type==="voiture"?Math.min(+cv,7):type==="moto"?Math.min(+cv,5):1;
  const tr=bk[cap]||bk[Object.keys(bk)[0]];
  let m=0;
  for(const[max,coef,plus]of tr){if(km<=max){m=coef*km+plus;break;}if(max===Infinity)m=coef*km;}
  return Math.round((elec?m*1.2:m)*100)/100;
}

const REPAS_FOYER=5.45;
const JOURS_STD=218;
const KM_MAX=40;

function ff(n){return(Math.round(n*100)/100).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2});}

/* ═══════════════════════════════════════════════════════════════════
   ARBRE DE QUESTIONS
═══════════════════════════════════════════════════════════════════ */
const SECTIONS=[
  {
    id:"profil",label:"Profil professionnel",icon:"👤",
    questions:[
      {id:"statut",q:"Quel est votre statut professionnel ?",type:"sel",opts:[
        {v:"salarie",l:"Salarié (CDI / CDD)"},{v:"cadre",l:"Cadre (convention cadre)"},
        {v:"vrp",l:"VRP (Voyageur Représentant Placier)"},{v:"multi",l:"Multi-employeurs"},
        {v:"fonctionnaire",l:"Fonctionnaire / Agent public"},{v:"apprenti",l:"Apprenti / alternant"},
      ]},
      {id:"secteur",q:"Secteur d'activité ?",type:"sel",opts:[
        {v:"bureau",l:"Bureau / administration"},{v:"terrain",l:"Commerce / terrain / itinérant"},
        {v:"sante",l:"Santé / médico-social"},{v:"education",l:"Éducation / formation"},
        {v:"btp",l:"BTP / artisanat"},{v:"it",l:"Informatique / tech"},{v:"autre",l:"Autre"},
      ]},
      {id:"salaire",q:"Salaire net imposable 2025 (case 1AJ) ?",type:"num",unit:"€",ph:"Ex : 35 000",
        hint:"Visible sur votre bulletin de décembre ou pré-rempli sur impots.gouv.fr."},
      {id:"primes",q:"Avez-vous perçu des primes ou indemnités imposables en 2025 ?",type:"bool",
        hint:"Primes de performance, 13e mois, intéressement imposable… Elles s'ajoutent à la base de comparaison."},
      {id:"primes_mt",q:"Montant total des primes et indemnités imposables ?",type:"num",unit:"€",ph:"Ex : 3 000",
        cond:d=>d.primes===true},
      {id:"multi_salaires",q:"Avez-vous travaillé pour plusieurs employeurs en 2025 ?",type:"bool",
        hint:"Si oui, additionnez tous vos salaires nets imposables pour la case 1AJ."},
    ]
  },
  {
    id:"transport",label:"Domicile ↔ Travail",icon:"🚗",
    questions:[
      {id:"jours",q:"Nombre de jours travaillés en 2025 ?",type:"num",unit:"jours",ph:"218",def:218,
        hint:"Temps plein = 218 jours. Réduisez si temps partiel, arrêt maladie, chômage partiel."},
      {id:"jours_tt",q:"Dont jours de télétravail (non-déplacement) ?",type:"num",unit:"jours",ph:"0",def:0,
        hint:"Ces jours sont déduits du calcul kilométrique mais ouvrent droit à d'autres déductions."},
      {id:"vehicule",q:"Moyen de transport principal domicile-travail ?",type:"sel",opts:[
        {v:"voiture",l:"🚗 Voiture"},{v:"moto",l:"🏍️ Moto / scooter > 50 cm³"},
        {v:"cyclo",l:"🛵 Cyclomoteur ≤ 50 cm³"},{v:"tc",l:"🚆 Transports en commun"},
        {v:"velo",l:"🚲 Vélo / trottinette"},{v:"mixte",l:"🔀 Combinaison (véhicule + TC)"},
      ]},
      {id:"electrique",q:"Votre véhicule est-il 100 % électrique ?",type:"bool",
        hint:"Majoration de 20 % sur le barème kilométrique.",
        cond:d=>["voiture","moto","cyclo"].includes(d.vehicule)},
      {id:"cv",q:"Puissance fiscale de votre véhicule (CV) ?",type:"sel",
        opts:d=>d.vehicule==="voiture"?[3,4,5,6,7].map(v=>({v,l:`${v} CV${v===7?" ou plus":""}`}))
                :d.vehicule==="moto"?[1,2,3,5].map(v=>({v,l:`${v} CV${v===5?" ou plus":""}`}))
                :[{v:1,l:"Cyclomoteur"}],
        hint:"Carte grise, case P.6. Plafonné à 7 CV (voiture) ou 5 CV (moto).",
        cond:d=>["voiture","moto","cyclo"].includes(d.vehicule)},
      {id:"carburant",q:"Type de carburant ?",type:"sel",
        opts:[{v:"essence",l:"Essence"},{v:"diesel",l:"Diesel"},{v:"hybride",l:"Hybride"},{v:"gpl",l:"GPL / GNV"},{v:"hydrogene",l:"Hydrogène"}],
        cond:d=>["voiture","moto","cyclo"].includes(d.vehicule)&&d.electrique!==true},
      {id:"leasing",q:"Votre véhicule est-il en LOA / LLD ?",type:"bool",
        hint:"Si oui, vous ne déduisez pas les mensualités — uniquement le barème kilométrique s'applique.",
        cond:d=>["voiture","moto","cyclo"].includes(d.vehicule)},
      {id:"distance",q:"Distance domicile → lieu de travail (aller simple) ?",type:"num",unit:"km",ph:"Ex : 25",
        hint:"Plafond de 40 km sauf motif justifié.",
        cond:d=>["voiture","moto","cyclo"].includes(d.vehicule)},
      {id:"justif_dist",q:"Votre trajet dépasse 40 km — quel motif justifie cet éloignement ?",type:"sel",opts:[
        {v:"mutation",l:"Mutation géographique imposée par l'employeur"},
        {v:"precaire",l:"Emploi précaire : CDD, missions variables, lieu changeant"},
        {v:"conjoint",l:"Conjoint travaille à < 40 km du domicile commun"},
        {v:"sante",l:"État de santé du salarié ou d'un proche"},
        {v:"elu",l:"Mandat d'élu local sur le territoire de résidence"},
        {v:"logement",l:"Coût du logement hors de proportion avec les revenus"},
        {v:"aucun",l:"Aucun motif justifiable — limitation à 40 km"},
      ],cond:d=>["voiture","moto","cyclo"].includes(d.vehicule)&&(+d.distance)>KM_MAX,
        hint:"BOFiP BOI-RSA-BASE-30-50-30-20. Le motif doit figurer en informations complémentaires."},
      {id:"double_ar",q:"Rentrez-vous déjeuner chez vous le midi (double A/R quotidien) ?",type:"bool",
        hint:"Second A/R admis si : problème de santé, proche dépendant, horaires atypiques matin + soir.",
        cond:d=>["voiture","moto","cyclo"].includes(d.vehicule)},
      {id:"horaires_atypiques",q:"Travaillez-vous en horaires atypiques (nuit, très tôt, très tard) ?",type:"bool",
        hint:"Les transports en commun indisponibles peuvent justifier l'usage du véhicule."},
      {id:"transport_dispo",q:"Des transports en commun desservent-ils votre trajet domicile-travail ?",type:"bool",
        hint:"Si non, l'usage du véhicule personnel est admis sans justification particulière."},
      {id:"tc_mt",q:"Abonnements transports en commun annuels (part à votre charge) ?",type:"num",unit:"€",ph:"Ex : 720",def:0,
        hint:"Déduisez la participation obligatoire de l'employeur (50 % minimum légal).",
        cond:d=>["tc","mixte"].includes(d.vehicule)},
      {id:"peages",q:"Péages annuels payés pour aller au travail ?",type:"num",unit:"€",ph:"Ex : 480",def:0,
        hint:"Hors barème kilométrique — cumulable en supplément. Relevés télépéage recommandés.",
        cond:d=>["voiture","moto","cyclo","mixte"].includes(d.vehicule)},
      {id:"parking",q:"Frais de stationnement annuels sur votre lieu de travail ?",type:"num",unit:"€",ph:"Ex : 720",def:0,
        hint:"Hors barème kilométrique — déductible en supplément.",
        cond:d=>["voiture","moto","cyclo","mixte"].includes(d.vehicule)},
    ]
  },
  {
    id:"teletravail",label:"Télétravail & bureau",icon:"🏠",
    questions:[
      {id:"tt_semaine",q:"Nombre de jours de télétravail par semaine (en moyenne) ?",type:"sel",
        opts:[0,1,2,3,4,5].map(v=>({v,l:`${v} jour${v>1?"s":""} / semaine`})),def:0,
        hint:"Forfait DGFiP : 2,60 €/jour. Ou quote-part réelle bureau si plus avantageux."},
      {id:"accord_tt",q:"Disposez-vous d'un accord de télétravail écrit avec votre employeur ?",type:"bool",
        hint:"Très fortement recommandé en cas de contrôle fiscal.",
        cond:d=>(+d.tt_semaine)>0},
      {id:"bureau_dedie",q:"Disposez-vous d'une pièce entièrement dédiée au bureau ?",type:"bool",
        hint:"Si oui, la quote-part loyer + charges peut être déduite — souvent plus avantageux que le forfait.",
        cond:d=>(+d.tt_semaine)>0},
      {id:"bureau_m2",q:"Surface de votre pièce bureau (m²) ?",type:"num",unit:"m²",ph:"Ex : 12",
        cond:d=>d.bureau_dedie===true},
      {id:"lgt_m2",q:"Surface totale de votre logement (m²) ?",type:"num",unit:"m²",ph:"Ex : 75",
        cond:d=>d.bureau_dedie===true},
      {id:"loyer_an",q:"Loyer annuel + charges locatives (ou valeur locative si propriétaire) ?",type:"num",unit:"€",ph:"Ex : 12 000",
        hint:"Propriétaire : estimez la valeur locative de marché.",
        cond:d=>d.bureau_dedie===true},
      {id:"electricite_an",q:"Factures d'électricité annuelles ?",type:"num",unit:"€",ph:"Ex : 1 200",def:0,
        hint:"La quote-part professionnelle sera calculée automatiquement.",
        cond:d=>(+d.tt_semaine)>0},
      {id:"chauffage_an",q:"Factures de chauffage / gaz annuelles ?",type:"num",unit:"€",ph:"Ex : 800",def:0,
        cond:d=>(+d.tt_semaine)>0},
      {id:"inet_an",q:"Abonnement internet annuel (part professionnelle estimée) ?",type:"num",unit:"€",ph:"Ex : 240",def:0,
        hint:"Usage mixte : proratisez selon vos jours de télétravail.",
        cond:d=>(+d.tt_semaine)>0},
      {id:"tel_an",q:"Abonnement téléphonique annuel (part professionnelle) ?",type:"num",unit:"€",ph:"Ex : 120",def:0,
        cond:d=>(+d.tt_semaine)>0},
      {id:"coworking",q:"Frais de coworking en 2025 ?",type:"num",unit:"€",ph:"0",def:0,
        hint:"Espaces de coworking payés de votre poche, non remboursés par l'employeur."},
    ]
  },
  {
    id:"repas",label:"Frais de repas",icon:"🍽️",
    questions:[
      {id:"repas_sit",q:"Quelle est votre situation habituelle pour le repas du midi ?",type:"sel",opts:[
        {v:"restau",l:"🍽️ Restaurant à mes frais (sans cantine ni TR)"},
        {v:"cantine",l:"🏢 Cantine / restaurant d'entreprise"},
        {v:"gamelle",l:"🥡 Gamelle (éloignement ou absence de cantine)"},
        {v:"tr_restau",l:"🎟️ Titres-restaurant + restaurant"},
        {v:"tr_gamelle",l:"🎟️ Titres-restaurant + gamelle"},
        {v:"domicile",l:"🏠 Je rentre déjeuner chez moi"},
        {v:"depl",l:"🚀 Repas en déplacement professionnel"},
      ]},
      {id:"repas_cout",q:"Coût moyen de votre repas du midi (ce que VOUS payez) ?",type:"num",unit:"€",ph:"Ex : 12",
        hint:`Le forfait repas à domicile (${REPAS_FOYER} € en 2025) sera déduit — seul l'excédent est déductible.`,
        cond:d=>["restau","cantine","depl"].includes(d.repas_sit)},
      {id:"tr_valeur",q:"Valeur faciale de vos titres-restaurant ?",type:"num",unit:"€",ph:"Ex : 9",
        cond:d=>["tr_restau","tr_gamelle"].includes(d.repas_sit)},
      {id:"tr_emp_pct",q:"Part financée par votre employeur sur les titres-restaurant ?",type:"sel",
        opts:[50,51,52,53,54,55,56,57,58,59,60].map(v=>({v,l:`${v}%`})),def:50,
        hint:"Entre 50 % et 60 % légalement. Cette part est NON déductible.",
        cond:d=>["tr_restau","tr_gamelle"].includes(d.repas_sit)},
      {id:"tr_cout_restau",q:"Coût moyen de votre repas au restaurant (avec titres-restaurant) ?",type:"num",unit:"€",ph:"Ex : 12",
        cond:d=>d.repas_sit==="tr_restau"},

      /* ── Remboursement repas employeur — montant fixe OU pourcentage ── */
      {id:"indem_repas",q:"Votre employeur vous verse-t-il des indemnités / paniers repas ?",type:"bool",
        hint:"⚠️ Ces indemnités doivent être réintégrées dans votre salaire imposable si vous optez pour les frais réels."},
      {id:"indem_mode",q:"Comment l'employeur prend-il en charge vos repas ?",type:"sel",opts:[
        {v:"fixe",l:"💶 Montant fixe par jour (panier repas, indemnité en €)"},
        {v:"pct", l:"📊 Pourcentage du coût réel de votre repas"},
      ],cond:d=>d.indem_repas===true,
        hint:"Choisissez le mode qui figure sur votre contrat ou vos bulletins de salaire."},
      {id:"indem_fixe_jour",q:"Montant de l'indemnité repas versée par jour (€) ?",type:"num",unit:"€/j",ph:"Ex : 6.50",
        hint:"Sera multiplié par votre nombre de jours travaillés pour la réintégration annuelle.",
        cond:d=>d.indem_repas===true&&d.indem_mode==="fixe"},
      {id:"indem_pct",q:"Quel pourcentage du coût du repas l'employeur rembourse-t-il ?",type:"sel",
        opts:[5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80].map(v=>({v,l:`${v}%`})),
        hint:"Ce pourcentage sera appliqué au coût moyen de votre repas pour calculer la réintégration annuelle.",
        cond:d=>d.indem_repas===true&&d.indem_mode==="pct"},
      {id:"repas_avantage_nature",q:"L'employeur offre-t-il des repas sans retenue sur salaire ?",type:"bool",
        hint:"Ces repas constituent un avantage en nature (5,45 €/repas en 2025) imposable — à réintégrer."},
    ]
  },
  {
    id:"double_res",label:"Double résidence",icon:"🏘️",
    questions:[
      {id:"double_res_oui",q:"Maintenez-vous une résidence secondaire pour raisons professionnelles ?",type:"bool",
        hint:"Fort levier fiscal. Déductible si vous ne pouvez raisonnablement rentrer chaque soir."},
      {id:"dres_motif",q:"Quel motif justifie cette double résidence ?",type:"sel",opts:[
        {v:"distance",l:"Distance excessive rendant le retour quotidien impossible"},
        {v:"conjoint_travail",l:"Conjoint travaillant sur le lieu de la résidence principale"},
        {v:"enfants",l:"Enfants scolarisés à la résidence principale"},
        {v:"horaires",l:"Horaires de travail incompatibles avec les transports"},
        {v:"mutation",l:"Mutation imposée sans déménagement de la famille"},
      ],cond:d=>d.double_res_oui===true},
      {id:"dres_loyer",q:"Loyer annuel de la résidence secondaire professionnelle ?",type:"num",unit:"€",ph:"Ex : 7 200",
        cond:d=>d.double_res_oui===true},
      {id:"dres_charges",q:"Charges annuelles (eau, énergie, entretien) de la résidence secondaire ?",type:"num",unit:"€",ph:"Ex : 1 200",def:0,
        cond:d=>d.double_res_oui===true},
      {id:"dres_transport_hebdo",q:"Coût annuel des transports pour rentrer au domicile familial (week-ends) ?",type:"num",unit:"€",ph:"Ex : 2 400",def:0,
        hint:"Un A/R hebdomadaire est généralement admis.",cond:d=>d.double_res_oui===true},
      {id:"dres_attestation",q:"Disposez-vous d'une attestation de l'employeur justifiant la nécessité professionnelle ?",type:"bool",
        hint:"Fortement recommandé. Peut être demandé en cas de contrôle.",cond:d=>d.double_res_oui===true},
    ]
  },
  {
    id:"materiel",label:"Matériel & équipement",icon:"💻",
    questions:[
      {id:"ordi",q:"Avez-vous acheté un ordinateur / tablette à usage professionnel en 2025 ?",type:"bool",
        hint:"Amortissement sur 3 ans (⅓/an) × pourcentage d'usage professionnel."},
      {id:"ordi_mt",q:"Prix d'achat de l'ordinateur / tablette ?",type:"num",unit:"€",ph:"Ex : 1 200",
        cond:d=>d.ordi===true},
      {id:"ordi_pro_pct",q:"Part d'usage professionnel de l'ordinateur ?",type:"sel",
        opts:[100,90,80,75,70,60,50].map(v=>({v,l:`${v}%`})),def:100,cond:d=>d.ordi===true},
      {id:"ecran",q:"Écran(s) additionnel(s) acheté(s) en 2025 ?",type:"num",unit:"€",ph:"0",def:0,
        hint:"Amortissement ⅓/an × % usage pro."},
      {id:"imprimante",q:"Imprimante / scanner achetés en 2025 ?",type:"num",unit:"€",ph:"0",def:0},
      {id:"telephone",q:"Téléphone professionnel acheté en 2025 (part à votre charge) ?",type:"num",unit:"€",ph:"0",def:0,
        hint:"Usage mixte : appliquez le prorata professionnel. Amortissement sur 3 ans."},
      {id:"mobilier_mt",q:"Mobilier de bureau acheté en 2025 (bureau, chaise ergonomique…) ?",type:"num",unit:"€",ph:"0",def:0,
        hint:"Amortissement sur 5 à 10 ans selon la nature du bien."},
      {id:"materiel_remb",q:"L'employeur a-t-il remboursé tout ou partie de ce matériel ?",type:"bool",
        hint:"Seule la part à votre charge réelle est déductible."},
      {id:"materiel_remb_mt",q:"Montant remboursé par l'employeur pour le matériel ?",type:"num",unit:"€",ph:"Ex : 500",
        cond:d=>d.materiel_remb===true},
    ]
  },
  {
    id:"formation",label:"Formation & documentation",icon:"📚",
    questions:[
      {id:"form_mt",q:"Formations professionnelles financées par vous en 2025 ?",type:"num",unit:"€",ph:"0",def:0,
        hint:"Déduisez les remboursements CPF et employeur. Liée à l'emploi actuel ou à une reconversion."},
      {id:"form_transport",q:"Frais de transport pour vous rendre aux formations (hors remboursements) ?",type:"num",unit:"€",ph:"0",def:0,
        cond:d=>(+d.form_mt)>0},
      {id:"form_hebergement",q:"Frais d'hébergement liés aux formations ?",type:"num",unit:"€",ph:"0",def:0,
        cond:d=>(+d.form_mt)>0},
      {id:"doc_mt",q:"Documentation professionnelle (livres, revues, abonnements sectoriels) ?",type:"num",unit:"€",ph:"0",def:0,
        hint:"Ouvrages directement liés à votre profession. Conservez les preuves d'achat."},
      {id:"logiciels",q:"Licences logicielles professionnelles achetées de votre poche ?",type:"num",unit:"€",ph:"0",def:0,
        hint:"Logiciels non fournis par l'employeur, à usage strictement professionnel."},
      {id:"congres",q:"Frais de congrès / salons professionnels à votre charge ?",type:"num",unit:"€",ph:"0",def:0,
        hint:"Inscription, transport, hébergement — part non remboursée."},
    ]
  },
  {
    id:"specifiques",label:"Frais spécifiques",icon:"🔧",
    questions:[
      {id:"vetements",q:"Achetez-vous des vêtements professionnels spécifiques obligatoires ?",type:"bool",
        hint:"Uniforme, blouse, EPI, toge… Les vêtements civils (costume, chemise) ne sont PAS déductibles."},
      {id:"vet_mt",q:"Montant achats + entretien vêtements professionnels en 2025 ?",type:"num",unit:"€",ph:"Ex : 300",
        cond:d=>d.vetements===true},
      {id:"outils",q:"Outils ou matériel professionnel achetés de votre poche en 2025 ?",type:"num",unit:"€",ph:"0",def:0,
        hint:"Outillage BTP, instruments de mesure… non fournis par l'employeur."},
      {id:"assurance_pro",q:"Assurance responsabilité civile professionnelle à votre charge ?",type:"num",unit:"€",ph:"0",def:0,
        hint:"Si non couverte par l'employeur et nécessaire à l'exercice de la profession."},
      {id:"synd_mt",q:"Cotisations syndicales versées en 2025 ?",type:"num",unit:"€",ph:"0",def:0,
        hint:"⚠️ Non cumulable avec la réduction d'impôt de 66 %. Comparez les deux options."},
      {id:"vrp_frais",q:"Frais spécifiques VRP (échantillons, catalogues, matériel de démonstration) ?",type:"num",unit:"€",ph:"0",def:0,
        cond:d=>d.statut==="vrp"},
      {id:"mission_mt",q:"Frais de déplacements professionnels ponctuels (missions, clients) à votre charge ?",type:"num",unit:"€",ph:"0",def:0,
        hint:"Train, avion, hôtel, repas en mission — uniquement la part non remboursée."},
      {id:"recherche_mt",q:"Frais de recherche d'emploi en 2025 ?",type:"num",unit:"€",ph:"0",def:0,
        hint:"Déplacements, formations, CV professionnel… Valable aussi pour demandeurs d'emploi."},
    ]
  },
  {
    id:"remboursements",label:"Remboursements & avantages",icon:"💼",
    questions:[
      {id:"reb_oui",q:"Votre employeur rembourse-t-il tout ou partie de vos frais professionnels ?",type:"bool",
        hint:"Ces remboursements doivent être déduits de vos frais réels pour éviter une double déduction."},
      {id:"reb_mt",q:"Montant total des remboursements de frais par l'employeur en 2025 ?",type:"num",unit:"€",ph:"Ex : 1 500",
        hint:"Incluez : IK, parking, péages, repas, formation, matériel…",cond:d=>d.reb_oui===true},
      {id:"avantage_nature",q:"Bénéficiez-vous d'avantages en nature imposables (voiture de fonction, logement…) ?",type:"bool",
        hint:"Les avantages en nature sont imposables ET peuvent réduire certaines déductions."},
      {id:"avantage_nature_mt",q:"Montant total des avantages en nature (valeur imposable) ?",type:"num",unit:"€",ph:"Ex : 3 000",
        cond:d=>d.avantage_nature===true},
      {id:"voiture_fct",q:"Utilisez-vous une voiture de fonction pour aller au travail ?",type:"bool",
        hint:"⚠️ Voiture de fonction : aucun frais kilométrique domicile-travail ne peut être déduit."},
    ]
  },
];

/* ═══════════════════════════════════════════════════════════════════
   MOTEUR DE CALCUL
═══════════════════════════════════════════════════════════════════ */
function compute(data){
  const items=[],warns=[],opps=[];
  let total=0;
  const jours=Math.max(1,(+data.jours||JOURS_STD)-(+data.jours_tt||0));
  const joursReel=+data.jours||JOURS_STD;

  // KILOMÉTRIQUE
  if(["voiture","moto","cyclo"].includes(data.vehicule)&&(+data.distance)>0&&data.voiture_fct!==true){
    let dist=+data.distance;
    if(dist>KM_MAX&&(!data.justif_dist||data.justif_dist==="aucun")){
      warns.push(`Distance plafonnée à ${KM_MAX} km (réelle : ${data.distance} km — aucun motif valide renseigné)`);
      dist=KM_MAX;
    }
    const ar=data.double_ar===true?2:1;
    const km=dist*2*ar*jours;
    const elec=data.electrique===true;
    const m=calcKm(data.vehicule==="cyclo"?"cyclo":data.vehicule,data.cv||5,km,elec);
    items.push({lab:"Frais kilométriques (barème DGFiP)",mt:m,
      calc:`${km.toLocaleString("fr-FR")} km × barème ${data.cv||5} CV${elec?" ×1,20 (électrique)":""}`,
      km,cv:data.cv,cat:"transport"});
    total+=m;
    if(elec) opps.push({txt:"Majoration +20 % appliquée — véhicule 100 % électrique",score:5});
    if(dist<(+data.distance)&&(+data.distance)>KM_MAX)
      opps.push({txt:`Avec un motif justifié, ${((+data.distance)-dist)*2*ar*jours} km supplémentaires pourraient être déductibles`,score:4});
  }
  if(data.voiture_fct===true) warns.push("Voiture de fonction : aucun frais kilométrique domicile-travail ne peut être déduit.");

  const peages=+data.peages||0;
  if(peages>0){items.push({lab:"Péages autoroute",mt:peages,calc:"Hors barème — justifiés par relevé télépéage",cat:"transport"});total+=peages;}
  const parking=+data.parking||0;
  if(parking>0){items.push({lab:"Parking lieu de travail",mt:parking,calc:"Hors barème — justifiés par reçus / abonnement",cat:"transport"});total+=parking;}
  if(["tc","mixte"].includes(data.vehicule)){
    const tc=+data.tc_mt||0;
    if(tc>0){items.push({lab:"Transports en commun",mt:tc,calc:"Abonnements à votre charge (net remb. employeur 50 %)",cat:"transport"});total+=tc;}
  }

  // REPAS
  let repas=0,rCalc="";
  if(["restau","cantine","depl"].includes(data.repas_sit)){
    const c=+data.repas_cout||0;
    repas=Math.max(0,c-REPAS_FOYER)*joursReel;
    rCalc=`(${c.toFixed(2)} € − ${REPAS_FOYER} € forfait foyer) × ${joursReel} j`;
  } else if(data.repas_sit==="gamelle"){
    repas=REPAS_FOYER*joursReel;
    rCalc=`Forfait gamelle ${REPAS_FOYER} € × ${joursReel} j (sans justificatif)`;
    opps.push({txt:"Gamelle : forfait 5,45 €/j sans justificatif requis",score:3});
  } else if(data.repas_sit==="tr_restau"){
    const c=+data.tr_cout_restau||0,val=+data.tr_valeur||0,pe=(+data.tr_emp_pct||50)/100;
    repas=Math.max(0,c-REPAS_FOYER-val*pe)*joursReel;
    rCalc=`(${c.toFixed(2)} € − ${REPAS_FOYER} € − ${(val*pe).toFixed(2)} € part empl.) × ${joursReel} j`;
  } else if(data.repas_sit==="tr_gamelle"){
    const val=+data.tr_valeur||0,pe=(+data.tr_emp_pct||50)/100;
    repas=Math.max(0,REPAS_FOYER-val*pe)*joursReel;
    rCalc=`(${REPAS_FOYER} € − ${(val*pe).toFixed(2)} € part empl.) × ${joursReel} j`;
  }
  if(repas>0){items.push({lab:"Frais de repas",mt:Math.round(repas*100)/100,calc:rCalc,cat:"repas"});total+=repas;}

  // Indemnités repas — montant fixe OU pourcentage
  let indem=0,indemCalc="";
  if(data.indem_repas){
    if(data.indem_mode==="fixe"){
      const pj=+data.indem_fixe_jour||0;
      indem=Math.round(pj*joursReel*100)/100;
      indemCalc=`${pj.toFixed(2)} €/j × ${joursReel} jours`;
    } else if(data.indem_mode==="pct"){
      const pct=(+data.indem_pct||0)/100;
      const coutRef=+data.repas_cout||+data.tr_cout_restau||REPAS_FOYER;
      indem=Math.round(coutRef*pct*joursReel*100)/100;
      indemCalc=`${data.indem_pct}% × ${coutRef.toFixed(2)} €/j × ${joursReel} jours`;
    }
  }
  if(indem>0){
    items.push({lab:"⚠️ Indemnités repas — réintégration obligatoire case 1AJ",mt:-indem,calc:indemCalc,cat:"repas"});
    total-=indem;
    warns.push(`Indemnités repas employeur (${ff(indem)} €) : à réintégrer case 1AJ — risque de redressement si omis`);
  }

  // TÉLÉTRAVAIL
  const ttJ=+data.tt_semaine||0;
  if(ttJ>0){
    const nbJTT=ttJ*47;
    const forfait=Math.round(nbJTT*2.60*100)/100;
    let qp=0;
    if(data.bureau_dedie&&(+data.bureau_m2)>0&&(+data.lgt_m2)>0&&(+data.loyer_an)>0){
      const ratioS=(+data.bureau_m2)/(+data.lgt_m2);
      const ratioT=ttJ/5;
      qp=(+data.loyer_an)*ratioS*ratioT;
      qp+=(+data.electricite_an||0)*ratioS*ratioT;
      qp+=(+data.chauffage_an||0)*ratioS*ratioT;
      qp+=(+data.inet_an||0);
      qp+=(+data.tel_an||0);
      qp=Math.round(qp*100)/100;
    }
    const mt=Math.round(Math.max(forfait,qp)*100)/100;
    const meth=mt>forfait
      ?`Quote-part bureau ${data.bureau_m2}m²/${data.lgt_m2}m² × ${ttJ}j/sem.`
      :`Forfait DGFiP 2,60 €/j × ${nbJTT} jours TT`;
    items.push({lab:"Bureau à domicile / télétravail",mt,calc:meth,cat:"teletravail"});
    total+=mt;
    if(mt>forfait) opps.push({txt:`Quote-part bureau retenue : ${ff(mt)} € vs forfait ${ff(forfait)} € (+${ff(mt-forfait)} €)`,score:5});
    if((+data.inet_an)>0&&!data.bureau_dedie){items.push({lab:"Internet (part pro)",mt:+data.inet_an,calc:"Abonnement proratisé",cat:"teletravail"});total+=(+data.inet_an);}
    if((+data.tel_an)>0&&!data.bureau_dedie){items.push({lab:"Téléphone (part pro)",mt:+data.tel_an,calc:"Abonnement proratisé",cat:"teletravail"});total+=(+data.tel_an);}
    if((+data.coworking)>0){items.push({lab:"Coworking",mt:+data.coworking,calc:"Espace de travail partagé",cat:"teletravail"});total+=(+data.coworking);}
  }

  // MATÉRIEL
  const matItems=[];
  if(data.ordi&&(+data.ordi_mt)>0){
    const a=Math.round((+data.ordi_mt)/3*((+data.ordi_pro_pct||100)/100)*100)/100;
    matItems.push({lab:"Ordinateur / tablette (amortissement ⅓)",mt:a,calc:`${data.ordi_mt} € ÷ 3 ans × ${data.ordi_pro_pct||100}%`,cat:"materiel"});
    opps.push({txt:"Rappel : ⅓ du matériel déductible également en 2026 et 2027",score:4});
  }
  if((+data.ecran)>0) matItems.push({lab:"Écran(s) additionnel(s) (⅓/an)",mt:Math.round((+data.ecran)/3*100)/100,calc:`${data.ecran} € ÷ 3 ans`,cat:"materiel"});
  if((+data.imprimante)>0) matItems.push({lab:"Imprimante / scanner (⅓/an)",mt:Math.round((+data.imprimante)/3*100)/100,calc:`${data.imprimante} € ÷ 3 ans`,cat:"materiel"});
  if((+data.telephone)>0) matItems.push({lab:"Téléphone pro (⅓/an)",mt:Math.round((+data.telephone)/3*100)/100,calc:`${data.telephone} € ÷ 3 ans`,cat:"materiel"});
  if((+data.mobilier_mt)>0) matItems.push({lab:"Mobilier bureau (~7 ans)",mt:Math.round((+data.mobilier_mt)/7*100)/100,calc:`${data.mobilier_mt} € ÷ 7 ans`,cat:"materiel"});
  const matRem=data.materiel_remb?(+data.materiel_remb_mt||0):0;
  for(const mi of matItems){
    const net=Math.max(0,mi.mt-matRem/matItems.length);
    items.push({...mi,mt:Math.round(net*100)/100});total+=net;
  }

  // DOUBLE RÉSIDENCE
  if(data.double_res_oui){
    const dres=(+data.dres_loyer||0)+(+data.dres_charges||0)+(+data.dres_transport_hebdo||0);
    if(dres>0){
      items.push({lab:"Double résidence professionnelle",mt:Math.round(dres*100)/100,
        calc:`Loyer ${data.dres_loyer||0} € + charges ${data.dres_charges||0} € + transports hebdo ${data.dres_transport_hebdo||0} €`,
        cat:"double_res"});
      total+=dres;
    }
  }

  // FORMATION
  const formTotal=(+data.form_mt||0)+(+data.form_transport||0)+(+data.form_hebergement||0);
  if(formTotal>0){items.push({lab:"Formations professionnelles",mt:Math.round(formTotal*100)/100,calc:`Formation ${data.form_mt||0} € + transport ${data.form_transport||0} € + héberg. ${data.form_hebergement||0} €`,cat:"formation"});total+=formTotal;}
  if((+data.doc_mt)>0){items.push({lab:"Documentation professionnelle",mt:+data.doc_mt,calc:"Livres, revues, abonnements sectoriels",cat:"formation"});total+=(+data.doc_mt);}
  if((+data.logiciels)>0){items.push({lab:"Licences logicielles pro",mt:+data.logiciels,calc:"Logiciels à usage professionnel",cat:"formation"});total+=(+data.logiciels);}
  if((+data.congres)>0){items.push({lab:"Congrès / salons professionnels",mt:+data.congres,calc:"Inscription, transport, hébergement",cat:"formation"});total+=(+data.congres);}

  // SPÉCIFIQUES
  if(data.vetements&&(+data.vet_mt)>0){items.push({lab:"Vêtements professionnels",mt:+data.vet_mt,calc:"Achats + entretien justifiés",cat:"specifique"});total+=(+data.vet_mt);}
  if((+data.outils)>0){items.push({lab:"Outils / matériel professionnel",mt:+data.outils,calc:"Outillage non fourni par l'employeur",cat:"specifique"});total+=(+data.outils);}
  if((+data.assurance_pro)>0){items.push({lab:"Assurance RC professionnelle",mt:+data.assurance_pro,calc:"Part à votre charge",cat:"specifique"});total+=(+data.assurance_pro);}
  if((+data.synd_mt)>0){
    items.push({lab:"Cotisations syndicales",mt:+data.synd_mt,calc:"⚠️ Non cumulable avec réduction 66 %",cat:"specifique"});
    total+=(+data.synd_mt);
    warns.push(`Syndicat : comparez avec la réduction d'impôt 66 % = ${ff(+data.synd_mt*0.66)} € d'économie directe`);
  }
  if(data.statut==="vrp"&&(+data.vrp_frais)>0){items.push({lab:"Frais spécifiques VRP",mt:+data.vrp_frais,calc:"Échantillons, catalogues, matériel demo",cat:"specifique"});total+=(+data.vrp_frais);}
  if((+data.mission_mt)>0){items.push({lab:"Frais de missions professionnelles",mt:+data.mission_mt,calc:"Transport, hébergement, repas — net remb.",cat:"specifique"});total+=(+data.mission_mt);}
  if((+data.recherche_mt)>0){items.push({lab:"Frais de recherche d'emploi",mt:+data.recherche_mt,calc:"Déplacements, CV pro, formations",cat:"specifique"});total+=(+data.recherche_mt);}

  // REMBOURSEMENTS
  if(data.reb_oui&&(+data.reb_mt)>0){
    items.push({lab:"⚠️ Remboursements employeur (à déduire)",mt:-(+data.reb_mt),calc:"Montants déjà perçus",cat:"remb"});
    total-=(+data.reb_mt);
  }

  total=Math.round(total*100)/100;
  const sal=(+data.salaire||0)+(+data.primes_mt||0);
  const ab=Math.round(Math.min(Math.max(sal*.10,495),14171)*100)/100;
  const gain=Math.round((total-ab)*100)/100;

  // OPPORTUNITÉS DÉTECTÉES
  if(!data.double_res_oui&&(+data.distance)>60) opps.push({txt:"Domicile très éloigné (> 60 km) : avez-vous envisagé la déduction de double résidence ?",score:5});
  if((+data.tt_semaine)===0&&data.statut==="it") opps.push({txt:"Secteur IT : si télétravail non déclaré, vérifiez vos droits",score:3});
  if(!data.ordi&&(+data.tt_semaine)>0) opps.push({txt:"Télétravail sans matériel déclaré : avez-vous acheté un ordinateur / écran ?",score:3});
  if(data.statut==="vrp"&&!(+data.vrp_frais)) opps.push({txt:"Statut VRP : des frais spécifiques (échantillons, catalogues) sont souvent déductibles",score:4});

  return{items,warns,opps:opps.sort((a,b)=>b.score-a.score),total,ab,gain,ok:total>ab,sal};
}

/* ═══════════════════════════════════════════════════════════════════
   RÉSUMÉ DÉCLARATION
═══════════════════════════════════════════════════════════════════ */
const MOTIF_DIST={mutation:"mutation géographique imposée par l'employeur",precaire:"emploi précaire (CDD / missions variables)",conjoint:"conjoint travaillant à < 40 km du domicile commun",sante:"état de santé",elu:"mandat d'élu local",logement:"coût du logement disproportionné"};
const MOTIF_DRES={distance:"distance excessive rendant le retour quotidien impossible",conjoint_travail:"conjoint travaillant sur le lieu de la résidence principale",enfants:"enfants scolarisés à la résidence principale",horaires:"horaires incompatibles avec les transports",mutation:"mutation imposée sans déménagement de la famille"};

function makeResume(data,res){
  const km=res.items.find(d=>d.lab.startsWith("Frais kilométriques"));
  const rep=res.items.find(d=>d.lab==="Frais de repas");
  const tt=res.items.find(d=>d.lab==="Bureau à domicile / télétravail");
  const dres=res.items.find(d=>d.lab==="Double résidence professionnelle");
  let t="DÉCLARATION FRAIS RÉELS — CASE 1AK\n";
  t+="Rubrique : Informations complémentaires\n";
  t+="━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  if(km){
    t+=`▸ FRAIS KILOMÉTRIQUES\n`;
    t+=`  Véhicule : ${data.vehicule} — ${km.cv} CV fiscal${data.electrique?" — 100 % électrique (×1,20)":""}\n`;
    t+=`  Kilométrage annuel total : ${km.km?.toLocaleString("fr-FR")||"—"} km\n`;
    t+=`  Montant barème DGFiP 2026 : ${ff(km.mt)} €\n`;
    if(+data.peages>0) t+=`  Péages : ${ff(+data.peages)} €\n`;
    if(+data.parking>0) t+=`  Parking : ${ff(+data.parking)} €\n`;
    if(data.justif_dist&&data.justif_dist!=="aucun"&&(+data.distance)>KM_MAX)
      t+=`  Motif dépassement 40 km : ${MOTIF_DIST[data.justif_dist]||data.justif_dist}\n`;
    t+="\n";
  }
  if(rep){t+=`▸ FRAIS DE REPAS\n  ${rep.calc}\n  Montant annuel : ${ff(rep.mt)} €\n\n`;}
  if(tt){t+=`▸ BUREAU À DOMICILE / TÉLÉTRAVAIL\n  ${tt.calc}\n  Montant annuel : ${ff(tt.mt)} €\n\n`;}
  if(dres){
    t+=`▸ DOUBLE RÉSIDENCE PROFESSIONNELLE\n`;
    if(data.dres_motif) t+=`  Motif : ${MOTIF_DRES[data.dres_motif]||data.dres_motif}\n`;
    t+=`  Montant annuel : ${ff(dres.mt)} €\n\n`;
  }
  const autres=res.items.filter(d=>d.mt>0&&![
    "Frais kilométriques (barème DGFiP)","Péages autoroute","Parking lieu de travail",
    "Frais de repas","Bureau à domicile / télétravail","Double résidence professionnelle",
    "Internet (part pro)","Téléphone (part pro)","Transports en commun"
  ].includes(d.lab));
  if(autres.length){t+=`▸ AUTRES DÉDUCTIONS\n`;autres.forEach(d=>t+=`  ${d.lab} : ${ff(d.mt)} €\n`);t+="\n";}
  t+="━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  t+=`TOTAL FRAIS RÉELS (case 1AK) : ${ff(res.total)} €\n`;
  t+=res.ok?`✅ Gain vs abattement 10 % (${ff(res.ab)} €) : +${ff(res.gain)} €`:`⚠️ Abattement 10 % (${ff(res.ab)} €) reste plus avantageux de ${ff(-res.gain)} €`;
  return t;
}

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════════ */
const C={
  bg:"#08090f",surface:"rgba(255,255,255,0.025)",border:"rgba(255,255,255,0.07)",
  gold:"#c4a35a",goldLight:"#e2c07a",goldDim:"rgba(196,163,90,0.35)",
  green:"#4caf82",red:"#e06060",amber:"#e0a040",
  text:"#ddd6c8",textDim:"rgba(221,214,200,0.45)",textMid:"rgba(221,214,200,0.7)",
};
const CAT_COLORS={transport:"#4a9eff",teletravail:"#4caf82",repas:"#e2c07a",materiel:"#c47bff",double_res:"#e08060",formation:"#60c4e0",specifique:"#e06090",remb:"#e06060",default:"#aaa"};

function flatQ(data){
  const out=[];
  for(const sec of SECTIONS)
    for(const q of sec.questions)
      if(!q.cond||q.cond(data)) out.push({...q,sectionLabel:sec.label,sectionIcon:sec.icon,sectionId:sec.id});
  return out;
}

/* ═══════════════════════════════════════════════════════════════════
   IMPRESSION PDF
═══════════════════════════════════════════════════════════════════ */
function PrintZone({res,resume,data}){
  if(!res) return null;
  const km=res.items.find(d=>d.lab.startsWith("Frais kilométriques"));
  const dateStr=new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
  return(
    <div className="print-zone" style={{display:"none"}}>
      <div className="print-header">
        <h1>Simulateur Frais Réels — Déclaration de revenus 2025</h1>
        <p>Généré le {dateStr} · Revenus {data.statut||""} · Barème DGFiP 2026 (GP 120)</p>
      </div>

      {/* Score */}
      <div className="print-score-card">
        <div>
          <div className="total-label">Total frais réels déductibles (case 1AK)</div>
          <div className="total-val">{ff(res.total)} €</div>
          <div style={{fontSize:"9pt",color:res.ok?"#27ae60":"#c0392b",marginTop:"4px"}}>
            {res.ok?`✅ Gain vs abattement 10 % : +${ff(res.gain)} €`:`⚠️ Abattement 10 % (${ff(res.ab)} €) plus avantageux`}
          </div>
        </div>
        <div className="compare">
          <div>Abattement 10 %</div>
          <div style={{fontSize:"14pt",fontWeight:"bold"}}>{ff(res.ab)} €</div>
          <div style={{marginTop:"6px"}}>Salaire imposable</div>
          <div style={{fontSize:"12pt",fontWeight:"bold"}}>{ff(res.sal||0)} €</div>
        </div>
      </div>

      {/* Détail */}
      <div className="print-section-title">Détail ligne à ligne</div>
      {res.items.map((d,i)=>(
        <div key={i} className="print-row">
          <div>
            <div className="label">{d.lab}</div>
            <div className="sub">{d.calc}</div>
          </div>
          <div className={`amount${d.mt<0?" neg":""}`}>{d.mt>=0?"+":""}{ff(d.mt)} €</div>
        </div>
      ))}
      <div className="print-total-row">
        <span>TOTAL</span>
        <span>{ff(res.total)} €</span>
      </div>

      {/* Justificatifs */}
      <div className="print-justifs">
        <strong>📂 Justificatifs à conserver 3 ans</strong><br/>
        {km&&"· Carte grise · Agenda des déplacements · Compteur ou appli GPS\n"}
        {res.items.find(d=>d.lab==="Péages autoroute")&&"· Relevés de badge de télépéage\n"}
        {res.items.find(d=>d.cat==="repas"&&d.mt>0)&&"· Tickets de restaurant ou de cantine\n"}
        {res.items.find(d=>d.cat==="materiel")&&"· Factures matériel · Documentation usage professionnel\n"}
        {res.items.find(d=>d.cat==="teletravail")&&"· Accord de télétravail · Factures internet · Plan du logement\n"}
        {res.items.find(d=>d.cat==="double_res")&&"· Bail résidence secondaire · Attestation employeur · Justificatifs transport\n"}
        · Conserver tous justificatifs 3 ans à compter de la déclaration (art. L. 169 LPF)
      </div>

      {/* Texte déclaration */}
      <div style={{marginTop:"16px"}}>
        <div className="print-resume-title">Texte à copier — Rubrique informations complémentaires</div>
        <pre className="print-resume">{resume}</pre>
      </div>

      {/* Alertes */}
      {res.warns.length>0&&(
        <div style={{marginTop:"14px",fontSize:"9pt",color:"#c0392b"}}>
          <strong>Points de vigilance :</strong><br/>
          {res.warns.map((w,i)=><div key={i}>⚠️ {w}</div>)}
        </div>
      )}

      <div className="print-footer">
        Simulateur à titre indicatif — Barèmes DGFiP 2026 pour revenus 2025 · En cas de doute, consultez un professionnel fiscal · impots.gouv.fr
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════════════════ */
export default function App(){
  const[data,setData]=useState({});
  const[step,setStep]=useState(0);
  const[done,setDone]=useState(false);
  const[copied,setCopied]=useState(false);
  const[numVal,setNumVal]=useState("");
  const topRef=useRef(null);

  const visQ=useMemo(()=>flatQ(data),[data]);
  const q=visQ[step];
  const res=useMemo(()=>done?compute(data):null,[done,data]);
  const resume=useMemo(()=>res?makeResume(data,res):"",[res,data]);
  const progress=done?100:visQ.length?Math.round((step/visQ.length)*100):0;
  const opts=q?(typeof q.opts==="function"?q.opts(data):(q.opts||[])):[];

  useEffect(()=>{
    if(q) setNumVal(data[q.id]!==undefined?String(data[q.id]):q.def!==undefined?String(q.def):"");
  },[step,q?.id]);

  useEffect(()=>{topRef.current?.scrollIntoView({behavior:"smooth"});},[step,done]);

  function answer(val){
    const nd={...data,[q.id]:val};
    setData(nd);
    const nq=flatQ(nd);
    if(step<nq.length-1) setStep(s=>s+1); else setDone(true);
  }
  function back(){if(step>0)setStep(s=>s-1);}
  function skip(){const nd={...data};if(q.def!==undefined)nd[q.id]=q.def;setData(nd);const nq=flatQ(nd);if(step<nq.length-1)setStep(s=>s+1);else setDone(true);}
  function restart(){setData({});setStep(0);setDone(false);setCopied(false);}
  function copy(){navigator.clipboard.writeText(resume).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),3000);});}
  function printPDF(){window.print();}

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:"'EB Garamond','Garamond',Georgia,serif",color:C.text,position:"relative",overflow:"hidden"}}>
      <div style={{position:"fixed",inset:0,backgroundImage:`radial-gradient(ellipse at 20% 20%,rgba(196,163,90,0.04) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(76,175,130,0.03) 0%,transparent 60%)`,pointerEvents:"none"}}/>

      {/* Header */}
      <header className="no-print" style={{background:"rgba(8,9,15,0.92)",borderBottom:`1px solid ${C.border}`,padding:"14px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",backdropFilter:"blur(24px)",position:"sticky",top:0,zIndex:50,boxSizing:"border-box"}}>
        <div>
          <div style={{fontSize:"10px",letterSpacing:"4px",color:C.gold,textTransform:"uppercase",marginBottom:"3px",opacity:.8}}>Fiscalité · Revenus 2025</div>
          <div style={{fontSize:"19px",color:"#f0e8d8",letterSpacing:".3px",fontFamily:"'Cormorant Garamond',Garamond,serif",fontWeight:600}}>Simulateur Frais Réels</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <span style={{fontSize:"11px",color:C.goldDim}}>{progress}%</span>
          <div style={{width:"90px",height:"2px",background:"rgba(255,255,255,0.07)",borderRadius:"1px"}}>
            <div style={{width:`${progress}%`,height:"100%",background:`linear-gradient(90deg,${C.gold},${C.goldLight})`,borderRadius:"1px",transition:"width .5s cubic-bezier(.4,0,.2,1)"}}/>
          </div>
        </div>
      </header>

      {/* Zone d'impression (cachée à l'écran, visible à l'impression) */}
      <PrintZone res={res} resume={resume} data={data}/>

      {/* Main */}
      <main className="no-print" style={{flex:1,display:"flex",justifyContent:"center",padding:"0 16px 80px"}}>
        <div style={{width:"100%",maxWidth:"680px"}}>
          <div ref={topRef} style={{paddingTop:"1px"}}/>

          {/* ── QUESTIONS ── */}
          {!done&&q&&(
            <div style={{paddingTop:"44px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"28px"}}>
                <span style={{fontSize:"14px"}}>{q.sectionIcon}</span>
                <span style={{fontSize:"10px",letterSpacing:"3px",textTransform:"uppercase",color:C.gold,opacity:.85}}>{q.sectionLabel}</span>
                <span style={{fontSize:"10px",color:C.textDim,marginLeft:"auto"}}>{step+1} / {visQ.length}</span>
              </div>
              <h2 style={{fontSize:"22px",fontWeight:600,lineHeight:1.5,color:"#f0e8d8",marginBottom:q.hint?"14px":"32px",fontFamily:"'Cormorant Garamond',Garamond,serif"}}>{q.q}</h2>
              {q.hint&&<p style={{fontSize:"13px",color:C.textDim,lineHeight:1.7,fontStyle:"italic",borderLeft:`2px solid ${C.goldDim}`,paddingLeft:"14px",marginBottom:"32px"}}>{q.hint}</p>}

              {q.type==="num"&&(
                <div style={{display:"flex",gap:"10px",alignItems:"stretch"}}>
                  <input type="number" value={numVal} onChange={e=>setNumVal(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&numVal!=="")answer(parseFloat(numVal));}}
                    placeholder={q.ph||""} autoFocus
                    style={{flex:1,padding:"15px 18px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:"8px",color:"#f0e8d8",fontSize:"20px",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
                  {q.unit&&<div style={{display:"flex",alignItems:"center",fontSize:"13px",color:C.gold,padding:"0 4px",whiteSpace:"nowrap"}}>{q.unit}</div>}
                  <button onClick={()=>{if(numVal!=="")answer(parseFloat(numVal));}} style={BS.primary}>Valider →</button>
                </div>
              )}
              {q.type==="bool"&&(
                <div style={{display:"flex",gap:"10px"}}>
                  {[{v:true,l:"Oui"},{v:false,l:"Non"}].map(({v,l})=>(
                    <button key={l} onClick={()=>answer(v)} style={{...BS.choice(data[q.id]===v),flex:1,padding:"18px",fontSize:"16px",textAlign:"center"}}>{l}</button>
                  ))}
                </div>
              )}
              {q.type==="sel"&&(
                <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
                  {opts.map(opt=>(
                    <button key={opt.v} onClick={()=>answer(opt.v)} style={BS.choice(data[q.id]===opt.v)}>
                      {data[q.id]===opt.v&&<span style={{color:C.gold,marginRight:"10px",flexShrink:0}}>✓</span>}
                      <span>{opt.l}</span>
                    </button>
                  ))}
                </div>
              )}

              <div style={{display:"flex",gap:"10px",marginTop:"28px"}}>
                {step>0&&<button onClick={back} style={BS.ghost}>← Retour</button>}
                {q.def!==undefined&&<button onClick={skip} style={BS.skip}>Passer (0 €)</button>}
              </div>

              <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginTop:"48px"}}>
                {visQ.map((_,i)=>(
                  <div key={i} style={{width:"5px",height:"5px",borderRadius:"50%",flexShrink:0,
                    background:i<step?C.gold:i===step?C.goldLight:"rgba(255,255,255,0.08)",
                    boxShadow:i===step?`0 0 7px ${C.gold}88`:"none",transition:"all .25s"}}/>
                ))}
              </div>
            </div>
          )}

          {/* ── RÉSULTATS ── */}
          {done&&res&&<ResultsView res={res} resume={resume} data={data} copied={copied} onCopy={copy} onPrint={printPDF} onRestart={restart}/>}
        </div>
      </main>
    </div>
  );
}

/* ─── Button styles ── */
const BS={
  primary:{padding:"15px 22px",background:`linear-gradient(135deg,#c4a35a,#9c7e3a)`,border:"none",borderRadius:"8px",color:"#08090f",fontWeight:"bold",cursor:"pointer",fontSize:"14px",fontFamily:"inherit",whiteSpace:"nowrap"},
  choice:(active)=>({padding:"13px 18px",background:active?"rgba(196,163,90,0.1)":"rgba(255,255,255,0.025)",border:`1px solid ${active?"rgba(196,163,90,0.5)":"rgba(255,255,255,0.07)"}`,borderRadius:"8px",color:active?"#e2c07a":"#ddd6c8",cursor:"pointer",fontSize:"14px",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:"8px",transition:"all .18s"}),
  ghost:{padding:"9px 18px",background:"transparent",border:"1px solid rgba(255,255,255,0.09)",borderRadius:"6px",color:"rgba(221,214,200,0.45)",cursor:"pointer",fontFamily:"inherit",fontSize:"13px"},
  skip:{padding:"9px 18px",background:"transparent",border:"1px solid rgba(196,163,90,0.2)",borderRadius:"6px",color:"rgba(196,163,90,0.5)",cursor:"pointer",fontFamily:"inherit",fontSize:"13px"},
};

/* ═══════════════════════════════════════════════════════════════════
   RÉSULTATS
═══════════════════════════════════════════════════════════════════ */
function ResultsView({res,resume,data,copied,onCopy,onPrint,onRestart}){
  const[tab,setTab]=useState("detail");
  const C2={gold:"#c4a35a",goldLight:"#e2c07a",goldDim:"rgba(196,163,90,0.35)",green:"#4caf82",red:"#e06060",amber:"#e0a040",text:"#ddd6c8",textDim:"rgba(221,214,200,0.45)",textMid:"rgba(221,214,200,0.7)",surface:"rgba(255,255,255,0.025)",border:"rgba(255,255,255,0.07)"};

  return(
    <div style={{paddingTop:"44px"}}>
      {/* Score */}
      <div style={{background:res.ok?"rgba(0,80,40,0.22)":"rgba(80,20,0,0.22)",border:`1px solid ${res.ok?"rgba(76,175,130,0.35)":"rgba(224,96,96,0.35)"}`,borderRadius:"16px",padding:"36px 28px",marginBottom:"36px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:res.ok?"radial-gradient(ellipse at 50% 0%,rgba(76,175,130,0.06),transparent 70%)":"radial-gradient(ellipse at 50% 0%,rgba(224,96,96,0.06),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{fontSize:"10px",letterSpacing:"4px",textTransform:"uppercase",color:res.ok?C2.green:C2.red,marginBottom:"12px"}}>
          {res.ok?"✅ Option frais réels recommandée":"⚠️ Abattement 10 % plus avantageux"}
        </div>
        <div style={{fontSize:"58px",fontWeight:700,color:C2.goldLight,lineHeight:1,letterSpacing:"-1px",fontFamily:"'Cormorant Garamond',Garamond,serif"}}>{ff(res.total)} €</div>
        <div style={{fontSize:"13px",color:C2.textDim,marginTop:"8px"}}>Total frais réels déductibles — case 1AK</div>
        <div style={{display:"flex",justifyContent:"center",gap:"40px",marginTop:"28px",flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:"10px",color:C2.textDim,letterSpacing:"2px",textTransform:"uppercase"}}>Abattement 10 %</div>
            <div style={{fontSize:"22px",color:C2.textMid,marginTop:"4px",fontFamily:"'Cormorant Garamond',Garamond,serif"}}>{ff(res.ab)} €</div>
          </div>
          <div>
            <div style={{fontSize:"10px",color:C2.textDim,letterSpacing:"2px",textTransform:"uppercase"}}>{res.gain>=0?"Économie":"Manque à gagner"}</div>
            <div style={{fontSize:"22px",color:res.gain>=0?C2.green:C2.red,marginTop:"4px",fontFamily:"'Cormorant Garamond',Garamond,serif"}}>{res.gain>=0?"+":""}{ff(res.gain)} €</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:"4px",marginBottom:"28px",background:"rgba(255,255,255,0.02)",borderRadius:"10px",padding:"4px",border:`1px solid ${C2.border}`}}>
        {[{k:"detail",l:"Détail"},{k:"opti",l:`Optimisations (${res.opps.length})`},{k:"warns",l:`Alertes (${res.warns.length})`},{k:"decla",l:"Déclaration"}].map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"9px 8px",background:tab===k?"rgba(196,163,90,0.12)":"transparent",border:tab===k?`1px solid rgba(196,163,90,0.35)`:"1px solid transparent",borderRadius:"7px",color:tab===k?C2.goldLight:C2.textDim,cursor:"pointer",fontSize:"13px",fontFamily:"inherit",transition:"all .2s"}}>{l}</button>
        ))}
      </div>

      {/* Tab: Détail */}
      {tab==="detail"&&(
        <div style={{marginBottom:"32px"}}>
          {/* Bouton impression */}
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"16px"}}>
            <button onClick={onPrint} style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 18px",background:"rgba(196,163,90,0.08)",border:`1px solid ${C2.goldDim}`,borderRadius:"8px",color:C2.gold,cursor:"pointer",fontFamily:"inherit",fontSize:"13px",transition:"all .2s"}}>
              <span style={{fontSize:"15px"}}>🖨️</span> Imprimer / Exporter PDF
            </button>
          </div>

          {res.items.map((d,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"14px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`,gap:"16px"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <div style={{width:"3px",height:"14px",background:CAT_COLORS[d.cat]||CAT_COLORS.default,borderRadius:"2px",flexShrink:0}}/>
                  <span style={{fontSize:"15px",color:d.mt<0?C2.red:"#f0e8d8"}}>{d.lab}</span>
                </div>
                <div style={{fontSize:"11px",color:C2.textDim,marginTop:"4px",paddingLeft:"11px"}}>{d.calc}</div>
              </div>
              <div style={{fontSize:"16px",fontWeight:"bold",color:d.mt<0?C2.red:C2.gold,whiteSpace:"nowrap"}}>{d.mt>=0?"+":""}{ff(d.mt)} €</div>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:"18px 0 0",marginTop:"4px",borderTop:`2px solid rgba(196,163,90,0.25)`}}>
            <span style={{fontSize:"16px",color:"#f0e8d8",fontWeight:600}}>TOTAL</span>
            <span style={{fontSize:"20px",color:C2.goldLight,fontWeight:700,fontFamily:"'Cormorant Garamond',Garamond,serif"}}>{ff(res.total)} €</span>
          </div>

          {/* Justificatifs */}
          <div style={{marginTop:"28px",background:C2.surface,border:`1px solid ${C2.border}`,borderRadius:"10px",padding:"18px"}}>
            <div style={{fontSize:"10px",letterSpacing:"3px",textTransform:"uppercase",color:C2.gold,marginBottom:"12px"}}>📂 Justificatifs à conserver 3 ans</div>
            <div style={{fontSize:"13px",color:C2.textDim,lineHeight:2.1}}>
              {res.items.find(d=>d.cat==="transport"&&d.lab.includes("km"))&&"· Carte grise · Agenda des déplacements · Compteur ou appli GPS\n"}
              {res.items.find(d=>d.lab==="Péages autoroute")&&"· Relevés de badge de télépéage\n"}
              {res.items.find(d=>d.cat==="repas"&&d.mt>0)&&"· Tickets de restaurant ou de cantine\n"}
              {res.items.find(d=>d.cat==="materiel")&&"· Factures matériel · Documentation usage professionnel\n"}
              {res.items.find(d=>d.cat==="teletravail")&&"· Accord de télétravail écrit · Factures internet · Plan du logement\n"}
              {res.items.find(d=>d.cat==="double_res")&&"· Bail résidence secondaire · Attestation employeur · Justificatifs transport\n"}
              · Conserver tous justificatifs 3 ans à compter de la déclaration (art. L. 169 LPF)
            </div>
          </div>
        </div>
      )}

      {/* Tab: Optimisations */}
      {tab==="opti"&&(
        <div style={{marginBottom:"32px"}}>
          {res.opps.length===0&&<div style={{color:C2.green,fontSize:"15px",padding:"20px 0"}}>✅ Votre dossier semble bien optimisé.</div>}
          {res.opps.map((o,i)=>(
            <div key={i} style={{padding:"14px 18px",background:"rgba(76,175,130,0.07)",border:"1px solid rgba(76,175,130,0.18)",borderRadius:"9px",marginBottom:"10px",display:"flex",gap:"14px",alignItems:"flex-start"}}>
              <div style={{background:"rgba(76,175,130,0.2)",borderRadius:"50%",width:"24px",height:"24px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"12px",marginTop:"1px"}}>
                {["⭐","💡","🔍","✅","🎯"][Math.min(o.score-1,4)]}
              </div>
              <div style={{fontSize:"14px",color:"#a8e6c4",lineHeight:1.6}}>{o.txt}</div>
              <div style={{marginLeft:"auto",flexShrink:0,fontSize:"11px",color:"rgba(76,175,130,0.5)",alignSelf:"center"}}>Score {o.score}/5</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Alertes */}
      {tab==="warns"&&(
        <div style={{marginBottom:"32px"}}>
          {res.warns.length===0&&<div style={{color:C2.green,fontSize:"15px",padding:"20px 0"}}>✅ Aucune alerte fiscale détectée.</div>}
          {res.warns.map((w,i)=>(
            <div key={i} style={{padding:"14px 18px",background:"rgba(224,160,64,0.08)",border:"1px solid rgba(224,160,64,0.25)",borderRadius:"9px",marginBottom:"10px",fontSize:"14px",color:C2.amber,lineHeight:1.6}}>
              ⚠️ {w}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Déclaration */}
      {tab==="decla"&&(
        <div style={{marginBottom:"32px"}}>
          <div style={{background:"rgba(196,163,90,0.05)",border:`1px solid ${C2.goldDim}`,borderRadius:"12px",padding:"24px",marginBottom:"16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",flexWrap:"wrap",gap:"10px"}}>
              <div>
                <div style={{fontSize:"10px",letterSpacing:"3px",textTransform:"uppercase",color:C2.gold,marginBottom:"4px"}}>Texte à copier-coller</div>
                <div style={{fontSize:"12px",color:C2.textDim}}>Rubrique « Informations complémentaires » de votre déclaration</div>
              </div>
              <button onClick={onCopy} style={{padding:"10px 20px",background:copied?"rgba(76,175,130,0.15)":"rgba(196,163,90,0.1)",border:`1px solid ${copied?"rgba(76,175,130,0.4)":C2.goldDim}`,borderRadius:"7px",color:copied?C2.green:C2.gold,cursor:"pointer",fontFamily:"inherit",fontSize:"13px",transition:"all .2s"}}>
                {copied?"✓ Copié !":"📋 Copier"}
              </button>
            </div>
            <pre style={{fontSize:"12.5px",color:C2.textMid,lineHeight:1.8,whiteSpace:"pre-wrap",margin:0,fontFamily:"inherit"}}>{resume}</pre>
          </div>
          <div style={{background:C2.surface,border:`1px solid ${C2.border}`,borderRadius:"10px",padding:"20px"}}>
            <div style={{fontSize:"10px",letterSpacing:"3px",textTransform:"uppercase",color:C2.gold,marginBottom:"16px"}}>Guide pas-à-pas — impots.gouv.fr</div>
            {[["1","Traitements et salaires","Cliquer sur « Option frais réels » à côté de votre déclarant"],["2","Frais de déplacements","Cocher « Oui » → barème kilométrique → saisir le kilométrage"],["3","Case 1AK","Le total est calculé automatiquement — vérifier la cohérence"],["4","Informations complémentaires","Coller le texte ci-dessus dans le champ libre dédié"],["5","Valider","Comparer avec la simulation sans frais réels avant de confirmer"]].map(([n,title,desc])=>(
              <div key={n} style={{display:"flex",gap:"14px",marginBottom:"14px",alignItems:"flex-start"}}>
                <div style={{width:"24px",height:"24px",borderRadius:"50%",background:"rgba(196,163,90,0.15)",border:`1px solid ${C2.goldDim}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",color:C2.gold,flexShrink:0,fontWeight:"bold"}}>{n}</div>
                <div><div style={{fontSize:"14px",color:"#f0e8d8",fontWeight:500}}>{title}</div><div style={{fontSize:"12px",color:C2.textDim,marginTop:"2px"}}>{desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{textAlign:"center",paddingBottom:"60px",paddingTop:"16px"}}>
        <button onClick={onRestart} style={{padding:"13px 32px",background:"transparent",border:`1px solid ${C2.goldDim}`,borderRadius:"8px",color:C2.gold,cursor:"pointer",fontFamily:"inherit",fontSize:"14px",letterSpacing:"1px"}}>
          ↺ Nouvelle simulation
        </button>
      </div>
    </div>
  );
}
