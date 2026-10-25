/* Runs before the page paints: if we came here through the curtain from the other page,
   keep the page hidden behind it until curtain.js takes over (see arrival() there). */
try { if (sessionStorage.getItem('ap-arrive')) document.documentElement.classList.add('arriving'); } catch (e) {}
/* the AP logo on the About page: its cream homecoming keeps covering this page until app.js lands the monogram */
try { if (sessionStorage.getItem('ap-home')) document.documentElement.classList.add('homing'); } catch (e) {}
