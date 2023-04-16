// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import Airtable from "airtable";
import { exec, execSync } from "child_process";
import type { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "fs";
import QRCode from "qrcode";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!process.env.AIRTABLE_BASE) {
    throw new Error("Missing Airtable base");
  }
  const base = Airtable.base(process.env.AIRTABLE_BASE);
  const update = await base("Registrations").update([
    {
      id: req.body.id,
      fields: {
        Attended: true,
      },
    },
  ]);

  if (update.length === 0) {
    return res.status(400).json({ error: "No record found" });
  }

  res.status(200).json(update);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([152.64, 72]);
  const { width, height } = page.getSize();

  const qr = await QRCode.toDataURL(update[0].id);
  const qrImage = await pdfDoc.embedPng(qr);
  page.drawImage(qrImage, {
    x: 10,
    y: 10,
    width: 50,
    height: 50,
  });

  const name = update[0].fields["Name"];
  const isVolunteer = update[0].fields["Volunteer"];
  const nameSize = 12;

  if (!name) {
    return;
  }

  page.drawText(name.toString(), {
    x: 70,
    y: height - 3 * nameSize,
    size: nameSize,
    font,
    color: rgb(0, 0, 0),
  });

  page.drawText(isVolunteer ? "Volunteer" : "Participant", {
    x: 70,
    y: height - 6 * 8,
    size: 8,
    font,
    color: rgb(0, 0, 0),
  });

  const bytes = await pdfDoc.save();

  // save pdf to file
  writeFileSync(`print/${update[0].id}.pdf`, bytes);

  execSync(
    `lp -o media=2.12x1in -d LabelWriter-450-Turbo print/${update[0].id}.pdf`
  );

  exec(`rm print/${update[0].id}.pdf`);
}
