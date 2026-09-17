export function generateNdaRecord({
  discloserName,
  recipientName,
  listingTitle,
  acceptedAt,
  agreementVersion,
}) {
  const formatDateTime = (d) => new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Confidentiality Agreement — Chiron</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; background: #faf5ee; padding: 2rem; }
  .doc { background: white; max-width: 720px; margin: 0 auto; padding: 3rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); line-height: 1.7; color: #222; }
  h1 { text-align: center; font-size: 22px; letter-spacing: 2px; }
  .subtitle { text-align: center; color: #666; font-size: 12px; margin-bottom: 2rem; }
  h2 { font-size: 15px; margin-top: 1.75rem; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .meta { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; font-size: 13px; }
  .meta div { margin-bottom: 4px; }
  ol { padding-left: 1.4rem; }
  li { margin-bottom: 8px; }
  .footer { margin-top: 2rem; border-top: 1px solid #ddd; padding-top: 1rem; font-size: 11px; color: #888; }
  @media print { body { background: white; padding: 0; } .doc { box-shadow: none; } .no-print { display: none; } }
</style>
</head>
<body>
<div class="doc">
  <h1>CONFIDENTIALITY AGREEMENT</h1>
  <div class="subtitle">Chiron | www.chironevo.com</div>

  <div class="meta">
    <div><strong>Discloser:</strong> ${discloserName}</div>
    <div><strong>Recipient:</strong> ${recipientName}</div>
    <div><strong>Listing:</strong> ${listingTitle}</div>
    <div><strong>Date and time of acceptance:</strong> ${formatDateTime(acceptedAt)}</div>
    <div><strong>Version of this Agreement accepted:</strong> ${agreementVersion}</div>
  </div>

  <p>This Confidentiality Agreement (the "Agreement") is made between the Discloser, the user who published the listing identified above, and the Recipient, the user requesting access to the private part of that listing. The Agreement is concluded at the moment the Recipient accepts it on the Chiron platform (the "Platform"). Chiron records this acceptance together with the full name of each party, the listing concerned, and the date and time.</p>

  <p>Each party confirms that the name recorded is that party's true full name, that each is at least 18 years old, and that each has the capacity to enter into this Agreement.</p>

  <h2>2. Purpose</h2>
  <p>The Discloser is willing to disclose information about the listing so that the Recipient may evaluate whether to acquire it, license it, fund it, collaborate on it, or otherwise reach an arrangement with the Discloser (the "Purpose"). The Recipient may use the Confidential Information for the Purpose and for nothing else.</p>

  <h2>3. What is confidential</h2>
  <p>"Confidential Information" means everything the Discloser makes available to the Recipient in connection with the listing after this Agreement is accepted, in whatever form and by whatever means, including the private part of the listing; messages, documents, data, code, formulae, protocols and results exchanged in connection with the listing, whether through the Platform or otherwise; anything disclosed orally, in a meeting, a call or a demonstration; and the fact and content of any discussion between the parties about the listing. Information does not have to be marked as confidential to be covered. The public part of the listing is not Confidential Information.</p>

  <h2>4. What is not confidential</h2>
  <p>This Agreement does not apply to information the Recipient can show was already lawfully known to it beforehand, is or later becomes publicly available otherwise than through the Recipient's breach, was lawfully received from a third party free to disclose it, or was developed independently by the Recipient without use of the Confidential Information.</p>

  <h2>5. What the Recipient undertakes</h2>
  <p>The Recipient will keep the Confidential Information secret and will not disclose it to any person. The Recipient will not use it for any purpose other than the Purpose, including to develop, manufacture, publish, exploit or commercialise anything. The Recipient will not copy, reproduce, record or store it beyond what the Purpose requires, and will not post, transmit or otherwise place it outside the Platform, including via a hyperlink or file-sharing address. The Recipient will protect the Confidential Information with at least the care it applies to its own confidential information, and will tell the Discloser without delay of any unauthorised disclosure or use it becomes aware of.</p>

  <h2>6. No application for registered rights</h2>
  <p>The Recipient will not, in its own name or through any other person, apply for a patent, trade mark, design or other registered right in respect of the Confidential Information or anything derived from it, and will not publish it or submit it for publication in any form.</p>

  <h2>7. No rights are granted</h2>
  <p>The Confidential Information remains the property of the Discloser. Access to it is not a licence, an option, or an undertaking to deal, and either party may end discussions at any time without liability to the other. Any transfer of rights between the parties requires a separate written agreement between them.</p>

  <h2>8. Return or destruction</h2>
  <p>The Recipient will, on written request from the Discloser, and in any event within thirty days of discussions ending without agreement, return or destroy all Confidential Information in its possession, together with every copy, note and summary derived from it, and confirm in writing that it has done so.</p>

  <h2>9. How long this Agreement lasts</h2>
  <p>The obligations in this Agreement take effect on acceptance and continue for five years from that date. For so long as any part of the Confidential Information continues to qualify as a trade secret, that part remains subject to the confidentiality, non-use and non-registration obligations without limit of time. This Agreement continues to bind each party after either of them closes an account on the Platform.</p>

  <h2>10. What happens if the Recipient breaks this Agreement</h2>
  <p>For each breach of the confidentiality or non-registration obligations, the Recipient will pay the Discloser five thousand euros (EUR 5,000) as a contractual penalty, due whether or not the Discloser has suffered any provable loss. This penalty is a minimum; the Discloser may additionally claim compensation for any greater loss, and may seek an injunction or other interim relief.</p>

  <h2>11. Chiron is not a party</h2>
  <p>Chiron makes this standard form available and records its acceptance. Chiron is not a party to this Agreement, acquires no right and assumes no obligation under it, does not monitor whether the parties observe it, and takes no part in any dispute arising from it. On the written request of either party, and where lawful, Chiron will provide the record it holds of this acceptance for use in proceedings between the parties.</p>

  <h2>12. Governing law and jurisdiction</h2>
  <p>This Agreement is governed by Greek law. The courts of Athens have jurisdiction over any dispute arising out of it, without prejudice to the mandatory rights of a party who is a consumer as to jurisdiction and applicable law.</p>

  <div class="footer">
    This is a digitally recorded confirmation of an acceptance made on the Chiron platform (chironevo.com). Chiron is not a party to this Agreement. This document may be printed or saved as PDF for your own records.
  </div>

  <div class="no-print" style="text-align:center; margin-top: 1.5rem;">
    <button onclick="window.print()" style="background:#0F6E56;color:white;border:none;padding:10px 24px;border-radius:6px;font-size:14px;cursor:pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>
</div>
</body>
</html>
  `
  return html
}

export function openNdaRecord(data) {
  const html = generateNdaRecord(data)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
