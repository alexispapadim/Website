import { I18N } from './i18n.js';
import { GALLERY } from './gallery.js';

/* ===== Edit these if details change ===== */
const CONFIG = {
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

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (RM) document.documentElement.classList.add('rm');
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const seg=(p,a,b)=>clamp((p-a)/(b-a));
const ease=t=>1-Math.pow(1-t,3);
const prog=el=>{const r=el.getBoundingClientRect(),t=el.offsetHeight-innerHeight;return t>0?clamp(-r.top/t):(r.top<0?1:0)};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IS_LOCAL=['localhost','127.0.0.1'].includes(location.hostname);
const PAGE_START=Date.now();

/* ---- olive branch, drawn in SVG (matches the card) ---- */
function branch(){
  const L=[[92,180,-70,.8],[88,168,55,.85],[82,156,-62,.9],[77,142,48,.9],[72,130,-55,.95],[67,116,40,.9],
           [63,104,-48,.95],[59,90,32,.85],[56,78,-40,.9],[52,64,25,.8],[50,54,-32,.8],[47,40,18,.7],[45,32,-25,.7],[42,14,-5,.65]];
  const leaf='M0 0C8-12 8-34 0-48C-8-34-8-12 0 0Z';
  let s='<svg viewBox="0 0 120 210" aria-hidden="true"><path class="stem" d="M104 204C74 160 54 104 42 12" fill="none" stroke="#4a5233" stroke-width="1.6" stroke-linecap="round"/>';
  s+='<path d="M86 184Q74 188 64 194" fill="none" stroke="#4a5233" stroke-width="1.2"/>';
  L.forEach(([x,y,r,k],i)=>{s+=`<g transform="translate(${x} ${y}) rotate(${r}) scale(${k})"><path class="lf" style="--i:${i}" d="${leaf}" fill="url(#lg)"/></g>`});
  s+=`<ellipse class="lf" style="--i:14" cx="62" cy="196" rx="8" ry="6" transform="rotate(-18 62 196)" fill="url(#og)"/>`;
  s+=`<ellipse class="lf" style="--i:15" cx="74" cy="198" rx="7.5" ry="5.6" transform="rotate(12 74 198)" fill="url(#og)"/>`;
  return s+'</svg>';
}
$$('.olive').forEach(e=>e.innerHTML=branch());

/* ---- contact links ---- */
$('#lnk-tel').href='tel:'+CONFIG.phone; $('#tel-txt').textContent=CONFIG.phoneDisplay;
$('#lnk-wa').href='https://wa.me/'+CONFIG.whatsapp.replace(/\D/g,'');
$('#lnk-mail').href='mailto:'+CONFIG.email; $('#mail-txt').textContent=CONFIG.email;
$('#f-date').min=new Date().toISOString().slice(0,10);

/* ===================== legal pages ===================== */
function legalPages(l){
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
const LEGAL_KEYS=['privacy','cookies','terms','legal'];
const sheet=$('#sheet'), sheetBody=$('#sheet-body');
let sheetKey='', sheetOpener=null;
function openLegal(key,push=true){
  if(!LEGAL_KEYS.includes(key)) return;
  sheetKey=key;
  sheetBody.innerHTML=legalPages(lang)[key];
  if(sheet.hidden){ sheetOpener=document.activeElement; sheet.hidden=false; document.documentElement.classList.add('locked'); }
  sheet.scrollTop=0;
  if(push) try{history.pushState({legal:key},'','#'+key)}catch(_){}
  $('#sheet-x').focus({preventScroll:true});
}
function closeLegal(fromPop=false){
  if(sheet.hidden) return;
  sheet.hidden=true; sheetKey=''; document.documentElement.classList.remove('locked');
  if(!fromPop) try{history.replaceState(null,'',location.pathname+location.search)}catch(_){}
  if(sheetOpener&&sheetOpener.focus) sheetOpener.focus({preventScroll:true});
}
$('#sheet-x').addEventListener('click',()=>closeLegal());
addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden) closeLegal()});
addEventListener('popstate',()=>{const k=location.hash.slice(1); if(LEGAL_KEYS.includes(k)) openLegal(k,false); else closeLegal(true)});

