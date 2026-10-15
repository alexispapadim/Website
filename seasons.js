/* ============================================================
   SEASONAL MENUS: the four cards in "A menu for every season"
   and the menus they open. The menus are real text (not images),
   so they stay sharp on every screen and switch to Greek.

   To edit a menu, change the words below. Each dish is written as
     dish('English name', 'English description', 'Greek name', 'Greek description')
   Leave a description as '' if the dish has none.
   art = the hand-drawn produce behind the menu (art-*.webp).
   The season names and Alexis's notes are in i18n.js (sn.*).
   ============================================================ */
const dish = (en, enD, el, elD) => ({ en, enD, el, elD });
const course = (en, el, ...dishes) => ({ en, el, dishes });

export const SEASONS = {
  summer: { menus: [
    { art: 'art-summer.webp', en: 'An Aegean Evening', el: 'Ένα βράδυ στο Αιγαίο', courses: [
      course('Antipasti', 'Ορεκτικά',
        dish('Grilled octopus & fava purée', 'Capers, red onion, olive oil, lemon', 'Χταπόδι σχάρας & φάβα', 'Κάπαρη, κόκκινο κρεμμύδι, ελαιόλαδο, λεμόνι'),
        dish('Tomato & watermelon salad', 'Cucumber, kalamata olives, mint, feta', 'Σαλάτα με ντομάτα & καρπούζι', 'Αγγούρι, ελιές Καλαμών, δυόσμος, φέτα')),
      course('Secondi da condividere', 'Κυρίως για μοίρασμα',
        dish('Herb-roasted sea bream', 'Lemon, oregano, olive oil', 'Τσιπούρα ψητή με μυρωδικά', 'Λεμόνι, ρίγανη, ελαιόλαδο')),
      course('Contorni', 'Συνοδευτικά',
        dish('Grilled summer vegetables', 'Courgettes, peppers, red onion, extra virgin olive oil', 'Καλοκαιρινά λαχανικά σχάρας', 'Κολοκυθάκια, πιπεριές, κόκκινο κρεμμύδι, εξαιρετικό παρθένο ελαιόλαδο')),
      course('Dolce', 'Γλυκό',
        dish('Honey & thyme panna cotta', 'Roasted figs, pistachio crumble', 'Πανακότα με μέλι & θυμάρι', 'Ψητά σύκα, κραμπλ φιστικιού')),
    ]},
    { art: 'art-summer-2.webp', en: 'A Long Summer Lunch', el: 'Ένα μακρύ καλοκαιρινό γεύμα', courses: [
      course('Antipasti', 'Ορεκτικά',
        dish('Grilled sourdough & whipped feta', 'Olives, oregano, extra virgin olive oil', 'Ψητό προζυμένιο ψωμί & χτυπητή φέτα', 'Ελιές, ρίγανη, εξαιρετικό παρθένο ελαιόλαδο'),
        dish('Heirloom tomatoes & watermelon', 'Cucumber, barrel-aged feta, mint', 'Ντομάτες παλαιών ποικιλιών & καρπούζι', 'Αγγούρι, βαρελίσια φέτα, δυόσμος')),
      course('Secondi da condividere', 'Κυρίως για μοίρασμα',
        dish('Lemon & oregano chicken', 'Charred peppers, herb dressing', 'Κοτόπουλο με λεμόνι & ρίγανη', 'Καψαλισμένες πιπεριές, σάλτσα μυρωδικών')),
      course('Contorni', 'Συνοδευτικά',
        dish('Grilled courgettes with dill yoghurt', 'Green beans, toasted almonds', 'Κολοκυθάκια σχάρας με γιαούρτι άνηθου', 'Φασολάκια, καβουρδισμένα αμύγδαλα'),
        dish('Rosemary potatoes', '', 'Πατάτες με δεντρολίβανο', '')),
      course('Dolce', 'Γλυκό',
        dish('Roasted peaches', 'Vanilla mascarpone, pistachio crumble', 'Ψητά ροδάκινα', 'Μασκαρπόνε βανίλιας, κραμπλ φιστικιού')),
    ]},
  ]},
  autumn: { menus: [
    { art: 'art-autumn.webp', en: 'The Harvest Table', el: 'Το τραπέζι της σοδειάς', courses: [
      course('Antipasti', 'Ορεκτικά',
        dish('Roasted beetroot tartlet', 'Whipped goat’s cheese, walnut', 'Ταρτάκι με ψητό παντζάρι', 'Χτυπητό κατσικίσιο τυρί, καρύδι'),
        dish('Roasted squash & bitter leaves', 'Pomegranate, hazelnut, sage', 'Ψητή κολοκύθα & πικρά χόρτα', 'Ρόδι, φουντούκι, φασκόμηλο')),
      course('Primi', 'Πρώτα πιάτα',
        dish('Wild mushroom tagliatelle', 'Thyme, aged graviera', 'Ταλιατέλες με άγρια μανιτάρια', 'Θυμάρι, παλαιωμένη γραβιέρα')),
      course('Secondi', 'Κυρίως',
        dish('Slow-braised beef cheek', 'Celeriac purée, glazed shallots, red wine jus', 'Μοσχαρίσιο μάγουλο σιγομαγειρεμένο', 'Πουρές σελινόριζας, γλασαρισμένα κρεμμυδάκια, σάλτσα κόκκινου κρασιού')),
      course('Dolce', 'Γλυκό',
        dish('Pear & almond tart', 'Vanilla cream', 'Τάρτα αχλαδιού & αμυγδάλου', 'Κρέμα βανίλιας')),
    ]},
  ]},
  winter: { menus: [
    { art: 'art-winter.webp', en: 'A Winter Gathering', el: 'Ένα χειμωνιάτικο τραπέζι', courses: [
      course('Antipasti', 'Ορεκτικά',
        dish('Warm leek & feta tartlet', 'Thyme', 'Ζεστό ταρτάκι με πράσο & φέτα', 'Θυμάρι'),
        dish('Roasted cauliflower soup', 'Brown butter, toasted hazelnuts', 'Σούπα ψητού κουνουπιδιού', 'Καβουρδισμένο βούτυρο, φουντούκια')),
      course('Primi', 'Πρώτα πιάτα',
        dish('Potato & graviera ravioli', 'Braised leek, sage butter', 'Ραβιόλι πατάτας & γραβιέρας', 'Σιγομαγειρεμένο πράσο, βούτυρο φασκόμηλου')),
      course('Secondi', 'Κυρίως',
        dish('Slow-roasted lamb shoulder', 'Celeriac purée, glazed shallots, red wine jus', 'Αρνίσια σπάλα ψημένη αργά', 'Πουρές σελινόριζας, γλασαρισμένα κρεμμυδάκια, σάλτσα κόκκινου κρασιού')),
      course('Dolce', 'Γλυκό',
        dish('Orange & olive oil cake', 'Dark chocolate crémeux', 'Κέικ πορτοκαλιού & ελαιολάδου', 'Κρεμέ μαύρης σοκολάτας')),
    ]},
  ]},
  spring: { menus: [
    { art: 'art-spring.webp', en: 'The Spring Table', el: 'Το ανοιξιάτικο τραπέζι', courses: [
      course('Antipasti', 'Ορεκτικά',
        dish('Pea & mint tartlet', 'Whipped feta, lemon', 'Ταρτάκι αρακά & δυόσμου', 'Χτυπητή φέτα, λεμόνι'),
        dish('Warm artichoke & broad bean salad', 'Dill, spring onion, aged graviera', 'Ζεστή σαλάτα με αγκινάρες & κουκιά', 'Άνηθος, φρέσκο κρεμμυδάκι, παλαιωμένη γραβιέρα')),
      course('Primi', 'Πρώτα πιάτα',
        dish('Ricotta & spinach ravioli', 'Brown butter, lemon, toasted pine nuts', 'Ραβιόλι ρικότας & σπανακιού', 'Καβουρδισμένο βούτυρο, λεμόνι, κουκουνάρι')),
      course('Secondi', 'Κυρίως',
        dish('Herb-crusted spring lamb', 'Asparagus, potato fondant, rosemary jus', 'Ανοιξιάτικο αρνί με κρούστα μυρωδικών', 'Σπαράγγια, πατάτα φοντάν, σάλτσα δεντρολίβανου')),
      course('Dolce', 'Γλυκό',
        dish('Strawberries & vanilla yoghurt cream', 'Almond crumble, basil', 'Φράουλες & κρέμα γιαουρτιού βανίλιας', 'Κραμπλ αμυγδάλου, βασιλικός')),
    ]},
  ]},
};
