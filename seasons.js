/* ============================================================
   MENUS: the cards in "A menu for every season" and the menus they
   open. The menus are real text (not images), so they stay sharp on
   every screen and switch to Greek.

   How to edit
   - A dish is written d('English', 'Greek').
     Put " | " between the dish name and its description, e.g.
       d('Red mullet | orzo', 'Μπαρμπούνι | κριθαράκι')
     Without " | " the whole line is shown as the dish name.
   - OR between two dishes shows "or" (a choice for the guest).
   - course('Heading', 'Greek heading', ...dishes). Use '' for a
     course without a heading (plated menus).
   - art = the hand-drawn produce behind the menu (art-*.webp).
   The season names and Alexis's notes are in i18n.js (sn.*).
   ============================================================ */
const d = (en, el) => {
  const [n, ds = ''] = en.split(' | '), [gn, gds = ''] = el.split(' | ');
  return { en: n, enD: ds, el: gn, elD: gds };
};
const OR = { or: true };
const course = (en, el, ...dishes) => ({ en, el, dishes });

export const SEASONS = {
  summer: { menus: [
    { art: 'art-summer.webp', en: 'An Aegean Evening', el: 'Ένα βράδυ στο Αιγαίο', courses: [
      course('Antipasti to share', 'Ορεκτικά για μοίρασμα',
        d('Tomato and watercress salad | tomato consommé dressing', 'Σαλάτα ντομάτας και κάρδαμου | ντρέσινγκ από κονσομέ ντομάτας'),
        d('Fried artichokes | lemon aioli', 'Τηγανητές αγκινάρες | αϊόλι λεμονιού'),
        d('Burrata | grilled peaches and basil', 'Μπουράτα | ψητά ροδάκινα και βασιλικός')),
      course('Primi', 'Πρώτα πιάτα',
        d('Porcini and ricotta ravioli | chanterelle mushroom and sage sauce', 'Ραβιόλι πορτσίνι και ρικότας | σάλτσα από κανθαρέλες και φασκόμηλο'), OR,
        d('Orecchiette | Santorini cherry tomatoes and basil', 'Ορεκιέτε | ντοματίνια Σαντορίνης και βασιλικός')),
      course('Secondi', 'Κυρίως',
        d('Red mullet | orzo', 'Μπαρμπούνι | κριθαράκι'),
        d('Steak frites', 'Steak frites | μοσχαρίσια μπριζόλα με τηγανητές πατάτες')),
      course('Dolce', 'Γλυκό',
        d('Ajo blanco ice cream | fig leaf oil', 'Παγωτό ajo blanco | λάδι από φύλλα συκιάς'), OR,
        d('Toasted fig leaf panna cotta | Modena balsamic figs', 'Πανακότα με καβουρδισμένα φύλλα συκιάς | σύκα με βαλσάμικο Μόντενας')),
    ]},
    { art: 'art-summer-2.webp', en: 'A Summer Supper', el: 'Ένα καλοκαιρινό δείπνο', courses: [
      course('', '', d('Tuna | cucumber gazpacho', 'Τόνος | γκασπάτσο αγγουριού')),
      course('', '', d('Seared scallops | lemon, marjoram butter and golden garlic', 'Σοταρισμένα χτένια | λεμόνι, βούτυρο μαντζουράνας και χρυσαφένιο σκόρδο')),
      course('', '', d('Grilled chateaubriand | chanterelle mushroom jus and rosemary potatoes', 'Σατομπριάν στη σχάρα | ζωμός από κανθαρέλες και πατάτες με δεντρολίβανο')),
      course('', '',
        d('Lemon meringue tart', 'Τάρτα λεμονιού με μαρέγκα'), OR,
        d('Chocolate mousse | sea salt and extra virgin olive oil', 'Μους σοκολάτας | αλάτι θαλάσσης και εξαιρετικό παρθένο ελαιόλαδο')),
    ]},
  ]},
  autumn: { menus: [
    { art: 'art-autumn.webp', en: 'The Harvest Table', el: 'Το τραπέζι της σοδειάς', courses: [
      course('Antipasti', 'Ορεκτικά',
        d('Bitter leaf salad | pear, candied walnuts and salted ricotta', 'Σαλάτα πικρών φύλλων | αχλάδι, καραμελωμένα καρύδια και αλατισμένη ρικότα'),
        d('Chicken liver crostini | confit garlic and grilled fig', 'Κροστίνι με συκωτάκια κοτόπουλου | σκόρδο κονφί και ψητό σύκο'),
        d('Seared bluefin tuna carpaccio | lemon oil and oregano', 'Καρπάτσιο σοταρισμένου τόνου | λάδι λεμονιού και ρίγανη')),
      course('Primi', 'Πρώτα πιάτα',
        d('Pappardelle | duck, porcini and orange ragù', 'Παπαρδέλες | ραγού πάπιας, πορτσίνι και πορτοκαλιού'), OR,
        d('Pumpkin ravioli | sage butter', 'Ραβιόλι κολοκύθας | βούτυρο φασκόμηλου')),
      course('Secondi', 'Κυρίως',
        d('Brioche-crusted Greek sea bass | wilted spinach, caviar and vermouth beurre blanc', 'Ελληνικό λαβράκι σε κρούστα μπριός | σπανάκι, χαβιάρι και beurre blanc βερμούτ'), OR,
        d('Chickpea farinata | Taleggio, broccoli and a rocket and Parmigiano-Reggiano salad', 'Φαρινάτα ρεβιθιού | ταλέτζιο, μπρόκολο και σαλάτα ρόκας με παρμιτζάνο')),
      course('Dolce', 'Γλυκό',
        d('Chianti-poached pear | vanilla custard and biscotti crumb', 'Αχλάδι ποσέ σε Κιάντι | κρέμα βανίλιας και τρίμμα μπισκότου'), OR,
        d('Tarte Tatin', 'Τάρτα Τατέν')),
    ]},
    { art: 'art-autumn.webp', en: 'An Autumn Supper', el: 'Ένα φθινοπωρινό δείπνο', courses: [
      course('', '',
        d('Miso-glazed carrots | labneh, dill oil and cashews', 'Καρότα γλασαρισμένα με μίσο | λαμπνέ, λάδι άνηθου και κάσιους'), OR,
        d('Salt-baked beetroot carpaccio | lemongrass dressing, pickled shallots and orange', 'Καρπάτσιο παντζαριού ψημένου στο αλάτι | ντρέσινγκ λεμονόχορτου, τουρσί εσαλότ και πορτοκάλι')),
      course('', '', d('Seared scallops | squash purée, pumpkin seeds and sage beurre blanc', 'Σοταρισμένα χτένια | πουρές κολοκύθας, κολοκυθόσποροι και beurre blanc φασκόμηλου')),
      course('', '', d('Wood pigeon | Jerusalem artichokes, black garlic, and olive and pine nut praline', 'Αγριοπερίστερο | τοπιναμπούρ, μαύρο σκόρδο και πραλίνα ελιάς και κουκουναριού')),
      course('', '', d('Crème brûlée', 'Κρεμ μπρουλέ')),
    ]},
  ]},
  winter: { menus: [
    { art: 'art-winter.webp', en: 'A Winter Gathering', el: 'Ένα χειμωνιάτικο τραπέζι', courses: [
      course('Antipasti', 'Ορεκτικά',
        d('Bluefin tuna tartare | capers, orange and pine nuts', 'Ταρτάρ τόνου | κάπαρη, πορτοκάλι και κουκουνάρι'),
        d('Porchetta or ox tongue tonnato', 'Πορκέτα ή μοσχαρίσια γλώσσα tonnato'),
        d('Blood orange | Olasagasti anchovies and fresh oregano', 'Σαγκουίνι | αντζούγιες Olasagasti και φρέσκια ρίγανη')),
      course('Primi', 'Πρώτα πιάτα',
        d('Pappardelle | ragù of veal, rabbit and radicchio', 'Παπαρδέλες | ραγού μοσχαριού, κουνελιού και ραντίτσιο'), OR,
        d('Corn agnolotti | ’nduja, speck and clams', 'Ανιολότι καλαμποκιού | ’nduja, speck και αχιβάδες')),
      course('Secondi', 'Κυρίως',
        d('Mackerel | lentils and romesco sauce', 'Σκουμπρί | φακές και σάλτσα romesco'), OR,
        d('Tagliata di manzo | prime rib, pommes frites, rocket and Parmigiano-Reggiano', 'Tagliata di manzo | prime rib, τηγανητές πατάτες, ρόκα και παρμιτζάνο')),
      course('Dolce', 'Γλυκό',
        d('Almond cake', 'Κέικ αμυγδάλου'), OR,
        d('Tiramisu', 'Τιραμισού')),
    ]},
    { art: 'art-winter.webp', en: 'A Winter Feast', el: 'Μια χειμωνιάτικη γιορτή', courses: [
      course('Antipasti', 'Ορεκτικά',
        d('Puntarelle alla Romana', 'Πουνταρέλε αλα ρομάνα'),
        d('Pommes dauphine | black garlic and prosciutto culatello', 'Πομ ντοφίν | μαύρο σκόρδο και προσούτο κουλατέλο'),
        d('Langoustines | ’nduja and lemon', 'Καραβίδες | ’nduja και λεμόνι')),
      course('Primi', 'Πρώτα πιάτα',
        d('Tagliarini | crab, chilli and lemon', 'Ταλιαρίνι | καβούρι, τσίλι και λεμόνι'), OR,
        d('Agnolotti filled with Taleggio fonduta | tossed in a meaty butter sauce', 'Ανιολότι με φοντούτα ταλέτζιο | σε σάλτσα βουτύρου με ζωμό κρέατος')),
      course('Secondi', 'Κυρίως',
        d('Crispy stone bass | cauliflower purée, slow-cooked leeks, steamed mussels and burnt lemon', 'Τραγανός βλάχος | πουρές κουνουπιδιού, σιγομαγειρεμένα πράσα, μύδια ατμού και καμένο λεμόνι')),
      course('Dolce', 'Γλυκό',
        d('Winter fruit zabaglione', 'Ζαμπαγιόνε με χειμωνιάτικα φρούτα'), OR,
        d('Salted caramel and chocolate tart', 'Τάρτα σοκολάτας με αλατισμένη καραμέλα'), OR,
        d('Browned white chocolate and toasted vanilla ice cream', 'Παγωτό καραμελωμένης λευκής σοκολάτας και καβουρδισμένης βανίλιας')),
    ]},
  ]},
  spring: { menus: [
    { art: 'art-spring.webp', en: 'The Spring Table', el: 'Το ανοιξιάτικο τραπέζι', courses: [
      course('Antipasti', 'Ορεκτικά',
        d('Bitter leaf salad of broad beans and peas | lemon and pecorino', 'Σαλάτα πικρών φύλλων με κουκιά και αρακά | λεμόνι και πεκορίνο'), OR,
        d('Purple sprouting broccoli | bagna cauda and shaved walnuts', 'Μωβ μπροκολίνι | bagna cauda και ξυσμένα καρύδια'),
        d('Fish carpaccio | pistachio chilli dressing', 'Καρπάτσιο ψαριού | ντρέσινγκ φιστικιού και τσίλι')),
      course('Primi', 'Πρώτα πιάτα',
        d('Linguine al limone', 'Λιγκουίνι αλ λιμόνε'), OR,
        d('Paccheri | Umbrian style, aubergine and pistachio', 'Πάκερι | με τον τρόπο της Ούμπρια, μελιτζάνα και φιστίκι')),
      course('Secondi', 'Κυρίως',
        d('Crispy-skin sea bass | bell pepper ragù, basil and bouillabaisse', 'Λαβράκι με τραγανή πέτσα | ραγού πιπεριάς, βασιλικός και μπουγιαμπέσα'), OR,
        d('Quail blanquette | wild asparagus, peas and speck', 'Μπλανκέτ ορτυκιού | άγρια σπαράγγια, αρακάς και speck')),
      course('Dolce', 'Γλυκό',
        d('Blood orange sorbetto', 'Σορμπέ σαγκουίνι'),
        d('Toasted vanilla affogato', 'Affogato με καβουρδισμένη βανίλια')),
    ]},
    { art: 'art-spring.webp', en: 'A Spring Lunch', el: 'Ένα ανοιξιάτικο γεύμα', courses: [
      course('', '', d('Cold almond soup | cherries and extra virgin olive oil', 'Κρύα σούπα αμυγδάλου | κεράσια και εξαιρετικό παρθένο ελαιόλαδο')),
      course('', '', d('Pea crostini | chilli, lemon and Parmigiano with a lardo di Colonnata blanquette', 'Κροστίνι αρακά | τσίλι, λεμόνι και παρμιτζάνο με μπλανκέτ από lardo di Colonnata')),
      course('', '',
        d('Herb-crusted rack of lamb | courgette purée and wild asparagus', 'Καρέ αρνιού με κρούστα μυρωδικών | πουρές κολοκυθιού και άγρια σπαράγγια'), OR,
        d('Lamb loin chop | pea purée, olive and red pepper, with a Parmesan lamb leg croquette', 'Αρνίσιο κοτολέτο | πουρές αρακά, ελιά και κόκκινη πιπεριά, με κροκέτα από μπούτι αρνιού και παρμεζάνα')),
      course('', '', d('Fior di latte ice cream | roasted pistachio and extra virgin olive oil', 'Παγωτό fior di latte | καβουρδισμένο φιστίκι και εξαιρετικό παρθένο ελαιόλαδο')),
    ]},
  ]},
  events: { menus: [
    { art: 'art-events.webp', en: 'Canapés', el: 'Καναπεδάκια', courses: [
      course('', '',
        d('Lemon, ricotta and pea tart', 'Ταρτάκι λεμονιού, ρικότας και αρακά'),
        d('Courgette tart | bell pepper ragù and basil', 'Ταρτάκι κολοκυθιού | ραγού πιπεριάς και βασιλικός'),
        d('Beef tartare buckwheat tart | ponzu and wasabi', 'Ταρτάκι φαγόπυρου με ταρτάρ μοσχαριού | ponzu και wasabi'),
        d('Pommes dauphine | black garlic and culatello prosciutto', 'Πομ ντοφίν | μαύρο σκόρδο και προσούτο κουλατέλο'),
        d('Chicken liver and apricot tart', 'Ταρτάκι με συκωτάκια κοτόπουλου και βερίκοκο'),
        d('Japanese miso aubergine | black garlic', 'Ιαπωνική μελιτζάνα μίσο | μαύρο σκόρδο'),
        d('Lemon tart', 'Ταρτάκι λεμονιού'),
        d('Fig leaf custard tart', 'Ταρτάκι κρέμας με φύλλο συκιάς')),
    ]},
    { art: 'art-events.webp', en: 'A Japanese Supper', el: 'Ένα ιαπωνικό δείπνο', courses: [
      course('From past catering events', 'Από προηγούμενες εκδηλώσεις catering',
        d('Miso soup | tofu and spring onion', 'Σούπα μίσο | τόφου και φρέσκο κρεμμυδάκι'),
        d('Japanese Nobu salad', 'Ιαπωνική σαλάτα Nobu'),
        d('Japanese salmon ceviche', 'Ιαπωνικό σεβίτσε σολομού'),
        d('Tuna tataki | coriander, jalapeño and yuzu ponzu', 'Τατάκι τόνου | κόλιανδρος, χαλαπένιο και yuzu ponzu'),
        d('Crispy chilli and garlic smashed cucumber', 'Σπασμένο αγγούρι με τραγανό τσίλι και σκόρδο'),
        d('Miso aubergine', 'Μελιτζάνα μίσο'),
        d('Flank steak | grilled shimeji mushrooms, burnt lime and cherry jus', 'Flank steak | ψητά μανιτάρια shimeji, καμένο λάιμ και ζωμός κερασιού'),
        d('Japanese purin', 'Ιαπωνικό purin')),
    ]},
  ]},
};