/* ---- language ---- */
let lang='en';
let words=[], wGen=0;
function buildStatement(){
  const tmp=document.createElement('div'); tmp.innerHTML=I18N[lang]['st.text'];
  const out=[];
  tmp.childNodes.forEach(n=>{
    const em=n.nodeType===1;
    n.textContent.split(/\s+/).filter(Boolean).forEach(w=>out.push(em?`<em class="w">${esc(w)}</em>`:`<span class="w">${esc(w)}</span>`));
  });
  $('#stmt').innerHTML=out.join(' ');
  words=$$('#stmt .w'); wGen++;
  $('#tap').classList.remove('gone');
}
function setLang(l){
  lang=I18N[l]?l:'en';
  document.documentElement.lang=lang;
  document.title=I18N[lang].title;
  const md=document.querySelector('meta[name="description"]'); if(md) md.setAttribute('content',I18N[lang]['meta.desc']);
  // Keep the address bar in step with the language: / (English) or /el/ (Greek)
  if(location.pathname==='/'||location.pathname==='/el/'){
    const path=lang==='el'?'/el/':'/';
    if(location.pathname!==path){
      const q=new URLSearchParams(location.search); q.delete('lang'); const qs=q.toString();
      try{history.replaceState(history.state,'',path+(qs?'?'+qs:'')+location.hash)}catch(_){}
    }
  }
  $$('[data-i18n]').forEach(e=>{const v=I18N[lang][e.dataset.i18n]; if(v!=null) e.innerHTML=v});
  $$('[data-i18n-ph]').forEach(e=>e.placeholder=I18N[lang][e.dataset.i18nPh]);
  $$('[data-i18n-aria]').forEach(e=>e.setAttribute('aria-label',I18N[lang][e.dataset.i18nAria]));
  $$('[data-i18n-alt]').forEach(e=>e.setAttribute('alt',I18N[lang][e.dataset.i18nAlt]));
  if(typeof renderGallery==='function') renderGallery();
  $$('.lang button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===lang));
  if(typeof placeInd==='function') placeInd();
  buildStatement(); setStatus('','');
  if(sheetKey) sheetBody.innerHTML=legalPages(lang)[sheetKey];
  if(tsWidget!==null) renderTurnstile();
  try{localStorage.setItem('ap-lang',lang)}catch(e){}
  layout(); tick();
}
const langBox=$('.lang');
const ind=document.createElement('span'); ind.className='lang-ind'; ind.style.transition='none'; langBox.prepend(ind);
function placeInd(){
  const b=$('.lang button[aria-pressed="true"]'); if(!b) return;
  ind.style.width=b.offsetWidth+'px'; ind.style.transform=`translateX(${b.offsetLeft-3}px)`;
}
/* ---- language switch: a liquid curtain sweeps up, the language name morphs letter by letter
        from one alphabet to the other, then the curtain lifts away and the new text cascades in ---- */
const LNAME={en:'English',el:'Ελληνικά'};
const GLYPHS='ΑΒΓΔΘΛΞΠΣΦΨΩαβγδεζηθλμξπσφψωAEGKMNRSWXZ';
const lsw=document.createElement('div'); lsw.id='lswap'; lsw.setAttribute('aria-hidden','true');
lsw.innerHTML='<div class="ls-panel"><i class="ls-bulge ls-top"></i><i class="ls-bulge ls-bot"></i>'+
  '<div class="ls-inner"><span class="ls-ap">A<span>P</span></span><div class="ls-word"></div><i class="ls-rule"></i>'+
  '<div class="ls-sub"><b data-l="en">English</b><em></em><b data-l="el">Ελληνικά</b></div></div></div>';
document.body.appendChild(lsw);
const LS={panel:lsw.querySelector('.ls-panel'),top:lsw.querySelector('.ls-top'),bot:lsw.querySelector('.ls-bot'),
  inner:lsw.querySelector('.ls-inner'),word:lsw.querySelector('.ls-word'),rule:lsw.querySelector('.ls-rule'),
  ap:lsw.querySelector('.ls-ap'),subs:[...lsw.querySelectorAll('.ls-sub b')]};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const EASE_IO='cubic-bezier(.76,0,.24,1)', EASE_OUT='cubic-bezier(.16,1,.3,1)';
function scramble(el,from,to,dur){
  return new Promise(res=>{
    const L=Math.max(from.length,to.length), t0=performance.now(); let lastSwap=0, noise=[];
    const step=now=>{
      const t=clamp((now-t0)/dur);
      if(now-lastSwap>45){ lastSwap=now; noise=[...Array(L)].map(()=>GLYPHS[(Math.random()*GLYPHS.length)|0]); }
      let s='';
      for(let i=0;i<L;i++){ const r=t*(L+5)-i*1.0;
        s+= r>=5 ? (to[i]||'') : r>0 ? noise[i] : (from[i]||''); }
      el.textContent=s;
      if(t<1) requestAnimationFrame(step); else { el.textContent=to; res(); }
    };
    requestAnimationFrame(step);
  });
}
function cascadeIn(){
  // Only animate text that is actually visible right now, and only up to its current opacity —
  // so things the scroll scenes are keeping hidden (e.g. the hero tagline) never flash.
  const effOpacity=el=>{ let o=1; for(let n=el;n&&n.nodeType===1;n=n.parentElement){ const cs=getComputedStyle(n);
      if(cs.visibility==='hidden'||cs.display==='none') return 0; o*=parseFloat(cs.opacity); if(o<.05) return 0; } return o; };
  const coveredByHeroDisc=el=>{ if(!el.closest('#hero')) return false; return M.hero&&pin(M.hero,scrollY)<.8; };
  const vis=[];
  for(const el of $$('main [data-i18n], header [data-i18n], #stmt')){
    if(vis.length>=26) break;
    const r=el.getBoundingClientRect();
    if(!r.width||r.bottom<=0||r.top>=innerHeight) continue;
    if(coveredByHeroDisc(el)) continue;
    const eo=effOpacity(el); if(eo<.6) continue;
    vis.push({el,o:parseFloat(getComputedStyle(el).opacity)||1});
  }
  vis.sort((a,b)=>a.el.getBoundingClientRect().top-b.el.getBoundingClientRect().top);
  vis.forEach(({el,o},i)=>el.animate(
    [{opacity:0,transform:'translate3d(0,34px,0)',filter:'blur(8px)'},{opacity:o,transform:'none',filter:'blur(0)'}],
    {duration:850,delay:120+i*55,easing:EASE_OUT,fill:'backwards'}));
}
let langBusy=false;
async function switchLang(l){
  if(l===lang||langBusy) return;
  if(RM){ setLang(l); return; }
  langBusy=true; const from=lang;
  $$('.lang button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===l)); placeInd();
  LS.word.textContent=LNAME[from];
  LS.subs.forEach(b=>b.classList.toggle('on',b.dataset.l===l));
  lsw.style.visibility='visible';
  // 1. curtain sweeps up, its leading edge bulging then flattening like liquid
  const inA=LS.panel.animate([{transform:'translate3d(0,100%,0)'},{transform:'translate3d(0,0,0)'}],{duration:700,easing:EASE_IO,fill:'forwards'});
  LS.top.animate([{transform:'scaleY(1)'},{transform:'scaleY(1)',offset:.35},{transform:'scaleY(0)'}],{duration:700,easing:EASE_IO,fill:'forwards'});
  LS.bot.animate([{transform:'scaleY(0)'},{transform:'scaleY(0)'}],{duration:10,fill:'forwards'});
  LS.ap.animate([{opacity:0,transform:'translate3d(0,30px,0) scale(.9)'},{opacity:1,transform:'none'}],{duration:700,delay:300,easing:EASE_OUT,fill:'both'});
  LS.word.animate([{opacity:0,transform:'translate3d(0,60px,0)',letterSpacing:'.3em'},{opacity:1,transform:'none',letterSpacing:'.02em'}],{duration:900,delay:320,easing:EASE_OUT,fill:'both'});
  LS.rule.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:900,delay:450,easing:EASE_OUT,fill:'both'});
  LS.subs[0].parentNode.animate([{opacity:0,transform:'translate3d(0,14px,0)'},{opacity:1,transform:'none'}],{duration:700,delay:520,easing:EASE_OUT,fill:'both'});
  await inA.finished;
  // 2. page swaps underneath while the name morphs between alphabets
  const y=scrollY; setLang(l); if(Math.abs(scrollY-y)>1) scrollTo(0,y);
  await wait(120);
  await scramble(LS.word,LNAME[from],LNAME[l],620);
  await wait(260);
  // 3. curtain lifts away (its trailing edge curls), new text cascades in behind it
  const out=[
    LS.panel.animate([{transform:'translate3d(0,0,0)'},{transform:'translate3d(0,-100%,0)'}],{duration:800,easing:EASE_IO,fill:'forwards'}),
    LS.bot.animate([{transform:'scaleY(0)'},{transform:'scaleY(1)',offset:.55},{transform:'scaleY(.2)'}],{duration:800,easing:EASE_IO,fill:'forwards'}),
    LS.inner.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translate3d(0,-80px,0)'}],{duration:520,easing:'cubic-bezier(.5,0,.75,0)',fill:'forwards'})
  ];
  setTimeout(cascadeIn,230);
  await out[0].finished;
  lsw.style.visibility='hidden';
  lsw.querySelectorAll('*').forEach(e=>e.getAnimations().forEach(an=>an.cancel()));
  LS.panel.getAnimations().forEach(an=>an.cancel());
  langBusy=false;
}
$$('.lang button').forEach(b=>b.addEventListener('click',()=>switchLang(b.dataset.lang)));

/* ===================== chef scene (pinned, layered) =====================
   Layers inside the box: outline word · gold line · arch with studio backdrop · filled word · cut-out of Alexis.
   As you scroll: the scene rises in, he lifts up and breaks out over the top of the arch while the arch
   settles back, his name glides through the scene behind him, then the caption draws in.            */
const C={sec:$('#chef'), box:$('#cbox')};
if(C.box){
  C.arch=C.box.querySelector('.c-arch'); C.archImg=C.arch.querySelector('img');
  C.cut=C.box.querySelector('.c-cut img'); C.line=C.box.querySelector('.c-line');
  C.front=C.box.querySelector('.c-word-front');
  C.words=[...C.box.querySelectorAll('.c-word span')];
  C.cap=$('.c-cap'); C.rule=$('.c-rule');
}
function renderChef(y){
  if(!C.box||!M.chef) return;
  const bh=M.bh||600;
  const enter=easeOutQ(clamp((y+M.vh-M.chef.top)/M.vh));      // section rising into view
  const p=pin(M.chef,y);                                        // progress while pinned
  const lift=easeIO(seg(p,.04,.62));                            // he rises out of the arch
  const grow=easeOutQ(seg(p,0,.32)), settle=easeIO(seg(p,.42,.86));
  // whole scene entrance
  put('cbT',C.box,'transform',`translate3d(0,${((1-enter)*70).toFixed(1)}px,0)`);
  put('cbO',C.box,'opacity',seg(enter,.15,.7).toFixed(3));
  // arch: grows in, then quietly recedes as he steps forward
  const as=(.9+.1*grow-.06*settle).toFixed(4);
  put('caT',C.arch,'transform',`scale(${as})`);
  put('cfT',C.front,'transform',`scale(${as})`);
  put('caI',C.archImg,'transform',`translate3d(0,${((p-.5)*-bh*.06).toFixed(1)}px,0) scale(1.08)`);
  // Alexis: starts low inside the arch, lifts and breaks out over the top
  const ty=((1-lift)*bh*.24+(1-enter)*bh*.06).toFixed(1), sc=(.94+.1*lift).toFixed(4);
  put('ccT',C.cut,'transform',`translate3d(0,${ty}px,0) scale(${sc})`);
  // his name glides through the scene, behind him
  const wx=((.5-p)*bh*1.5).toFixed(1), wo=(seg(p,.1,.3)*(1-.5*seg(p,.92,1))).toFixed(3);
  C.words.forEach((s,i)=>{ put('cwT'+i,s,'transform',`translate3d(calc(-50% + ${wx}px),-50%,0)`); put('cwO'+i,s,'opacity',wo); });
  // gold outline drifts out from behind the arch
  const lo=seg(p,.3,.58), le=easeOutQ(lo);
  put('clT',C.line,'transform',`translate3d(${(le*bh*.028).toFixed(1)}px,${(le*bh*.028).toFixed(1)}px,0) scale(${as})`);
  put('clO',C.line,'opacity',(lo*.85).toFixed(3));
  // caption
  const cp=easeOutQ(seg(p,.62,.82));
  put('ccpO',C.cap,'opacity',cp.toFixed(3));
  put('ccpT',C.cap,'transform',`translate3d(0,${((1-cp)*12).toFixed(1)}px,0)`);
  put('crT',C.rule,'transform',`scaleX(${easeOutQ(seg(p,.68,.9)).toFixed(4)})`);
}
const easeOutQ=t=>1-Math.pow(1-t,3);

/* ---- scroll scenes ----
   Performance rules (this is what keeps it smooth on phones):
   - section positions are measured once (on load / width change), never during scroll
   - each frame only reads scrollY and writes transforms/opacity (GPU-friendly)
   - the iPhone address bar showing/hiding does NOT trigger a re-layout            */
