// `random` is a parameter so the edges of the range can be tested without stubbing Math.random.
// Zero is excluded: "0000" reads as an empty form, not as a case file.
export function caseNumber(random: () => number = Math.random): string {
  return String(1 + Math.floor(random() * 9999)).padStart(4, '0')
}
