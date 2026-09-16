# Who do I call

You can run this as its own page, or copy it into a site you already have.

Type a problem. See the desk, the phone, and the window hours. Add your
own rows. Change the city name. Download the folder and drop it into
your project.

The City of Galion, Ohio text is sample data so the page is not empty
on first open. Names, street, and phone are fake. Email is on `.example`.

## Who it is for

A clerk window, or anyone who answers "who do I call" for potholes,
licenses, and records. You do not have to use the Galion sample. Put
your town and your desks in, then host the folder with the rest of your
site.

## What you get

The whole tool is the files in `site/public/`. Keep them in one folder.

- `index.html` - the page
- `styles.css` - clerk-window look
- `app.js` - search, add, edit, print, download
- `topics.json` - city name plus the problem list
- `README.txt` - short copy-this-folder note (also inside the zip)

No account. Nothing sends mail.

## Use it in your own project

You need those files next to each other. You do not need Node on the site
that hosts them.

**From this repo**

1. Copy the `site/public/` folder into your project. Name it whatever you
   want (`who-to-call/`, `clerk/`, `public/` is fine).
2. Keep `index.html`, `styles.css`, `app.js`, and `topics.json` in that
   same folder.
3. Point your usual static files at that folder.
4. Open that path in the browser, for example `/who-to-call/`.

Example layout:

```
your-site/who-to-call/index.html
your-site/who-to-call/styles.css
your-site/who-to-call/app.js
your-site/who-to-call/topics.json
```

**From the running page**

1. Open this tool, change **This city**, add your problems.
2. Click **Download folder**.
3. Unzip `who-to-call.zip`.
4. Copy the `who-to-call/` folder it contains into your project.
   `topics.json` in that zip already has what you typed.

**JSON only**

If the HTML, CSS, and JS are already in your project, click
**Download JSON only** and replace `topics.json` in that folder. Or use
**Load JSON** to bring a file back into the page.

## Make it yours

On the page:

1. **This city** - city line, street, phone, email, hours.
2. **Add a problem** - the words people type, desk, phone, window, hours.
3. Click a row to **Edit** or **Remove**.
4. **Print this card** keeps a paper copy after the tab is closed.
5. **Download folder** (or **Download JSON only**).

In the files:

- Edit `topics.json` in a text editor if you would rather not use the
  form.
- Restyle `styles.css` if you want. The page does not call a framework.

**Restore sample list** puts the Galion starter list back in this
browser only. It does not change the copy you already dropped into your
site.

## Try it here first

```
npm start
```

Leave that process running. Open:

http://127.0.0.1:47319/

## Demo

https://github.com/user-attachments/assets/7d6145b5-f013-41ed-bef4-98d77f40630d

Repo copy: [docs/media/who-to-call-demo.mp4](docs/media/who-to-call-demo.mp4)

Voice is Microsoft Andrew Neural. Music is Wallpaper by Kevin MacLeod (incompetech.com), CC BY 3.0.