const hero=$('#hero'), mono=$('#mono'), back=$('#back'), hint=$('#hint'), rules=$$('.rule'), names=$$('.back .n');
(()=>{ const st=document.createElement('style'); st.textContent=`
  #back{background:transparent!important;clip-path:none!important;overflow:hidden}
  #back>*:not(#disc){position:relative}
  #disc{position:absolute;left:50%;top:52%;border-radius:50%;background:radial-gradient(circle at 50% 45%,#353c2b,#20251a 55%);transform:scale(0);will-change:transform;pointer-events:none;backface-visibility:hidden}
  .big .w{transition:color .5s ease,text-shadow .7s ease}
  .big .w.on{transition:opacity .35s ease,color .5s ease,text-shadow .7s ease}
  html:not(.rm) #hw{overflow:hidden;touch-action:pan-y;-webkit-user-select:none;user-select:none}
  #track{will-change:transform;backface-visibility:hidden}
  .rm #disc{transform:none}
  /* language pill: gold indicator slides between EN and ΕΛ */
  .lang{position:relative}
  .lang button{position:relative;z-index:1;background:transparent!important;transition:color .35s ease}
  .lang-ind{position:absolute;top:3px;bottom:3px;left:3px;width:0;border-radius:999px;background:var(--gold);transition:transform .5s cubic-bezier(.16,1,.3,1),width .5s cubic-bezier(.16,1,.3,1)}
  /* site-wide language change */
  header{view-transition-name:site-header}
  ::view-transition-group(site-header){animation-duration:.4s}
  html.vt-lang::view-transition-old(root){animation:apLangOut .3s cubic-bezier(.4,0,1,1) both}
  html.vt-lang::view-transition-new(root){animation:apLangIn .6s cubic-bezier(.16,1,.3,1) .1s both}
  html.lang-out main,html.lang-out footer{opacity:0;filter:blur(4px);transition:opacity .22s ease,filter .22s ease}
  html.lang-in main,html.lang-in footer{animation:apLangIn .6s cubic-bezier(.16,1,.3,1) both}
  @keyframes apLangOut{to{opacity:0;filter:blur(4px)}}
  @keyframes apLangIn{from{opacity:0;filter:blur(4px);transform:translateY(8px)}}
  /* navigation veil */
  #veil{position:fixed;inset:0;z-index:95;background:#20251a;display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .5s cubic-bezier(.65,0,.35,1),visibility 0s linear .5s}
  #veil.on{opacity:1;visibility:visible;transition:opacity .5s cubic-bezier(.65,0,.35,1),visibility 0s}
  .veil-in{display:flex;flex-direction:column;align-items:center;gap:16px;transform:translateY(8px);opacity:0;transition:transform .7s cubic-bezier(.16,1,.3,1),opacity .4s ease}
  #veil.on .veil-in{transform:none;opacity:1;transition-delay:.12s}
  .veil-ap{font-family:'Cormorant Garamond','GFS Didot',Georgia,serif;font-size:54px;line-height:.8;color:#d6b679;display:flex;align-items:flex-end}
  .veil-ap span{font-size:.7em;margin-left:-.36em;transform:translateY(.24em)}
  #veil i{display:block;height:1px;width:0;background:#b8914f;transition:width .8s cubic-bezier(.16,1,.3,1)}
  #veil.on i{width:110px;transition-delay:.15s}
  html.rm #veil{display:none}
  /* logo homecoming */
  .hc{position:fixed;inset:0;z-index:98;pointer-events:none;overflow:hidden}
  .hc-disc{position:absolute;border-radius:50%;background:radial-gradient(circle at 50% 50%,#f4eee5,#ece4d8 60%);transform:scale(0);will-change:transform,opacity}
  .hc-ring{position:absolute;border-radius:50%;border:1px solid #b8914f;transform:scale(0);will-change:transform,opacity}
  .hc-ap{position:absolute;display:flex;align-items:flex-end;font-family:'Cormorant Garamond','GFS Didot',Georgia,serif;line-height:.8;color:#20251a;white-space:nowrap;-webkit-font-smoothing:antialiased;backface-visibility:hidden}
  .hc-ap span{font-size:.7em;margin-left:-.36em;transform:translateY(.24em)}
  /* frosted menu bar once you scroll, so it stays readable over photos and text */
  header::before{content:"";position:absolute;inset:0;z-index:-1;opacity:0;pointer-events:none;
    background:rgba(240,233,222,.8);-webkit-backdrop-filter:blur(16px) saturate(1.3);backdrop-filter:blur(16px) saturate(1.3);
    border-bottom:1px solid rgba(32,37,26,.08);box-shadow:0 10px 30px -22px rgba(32,37,26,.5);transition:opacity .45s ease,background-color .45s ease,border-color .45s ease}
  header.scrolled::before{opacity:1}
  header.dark::before{background:rgba(26,30,21,.78);border-bottom-color:rgba(214,182,121,.14)}
  header{padding-top:max(12px,env(safe-area-inset-top))!important;padding-bottom:12px!important;transition:color .45s ease}
  /* tasting menu gallery */
  #kitchen.deck-mode{padding:0!important;overflow:visible}
  .tstage{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(16px,3vh,32px);background:var(--cream);
    padding-top:clamp(64px,9vh,96px);box-sizing:border-box;overflow:hidden}
  .tstage .kitchen-head{margin:0!important;text-align:center;padding:0 20px;will-change:transform}
  .tstage .kitchen-head .eyebrow{justify-content:center;margin-bottom:10px}
  .tstage .kitchen-head .eyebrow::after{content:"";width:28px;height:1px;background:currentColor}
  .tstage .kitchen-head h2{font-size:clamp(30px,5.6vw,60px)}
  .t-wrap{display:flex;flex-direction:column;align-items:center;gap:22px}
  .tstage.wide .t-wrap{flex-direction:row;gap:clamp(48px,6vw,110px)}
  .t-frame{position:relative;overflow:hidden;background:#e4dacb;will-change:transform,opacity;border-radius:4px;
    box-shadow:0 40px 70px -40px rgba(32,37,26,.55),0 4px 14px -6px rgba(32,37,26,.2)}
  .t-frame::after{content:"";position:absolute;inset:10px;border:1px solid rgba(214,182,121,.75);pointer-events:none;z-index:6}
  .t-open{all:unset;position:absolute;inset:0;z-index:7;cursor:zoom-in}
  .t-open:focus-visible{outline:2px solid var(--gold);outline-offset:-4px}
  .t-mask{position:absolute;left:50%;top:50%;overflow:hidden;visibility:hidden;will-change:transform;backface-visibility:hidden}
  .t-inner{position:absolute;left:50%;top:50%;will-change:transform}
  .t-inner img{width:100%;height:100%;object-fit:cover;display:block;will-change:transform}
  .t-shade{position:absolute;inset:0;background:#14170f;opacity:0;pointer-events:none}
  .t-blade{position:absolute;left:50%;top:50%;width:2px;margin-left:-1px;z-index:5;opacity:0;pointer-events:none;will-change:transform,opacity;
    background:linear-gradient(to bottom,transparent,rgba(214,182,121,.9) 18%,#fff8e6 50%,rgba(214,182,121,.9) 82%,transparent);
    box-shadow:0 0 14px 2px rgba(255,236,190,.55)}
  .t-edge{display:none}
  .t-card{text-align:center;max-width:min(440px,calc(100vw - 40px));will-change:transform,opacity}
  .tstage.wide .t-card{text-align:left;max-width:380px}
  .t-course,.t-title,.t-parts{overflow:hidden;padding-bottom:.08em}
  .t-num{display:inline-block;font-family:var(--serif);font-style:italic;font-size:22px;color:var(--gold)}
  .t-title span{display:inline-block;font-family:var(--serif);font-weight:400;font-size:clamp(26px,3.6vw,40px);line-height:1.1;color:var(--olive)}
  .t-parts span{display:inline-block;margin-top:6px;font:500 11px var(--sans);letter-spacing:.22em;text-transform:uppercase;color:var(--leaf);line-height:1.8}
  .t-ticks{display:flex;gap:14px;justify-content:center;margin-top:18px;padding-top:14px;border-top:1px solid rgba(184,145,79,.35)}
  .tstage.wide .t-ticks{justify-content:flex-start}
  .t-ticks b{font:400 13px var(--serif);font-style:italic;color:rgba(32,37,26,.35);cursor:pointer;position:relative;padding:4px 2px;transition:color .4s ease}
  .t-ticks b::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:1px;background:var(--gold);transform:scaleX(0);transition:transform .5s cubic-bezier(.16,1,.3,1)}
  .t-ticks b.on{color:var(--olive)}.t-ticks b.on::after{transform:scaleX(1)}
  .t-hint{margin:12px 0 0;font:600 10px var(--sans);letter-spacing:.28em;text-transform:uppercase;color:rgba(91,102,64,.7)}
  /* language curtain */
  #lswap{position:fixed;inset:0;z-index:97;visibility:hidden;pointer-events:none;overflow:hidden}
  .ls-panel{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,#353c2b,#1b2016 75%);transform:translate3d(0,100%,0);will-change:transform;display:flex;align-items:center;justify-content:center}
  .ls-bulge{position:absolute;left:-25%;right:-25%;height:26vh;background:inherit;border-radius:50%;will-change:transform}
  .ls-top{top:-13vh;background:#2a3022;transform-origin:50% 100%}
  .ls-bot{bottom:-13vh;background:#1d2218;transform-origin:50% 0;transform:scaleY(0)}
  .ls-inner{position:relative;display:flex;flex-direction:column;align-items:center;gap:18px;color:#ece4d8;text-align:center;padding:0 20px}
  .ls-ap{font-family:'Cormorant Garamond','GFS Didot',Georgia,serif;font-size:40px;line-height:.8;color:#d6b679;display:flex;align-items:flex-end;opacity:0}
  .ls-ap span{font-size:.7em;margin-left:-.36em;transform:translateY(.24em)}
  .ls-word{font-family:'Cormorant Garamond','GFS Didot',Georgia,serif;font-style:italic;font-weight:300;font-size:clamp(58px,15vw,150px);line-height:1;color:#f1e7d6;min-height:1.1em;white-space:nowrap;opacity:0}
  .ls-rule{display:block;width:min(260px,60vw);height:1px;background:#b8914f;transform:scaleX(0)}
  .ls-sub{display:flex;align-items:center;gap:14px;font:500 11px 'Commissioner',system-ui,sans-serif;letter-spacing:.32em;text-transform:uppercase;opacity:0}
  .ls-sub b{font-weight:500;color:rgba(236,228,216,.45);transition:color .5s}
  .ls-sub b.on{color:#d6b679}
  .ls-sub em{width:5px;height:5px;background:#b8914f;transform:rotate(45deg)}
  /* gallery — masonry columns that drift at different speeds */
  .gallery{columns:auto!important;display:flex;gap:14px;align-items:flex-start}
  @media(min-width:900px){.gallery{gap:22px}}
  .g-col{flex:1;min-width:0;will-change:transform}
  .g-col:nth-child(2){margin-top:56px}
  .g-col:nth-child(3){margin-top:22px}
  html:not(.rm) .g-item{opacity:0;transform:none;transition:none}
  .g-item{will-change:transform,opacity}
  .g-item img{will-change:transform;transform-origin:50% 60%}
  html:not(.rm) .g-item:hover img{transform:none}
  .g-item figcaption{transition:none}
  /* lightbox: photo flies out of the grid */
  .lightbox{background:transparent!important;animation:none!important}
  .lightbox::before{content:"";position:absolute;inset:0;background:rgba(14,16,11,.96);opacity:0;transition:opacity .45s ease}
  .lightbox.open::before{opacity:1}
  .lightbox>*{position:relative}
  .lightbox .lb-x,.lightbox .lb-nav,.lightbox .lb-count,.lightbox figcaption{opacity:0;transition:opacity .35s ease .15s}
  .lightbox.open .lb-x,.lightbox.open .lb-nav,.lightbox.open .lb-count,.lightbox.open figcaption{opacity:1}
  .lightbox .lb-x,.lightbox .lb-nav,.lightbox .lb-count{position:absolute}`; document.head.appendChild(st); })();
