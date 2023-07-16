const cheerio = require("cheerio");
const axios = require("axios");
const express = require("express");
const app = express();
const port = 3000;
const url =
  "https://en.wikipedia.org/wiki/List_of_current_Indian_chief_ministers";

let scrapedData = [];
const tableHeaders = [];
let count = 0;
axios.get(url).then((res) => {
  let $ = cheerio.load(res.data);
  let entity = {};
  let tableHeaders = [];

  const rows = $(
    "#mw-content-text > div.mw-parser-output > table.wikitable > tbody > tr"
  );

  rows.each((i, tr) => {
    const cells = $(tr).children();
    const tableRow = {};
    let bg = 0;

    if (i === 0) {
      cells.each((j, th) => {
        tableHeaders.push($(th).text().trim());
      });
      return;
    }

    for (let j = 0; j < cells.length; j++) {
      let td = cells[j];
      let header = tableHeaders[j - bg];
      let tdText = $(td).text().trim();
      if (header === "Portrait") {
        tdText = $(td).find("img").attr("src");
      } else if (header === "Ref") {
        continue;
      }

      if (td.attribs.bgcolor) {
        bg++;
        continue;
      }

      const rowspan = Number(td.attribs.rowspan);
      if (rowspan) {
        entity[header] = {
          count: rowspan - 1,
          name: tdText,
        };
      } else {
        while (entity[header]) {
          let count = entity[header].count;
          entity[header].count = count - 1;
          tableRow[header] = entity[header].name;
          if (entity[header].count === 0) {
            entity[header] = null;
          }
          header = tableHeaders[j + 1 - bg];
          bg--;
        }
      }
      tableRow[header] = tdText;
    }

    scrapedData.push(tableRow);
  });
});

app.get("/", (req, res) => {
  res.send(scrapedData);
});

app.listen(port, () => {
  console.log(`Server is listening at http: //localhost:`, port);
});
