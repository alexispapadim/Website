/* ============================================================
   FOOD GALLERY: the photos shown in "From the kitchen".

   To add a photo:
   1. Upload it to GitHub (e.g. food-5.jpg). Under ~400 KB is ideal.
   2. Add a line below with the file name and a caption in
      English (en) and Greek (el). Keep the commas.
      w and h (the photo's width and height) are optional; they just
      stop the page jumping while photos load.
   3. Commit. Photos appear in the order listed.
   ============================================================ */
export const GALLERY = [
  { file: 'food-1.jpg', w: 1000, h: 1250, en: 'Tuna tartare, avocado, radish, coriander',        el: 'Ταρτάρ τόνου, αβοκάντο, ραπανάκι, κόλιανδρος' },
  { file: 'food-3.jpg', w: 1000, h: 1250, en: 'Ravioli, chanterelles, prosciutto, crispy sage',  el: 'Ραβιόλι, κανθαρέλες, προσούτο, τραγανό φασκόμηλο' },
  { file: 'food-5.jpg', w: 1000, h: 1250, en: 'Salmon sashimi, pickled ginger, wasabi',          el: 'Σασίμι σολομού, πίκλα τζίντζερ, γουασάμπι' },
  { file: 'food-4.jpg', w: 1200, h: 800,  en: 'On the pass',                                     el: 'Στο πάσο της κουζίνας' },
  { file: 'food-17.jpg', w: 1000, h: 1339, en: 'Mise en place', el: 'Μιζ αν πλας' },
  { file: 'food-2.jpg', w: 1000, h: 1250, en: 'Tuna sashimi, jalapeño, coriander',               el: 'Σασίμι τόνου, χαλαπένιο, κόλιανδρος' },
  { file: 'food-6.jpg', w: 1000, h: 1250, en: 'Seared sirloin, tenderstem broccoli, crispy garlic', el: 'Κόντρα φιλέτο, μπροκολίνι, τραγανό σκόρδο' },
  { file: 'food-7.jpg', w: 1000, h: 1250, en: 'Duck, roasted peach, broad beans, mangetout, jus', el: 'Πάπια, ψητό ροδάκινο, κουκιά, μπιζέλι μανζ-του, ζωμός' },
  { file: 'food-8.jpg', w: 1000, h: 1250, en: 'Burrata, heritage tomatoes, basil, aged balsamic', el: 'Μπουράτα, ντομάτες παλαιών ποικιλιών, βασιλικός, παλαιωμένο βαλσάμικο' },
  { file: 'food-9.jpg', w: 1000, h: 1250, en: 'Scallops in the shell, herb butter, golden crumb', el: 'Χτένια στο κέλυφος, βούτυρο μυρωδικών, τραγανή κρούστα' },
  { file: 'food-16.jpg', w: 1000, h: 1328, en: 'Langoustines, shaved bottarga, Amalfi lemon', el: 'Καραβίδες, τριμμένο αυγοτάραχο, λεμόνι Αμάλφι' },
  { file: 'food-11.jpg', w: 1000, h: 1250, en: 'French-trimmed lamb, celeriac purée, Modena balsamic carrots', el: 'Καρέ αρνιού, πουρές σελινόριζας, καρότα με βαλσάμικο Μόντενα' },
  { file: 'food-12.jpg', w: 1000, h: 1250, en: 'Crispy cod, coco beans, rosemary dressing', el: 'Τραγανός μπακαλιάρος, φασόλια κόκο, σάλτσα δεντρολίβανου' },
  { file: 'food-14.jpg', w: 1000, h: 1328, en: 'Pork chop, borlotti beans, salsa verde', el: 'Χοιρινή μπριζόλα, φασόλια μπορλότι, σάλσα βέρντε' },
  { file: 'food-13.jpg', w: 1000, h: 1250, en: 'Grilled trout, panzanella', el: 'Πέστροφα στη σχάρα, παντσανέλα' },
  { file: 'food-10.jpg', w: 1000, h: 1250, en: 'Amalfi lemon tart',      el: 'Τάρτα λεμονιού Αμάλφι' },
  { file: 'food-15.jpg', w: 1000, h: 1328, en: 'Tiramisu', el: 'Τιραμισού' },
];

/* ============================================================
   PRODUCE GALLERY: the photos shown in "The produce".
   Same rules as above: file name, optional w/h, English and Greek
   caption. Text before the first comma is the title; the rest
   becomes the small line underneath.
   pos (optional) moves the crop inside the frame, e.g. pos: '30% 50%'
   keeps the left of a wide photo in view. Tapping shows the whole photo.
   ============================================================ */
