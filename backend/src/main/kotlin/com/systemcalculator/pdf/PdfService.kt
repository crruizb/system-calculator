package com.systemcalculator.pdf

import com.systemcalculator.calculator.Calculator
import org.springframework.stereotype.Service
import org.xhtmlrenderer.pdf.ITextRenderer
import java.io.ByteArrayOutputStream
import java.text.NumberFormat
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

private val HEX_COLOR_RE = Regex("^#[0-9a-fA-F]{3,8}$")
private fun String.esc() = replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

@Service
class PdfService {

    fun generate(calc: Calculator, req: PdfRequest): ByteArray {
        val branding = calc.branding
        val companyName = (branding["companyName"] as? String)?.takeIf { it.isNotBlank() }
            ?: calc.tenant.name
        val rawColor = (branding["primaryColorLight"] as? String)
            ?: (branding["primaryColor"] as? String)
            ?: "#6366f1"
        val accent = if (HEX_COLOR_RE.matches(rawColor)) rawColor else "#6366f1"

        val locale = Locale.forLanguageTag(req.locale).let {
            if (it == Locale.ROOT) Locale.of("es", "ES") else it
        }
        val nf = NumberFormat.getNumberInstance(locale).apply {
            minimumFractionDigits = 2
            maximumFractionDigits = 2
        }

        val filterFields = req.instances.flatMap { it.filters.keys }.distinct()
        val resolvedPrices = req.instances.mapNotNull { it.price?.toDoubleOrNull() }
        val total = resolvedPrices.sumOf { it }
        val date = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))

        val html = buildHtml(
            company = companyName,
            accent = accent,
            fields = filterFields,
            req = req,
            nf = nf,
            date = date,
            total = total,
            showTotal = resolvedPrices.size >= 2,
        )

        val out = ByteArrayOutputStream()
        ITextRenderer().apply {
            setDocumentFromString(html)
            layout()
            createPDF(out)
        }
        return out.toByteArray()
    }

    private fun buildHtml(
        company: String,
        accent: String,
        fields: List<String>,
        req: PdfRequest,
        nf: NumberFormat,
        date: String,
        total: Double,
        showTotal: Boolean,
    ): String {
        val currency = req.currency.esc()

        val headerCols = fields.joinToString("") {
            "<th>${it.replaceFirstChar(Char::uppercaseChar).esc()}</th>"
        }

        val bodyRows = buildString {
            req.instances.forEachIndexed { i, inst ->
                val rowBg = if (i % 2 == 0) "#f7f7fb" else "#ffffff"
                append("<tr>")
                fields.forEach { f ->
                    append("""<td style="background-color:$rowBg">${(inst.filters[f] ?: "-").esc()}</td>""")
                }
                val priceText = inst.price?.toDoubleOrNull()
                    ?.let { "${nf.format(it)} $currency" } ?: "-"
                append("""<td style="background-color:$rowBg;text-align:right;font-weight:bold">$priceText</td>""")
                append("</tr>")
            }
        }

        val tableSection = if (fields.isNotEmpty()) """
            <table cellspacing="0" cellpadding="0">
              <thead>
                <tr>$headerCols<th style="text-align:right">Precio</th></tr>
              </thead>
              <tbody>$bodyRows</tbody>
            </table>
        """ else ""

        val totalSection = if (showTotal) """
            <div style="border-top:2px solid $accent;padding-top:14px;text-align:right;margin-top:4px">
              <div style="font-size:9px;color:#888888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Total</div>
              <div style="font-size:20px;font-weight:bold;color:$accent">${nf.format(total)} $currency</div>
            </div>
        """ else ""

        return """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<style type="text/css">
  @page { size: A4; margin: 48px; }
  body {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 11px;
    color: #1a1a2e;
    margin: 0;
    padding: 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }
  th {
    background-color: $accent;
    color: #ffffff;
    padding: 10px 12px;
    text-align: left;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  td {
    padding: 9px 12px;
    border-bottom: 1px solid #eeeeee;
  }
</style>
</head>
<body>
  <table cellspacing="0" cellpadding="0" style="margin-bottom:32px">
    <tr>
      <td style="vertical-align:bottom">
        <div style="font-size:22px;font-weight:bold;color:$accent">${company.esc()}</div>
        <div style="font-size:11px;color:#888888;margin-top:4px">Presupuesto</div>
      </td>
      <td style="vertical-align:bottom;text-align:right">
        <div style="font-size:10px;color:#aaaaaa">$date</div>
      </td>
    </tr>
  </table>
  <div style="height:3px;background-color:$accent;margin-bottom:28px">&#160;</div>
  $tableSection
  $totalSection
</body>
</html>"""
    }
}