let disc=$('#disc');
if(!disc){ disc=document.createElement('div'); disc.id='disc'; disc.className='disc'; back.prepend(disc); }
const stmt=$('#statement'), occ=$('#occasions'), hw=$('#hw'), track=$('#track'), bar=$('#bar');
const steps=$('#steps'), pline=$('#pline'), wm=$('#wm'), about=$('#about'), hdr=$('#hdr');
const themed=$$('[data-theme]');
const docTop=el=>el.getBoundingClientRect().top+scrollY;
const probe=document.createElement('div');
probe.style.cssText='position:fixed;top:0;left:-9999px;width:1px;height:100vh;height:100svh;pointer-events:none;visibility:hidden';
document.body.appendChild(probe);

const M={vh:innerHeight,w:0,hero:{},stmt:{},occ:{},steps:{},about:{},themes:[]};
let hDist=0, cardStep=1;
function measure(){
  M.vh=probe.offsetHeight||innerHeight; M.w=innerWidth;
  if(typeof layoutDeck==='function') layoutDeck();
  const d=Math.ceil(Math.hypot(innerWidth,M.vh*1.04)*1.02);
  disc.style.width=disc.style.height=d+'px'; disc.style.margin=`${-d/2}px 0 0 ${-d/2}px`;
  hDist=Math.max(0,track.scrollWidth-hw.clientWidth);
  const c=track.children[0]; cardStep=c?c.offsetWidth+parseFloat(getComputedStyle(track).columnGap||0):1;
  if(!RM) occ.style.height=Math.round(M.vh+hDist*1.15)+'px'; else occ.style.height='auto';
  const box=el=>{const t=docTop(el);return{top:t,h:el.offsetHeight,span:Math.max(1,el.offsetHeight-M.vh)}};
  M.hero=box(hero); M.stmt=box(stmt); M.occ=box(occ); M.steps=box(steps); M.about=box(about);
  M.themes=themed.map(s=>{const b=box(s);return{top:b.top,bottom:b.top+b.h,dark:s.dataset.theme==='dark',hero:s===hero}});
  if(C.sec){ M.chef=box(C.sec); M.bh=C.box.offsetHeight; }
  M.gal=null;
  if(kitchen&&!kitchen.hidden&&D.on){ M.gal=box(kitchen); }
  else if(galleryEl&&!kitchen.hidden&&galleryEl.children.length){
    const gTop=docTop(galleryEl);
    M.gal={top:gTop,h:galleryEl.offsetHeight,items:GI.map(it=>({top:gTop+it.col.offsetTop+it.el.offsetTop,h:it.el.offsetHeight}))};
  }
}
const layout=measure;
const pin=(b,y)=>clamp((y-b.top)/b.span);

/* ---- horizontal cards ----
   Card position = page-scroll part + swipe part. You can swipe/drag them whenever they're on
   screen, and scrolling the page still glides them through the pinned section. */
let curLeft=0, off=0, offAnim=0, cardSnapT=0;
const baseLeft=y=>pin(M.occ,y)*hDist;
function setCards(left,raw){
  curLeft=clamp(left,0,hDist);
  track.style.transform=`translate3d(${-(raw??curLeft)}px,0,0)`;
  bar.style.transform=`scaleX(${hDist?curLeft/hDist:0})`;
}
function applyCards(y){ const b=baseLeft(y); off=clamp(off,-b,hDist-b); setCards(b+off); }
function animOff(target,dur=560){
  cancelAnimationFrame(offAnim);
  const from=off, t0=performance.now();
  const step=now=>{ const t=clamp((now-t0)/dur); off=from+(target-from)*easeOut(t); applyCards(sy);
    offAnim=t<1?requestAnimationFrame(step):0; };
  offAnim=requestAnimationFrame(step);
}
const snapLeft=left=>clamp(Math.round(left/cardStep)*cardStep,0,hDist);
let sw=null;
hw.addEventListener('pointerdown',e=>{
  if(RM||(e.pointerType==='mouse'&&e.button!==0)) return;
  cancelAnimationFrame(offAnim); offAnim=0;
  sw={id:e.pointerId,x:e.clientX,y:e.clientY,mode:'',start:curLeft,lx:e.clientX,lt:performance.now(),v:0};
});
hw.addEventListener('pointermove',e=>{
  if(!sw||e.pointerId!==sw.id) return;
  const dx=e.clientX-sw.x, dy=e.clientY-sw.y;
  if(!sw.mode){
    if(Math.abs(dx)<7&&Math.abs(dy)<7) return;
    sw.mode=Math.abs(dx)>Math.abs(dy)*1.1?'h':'v';
    if(sw.mode==='h'){ try{hw.setPointerCapture(e.pointerId)}catch(_){} hw.classList.add('drag'); sw.x=e.clientX; sw.start=curLeft; }
  }
  if(sw.mode!=='h') return;
  const now=performance.now(), dt=Math.max(1,now-sw.lt);
  sw.v=.75*((e.clientX-sw.lx)/dt)+.25*sw.v; sw.lx=e.clientX; sw.lt=now;
  let raw=sw.start-(e.clientX-sw.x);
  if(raw<0) raw*=.35; else if(raw>hDist) raw=hDist+(raw-hDist)*.35;   // soft edges
  off=clamp(raw,0,hDist)-baseLeft(sy);
  setCards(raw,raw);
});
function endSwipe(e){
  if(!sw||(e&&e.pointerId!==sw.id)) return;
  const was=sw; sw=null; hw.classList.remove('drag');
  if(was.mode!=='h') return;
  const target=snapLeft(curLeft-was.v*280);       // fling, then settle on a card
  animOff(target-baseLeft(sy));
}
hw.addEventListener('pointerup',endSwipe); hw.addEventListener('pointercancel',endSwipe);
hw.addEventListener('wheel',e=>{
  if(RM||Math.abs(e.deltaX)<=Math.abs(e.deltaY)) return;
  e.preventDefault(); cancelAnimationFrame(offAnim); offAnim=0;
  off=clamp(curLeft+e.deltaX,0,hDist)-baseLeft(sy); applyCards(sy);
  clearTimeout(cardSnapT); cardSnapT=setTimeout(()=>animOff(snapLeft(curLeft)-baseLeft(sy),420),140);
},{passive:false});
function stepCards(dir){
  const target=clamp(Math.round(curLeft/cardStep+dir)*cardStep,0,hDist);
  if(RM){hw.scrollTo({left:target,behavior:'smooth'});return}
  animOff(target-baseLeft(sy),620);
}
$('#prev').addEventListener('click',()=>stepCards(-1));
$('#next').addEventListener('click',()=>stepCards(1));

