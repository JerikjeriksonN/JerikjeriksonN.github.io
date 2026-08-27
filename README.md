# .github.io

## VST waitlist

The inline VST signup uses FormSubmit to email requests to
`contact@erikmagnifico.com`, with the subject
“New Upright Piano VST waitlist signup”. It does not open the visitor’s email app.
The contact form uses the same service and inbox.

After publishing, test with an email address you control. If FormSubmit sends
an activation email to the contact inbox, confirm it and submit another test
to check delivery. See [FormSubmit setup](https://formsubmit.co/).

Changing the receiving email address requires activating the form again. Check
the contact inbox's junk folder too. See [FormSubmit troubleshooting](https://formsubmit.co/help).

Both forms use `js/forms.js`: checked service responses, a 20-second timeout,
duplicate-submit prevention and preserved text on errors. An explicit “Try
secure form” retry opens the normal FormSubmit page in a new tab, where any
verification can be completed. Nothing is automatically resent. Local `file:`
previews do not send AJAX submissions; use the published site for delivery tests.

This is an inbox-based waitlist, not a managed subscriber database. Sending
campaigns, confirmation emails, and automated unsubscribe handling would require
connecting a mailing-list provider. No subscriber addresses or secret API keys
are stored in this repository or in browser storage.

## Images and sharing previews

`images/hero.jpg` is the original photo, unchanged. The homepage selects one of
four smaller `hero-800.jpg`, `hero-1200.jpg`, `hero-1600.jpg` or `hero-2400.jpg`
copies to fit the screen. These keep the full composition and existing display
crop. The four approved VST PNG files are unchanged. Gallery photos below the
opening section load lazily; selecting a slide explicitly requests that image.

The clearly marked “Sharing/search metadata” block in `index.html` supplies the
description and image used by search engines and link previews. It does not
change the visible page or add tracking. To undo it, remove only that marked
block. The browser-tab `<title>` can separately be restored to
`Erik Magnifico | Music Producer`. Sharing services may cache older previews.

## Local regression checks

Run `node --test tests/homepage.test.cjs` with Node.js 18 or newer. The tests use
only built-in modules, mock all form requests, and send no emails. They cover
form error/success states, focus handling, HTML/CSS structure, asset references,
and preservation of the original hero and approved VST files.

These are source-level and simulated-DOM checks, not a replacement for a live
browser pass. After publishing, check desktop/mobile layout, gallery keyboard
and video controls, and send one test through each form from an address you own.
