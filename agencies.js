/* Agencies and their calendar links.

   Each agency has its own web address (for example presslane.northside.com) pointing at this site.
   The site recognises the address and uses that agency's calendar link on every "Book a demo" button.

   One line per agency:
     "northside": { name: "Northside Print", domain: "presslane.northside.com", book: "https://calendly.com/northside/presslane-demo" },

   key     lowercase letters, numbers and hyphens. Also works as ?agency=northside, for testing before the address is live.
   name    shown under the pricing button.
   domain  the agency's address, without https:// or a trailing slash.
   book    their calendar link; must start with https://.

   On any address not listed here, the "Book a demo" buttons are hidden.
*/
window.PRESSLANE_AGENCIES = {
  "leonardopower": { name: "Leonardo Power", domain: "presslane.leonardopower.com", book: "https://api.leadconnectorhq.com/widget/booking/c6jqHKI3Ymq2b5DJ5HzP" },
};