/* ---- snappy animated scrolling for nav links ---- */
let anim=0;
function stopAnim(){if(anim){cancelAnimationFrame(anim);anim=0}}
const easeIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const easeOut=t=>1-Math.pow(1-t,4);
function animScroll(to,dur,done,fn=easeIO){
  stopAnim();
  to=clamp(to,0,document.documentElement.scrollHeight-M.vh);
  if(RM){scrollTo(0,to);done&&done();return}
  const from=scrollY, d=to-from, t0=performance.now();
  if(Math.abs(d)<1){done&&done();return}
  dur=dur||Math.min(950,Math.max(600,Math.abs(d)*.6));
  const step=now=>{const t=clamp((now-t0)/dur);scrollTo(0,from+d*fn(t));if(t<1)anim=requestAnimationFrame(step);else{anim=0;done&&done()}};
  anim=requestAnimationFrame(step);
}
addEventListener('wheel',stopAnim,{passive:true});
addEventListener('touchstart',e=>{if(!(e.target instanceof Node)||!hw.contains(e.target))stopAnim()},{passive:true});
addEventListener('keydown',stopAnim);

// Only accept simple, known-safe fragment ids (never pass URL text to querySelector).
function elForHash(h){ return /^#[A-Za-z][\w-]{0,40}$/.test(h||'') ? document.getElementById(h.slice(1)) : null; }
const veil=document.createElement('div');
veil.id='veil'; veil.setAttribute('aria-hidden','true');
veil.innerHTML='<div class="veil-in"><span class="veil-ap">A<span>P</span></span><i></i></div>';
document.body.appendChild(veil);
let navBusy=false;
function goTo(hash,instant){
  const el=hash==='#top'?null:elForHash(hash);
  if(hash!=='#top'&&!el) return;
  const y=Math.min(el?docTop(el):0, document.documentElement.scrollHeight-M.vh);
  const after=()=>{if(hash==='#contact'){loadTurnstile();const f=$('#form');f.classList.remove('arrive');void f.offsetWidth;f.classList.add('arrive');$$('#contact [data-reveal],#contact [data-reveal-group]').forEach(e=>e.classList.add('in'))}};
  if(instant||RM){scrollTo(0,y);tick();after();return}
  if(Math.abs(y-scrollY)<M.vh*1.3){ animScroll(y,0,after); return; }   // short hop: gentle glide
  // Long jump: fade to the brand colour, move while hidden, then reveal — calm instead of racing past every section.
  if(navBusy) return; navBusy=true; stopAnim();
  veil.classList.add('on');
  setTimeout(()=>{
    scrollTo(0,y); tick();
    setTimeout(()=>{ veil.classList.remove('on'); setTimeout(after,180); navBusy=false; },260);
  },520);
}
/* ---- logo click: "homecoming" ----
   A cream circle blooms out of the logo and fills the screen; the AP monogram lifts out of the
   menu bar, grows and flies to the centre; behind the cream we return to the top; the monogram
   lands exactly on the opening monogram, the olive branch regrows and the cream melts away.   */
let homeBusy=false;
async function homecoming(link){
  if(homeBusy||navBusy) return;
  if(RM||scrollY<8){ goTo('#top'); return; }
  homeBusy=true; stopAnim();
  const from=link.getBoundingClientRect();
  const cx=from.left+Math.min(from.width,44)/2, cy=from.top+from.height/2;
  const rad=Math.hypot(Math.max(cx,innerWidth-cx),Math.max(cy,innerHeight-cy))+4;
  const wrapEl=document.createElement('div'); wrapEl.className='hc'; wrapEl.setAttribute('aria-hidden','true');
  const disc=document.createElement('i'); disc.className='hc-disc';
  Object.assign(disc.style,{width:rad*2+'px',height:rad*2+'px',left:(cx-rad)+'px',top:(cy-rad)+'px'});
  const ring=document.createElement('i'); ring.className='hc-ring';
  Object.assign(ring.style,{width:rad*2+'px',height:rad*2+'px',left:(cx-rad)+'px',top:(cy-rad)+'px'});
  const fly=document.createElement('span'); fly.className='hc-ap'; fly.innerHTML='A<span>P</span>';
  wrapEl.append(disc,ring,fly); document.body.append(wrapEl);
  // The flying monogram is drawn at its final (large) size and scaled DOWN to start, so the text is
  // rendered sharp at every moment instead of being a small bitmap stretched up.
  const fs0=parseFloat(getComputedStyle(link).fontSize)||26;
  const target=document.querySelector('#mono .ap')||document.querySelector('#mono');
  const tfs=parseFloat(getComputedStyle(target).fontSize)||120;
  const k=tfs/fs0;
  fly.style.fontSize=tfs+'px'; fly.style.left=from.left+'px'; fly.style.top=from.top+'px';
  fly.style.transformOrigin='0 0';
  const nat=fly.getBoundingClientRect(), w0=nat.width/k, h0=nat.height/k;   // size at menu-bar scale
  const E1='cubic-bezier(.7,0,.2,1)', E2='cubic-bezier(.16,1,.3,1)';
  const S0=`translate3d(0,0,0) scale(${(1/k).toFixed(5)})`;
  const MID=`translate3d(${(innerWidth/2-from.left-w0*1.8).toFixed(1)}px,${(innerHeight*.42-from.top-h0*1.8).toFixed(1)}px,0) scale(${(3.6/k).toFixed(5)})`;
  fly.style.transform=S0;
  link.style.visibility='hidden';
  disc.animate([{transform:'scale(0)'},{transform:'scale(1)'}],{duration:820,easing:E1,fill:'forwards'});
  ring.animate([{transform:'scale(0)',opacity:1},{transform:'scale(1.02)',opacity:.0}],{duration:1000,delay:60,easing:E1,fill:'forwards'});
  // phase 1: lift and grow towards the centre
  const mid=fly.animate([{transform:S0},{transform:MID}],{duration:820,easing:E1,fill:'forwards'});
  await mid.finished;
  // behind the cream: back to the top, restart the opening monogram
  scrollTo(0,0); sy=0; tick();
  document.body.classList.remove('loaded'); void document.body.offsetWidth;
  await wait(40);
  const t=target.getBoundingClientRect();
  // phase 2: land on the opening monogram (scale 1 = exactly its size)
  const land=fly.animate([{transform:MID},
    {transform:`translate3d(${(t.left-from.left).toFixed(1)}px,${(t.bottom-nat.height-from.top).toFixed(1)}px,0) scale(1)`}],
    {duration:760,easing:E2,fill:'forwards'});
  setTimeout(()=>document.body.classList.add('loaded'),260);    // olive branch regrows, letters rise
  await wait(380);
  disc.animate([{opacity:1},{opacity:0}],{duration:700,easing:'ease',fill:'forwards'});
  await land.finished;
  fly.animate([{opacity:1},{opacity:0}],{duration:500,easing:'ease',fill:'forwards'});
  link.style.visibility='';
  try{history.replaceState(null,'',location.pathname+location.search)}catch(_){}
  await wait(520);
  wrapEl.remove(); homeBusy=false;
}
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]'); if(!a)return;
  const h=a.getAttribute('href'), key=h.slice(1);
  if(LEGAL_KEYS.includes(key)){ e.preventDefault(); openLegal(key, sheet.hidden); return; }
  if(h.length<2)return;
  e.preventDefault(); if(!sheet.hidden) closeLegal();
  if(h==='#top'&&a.classList.contains('brand')) homecoming(a); else goTo(h);
  try{history.replaceState(null,'',h==='#top'?location.pathname+location.search:h)}catch(_){}
});

/* ---- statement: tap to light up (temporary, so the scroll effect keeps working) ---- */
let lightTimer=0;
$('#stmt').addEventListener('click',e=>{
  const w=e.target.closest('.w'), idx=w?words.indexOf(w):0, set=words;
  $('#tap').classList.add('gone');
  clearTimeout(lightTimer);
  set.forEach((el,i)=>setTimeout(()=>{
    if(words!==set) return;
    el.classList.add('on','flash');
    setTimeout(()=>el.classList.remove('flash'),i===idx?900:420);
  },Math.abs(i-idx)*32));
  const span=Math.max(idx,set.length-1-idx)*32;
  lightTimer=setTimeout(()=>set.forEach((el,i)=>setTimeout(()=>el.classList.remove('on'),Math.abs(i-idx)*24)),span+2600);
});

