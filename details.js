/* ============================================================
   SITE DETAILS + LEGAL PAGES, shared by the home page and the About page.
   ============================================================ */
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ===== Edit these if details change ===== */
export const CONFIG = {
  email: 'alexis@papadimitriou.uk',
  phone: '+306945009919',            // Greek number: call link + shown on the site
  phoneDisplay: '+30 694 500 9919',
  whatsapp: '+447856779459',         // WhatsApp link (UK number)
  turnstileSiteKey: '0x4AAAAAAFUZ8kLv46CVO1UJ', // Cloudflare → Turnstile → your widget → Site key (public)
  api: '/api/enquiry'
};

/* Business details shown in the Legal notice — fill in before launch.
   Lines left empty are simply not shown. */
const LEGAL_INFO = {
  legalName: '',      // e.g. registered name of the business
  address: '',        // business address
  vat: '',            // ΑΦΜ / VAT number
  taxOffice: '',      // ΔΟΥ
  gemi: ''            // Αριθμός ΓΕΜΗ (if registered)
};
const POLICY_DATE = { en: '12 October 2026', el: '12 Οκτωβρίου 2026' };

/* ===================== legal pages ===================== */
export function legalPages(l){
  const E=esc(CONFIG.email), P=esc(CONFIG.phoneDisplay), mail=`<a href="mailto:${E}">${E}</a>`;
  const addr=LEGAL_INFO.address?` · ${esc(LEGAL_INFO.address)}`:'';
  const upd=`<p class="upd">${l==='el'?'Τελευταία ενημέρωση':'Last updated'}: ${POLICY_DATE[l]}</p>`;
  const info=[
    [l==='el'?'Διακριτικός τίτλος':'Trading name','Alexis Papadimitriou — Private Chef &amp; Catering'],
    [l==='el'?'Επωνυμία':'Legal name',LEGAL_INFO.legalName&&esc(LEGAL_INFO.legalName)],
    [l==='el'?'Διεύθυνση':'Address',LEGAL_INFO.address&&esc(LEGAL_INFO.address)],
    ['Email',mail],
    [l==='el'?'Τηλέφωνο':'Phone',P],
    [l==='el'?'ΑΦΜ':'VAT / Tax no. (ΑΦΜ)',LEGAL_INFO.vat&&esc(LEGAL_INFO.vat)],
    [l==='el'?'ΔΟΥ':'Tax office (ΔΟΥ)',LEGAL_INFO.taxOffice&&esc(LEGAL_INFO.taxOffice)],
    [l==='el'?'Αριθμός ΓΕΜΗ':'GEMI no.',LEGAL_INFO.gemi&&esc(LEGAL_INFO.gemi)]
  ].filter(r=>r[1]).map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('');

  if(l==='el') return {
    privacy:`<h1 id="sheet-title">Πολιτική Απορρήτου</h1>${upd}
<h2>1. Ποιοι είμαστε</h2><p>Υπεύθυνος επεξεργασίας των προσωπικών δεδομένων που περιγράφονται εδώ είναι ο Αλέξης Παπαδημητρίου, ιδιωτικός σεφ και catering («εμείς»). Επικοινωνία: ${mail} · ${P}${addr}.</p>
<h2>2. Ποια δεδομένα συλλέγουμε</h2><ul>
<li><strong>Φόρμα επικοινωνίας:</strong> ονοματεπώνυμο, email, τηλέφωνο (προαιρετικά), ημερομηνία εκδήλωσης, αριθμός ατόμων, τοποθεσία, περίσταση και ό,τι γράψετε στο μήνυμά σας.</li>
<li><strong>Αλλεργίες ή διατροφικές ανάγκες</strong>, εφόσον μας τις αναφέρετε.</li>
<li><strong>Email, τηλέφωνο ή WhatsApp:</strong> τα στοιχεία που μας δίνετε όταν επικοινωνείτε μαζί μας.</li>
<li><strong>Τεχνικά δεδομένα:</strong> ο πάροχος φιλοξενίας μας (Cloudflare) επεξεργάζεται τη διεύθυνση IP σας και στοιχεία του προγράμματος περιήγησης και του αιτήματος, για να παραδώσει και να προστατεύσει τον ιστότοπο. Ο έλεγχος ασφαλείας της φόρμας (Cloudflare Turnstile) επεξεργάζεται σήματα του προγράμματος περιήγησης/συσκευής για να ξεχωρίζει ανθρώπους από bots.</li>
<li><strong>Προτίμηση γλώσσας</strong>, αποθηκευμένη στη συσκευή σας (βλ. <a href="#cookies">Cookies</a>).</li></ul>
<h2>3. Γιατί τα χρησιμοποιούμε και νομική βάση</h2><ul>
<li>Απάντηση στο αίτημά σας, προετοιμασία προσφοράς και αποστολή αυτόματου email επιβεβαίωσης — ενέργειες κατόπιν αιτήματός σας πριν από τη σύναψη σύμβασης (άρθρο 6 παρ. 1 στοιχ. β΄ ΓΚΠΔ).</li>
<li>Αλλεργίες και διατροφικές πληροφορίες — η ρητή συγκατάθεσή σας (άρθρο 9 παρ. 2 στοιχ. α΄ ΓΚΠΔ), την οποία μπορείτε να ανακαλέσετε οποιαδήποτε στιγμή.</li>
<li>Ασφάλεια του ιστότοπου και πρόληψη spam και κατάχρησης — έννομο συμφέρον μας (άρθρο 6 παρ. 1 στοιχ. στ΄).</li>
<li>Τήρηση αρχείων που απαιτεί ο νόμος, π.χ. παραστατικά κρατήσεων — νομική υποχρέωση (άρθρο 6 παρ. 1 στοιχ. γ΄).</li></ul>
<p>Δεν στέλνουμε διαφημιστικά email, δεν πουλάμε δεδομένα και δεν προβαίνουμε σε αυτοματοποιημένη λήψη αποφάσεων ή κατάρτιση προφίλ.</p>
<h2>4. Αποδέκτες</h2><p>Πάροχοι που ενεργούν για λογαριασμό μας (εκτελούντες την επεξεργασία):</p><ul>
<li><strong>Cloudflare, Inc.</strong> — φιλοξενία, ασφάλεια, έλεγχος Turnstile και προώθηση email.</li>
<li><strong>Resend, Inc.</strong> — αποστολή των email του αιτήματος και της επιβεβαίωσης.</li>
<li><strong>Google (Gmail)</strong> — το εισερχόμενο όπου λαμβάνουμε και απαντάμε στα αιτήματα.</li>
<li><strong>BunnyWay d.o.o. (Bunny Fonts, ΕΕ)</strong> — παρέχει τις γραμματοσειρές του ιστότοπου και λαμβάνει τη διεύθυνση IP σας όταν φορτώνονται.</li></ul>
<p>Δεν κοινοποιούμε τα δεδομένα σας σε άλλους, εκτός αν το απαιτεί ο νόμος.</p>
<h2>5. Διαβιβάσεις εκτός ΕΟΧ</h2><p>Ορισμένοι πάροχοι (Cloudflare, Resend, Google) εδρεύουν στις ΗΠΑ και ενδέχεται να επεξεργάζονται δεδομένα εκτός ΕΟΧ/Ηνωμένου Βασιλείου. Στις περιπτώσεις αυτές, οι διαβιβάσεις βασίζονται σε κατάλληλες εγγυήσεις, όπως το Πλαίσιο Προστασίας Δεδομένων ΕΕ–ΗΠΑ ή οι Τυποποιημένες Συμβατικές Ρήτρες της Ευρωπαϊκής Επιτροπής.</p>
<h2>6. Χρόνος διατήρησης</h2><ul>
<li>Αιτήματα που δεν καταλήγουν σε κράτηση: διαγράφονται εντός 24 μηνών από την τελευταία επικοινωνία μας.</li>
<li>Κρατήσεις: για όσο χρειάζεται για την παροχή της υπηρεσίας και για όσο απαιτεί η ελληνική φορολογική και λογιστική νομοθεσία.</li>
<li>Αλλεργίες και διατροφικές πληροφορίες: διαγράφονται μετά την εκδήλωση, εκτός αν μας ζητήσετε να τις κρατήσουμε για μελλοντικές κρατήσεις.</li>
<li>Αρχεία ασφαλείας: για το σύντομο διάστημα που ορίζει η Cloudflare.</li></ul>
<h2>7. Τα δικαιώματά σας</h2><p>Σύμφωνα με τον ΓΚΠΔ (και τον UK GDPR) έχετε δικαίωμα πρόσβασης, διόρθωσης, διαγραφής, περιορισμού, φορητότητας και εναντίωσης στην επεξεργασία που βασίζεται σε έννομο συμφέρον, καθώς και δικαίωμα να ανακαλέσετε τη συγκατάθεσή σας οποιαδήποτε στιγμή. Γράψτε μας στο ${mail}· απαντάμε εντός ενός μηνός.</p>
<p>Μπορείτε να υποβάλετε καταγγελία στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (Κηφισίας 1–3, 115 23 Αθήνα, <a href="https://www.dpa.gr" rel="noopener" target="_blank">www.dpa.gr</a>), στην αντίστοιχη αρχή της χώρας της ΕΕ όπου διαμένετε, ή — στο Ηνωμένο Βασίλειο — στο Information Commissioner’s Office (<a href="https://ico.org.uk" rel="noopener" target="_blank">ico.org.uk</a>).</p>
<h2>8. Είναι υποχρεωτικό;</h2><p>Το ονοματεπώνυμο και το email χρειάζονται για να σας απαντήσουμε· όλα τα υπόλοιπα είναι προαιρετικά.</p>
<h2>9. Παιδιά</h2><p>Οι υπηρεσίες μας απευθύνονται σε ενήλικες. Δεν συλλέγουμε εν γνώσει μας δεδομένα παιδιών.</p>
<h2>10. Αλλαγές</h2><p>Ενδέχεται να ενημερώνουμε αυτή την πολιτική· η τρέχουσα έκδοση βρίσκεται πάντα σε αυτή τη σελίδα.</p>`,
    cookies:`<h1 id="sheet-title">Cookies και αποθήκευση</h1>${upd}
<p>Δεν χρησιμοποιούμε cookies διαφήμισης, στατιστικών ή παρακολούθησης — γι’ αυτό δεν εμφανίζουμε μήνυμα συγκατάθεσης για cookies.</p>
<h2>Τι αποθηκεύεται</h2><ul>
<li><strong>Προτίμηση γλώσσας</strong> (<code>ap-lang</code>, στο localStorage του προγράμματος περιήγησης): θυμάται αν επιλέξατε Ελληνικά ή Αγγλικά. Παραμένει στη συσκευή σας και δεν μας αποστέλλεται.</li>
<li><strong>Ασφάλεια Cloudflare:</strong> η Cloudflare ενδέχεται να ορίσει απολύτως απαραίτητα cookies ασφαλείας (π.χ. για τον εντοπισμό bots), και ο έλεγχος Turnstile εκτελείται όταν χρησιμοποιείτε τη φόρμα. Χρησιμοποιούνται μόνο για λόγους ασφαλείας.</li>
<li><strong>Γραμματοσειρές:</strong> φορτώνονται από το Bunny Fonts (ΕΕ), χωρίς cookies.</li></ul>
<p>Τα παραπάνω είναι απολύτως απαραίτητα για τη λειτουργία που ζητάτε και δεν απαιτούν συγκατάθεση (άρθρο 4 παρ. 5 ν. 3471/2006). Μπορείτε να τα διαγράψετε οποιαδήποτε στιγμή από τις ρυθμίσεις του προγράμματος περιήγησής σας.</p>`,
    terms:`<h1 id="sheet-title">Όροι χρήσης και κρατήσεων</h1>${upd}
<h2>Πληροφορίες και προσφορές</h2><p>Οι πληροφορίες του ιστότοπου είναι γενικές. Τα μενού και οι τιμές δίνονται ξεχωριστά για κάθε εκδήλωση, με προσφορά.</p>
<h2>Κρατήσεις</h2><p>Η αποστολή αιτήματος δεν αποτελεί κράτηση. Η κράτηση επιβεβαιώνεται μόνο όταν την επιβεβαιώσουμε γραπτώς και καταβληθεί τυχόν συμφωνημένη προκαταβολή. Οι ειδικοί όροι (προκαταβολή, ακύρωση, τελικός αριθμός ατόμων) περιγράφονται στην προσφορά σας.</p>
<h2>Αλλεργίες και διατροφικές ανάγκες</h2><p>Ενημερώστε μας εκ των προτέρων. Λαμβάνουμε κάθε μέριμνα, αλλά οι κουζίνες — και η δική σας — ενδέχεται να περιέχουν αλλεργιογόνα. Κατόπιν αιτήματος, παρέχουμε πληροφορίες για τα 14 κύρια αλλεργιογόνα κάθε πιάτου (Κανονισμός (ΕΕ) 1169/2011).</p>
<h2>Δικαίωμα υπαναχώρησης</h2><p>Επειδή πρόκειται για υπηρεσίες εστίασης για συγκεκριμένη ημερομηνία, δεν ισχύει το 14ήμερο δικαίωμα υπαναχώρησης των συμβάσεων από απόσταση (άρθρο 16 στοιχ. ιβ΄ της Οδηγίας 2011/83/ΕΕ, όπως ενσωματώθηκε στο ελληνικό δίκαιο). Οι όροι ακύρωσης ορίζονται στην προσφορά σας.</p>
<h2>Πνευματική ιδιοκτησία</h2><p>Το περιεχόμενο, οι φωτογραφίες και το λογότυπο του ιστότοπου ανήκουν στον Αλέξη Παπαδημητρίου και δεν επιτρέπεται η αναπαραγωγή τους χωρίς άδεια.</p>
<h2>Εφαρμοστέο δίκαιο</h2><p>Εφαρμόζεται το ελληνικό δίκαιο. Οι καταναλωτές διατηρούν την προστασία που τους παρέχει το δίκαιο της χώρας διαμονής τους.</p>`,
    legal:`<h1 id="sheet-title">Νομικές πληροφορίες</h1>${upd}
<h2>Στοιχεία επιχείρησης</h2><dl>${info}</dl>
<h2>Φιλοξενία</h2><p>Ο ιστότοπος φιλοξενείται από την Cloudflare, Inc.</p>
<h2>Παράπονα και επίλυση διαφορών</h2><p>Αν έχετε κάποιο παράπονο, επικοινωνήστε πρώτα μαζί μας στο ${mail}. Οι καταναλωτές μπορούν επίσης να απευθυνθούν στον Συνήγορο του Καταναλωτή (<a href="https://www.synigoroskatanaloti.gr" rel="noopener" target="_blank">www.synigoroskatanaloti.gr</a>).</p>`
  };

  return {
    privacy:`<h1 id="sheet-title">Privacy Policy</h1>${upd}
<h2>1. Who we are</h2><p>Alexis Papadimitriou, private chef and catering (“we”, “us”), is the controller of the personal data described here. Contact: ${mail} · ${P}${addr}.</p>
<h2>2. What we collect</h2><ul>
<li><strong>Enquiry form:</strong> your name, email, phone (optional), event date, number of guests, location, occasion and anything you write in your message.</li>
<li><strong>Allergies or dietary needs</strong>, if you tell us about them.</li>
<li><strong>Email, phone or WhatsApp:</strong> the details you share when you contact us.</li>
<li><strong>Technical data:</strong> our hosting provider (Cloudflare) processes your IP address and browser and request details to deliver and protect the website. The form’s security check (Cloudflare Turnstile) processes browser/device signals to tell people from bots.</li>
<li><strong>Your language preference</strong>, stored on your device (see <a href="#cookies">Cookies</a>).</li></ul>
<h2>3. Why we use it and our legal basis</h2><ul>
<li>Replying to your enquiry, preparing a quote and sending an automatic confirmation email — steps you ask us to take before entering into a contract (Art. 6(1)(b) GDPR).</li>
<li>Allergies and dietary information — your explicit consent (Art. 9(2)(a) GDPR), which you can withdraw at any time.</li>
<li>Keeping the website secure and preventing spam and abuse — our legitimate interests (Art. 6(1)(f)).</li>
<li>Keeping records the law requires, such as invoices for bookings — legal obligation (Art. 6(1)(c)).</li></ul>
<p>We don’t send marketing emails, we don’t sell data, and we don’t use automated decision-making or profiling.</p>
<h2>4. Who receives your data</h2><p>Service providers acting on our behalf (processors):</p><ul>
<li><strong>Cloudflare, Inc.</strong> — hosting, security, the Turnstile check and email forwarding.</li>
<li><strong>Resend, Inc.</strong> — sending the enquiry and confirmation emails.</li>
<li><strong>Google (Gmail)</strong> — the inbox where we receive and answer enquiries.</li>
<li><strong>BunnyWay d.o.o. (Bunny Fonts, EU)</strong> — delivers the website’s fonts and receives your IP address when they load.</li></ul>
<p>We don’t share your data with anyone else unless the law requires it.</p>
<h2>5. International transfers</h2><p>Some providers (Cloudflare, Resend, Google) are based in the US and may process data outside the EEA/UK. Where they do, transfers rely on appropriate safeguards such as the EU–US Data Privacy Framework (and its UK extension) or the European Commission’s Standard Contractual Clauses.</p>
<h2>6. How long we keep it</h2><ul>
<li>Enquiries that don’t lead to a booking: deleted within 24 months of our last contact.</li>
<li>Bookings: as long as needed to provide the service, and as long as Greek tax and accounting law requires.</li>
<li>Allergy and dietary information: deleted after your event, unless you ask us to keep it for future bookings.</li>
<li>Security logs: for the short period set by Cloudflare.</li></ul>
<h2>7. Your rights</h2><p>Under the GDPR (and UK GDPR) you can ask to access, correct, delete, restrict or port your data, object to processing based on legitimate interests, and withdraw consent at any time. Email ${mail} — we reply within one month.</p>
<p>You can complain to the Hellenic Data Protection Authority (Kifisias 1–3, 115 23 Athens, <a href="https://www.dpa.gr" rel="noopener" target="_blank">www.dpa.gr</a>), to the authority in the EU country where you live, or — in the UK — to the Information Commissioner’s Office (<a href="https://ico.org.uk" rel="noopener" target="_blank">ico.org.uk</a>).</p>
<h2>8. Do you have to give us your data?</h2><p>We need your name and email to reply; everything else is optional.</p>
<h2>9. Children</h2><p>Our services are for adults. We don’t knowingly collect children’s data.</p>
<h2>10. Changes</h2><p>We may update this policy; the current version is always on this page.</p>`,
    cookies:`<h1 id="sheet-title">Cookies &amp; storage</h1>${upd}
<p>We don’t use advertising, analytics or tracking cookies — which is why there’s no cookie banner.</p>
<h2>What is stored</h2><ul>
<li><strong>Language preference</strong> (<code>ap-lang</code>, in your browser’s localStorage): remembers whether you chose English or Greek. It stays on your device and is never sent to us.</li>
<li><strong>Cloudflare security:</strong> Cloudflare may set strictly necessary security cookies (for example to detect bots), and the Turnstile check runs when you use the form. These are used only for security.</li>
<li><strong>Fonts:</strong> loaded from Bunny Fonts (EU), without cookies.</li></ul>
<p>All of the above is strictly necessary for features you ask for, so no consent is required (Art. 5(3) ePrivacy Directive; Art. 4(5) Greek Law 3471/2006). You can clear it at any time in your browser settings.</p>`,
    terms:`<h1 id="sheet-title">Terms of use &amp; bookings</h1>${upd}
<h2>Information and quotes</h2><p>Information on this website is general. Menus and prices are quoted individually for each event.</p>
<h2>Bookings</h2><p>Sending an enquiry is not a booking. A booking is confirmed only when we confirm it in writing and any agreed deposit has been paid. Specific terms — deposit, cancellation and final guest numbers — are set out in your quote.</p>
<h2>Allergies and dietary needs</h2><p>Please tell us in advance. We take great care, but kitchens — including yours — may contain allergens. On request, we provide information on the 14 major allergens in each dish (Regulation (EU) 1169/2011).</p>
<h2>Right of withdrawal</h2><p>Because our services are catering services for a specific date, the 14-day right of withdrawal for distance contracts does not apply (Art. 16(l) Directive 2011/83/EU, as implemented in Greek law). Cancellation terms are set out in your quote.</p>
<h2>Intellectual property</h2><p>The content, photographs and logo on this website belong to Alexis Papadimitriou and may not be reproduced without permission.</p>
<h2>Governing law</h2><p>Greek law applies. Consumers keep the protection given by the law of the country where they live.</p>`,
    legal:`<h1 id="sheet-title">Legal notice</h1>${upd}
<h2>Business details</h2><dl>${info}</dl>
<h2>Hosting</h2><p>This website is hosted by Cloudflare, Inc.</p>
<h2>Complaints and disputes</h2><p>If you have a complaint, please contact us first at ${mail}. Consumers can also contact the Greek Consumer Ombudsman (<a href="https://www.synigoroskatanaloti.gr" rel="noopener" target="_blank">www.synigoroskatanaloti.gr</a>).</p>`
  };
}
export const LEGAL_KEYS=['privacy','cookies','terms','legal'];
