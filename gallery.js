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
  { file: 'food-2.jpg', w: 1000, h: 1250, en: 'Tuna sashimi, jalapeño, coriander',               el: 'Σασίμι τόνου, χαλαπένιο, κόλιανδρος' },
  { file: 'food-6.jpg', w: 1000, h: 1250, en: 'Seared sirloin, tenderstem broccoli, crispy garlic', el: 'Κόντρα φιλέτο, μπροκολίνι, τραγανό σκόρδο' },
  { file: 'food-7.jpg', w: 1000, h: 1250, en: 'Duck, roasted peach, broad beans, mangetout, jus', el: 'Πάπια, ψητό ροδάκινο, κουκιά, μπιζέλι μανζ-του, ζωμός' },
  { file: 'food-8.jpg', w: 1000, h: 1250, en: 'Burrata, heritage tomatoes, basil, aged balsamic', el: 'Μπουράτα, ντομάτες παλαιών ποικιλιών, βασιλικός, παλαιωμένο βαλσάμικο' },
  { file: 'food-9.jpg', w: 1000, h: 1250, en: 'Scallops in the shell, herb butter, golden crumb', el: 'Χτένια στο κέλυφος, βούτυρο μυρωδικών, τραγανή κρούστα' },
];

/* ============================================================
   PRODUCE GALLERY: the photos shown in "The produce".
   Same rules as above: file name, optional w/h, English and Greek
   caption. Text before the first comma is the title; the rest
   becomes the small line underneath.
   ============================================================ */
export const PRODUCE = [
  { file: 'produce-1.jpg', w: 1000, h: 1250, en: 'Borlotti beans, podded by hand',               el: 'Φασόλια μπορλότι, καθαρισμένα στο χέρι' },
  { file: 'produce-2.jpg', w: 1200, h: 904,  en: 'Over the coals, bone-in steaks, sea salt',     el: 'Στα κάρβουνα, μπριζόλες με κόκαλο, αλάτι θαλάσσης' },
  { file: 'produce-3.jpg', w: 1200, h: 900,  en: 'Sirloin, trimmed and portioned',               el: 'Κόντρα φιλέτο, καθαρισμένο και μοιρασμένο' },
  { file: 'produce-4.jpg', w: 1000, h: 1250, en: 'Parmigiano Reggiano, the whole wheel',         el: 'Παρμιτζάνο Ρετζάνο, ολόκληρο κεφάλι' },
  { file: 'produce-5.jpg', w: 1000, h: 1250, en: 'Aged beef, bone-in cut, short rib',            el: 'Ωριμασμένο μοσχάρι, κομμάτι με κόκαλο, σπάλα' },
];
