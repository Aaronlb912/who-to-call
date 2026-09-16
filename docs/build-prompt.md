# TARGET 2026-09-15

Who do I call. Type a problem. The page shows the desk, phone, window,
and hours. Empty search is its own state. Add and edit on the page.
Download the folder and drop it into another site.

Local URL: http://127.0.0.1:47319/

Pages:
- `/` search, match list, desk card, add/edit, city fields, downloads.
  No other routes.

Auth: none.

Sample: City of Galion, Ohio clerk desk. Names, street, and phone are
fake. Email is on `.example`. Starter topics in `site/public/topics.json`.

Done:
- Open the page in a browser.
- Empty box shows "type a problem," not the full list.
- Type pothole. See Street Department, phone, hours.
- Type xylophone. See no match.
- Clear it. The empty prompt comes back.
- Add a topic. Edit the city name. Download folder. Print the card.

## Usefulness check

1. Who else? A clerk window, or anyone who answers "who do I call"
   for potholes, licenses, and records. Front desk, not a developer.
2. Their data? Yes. Add, edit, remove topics on the page. Or edit
   `topics.json`. Load JSON.
3. Make it theirs? Yes. **This city** changes the banner, street,
   phone, email, hours. CSS is in the folder if they want a different look.
4. Take it? Yes. Copy `site/public/`, or **Download folder**
   (`who-to-call.zip`).
5. No account? Yes. Static files. No signup.
6. Coworker test? Yes. Send the zip. They put `who-to-call/` on their
   site or any static server.
7. Keep a copy? Yes. Print this card. Download folder or Download JSON
   only.
8. Miss and recover? Yes. Empty box is a real state. Unknown word says
   no match. Blank required fields on add. Then a real word or a filled form.
9. README says how? Yes. Who, what, copy-the-folder, download-the-folder,
   change the city, add topics.
