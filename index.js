"use strict";

import WebTorrent from "webtorrent";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { google } from "googleapis";
import express from "express";
const app = express();
dotenv.config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//AUTHENTICATION CODE STARTS HERE
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

try {
  const creds = fs.readFileSync(`creds_113710977401018767954_yuvrajkumar12012001@gmail.com.json`);
  oauth2Client.setCredentials(JSON.parse(creds));
} catch {
  console.log("No Creds Found");
}

app.get("/auth/google", async (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });
  res.redirect(url);
});

app.get("/oauth2/redirect/google", async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  const userId = userInfo.data.id;
  const userEmail = userInfo.data.email;
  fs.writeFileSync(
    `creds_${userId + `_` + userEmail}.json`,
    JSON.stringify(tokens)
  );
  res.status(200).json({ success: "ok", message: "Login Successfully" });

});
// AUTHENTICATICAATION CODE ENDS HERE


app.get("/savetext/:sometext", async (req, res) => {
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const sometext = req.params.sometext;
  const response = await drive.files.create({
    requestBody: {
      name: "test50.txt",
      mimeType: "text/plain",
    },
    media: {
      mimeType: "text/plain",
      body: sometext,
    },
  });
  return "success";
});

app.get('/allfiles', async (req, res) => {
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const response = await drive.files.list({
    pageSize: 10,
    fields: "nextPageToken, files(id, name, webViewLink)", // Include webViewLink in fields
  });
  const files = response.data.files;
  if (files.length) {
    console.log("Files:");
    files.map((file) => {
      console.log(`${file.webViewLink}`);
    });
  } else {
    console.log("No files found.");
  }
});

app.get('/copyfile', async (req, res) => {
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const link = req.query.link; 

  const regex = /file\/d\/([a-zA-Z0-9-_]+)/;
  const match = await link.match(regex);
  if (match) {
    const fileId = match[1];
    console.log(`File ID: ${fileId}`);
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'name',
    });
    const originalName = fileMetadata.data.name;
    const response = await drive.files.copy({
      fileId: fileId,
      requestBody: {
        name: `${originalName+`_GOKUTHECODER`}`,
      },
    });
    res.send(response.data);
  } else {
    console.log("No file ID found in the URL.");
  }
});


app.get('/copyfolder', async (req, res) => {
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const folderId = req.query.folderid;
  const allfiles = await drive.files.list({
    q: `'${folderId}' in parents`,
    fields: "files(id, name, webViewLink)",
  });
  res.send(allfiles.data.files);
  });

const port = 3000;
app.listen(port, (err) => {
  if (err) {
    console.log("Error in running server");
  } else {
    console.log("Server is running on port", port);
  }
});



// const __dirname = path.dirname(new URL(import.meta.url).pathname);

// app.use('/static', express.static(path.join(__dirname, 'public')));
// app.set('view engine', 'ejs');

// app.get('/', function (req, res) {
//     res.render('pages/index.ejs');
// });

// app.get('/download', function (req, res) {

//     const client = new WebTorrent();

//     const magnetURI = 'magnet:?xt=urn:btih:D8B14480F579F4D8918908F56B1AF1B07D82E6BE&dn=Lift+%282024%29+%5B720p%5D+%5BYTS.MX%5D&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.tracker.cl%3A1337%2Fannounce&tr=udp%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Fipv4.tracker.harry.lu%3A80%2Fannounce&tr=https%3A%2F%2Fopentracker.i2p.rocks%3A443%2Fannounce';
//     client.add(magnetURI, { path: './downloads' }, function (torrent) {
//         const file = torrent.files.find(function (file) {
//             return file.name.endsWith('.mp4');
//         });

//         res.send(file.path);
//     });

// });
