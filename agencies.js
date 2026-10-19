/* Agencies and their calendar links.

   Each agency has its own web address (for example presslane.northside.com) pointing at this site.
   The site recognises the address and uses that agency's calendar link on every "Book a demo" button.

   One line per agency:
     "northside": { name: "Northside Print", domain: "presslane.northside.com", book: "https://calendly.com/northside/presslane-demo" },

   key     lowercase letters, numbers and hyphens. Also works as ?agency=northside, for testing before the address is live.
   name    shown under the pricing button.
   domain  the agency's address, without https:// or a trailing slash.
   book    their calendar link; must start with https://.

   On any address not listed here, the "Book a demo" buttons and the contact form are hidden.
   Contact form tokens do NOT go here (this file is public): see "Contact form" in README.md.
*/
window.PRESSLANE_AGENCIES = {
  "leonardopower": { name: "Leonardo Power", domain: "presslane.leonardopower.com", book: "https://api.leadconnectorhq.com/widget/booking/c6jqHKI3Ymq2b5DJ5HzP" },
  "octopusup": { name: "Octopus Up", domain: "presslane.octopusup.com", book: "https://api.leadconnectorhq.com/widget/booking/2WHz5s2nH4i0zdSLeIDe" },
};
