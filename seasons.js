/* ============================================================
   SEASONAL MENUS: the four cards in "A menu for every season".

   For each season:
   - photo:  the photo behind the card (any photo already on the site)
   - menus:  the menu image(s) shown when the card is tapped.
             Add as many as you like; each needs a file name and a
             title in English (en) and Greek (el).
   The season names and Alexis's notes are in i18n.js (sn.*).
   ============================================================ */
export const SEASONS = {
  summer: { photo: 'food-8.jpg', menus: [
    { file: 'menu-summer-1.jpg', en: 'An Aegean Evening',   el: 'Ένα βράδυ στο Αιγαίο' },
    { file: 'menu-summer-2.jpg', en: 'A Long Summer Lunch', el: 'Ένα μακρύ καλοκαιρινό γεύμα' },
  ]},
  autumn: { photo: 'produce-2.jpg', menus: [
    { file: 'menu-autumn.jpg',   en: 'The Harvest Table',   el: 'Το τραπέζι της σοδειάς' },
  ]},
  winter: { photo: 'produce-6.jpg', menus: [
    { file: 'menu-winter.jpg',   en: 'A Winter Gathering',  el: 'Ένα χειμωνιάτικο τραπέζι' },
  ]},
  spring: { photo: 'food-11.jpg', menus: [
    { file: 'menu-spring.jpg',   en: 'The Spring Table',    el: 'Το ανοιξιάτικο τραπέζι' },
  ]},
};
