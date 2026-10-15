/* ============================================================
   SEASONAL MENUS: the four cards in "A menu for every season".

   For each season:
   - menus:  the menu image(s) shown when the card is tapped.
             Add as many as you like; each needs a file name and a
             title in English (en) and Greek (el).
   The season names and Alexis's notes are in i18n.js (sn.*).
   ============================================================ */
export const SEASONS = {
  summer: { menus: [
    { file: 'menu-summer-1.jpg', en: 'An Aegean Evening',   el: 'Ένα βράδυ στο Αιγαίο' },
    { file: 'menu-summer-2.jpg', en: 'A Long Summer Lunch', el: 'Ένα μακρύ καλοκαιρινό γεύμα' },
  ]},
  autumn: { menus: [
    { file: 'menu-autumn.jpg',   en: 'The Harvest Table',   el: 'Το τραπέζι της σοδειάς' },
  ]},
  winter: { menus: [
    { file: 'menu-winter.jpg',   en: 'A Winter Gathering',  el: 'Ένα χειμωνιάτικο τραπέζι' },
  ]},
  spring: { menus: [
    { file: 'menu-spring.jpg',   en: 'The Spring Table',    el: 'Το ανοιξιάτικο τραπέζι' },
  ]},
};