/* ---- one frame: read scrollY, write styles ---- */
const last={};
const put=(key,el,prop,val)=>{ if(last[key]!==val){ last[key]=val; el.style[prop]=val; } };
function render(y,realY){
  const p=RM?1:pin(M.hero,y);
  if(!RM){
    const z=ease(seg(p,0,.55));
    put('mono',mono,'transform',`scale(${(1+z*1.6).toFixed(4)})`);
    put('monoO',mono,'opacity',(1-seg(p,.18,.45)).toFixed(3));
    const rs=`scaleX(${(1-ease(seg(p,0,.28))).toFixed(4)})`; rules.forEach((r,i)=>put('rule'+i,r,'transform',rs));
    put('disc',disc,'transform',`scale(${ease(seg(p,.12,.58)).toFixed(4)})`);
    names.forEach((n,i)=>{const t=ease(seg(p,.45+i*.06,.7+i*.06));put('nO'+i,n,'opacity',t.toFixed(3));put('nT'+i,n,'transform',`translate3d(0,${((1-t)*48).toFixed(1)}px,0)`)});
    put('hint',hint,'opacity',(1-seg(p,0,.06)).toFixed(3));
  }
  const lit=(RM?1:seg(pin(M.stmt,y),.08,.82))*words.length;
  for(let i=0;i<words.length;i++) put('w'+wGen+'_'+i,words[i],'opacity',(.14+.86*clamp(lit-i)).toFixed(3));
  if(!RM&&!(sw&&sw.mode==='h')) applyCards(y);
  if(!RM){
    put('pline',pline,'transform',`scaleY(${clamp((y+M.vh*.62-M.steps.top)/M.steps.h).toFixed(4)})`);
    put('wm',wm,'transform',`translate3d(0,calc(-50% + ${((M.about.top-y)*-.18).toFixed(1)}px),0)`);
  }
  let dark=false; const hy=realY+40;
  for(const s of M.themes){ if(s.top<=hy&&s.bottom>hy){ dark=s.hero?p>.42:s.dark; break; } }
  hdr.classList.toggle('dark',dark);
  hdr.classList.toggle('scrolled',realY>M.vh*.9);
  if(!RM) renderChef(y);
  if(!RM){ if(D.on) renderDeck(y); else renderGallery3D(y); }
}

/* Smoothing: animations glide towards the scroll position instead of copying it.
   iPhone Safari reports scroll positions unevenly, which made direct mapping look steppy. */
let sy=scrollY, loop=0, lastT=0;
function frame(t){
  const dt=lastT?Math.min(64,t-lastT):16.7; lastT=t;
  const ty=scrollY, k=1-Math.pow(1-.3,dt/16.7), prev=sy;
  sy+=(ty-sy)*k; if(Math.abs(ty-sy)<.35) sy=ty;
  // While the section is pinned, page scrolling gradually hands the cards back to the scroll.
  if(off&&!sw&&!offAnim&&sy>M.occ.top&&sy<M.occ.top+M.occ.span) off*=Math.exp(-Math.abs(sy-prev)/420);
  render(sy,ty);
  if(sy!==ty) loop=requestAnimationFrame(frame); else { loop=0; lastT=0; }
}
function tick(){ sy=scrollY; render(sy,sy); }          // instant sync (load, resize, language)
addEventListener('scroll',()=>{ if(!loop) loop=requestAnimationFrame(frame); },{passive:true});
/* plate stack: when scrolling stops mid-way, glide to the nearest plate (or the final fan) */
let snapT=0, touching=false;
addEventListener('touchstart',()=>{touching=true; clearTimeout(snapT);},{passive:true});
addEventListener('touchend',()=>{touching=false; queueSnap(180);},{passive:true});
addEventListener('scroll',()=>queueSnap(170),{passive:true});
function queueSnap(ms){ clearTimeout(snapT); snapT=setTimeout(deckSnap,ms); }
function deckSnap(){
  if(RM||!D.on||!M.gal||touching||anim||sw||navBusy) return;
  const y=scrollY, top=M.gal.top, span=M.gal.span;
  if(y<=top+2||y>=top+span-2) return;
  const N=PHOTOS.length, T=deckPhases(N).T;
  const pts=[]; for(let k=0;k<N;k++) pts.push(Math.min(1,k/T)); pts.push(1);
  const p=(y-top)/span; let best=pts[0];
  for(const q of pts) if(Math.abs(q-p)<Math.abs(best-p)) best=q;
  const ty=top+best*span;
  if(Math.abs(ty-y)<3) return;
  animScroll(ty,Math.min(700,Math.max(380,Math.abs(ty-y)*.9)),null,easeOut);
}
// Re-measure only when the width really changes (rotation, desktop resize) — not when
// the mobile address bar slides in/out, which is what caused the jumping.
let rzT=0;
addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(()=>{
  if(innerWidth!==M.w||Math.abs((probe.offsetHeight||innerHeight)-M.vh)>120){measure();tick()}
},120)});
addEventListener('load',()=>{measure();tick()});

const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.18,rootMargin:'0px 0px -6% 0px'});
$$('[data-reveal],[data-reveal-group]').forEach(e=>io.observe(e));

/* ===================== form ===================== */
const form=$('#form'), status=$('#status'), send=$('#send');
let busy=false;

/* Cloudflare Turnstile — loaded only when the form comes near the screen */
let tsLoaded=false, tsWidget=null, tsToken='';
const TS_TEST_KEY='1x00000000000000000000AA';
const siteKey=()=>/^REPLACE/.test(CONFIG.turnstileSiteKey)?TS_TEST_KEY:CONFIG.turnstileSiteKey;
function loadTurnstile(){
  if(tsLoaded) return; tsLoaded=true;
  window.onTurnstileReady=renderTurnstile;
  const s=document.createElement('script');
  s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileReady';
  s.async=true; s.defer=true;
  document.head.appendChild(s);
}
function renderTurnstile(){
  if(!window.turnstile) return;
  if(tsWidget!==null){ try{window.turnstile.remove(tsWidget)}catch(_){} }
  tsToken='';
  tsWidget=window.turnstile.render('#ts',{
    sitekey:siteKey(), action:'enquiry', theme:'light', size:'flexible', language:lang==='el'?'el':'en',
    callback:t=>{tsToken=t}, 'expired-callback':()=>{tsToken=''}, 'error-callback':()=>{tsToken=''}
  });
}
new IntersectionObserver((es,o)=>{if(es.some(e=>e.isIntersecting)){loadTurnstile();o.disconnect()}},{rootMargin:'900px 0px'}).observe($('#contact'));
form.addEventListener('focusin',loadTurnstile,{once:true});

function setStatus(kind,key,withMail){
  status.className='status'+(kind?' '+kind:'');
  status.textContent=key?I18N[lang][key]:'';
  if(withMail){
    const a=document.createElement('a'); a.href='mailto:'+CONFIG.email; a.textContent=CONFIG.email;
    status.append(' ',a);
  }
}
function markBad(fields){
  $$('#form .f.bad').forEach(f=>f.classList.remove('bad'));
  const map={name:'f-name',email:'f-email',phone:'f-phone',event_date:'f-date',guests:'f-guests',location:'f-loc',occasion:'f-occ',message:'f-msg'};
  (fields||[]).forEach(k=>{const el=map[k]&&document.getElementById(map[k]); if(el) el.closest('.f').classList.add('bad')});
  const first=$('#form .f.bad input, #form .f.bad select, #form .f.bad textarea'); if(first) first.focus();
}
const EMAIL_RE=/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{1,59})$/;

form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(busy) return;
  const v=n=>(form.elements[n]?form.elements[n].value:'').trim();
  const data={
    name:v('name'), email:v('email'), phone:v('phone'), event_date:v('event_date'),
    guests:v('guests')===''?'':Number(v('guests')), location:v('location'), occasion:v('occasion'),
    message:v('message'), lang, website:v('website'), t:Date.now()-PAGE_START
  };
  const bad=[];
  if(data.name.length<2) bad.push('name');
  if(!EMAIL_RE.test(data.email)) bad.push('email');
  if(data.phone && !/^[+0-9 ()./-]{5,32}$/.test(data.phone)) bad.push('phone');
  if(data.guests!=='' && !(Number.isInteger(data.guests)&&data.guests>=1&&data.guests<=1000)) bad.push('guests');
  if(bad.length){ markBad(bad); setStatus('err','s.req'); return; }
  markBad([]);

  data.token=tsToken || (IS_LOCAL?'dev-pass':'');
  if(!data.token){ loadTurnstile(); setStatus('err','s.captcha'); return; }

  busy=true; send.disabled=true; setStatus('','s.sending');
  try{
    const res=await fetch(CONFIG.api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),credentials:'same-origin',cache:'no-store'});
    const j=await res.json().catch(()=>({}));
    if(res.ok&&j.ok){
      form.reset(); setStatus('ok','s.ok');
      busy=true; setTimeout(()=>{busy=false;send.disabled=false},15000);
      return;
    }
    if(j.error==='invalid'){ markBad(j.fields); setStatus('err','s.req'); }
    else if(j.error==='captcha') setStatus('err','s.captcha');
    else if(j.error==='rate') setStatus('err','s.rate');
    else setStatus('err','s.err',true);
  }catch(_){
    setStatus('err','s.err',true);
  }finally{
    if(window.turnstile&&tsWidget!==null){ try{window.turnstile.reset(tsWidget)}catch(_){} }
    tsToken='';
    if(!status.classList.contains('ok')){ busy=false; send.disabled=false; }
  }
});


