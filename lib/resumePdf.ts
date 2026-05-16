"use client"

import * as pdfjsLib from "pdfjs-dist"

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
}

export async function extractResumeText(file: File) {
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
  let text = ""

  for (let page = 1; page <= pdf.numPages; page++) {
    const content = await (await pdf.getPage(page)).getTextContent()
    text += `${content.items.map((item: any) => item.str).join(" ")}\n`
  }

  return text.trim()
}