export const PRODUCE = [
  { file: 'produce-12.jpg', w: 1000, h: 1328, en: 'Pumpkins, the first of the autumn crop',      el: 'Κολοκύθες, η πρώτη φθινοπωρινή σοδειά' },
  { file: 'produce-13.jpg', w: 1000, h: 1328, en: 'Nelson\'s lobsters',            el: 'Οι αστακοί του Nelson' },
  { file: 'produce-1.jpg', w: 1000, h: 1250, en: 'Borlotti beans',               el: 'Φασόλια μπορλότι' },
  { file: 'produce-24.webp', w: 1000, h: 1333, en: 'Fennel, pulled straight from the garden',    el: 'Μάραθος, φρεσκοβγαλμένος από τον κήπο' },
  { file: 'produce-23.webp', w: 1000, h: 1333, en: 'Turbot, whole on crushed ice',               el: 'Καλκάνι, ολόκληρο πάνω σε θρυμματισμένο πάγο' },
  { file: 'produce-22.webp', w: 1000, h: 1333, en: 'Borlotti beans, slow-simmered with herbs',   el: 'Φασόλια μπορλότι, σιγοβρασμένα με μυρωδικά' },
  { file: 'produce-14.jpg', w: 1000, h: 1328, en: 'Butterflied langoustines on the grill',     el: 'Καραβίδες ανοιγμένες στη σχάρα' },
  { file: 'produce-15.jpg', w: 1000, h: 1328, en: 'Heirloom tomato, picked at its best',        el: 'Ντομάτα παλαιάς ποικιλίας, στο καλύτερό της' },
  { file: 'produce-21.jpg', w: 1000, h: 1328, en: 'Artichokes, the first of spring',      el: 'Αγκινάρες, οι πρώτες της άνοιξης' },
  { file: 'produce-2.jpg', w: 1200, h: 904,  en: 'T-bones + Maldon + 🔥 = 😍',     el: 'T-bone + Maldon + 🔥 = 😍' },
  { file: 'produce-16.jpg', w: 1000, h: 1328, en: 'Line-caught Cornish sea bass',                  el: 'Λαβράκι αγκιστριού από την Κορνουάλη' },
  { file: 'produce-20.jpg', w: 1200, h: 904,  en: 'Chef snack, cod heads', el: 'Σνακ του σεφ, κεφάλια μπακαλιάρου' },
  { file: 'produce-25.webp', w: 1200, h: 904,  pos: '38% 50%', en: 'Monkfish tail, ready to fillet', el: 'Ουρά πεσκανδρίτσας, έτοιμη για φιλετάρισμα' },
  { file: 'produce-17.jpg', w: 1000, h: 1328, en: 'Strawberries & cherries, at their peak',     el: 'Φράουλες και κεράσια, στην καλύτερη στιγμή τους' },
  { file: 'produce-3.jpg', w: 1200, h: 900,  en: 'Sirloin, trimmed and portioned',               el: 'Κόντρα φιλέτο, καθαρισμένο και μοιρασμένο' },
  { file: 'produce-4.jpg', w: 1000, h: 1250, en: 'Parmigiano Reggiano, the whole wheel',         el: 'Παρμιτζάνο Ρετζάνο, ολόκληρο κεφάλι' },
  { file: 'produce-18.jpg', w: 1200, h: 904,  en: 'Grilled white peaches',            el: 'Λευκά ροδάκινα στη σχάρα' },
  { file: 'produce-9.jpg', w: 1000, h: 1250, en: 'Sardines, whole and fresh',                    el: 'Σαρδέλες, ολόκληρες και φρέσκες' },
  { file: 'produce-5.jpg', w: 1000, h: 1250, en: 'Aged beef, bone-in cut, short rib',            el: 'Ωριμασμένο μοσχάρι, κομμάτι με κόκαλο, σπάλα' },
  { file: 'produce-10.jpg', w: 619, h: 1600, en: 'Scottish river trout',                         el: 'Σκωτσέζικη πέστροφα ποταμού' },
  { file: 'produce-7.jpg', w: 1000, h: 1250, en: 'Pumpkin ravioli', el: 'Ραβιόλι κολοκύθας' },
  { file: 'produce-6.jpg', w: 1000, h: 1250, en: 'Fresh ravioli, made by hand',                  el: 'Φρέσκα ραβιόλι, φτιαγμένα στο χέρι' },
  { file: 'produce-8.jpg', w: 1000, h: 1250, en: 'Tagliarini',                  el: 'Ταλιαρίνι' },
  { file: 'produce-11.jpg', w: 1000, h: 1250, en: 'Trout, portioned',                   el: 'Πέστροφα, σε μερίδες' },
];