/* ===================== food gallery ===================== */
const kitchen=$('#kitchen'), galleryEl=$('#gallery'), lb=$('#lightbox'), lbImg=$('#lb-img'), lbCap=$('#lb-cap'), lbCount=$('#lb-count');
const PHOTOS=(Array.isArray(GALLERY)?GALLERY:[]).filter(g=>g&&typeof g.file==='string'&&/^[\w.\- ]+\.(jpe?g|png|webp|avif)$/i.test(g.file));
const capOf=g=>String((lang==='el'?g.el:g.en)||g.en||'');
const srcOf=g=>'/'+encodeURIComponent(g.file);
let GI=[], galCols=0, galT=0;

/* ---- the tasting menu (pinned, scroll-driven) ----
   One dish at a time, presented like a course on a printed menu. Moving to the next course is a
   single clean diagonal cut: a fine gold blade crosses the frame and slices the next dish in,
   while the previous plate settles back. Each course rests (and the scroll snaps to it).        */
const D={on:false};
const ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI'];
const CUT_DEG=-20;                       // angle of the knife cut
function splitDish(t){ const k=t.indexOf(','); return k<0?{title:t,parts:''}:{title:t.slice(0,k).trim(),parts:t.slice(k+1).split(',').map(s=>s.trim()).filter(Boolean).join(' · ')}; }
function buildDeck(){
  const N=PHOTOS.length;
  kitchen.classList.add('deck-mode');
  const head=kitchen.querySelector('.kitchen-head');
  const stage=document.createElement('div'); stage.className='stage tstage';
  stage.innerHTML='<div class="t-wrap"><div class="t-frame"><button type="button" class="t-open"></button><i class="t-blade"></i><i class="t-edge"></i></div>'+
    '<div class="t-card"><div class="t-course"><span class="t-num"></span></div><div class="t-title"><span></span></div>'+
    '<div class="t-parts"><span></span></div><div class="t-ticks"></div><p class="t-hint" data-i18n="kt.hint"></p></div></div>';
  if(head) stage.prepend(head);
  galleryEl.hidden=true; kitchen.append(stage);
  const frame=stage.querySelector('.t-frame');
  Object.assign(D,{on:true,stage,head,frame,open:stage.querySelector('.t-open'),blade:stage.querySelector('.t-blade'),
    card:stage.querySelector('.t-card'),num:stage.querySelector('.t-num'),title:stage.querySelector('.t-title span'),
    parts:stage.querySelector('.t-parts span'),ticks:stage.querySelector('.t-ticks'),hint:stage.querySelector('.t-hint'),
    active:-1,capTok:0,layers:[]});
  D.hint.innerHTML=I18N[lang]['kt.hint']||'';
  GI=[];
  PHOTOS.forEach((g,i)=>{
    const mask=document.createElement('div'); mask.className='t-mask';
    const inner=document.createElement('div'); inner.className='t-inner';
    const img=document.createElement('img'); img.src=srcOf(g); img.alt=capOf(g); img.decoding='async'; if(i>1) img.loading='lazy';
    const shade=document.createElement('i'); shade.className='t-shade';
    img.addEventListener('error',()=>{ console.warn('Gallery photo not found:',g.file); },{once:true});
    inner.append(img,shade); mask.append(inner); frame.insertBefore(mask,D.blade);
    const tick=document.createElement('b'); tick.textContent=ROMAN[i]||String(i+1);
    tick.addEventListener('click',()=>goCourse(i)); D.ticks.append(tick);
    D.layers.push({mask,inner,img,shade,tick,g});
    GI.push({el:mask,img,cap:null,col:null});
  });
  D.open.addEventListener('click',()=>{ if(D.active>=0) openLightbox(D.active); });
  for(const k in last) if(k.startsWith('t')) delete last[k];
}
function deckPhases(N){ const T=Math.max(1,N-1)+.45; return {T}; }   // N-1 cuts + a final rest
function layoutDeck(){
  if(!D.on) return;
  const N=PHOTOS.length, vw=innerWidth, vh=M.vh, wide=vw>=900;
  kitchen.style.height=Math.round(vh*(1.15+deckPhases(N).T*.95))+'px';
  D.stage.classList.toggle('wide',wide);
  const headH=D.head?D.head.offsetHeight:0, top=Math.min(96,Math.max(64,vh*.09));
  let H, W;
  if(wide){ H=Math.min(vh-top-headH-90,720); W=H*.8; }
  else { const cardH=D.card.offsetHeight||130; H=Math.min(vh-top-headH-cardH-64,(vw-48)*1.25,640); H=Math.max(H,260); W=H*.8; if(W>vw-40){W=vw-40;H=W*1.25;} }
  D.W=W; D.H=H; D.diag=Math.hypot(W,H);
  Object.assign(D.frame.style,{width:W+'px',height:H+'px'});
  const S=Math.ceil(D.diag*1.6);
  D.layers.forEach(L=>{
    Object.assign(L.mask.style,{width:S+'px',height:S+'px',marginLeft:(-S/2)+'px',marginTop:(-S/2)+'px'});
    Object.assign(L.inner.style,{width:W+'px',height:H+'px',marginLeft:(-W/2)+'px',marginTop:(-H/2)+'px'});
  });
  D.S=S;
  Object.assign(D.blade.style,{height:S+'px',marginTop:(-S/2)+'px'});
  for(const k in last) if(k.startsWith('t')) delete last[k];
}
function setDeckCaption(i){
  if(i===D.active) return; const first=D.active<0, dir=i>D.active?1:-1; D.active=i;
  const tok=++D.capTok, d=splitDish(capOf(PHOTOS[i]));
  D.layers.forEach((L,k)=>L.tick.classList.toggle('on',k===i));
  D.open.setAttribute('aria-label',capOf(PHOTOS[i]));
  const E='cubic-bezier(.16,1,.3,1)';
  const els=[D.num,D.title,D.parts];
  const show=()=>{ if(tok!==D.capTok) return;
    els.forEach(el=>el.getAnimations().forEach(an=>an.cancel()));
    D.num.textContent=(ROMAN[i]||String(i+1));
    D.title.textContent=d.title; D.parts.textContent=d.parts;
    [D.num,D.title,D.parts].forEach((el,k)=>el.animate([{transform:`translate3d(0,${105*dir}%,0)`,opacity:0},{transform:'none',opacity:1}],{duration:700,delay:k*70,easing:E,fill:'backwards'})); };
  if(first) return show();
  els.forEach(el=>el.getAnimations().forEach(an=>an.cancel()));
  Promise.all(els.map(el=>el.animate([{transform:'none',opacity:1},{transform:`translate3d(0,${-105*dir}%,0)`,opacity:0}],{duration:220,easing:'cubic-bezier(.5,0,.75,0)',fill:'forwards'}).finished)).then(show,show);
}
function goCourse(i){
  if(!M.gal) return; const N=PHOTOS.length, T=deckPhases(N).T;
  animScroll(M.gal.top+Math.min(1,i/T)*M.gal.span,0,null,easeIO);
}
function renderDeck(y){
  if(!M.gal) return;
  const N=PHOTOS.length, vh=M.vh, T=deckPhases(N).T;
  const enter=clamp((y+vh-M.gal.top)/vh), p=pin(M.gal,y);
  const u=Math.min(N-1,p*T);                                   // 0 = first course … N-1 = last
  const idx=Math.min(N-1,Math.floor(u)), frac=u-idx;
  const c=idx>=N-1?0:easeIO(seg(frac,.3,.92));                 // the cut (rests at the start of each course)
  const S=D.S||800, half=S/2, sweep=D.diag*.62+2;
  const lineX=sweep-(2*sweep)*c;                                // blade position along the cut axis
  // whole frame rises in as the section arrives
  const e=easeOutQ(enter);
  put('tF',D.frame,'transform',`translate3d(0,${((1-e)*60).toFixed(1)}px,0) scale(${(.94+.06*e).toFixed(4)})`);
  put('tFo',D.frame,'opacity',seg(enter,.1,.6).toFixed(3));
  D.layers.forEach((L,i)=>{
    let vis='hidden', mx=-S, inS=1, sh=0;
    if(i===idx){ vis='visible'; mx=0; inS=1-.05*c; sh=.35*c; }
    else if(i===idx+1&&c>0){ vis='visible'; mx=lineX+half; inS=1.1-.1*c; }
    if(i===idx&&enter<1) inS*=1.12-.12*e;
    put('tv'+i,L.mask,'visibility',vis);
    if(vis==='visible'){
      put('tm'+i,L.mask,'transform',`rotate(${CUT_DEG}deg) translate3d(${mx.toFixed(1)}px,0,0)`);
      put('ti'+i,L.inner,'transform',`translate3d(${(-mx).toFixed(1)}px,0,0) rotate(${-CUT_DEG}deg)`);
      put('tim'+i,L.img,'transform',`scale(${inS.toFixed(4)})`);
      put('ts'+i,L.shade,'opacity',sh.toFixed(3));
    }
  });
  // the blade: a fine gold line with a glint, only while cutting
  const bo=c>0&&c<1?Math.sin(Math.PI*c):0;
  put('tbT',D.blade,'transform',`rotate(${CUT_DEG}deg) translate3d(${lineX.toFixed(1)}px,0,0)`);
  put('tbO',D.blade,'opacity',bo.toFixed(3));
  setDeckCaption(c>.5?idx+1:idx);
  put('tC',D.card,'opacity',seg(enter,.35,.85).toFixed(3));
  put('tCT',D.card,'transform',`translate3d(0,${((1-easeOutQ(seg(enter,.35,1)))*24).toFixed(1)}px,0)`);
  if(D.head) put('tHd',D.head,'transform',`translate3d(0,${(-seg(p,0,.2)*10).toFixed(1)}px,0)`);
}

