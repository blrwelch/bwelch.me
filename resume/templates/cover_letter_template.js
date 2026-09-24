// Canonical cover letter template for Brittany Welch. Usage:
//   node cover_letter_template.js data.json output.docx
// data.json shape:
// {
//   "date": "September 8, 2026",
//   "addressee": "Hiring Team",   // line(s) before company, optional array
//   "company": "micro1",
//   "salutation": "Dear micro1 Hiring Team,",
//   "paragraphs": ["p1", "p2", "p3", "p4"],
//   "closing": "Sincerely,"
// }
const { Document, Packer, Paragraph, TextRun } = require("docx");
const fs = require("fs");

const GRAY = "666666";
const FONT = "Calibri";

const p = (text, after = 200) => new Paragraph({
  spacing: { after },
  children: [new TextRun({ text, size: 21, font: FONT })],
});

function build(data) {
  const children = [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: "Brittany Welch", bold: true, size: 32, font: FONT })],
    }),
    new Paragraph({
      spacing: { after: 260 },
      children: [new TextRun({ text: "Brandon, MS  |  662-550-0523  |  blrwelch@gmail.com  |  bwelch.me  |  linkedin.com/in/blrwelch", color: GRAY, size: 18, font: FONT })],
    }),
    p(data.date, 200),
  ];

  const addresseeLines = Array.isArray(data.addressee) ? data.addressee : [data.addressee];
  addresseeLines.forEach((line, i) => {
    children.push(p(line, i === addresseeLines.length - 1 ? 0 : 0));
  });
  children.push(p(data.company, 200));

  children.push(p(data.salutation, 200));

  data.paragraphs.forEach((para) => children.push(p(para, 200)));

  children.push(p(data.closing, 0));
  children.push(p("Brittany Welch", 0));

  return new Document({
    styles: { default: { document: { run: { font: FONT, size: 21 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1000, bottom: 1000, left: 1080, right: 1080 },
          },
        },
        children,
      },
    ],
  });
}

const [, , dataPath, outPath] = process.argv;
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
Packer.toBuffer(build(data)).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("wrote", outPath);
});
