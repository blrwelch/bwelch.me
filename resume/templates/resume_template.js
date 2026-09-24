// Canonical resume template for Brittany Welch. Usage:
//   node resume_template.js data.json output.docx
// data.json shape:
// {
//   "subtitle": "string",
//   "summary": ["line1", "line2", ...],
//   "experience": [
//     { "title": "", "dates": "", "company": "",
//       "bullets": ["", ...] }, ...
//   ],
//   "skills": [ { "label": "", "items": "" }, ... ],
//   "certifications": ["optional line", ...] | null,
//   "education": "string",
//   "references": [
//     { "name": "", "title": "", "relationship": "", "phone": "", "email": "", "linkedin": "" },
//     ...
//   ] | null
//   // (legacy shape [{ name, title, detail }] is still supported)
// }
const {
  Document, Packer, Paragraph, TextRun,
  BorderStyle, TabStopType, TabStopPosition,
} = require("docx");
const fs = require("fs");

const ACCENT = "1A5F7A";
const GRAY = "666666";
const FONT = "Calibri";

const hr = () => new Paragraph({
  border: { bottom: { color: "CCCCCC", space: 2, style: BorderStyle.SINGLE, size: 4 } },
  spacing: { before: 0, after: 60 },
});

const sectionHeader = (text) => new Paragraph({
  children: [new TextRun({ text: text.toUpperCase(), bold: true, color: ACCENT, size: 21, font: FONT })],
  spacing: { before: 70, after: 10 },
});

const jobHeader = (title, dates) => new Paragraph({
  tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
  spacing: { before: 45, after: 0 },
  children: [
    new TextRun({ text: title, bold: true, size: 22, font: FONT }),
    new TextRun({ text: `\t${dates}`, color: GRAY, size: 20, font: FONT }),
  ],
});

const companyLine = (text) => new Paragraph({
  spacing: { after: 40 },
  children: [new TextRun({ text, italics: true, color: ACCENT, size: 20, font: FONT })],
});

const bulletRun = (text) => new Paragraph({
  bullet: { level: 0 },
  spacing: { after: 20 },
  children: [new TextRun({ text, size: 20, font: FONT })],
});

const skillLine = (label, items) => new Paragraph({
  spacing: { after: 40 },
  children: [
    new TextRun({ text: `${label}: `, bold: true, size: 20, font: FONT }),
    new TextRun({ text: items, size: 20, font: FONT }),
  ],
});

const bodyLine = (text, after = 45) => new Paragraph({
  spacing: { after },
  children: [new TextRun({ text, size: 20, font: FONT })],
});

function build(data) {
  const children = [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: "Brittany Welch", bold: true, size: 44, font: FONT })],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: data.subtitle, color: ACCENT, size: 24, font: FONT })],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: "Brandon, MS  |  662-550-0523  |  blrwelch@gmail.com  |  bwelch.me  |  linkedin.com/in/blrwelch", color: GRAY, size: 18, font: FONT })],
    }),

    sectionHeader("Summary"), hr(),
    ...data.summary.map((line, i) => bodyLine(line, i === data.summary.length - 1 ? 0 : 45)),

    sectionHeader("Experience"), hr(),
  ];

  data.experience.forEach((job) => {
    children.push(jobHeader(job.title, job.dates));
    children.push(companyLine(job.company));
    job.bullets.forEach((b) => children.push(bulletRun(b)));
  });

  children.push(sectionHeader("Skills"), hr());
  data.skills.forEach((s) => children.push(skillLine(s.label, s.items)));

  if (data.certifications && data.certifications.length) {
    children.push(sectionHeader("Certifications"), hr());
    data.certifications.forEach((c) => children.push(bodyLine(c, 0)));
  }

  if (data.awards && data.awards.length) {
    children.push(sectionHeader("Awards"), hr());
    data.awards.forEach((a) => children.push(bodyLine(a, 0)));
  }

  children.push(sectionHeader("Education"), hr());
  children.push(bodyLine(data.education, 0));

  if (data.references && data.references.length) {
    children.push(sectionHeader("References"), hr());
    data.references.forEach((r, i) => {
      const isLast = i === data.references.length - 1;
      if (r.detail !== undefined) {
        // Legacy 2-line format: "Name, Title" then a detail line.
        children.push(bodyLine(r.name + (r.title ? `, ${r.title}` : ""), 0));
        children.push(bodyLine(r.detail, isLast ? 0 : 60));
      } else {
        // Bullet format: Name / Title / Relationship / Phone / Email / LinkedIn.
        children.push(bulletRun(r.name));
        if (r.title) children.push(bulletRun(r.title));
        if (r.relationship) children.push(bulletRun(`Relationship: ${r.relationship}`));
        if (r.phone) children.push(bulletRun(`Phone: ${r.phone}`));
        if (r.email) children.push(bulletRun(`Email: ${r.email}`));
        if (r.linkedin) children.push(bulletRun(`LinkedIn: ${r.linkedin}`));
        if (!isLast) children.push(new Paragraph({ spacing: { after: 60 } }));
      }
    });
  }

  return new Document({
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 340, bottom: 340, left: 900, right: 900 },
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
