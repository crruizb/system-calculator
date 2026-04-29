package com.systemcalculator.pdf

import com.lowagie.text.*
import com.lowagie.text.pdf.PdfPCell
import com.lowagie.text.pdf.PdfPTable
import com.lowagie.text.pdf.PdfWriter
import com.systemcalculator.calculator.Calculator
import org.springframework.stereotype.Service
import java.awt.Color
import java.io.ByteArrayOutputStream
import java.math.BigDecimal
import java.math.RoundingMode

@Service
class PdfService {

    fun generate(calc: Calculator, req: PdfRequest): ByteArray {
        val branding = calc.branding
        val companyName = (branding["companyName"] as? String)?.takeIf { it.isNotBlank() }
            ?: calc.tenant.name

        val filterFields = req.instances.flatMap { it.filters.keys }.distinct()

        val doc = Document(PageSize.A4, 50f, 50f, 60f, 60f)
        val out = ByteArrayOutputStream()
        try {
            PdfWriter.getInstance(doc, out)
            doc.open()

            val titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20f, Font.BOLD)
            val headerPara = Paragraph(companyName, titleFont)
            headerPara.spacingAfter = 4f
            doc.add(headerPara)

            val subFont = FontFactory.getFont(FontFactory.HELVETICA, 10f)
            subFont.color = Color(120, 120, 120)
            val subPara = Paragraph("Presupuesto", subFont)
            subPara.spacingAfter = 20f
            doc.add(subPara)

            if (filterFields.isNotEmpty()) {
                val colCount = filterFields.size + 1
                val table = PdfPTable(colCount)
                table.widthPercentage = 100f
                table.setSpacingAfter(20f)

                val headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9f)
                val cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9f)
                val headerBg = Color(240, 240, 240)

                filterFields.forEach { field ->
                    val cell = PdfPCell(Phrase(field.replaceFirstChar { it.uppercase() }, headerFont))
                    cell.backgroundColor = headerBg
                    cell.setPadding(6f)
                    table.addCell(cell)
                }
                val priceHeaderCell = PdfPCell(Phrase("Precio", headerFont))
                priceHeaderCell.backgroundColor = headerBg
                priceHeaderCell.setPadding(6f)
                priceHeaderCell.horizontalAlignment = Element.ALIGN_RIGHT
                table.addCell(priceHeaderCell)

                req.instances.forEachIndexed { i, inst ->
                    val rowBg = if (i % 2 == 0) Color(255, 255, 255) else Color(250, 250, 250)
                    filterFields.forEach { field ->
                        val cell = PdfPCell(Phrase(inst.filters[field] ?: "-", cellFont))
                        cell.backgroundColor = rowBg
                        cell.setPadding(6f)
                        table.addCell(cell)
                    }
                    val priceText = inst.price
                        ?.toDoubleOrNull()
                        ?.let { "${"%.2f".format(it)} ${req.currency}" }
                        ?: "-"
                    val priceCell = PdfPCell(Phrase(priceText, cellFont))
                    priceCell.backgroundColor = rowBg
                    priceCell.setPadding(6f)
                    priceCell.horizontalAlignment = Element.ALIGN_RIGHT
                    table.addCell(priceCell)
                }
                doc.add(table)
            }

            val resolvedPrices = req.instances.mapNotNull { it.price?.toDoubleOrNull() }
            if (resolvedPrices.size >= 2) {
                val total = resolvedPrices.sumOf { it }
                val totalFormatted = BigDecimal(total).setScale(2, RoundingMode.HALF_UP)
                val totalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14f)
                val totalPara = Paragraph("Total: $totalFormatted ${req.currency}", totalFont)
                totalPara.alignment = Element.ALIGN_RIGHT
                doc.add(totalPara)
            }
        } finally {
            runCatching { doc.close() }
        }
        return out.toByteArray()
    }
}