/* masonry grid: used when the visitor prefers reduced motion */
function renderMasonry(){
  const n=innerWidth>=900?3:2; galCols=n;
  galleryEl.textContent=''; GI=[];
  const cols=[...Array(n)].map(()=>{const c=document.createElement('div'); c.className='g-col'; galleryEl.append(c); return c;});
  PHOTOS.forEach((g,i)=>{
    const col=cols[i%n];
    const fig=document.createElement('figure'); fig.className='g-item';
    const btn=document.createElement('button'); btn.type='button';
    const img=document.createElement('img');
    img.src=srcOf(g); img.loading='lazy'; img.decoding='async'; img.alt=capOf(g);
    if(g.w&&g.h){ img.width=g.w; img.height=g.h; }
    btn.append(img); btn.setAttribute('aria-label',capOf(g)||('Photo '+(i+1)));
    btn.addEventListener('click',()=>openLightbox(i));
    fig.append(btn);
    let cap=null;
    if(capOf(g)){ cap=document.createElement('figcaption'); cap.textContent=capOf(g); fig.append(cap); }
    col.append(fig); GI.push({el:fig,img,cap,col});
  });
  GI.forEach(it=>it.el.style.opacity=1);
}
function renderGallery(){
  if(!kitchen||!galleryEl) return;
  if(!PHOTOS.length){ kitchen.hidden=true; return; }
  kitchen.hidden=false;
  if(RM) return renderMasonry();
  if(!D.on) buildDeck();
  else { // language change: refresh captions in place
    D.layers.forEach(L=>{ L.img.alt=capOf(L.g); });
    if(D.active>=0){ const d=splitDish(capOf(PHOTOS[D.active])); D.title.textContent=d.title; D.parts.textContent=d.parts; D.open.setAttribute('aria-label',capOf(PHOTOS[D.active])); }
    D.hint.innerHTML=I18N[lang]['kt.hint']||'';
  }
}
addEventListener('resize',()=>{ if(RM&&PHOTOS.length&&(innerWidth>=900?3:2)!==galCols){ renderMasonry(); measure(); tick(); } });
const COL_SPEED=[0,-1,.55];
function renderGallery3D(y){ /* masonry needs no scroll effects */ }

/* lightbox: the photo flies out of the grid and back */
let lbIndex=0, lbOpener=null, lbBusy=false;
const thumbOf=i=>GI[i]&&GI[i].img;
function showPhoto(i,instant){
  lbIndex=(i+PHOTOS.length)%PHOTOS.length; const g=PHOTOS[lbIndex];
  const set=()=>{ lbImg.src='/'+encodeURIComponent(g.file); lbImg.alt=capOf(g); lbCap.textContent=capOf(g);
    lbCount.textContent=`${lbIndex+1} / ${PHOTOS.length}`; lbImg.classList.remove('swap'); };
  if(instant||RM) return set();
  lbImg.classList.add('swap'); setTimeout(set,180);
}
function flip(fromRect,toRect,dur,done){
  lbImg.style.transition='none'; lbImg.style.transformOrigin='0 0';
  lbImg.style.transform=`translate3d(${fromRect.left-toRect.left}px,${fromRect.top-toRect.top}px,0) scale(${fromRect.width/toRect.width},${fromRect.height/toRect.height})`;
  lbImg.style.opacity='';
  void lbImg.offsetWidth;
  lbImg.style.transition=`transform ${dur}ms cubic-bezier(.2,.8,.2,1)`;
  lbImg.style.transform='none';
  setTimeout(()=>{ lbImg.style.transition=''; lbImg.style.transform=''; lbImg.style.transformOrigin=''; done&&done(); },dur+30);
}
async function openLightbox(i){
  if(lbBusy) return; lbBusy=true;
  lbOpener=document.activeElement; showPhoto(i,true);
  lbImg.style.opacity='0'; lb.hidden=false; document.documentElement.classList.add('locked');
  const th=thumbOf(i);
  try{ await lbImg.decode(); }catch(_){}
  requestAnimationFrame(()=>lb.classList.add('open'));
  const a=th&&th.getBoundingClientRect(), b=lbImg.getBoundingClientRect();
  if(!RM&&a&&a.width&&b.width) flip(a,b,620); else lbImg.style.opacity='';
  setTimeout(()=>{lbBusy=false;},640);
  $('#lb-x').focus({preventScroll:true});
}
function closeLightbox(){
  if(lb.hidden||lbBusy) return; lbBusy=true;
  lb.classList.remove('open');
  const th=thumbOf(lbIndex), finish=()=>{ lb.hidden=true; lbImg.style.cssText=''; document.documentElement.classList.remove('locked'); lbBusy=false;
    if(lbOpener&&lbOpener.focus) lbOpener.focus({preventScroll:true}); };
  if(RM||!th) return finish();
  const a=th.getBoundingClientRect(), b=lbImg.getBoundingClientRect();
  const onScreen=a.bottom>0&&a.top<innerHeight&&a.width>0;
  if(!onScreen){ lbImg.style.transition='opacity .3s ease'; lbImg.style.opacity='0'; return setTimeout(finish,320); }
  lbImg.style.transformOrigin='0 0'; lbImg.style.transition='transform .5s cubic-bezier(.4,0,.2,1)';
  lbImg.style.transform=`translate3d(${a.left-b.left}px,${a.top-b.top}px,0) scale(${a.width/b.width},${a.height/b.height})`;
  setTimeout(finish,500);
}
if(lb){
  $('#lb-x').addEventListener('click',closeLightbox);
  $('#lb-prev').addEventListener('click',()=>showPhoto(lbIndex-1));
  $('#lb-next').addEventListener('click',()=>showPhoto(lbIndex+1));
  lb.addEventListener('click',e=>{ if(e.target===lb) closeLightbox(); });
  addEventListener('keydown',e=>{ if(lb.hidden) return;
    if(e.key==='Escape') closeLightbox(); else if(e.key==='ArrowLeft') showPhoto(lbIndex-1); else if(e.key==='ArrowRight') showPhoto(lbIndex+1); });
  let sx=null;
  lb.addEventListener('pointerdown',e=>{ sx=e.clientX; });
  lb.addEventListener('pointerup',e=>{ if(sx===null) return; const dx=e.clientX-sx; sx=null;
    if(Math.abs(dx)>50) showPhoto(lbIndex+(dx<0?1:-1)); });
}

/* ---- init ---- */
let start='';
try{start=new URLSearchParams(location.search).get('lang')||''}catch(e){}
if(!start && location.pathname.startsWith('/el')) start='el';
if(!start){ try{start=localStorage.getItem('ap-lang')||''}catch(e){} }
if(!start) start=(navigator.language||'').toLowerCase().startsWith('el')?'el':'en';
setLang(start);
requestAnimationFrame(()=>{document.body.classList.add('loaded'); placeInd(); requestAnimationFrame(()=>{ind.style.transition=''});});
const initHash=location.hash;
const landLegal=LEGAL_KEYS.includes(initHash.slice(1));
const landHash=!landLegal&&elForHash(initHash)?initHash:'';
if(landHash){history.scrollRestoration='manual';goTo(landHash,true)}
if(landLegal){try{history.replaceState(null,'',location.pathname+location.search)}catch(_){} openLegal(initHash.slice(1))}
(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>{layout();tick();if(landHash)goTo(landHash,true)});
