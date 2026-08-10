// Certificate generator — creates a downloadable HTML certificate
// that users can print as PDF from their browser

export function generateCertificate({ 
  certId, 
  listingTitle, 
  sellerName, 
  buyerName, 
  buyerAnonymous,
  submittedAt,
  soldAt,
  category,
}) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    })
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chiron — Sale Certificate ${certId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: #f8f2e8;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
    }
    .certificate {
      background: #ffffff;
      border: 3px solid #2D4A5A;
      border-radius: 8px;
      max-width: 700px;
      width: 100%;
      padding: 3rem;
      position: relative;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .corner {
      position: absolute;
      width: 40px;
      height: 40px;
      border-color: #1D9E75;
      border-style: solid;
    }
    .corner-tl { top: 12px; left: 12px; border-width: 3px 0 0 3px; }
    .corner-tr { top: 12px; right: 12px; border-width: 3px 3px 0 0; }
    .corner-bl { bottom: 12px; left: 12px; border-width: 0 0 3px 3px; }
    .corner-br { bottom: 12px; right: 12px; border-width: 0 3px 3px 0; }
    .header { text-align: center; margin-bottom: 2rem; }
    .platform-name { font-size: 28px; font-weight: bold; color: #2D4A5A; letter-spacing: 4px; text-transform: uppercase; }
    .platform-name span { color: #1D9E75; }
    .subtitle { font-size: 11px; color: #6b6b6b; letter-spacing: 3px; text-transform: uppercase; margin-top: 4px; }
    .divider { border: none; border-top: 1px solid #2D4A5A; margin: 1.5rem 0; opacity: 0.2; }
    .cert-title { text-align: center; font-size: 22px; color: #2D4A5A; margin-bottom: 0.5rem; font-style: italic; }
    .cert-subtitle { text-align: center; font-size: 12px; color: #6b6b6b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 2rem; }
    .listing-title { text-align: center; font-size: 18px; font-weight: bold; color: #1D9E75; margin: 1.5rem 0; padding: 1rem; background: #f0fdf4; border-radius: 6px; border: 1px solid #86efac; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 1.5rem 0; }
    .party { text-align: center; padding: 1rem; background: #f8f2e8; border-radius: 6px; }
    .party-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #6b6b6b; margin-bottom: 6px; }
    .party-name { font-size: 16px; font-weight: bold; color: #2D4A5A; }
    .details { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin: 1.5rem 0; }
    .detail { text-align: center; }
    .detail-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #6b6b6b; margin-bottom: 4px; }
    .detail-value { font-size: 13px; color: #2D4A5A; font-weight: bold; }
    .cert-id { text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e0d8cc; }
    .cert-id-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #6b6b6b; }
    .cert-id-value { font-size: 13px; color: #2D4A5A; font-family: 'Courier New', monospace; margin-top: 4px; }
    .disclaimer { font-size: 10px; color: #9b9b9b; text-align: center; margin-top: 1rem; line-height: 1.6; }
    .seal { text-align: center; margin: 1.5rem 0; }
    .seal-circle { display: inline-block; width: 80px; height: 80px; border-radius: 50%; border: 3px solid #1D9E75; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
    .seal-text { font-size: 10px; color: #1D9E75; font-weight: bold; letter-spacing: 1px; text-align: center; line-height: 1.4; }
    @media print {
      body { background: white; padding: 0; }
      .certificate { box-shadow: none; border: 2px solid #2D4A5A; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <div class="header">
      <div class="platform-name">CHIR<span>ON</span></div>
      <div class="subtitle">Intellectual Property Marketplace</div>
    </div>

    <hr class="divider">

    <div class="cert-title">Certificate of Sale</div>
    <div class="cert-subtitle">This certifies that the following transaction has been completed</div>

    <div class="listing-title">${listingTitle}</div>

    <div class="parties">
      <div class="party">
        <div class="party-label">Seller</div>
        <div class="party-name">${sellerName}</div>
      </div>
      <div class="party">
        <div class="party-label">Buyer</div>
        <div class="party-name">${buyerAnonymous ? 'Anonymous' : buyerName}</div>
      </div>
    </div>

    <div class="details">
      <div class="detail">
        <div class="detail-label">Category</div>
        <div class="detail-value">${category || '—'}</div>
      </div>
      <div class="detail">
        <div class="detail-label">Originally submitted</div>
        <div class="detail-value">${formatDate(submittedAt)}</div>
      </div>
      <div class="detail">
        <div class="detail-label">Sale completed</div>
        <div class="detail-value">${formatDate(soldAt)}</div>
      </div>
    </div>

    <div class="seal">
      <div class="seal-circle">
        <div class="seal-text">CHIRON<br>VERIFIED<br>SALE</div>
      </div>
    </div>

    <div class="cert-id">
      <div class="cert-id-label">Certificate ID</div>
      <div class="cert-id-value">${certId}</div>
    </div>

    <div class="disclaimer">
      This certificate is issued by Chiron (chironevo.com) as evidence of a completed transaction on the platform.
      Chiron acts as a neutral marketplace and is not a party to this transaction.
      The parties are solely responsible for the legal terms of their agreement.
      This certificate does not constitute legal proof of intellectual property transfer.
      A formal legal agreement between the parties is recommended.
    </div>

    <div style="text-align:center; margin-top: 1.5rem;" class="no-print">
      <button onclick="window.print()" style="background:#1D9E75;color:white;border:none;padding:10px 24px;border-radius:6px;font-size:14px;cursor:pointer;margin-right:8px;">
        🖨️ Print / Save as PDF
      </button>
      <button onclick="window.close()" style="background:transparent;color:#6b6b6b;border:1px solid #ccc;padding:10px 24px;border-radius:6px;font-size:14px;cursor:pointer;">
        Close
      </button>
    </div>
  </div>
</body>
</html>
  `
  return html
}

export function openCertificate(certData) {
  const html = generateCertificate(certData)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
