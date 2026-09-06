const HEADERS = ['Code', 'Status', 'Used At', 'Claimant Name', 'Claimant Email']

function safeCell(value) {
  let text = value == null ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function votingCodesCsv(codes) {
  const rows = [HEADERS, ...codes.map((code) => [code.code, code.status, code.usedAt ?? '',
    code.claimantDisplayName ?? '', code.claimantEmail ?? ''])]
  return `\uFEFF${rows.map((row) => row.map(safeCell).join(',')).join('\r\n')}\r\n`
}

export function votingCodesFilename(eventTitle, date = new Date()) {
  const slug = String(eventTitle || 'event').normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
    .toLowerCase() || 'event'
  return `${slug}-voting-codes-${date.toISOString().slice(0, 10)}.csv`
}

export function downloadVotingCodes(codes, eventTitle) {
  const url = URL.createObjectURL(new Blob([votingCodesCsv(codes)], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url; link.download = votingCodesFilename(eventTitle); link.click()
  URL.revokeObjectURL(url)
}
