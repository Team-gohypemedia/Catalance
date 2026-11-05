/**
 * Aspirant-mode knowledge for the demo AI tutor: bridge-track topics (Tally, GST, translation)
 * and warm, practical career guidance for government-exam aspirants (gap year, career switch, interviews).
 */

export const ASPIRANT_TOPICS = [
  {
    key: "gst",
    match: /\b(gst|gstr|cgst|sgst|igst|utgst|input tax credit|itc\b|hsn|sac code|gstin|e-?way bill)/i,
    title: "GST in plain words",
    body: `**GST is one tax on supply, split by where the sale happens.**

1. **Intra-state sale** (seller and buyer in the same state): **CGST + SGST**, half each. 18% GST on ₹10,000 → CGST ₹900 + SGST ₹900.
2. **Inter-state sale** (Uttar Pradesh → Bihar): **IGST**, the full 18% → ₹1,800.
3. **GSTIN** has 15 characters. The first two digits are the state code (09 = Uttar Pradesh, 10 = Bihar), then the PAN of the business.
4. **Input Tax Credit (ITC):** GST you paid on purchases is set off against GST you collect on sales. You pay only the difference.
5. **Returns:** **GSTR-1** lists your outward supplies (sales invoices). **GSTR-3B** is the summary return where you pay the net tax.

\`\`\`text
Sale (intra-state):  Taxable value ₹10,000 + CGST 9% ₹900 + SGST 9% ₹900 = ₹11,800
Purchase GST paid:   ₹1,200 (ITC)
Net GST payable:     ₹1,800 − ₹1,200 = ₹600
\`\`\`

Rates, thresholds and due dates change, so always confirm on the official GST portal before advising a client.`,
    tip: "Banking awareness ke fiscal-policy questions mein GST council aur rate slabs aate hain — wahi knowledge yahan direct kaam aata hai. Ek kirana store ke 10 bills ka GST summary bana ke dekho.",
  },
  {
    key: "tally",
    match: /\b(tally|journal entr|journal|ledger|trial balance|voucher|golden rules?|debit|bookkeep|book-keep|accounting|balance sheet|kirana books)/i,
    title: "Journal entries, ledgers and Tally Prime",
    body: `**The golden rules** (you've seen them in banking awareness):

- **Personal account:** Debit the receiver, credit the giver.
- **Real account:** Debit what comes in, credit what goes out.
- **Nominal account:** Debit all expenses and losses, credit all incomes and gains.

\`\`\`text
Paid shop rent ₹8,000 in cash
  Rent A/c            Dr  8,000   (expense → debit)
      To Cash A/c             8,000   (cash goes out → credit)

Bought goods from Sharma Traders on credit ₹50,000
  Purchases A/c       Dr 50,000
      To Sharma Traders       50,000   (giver → credit)
\`\`\`

**In Tally Prime**, the same entries are vouchers: **F4** Contra, **F5** Payment, **F6** Receipt, **F7** Journal, **F8** Sales, **F9** Purchase. Tally posts to the ledgers for you, and the **Trial Balance** shows whether debits equal credits.`,
    tip: "Daily 5 journal entries ki practice karo — jaise quant ke 5 sums. 2 hafte mein golden rules reflex ban jaate hain.",
  },
  {
    key: "translation",
    match: /\b(translat|anuvad|anuvaad|अनुवाद|subtitl|srt|rajbhasha|hindi to english|english to hindi|localis|localiz)/i,
    title: "Translating Hindi ↔ English like a professional",
    body: `**Translate meaning and register, not words.**

1. **Read the whole text first.** Who is it for — a court, a customer, a government office?
2. **Match the register.** "कृपया संलग्न परिपत्र का अवलोकन करें" is formal → "Please refer to the attached circular", not "Please see the attached paper".
3. **Keep a glossary.** परिपत्र = circular, अधिसूचना = notification, निविदा = tender, कार्यालय ज्ञापन = office memorandum. Use the same term every time.
4. **Use tools, then edit.** Google Docs voice typing (Hindi), IndicTrans2 or another MT engine for a first draft — then post-edit every line yourself. Never paste confidential documents into public tools.
5. **Read it aloud** in the target language. If it sounds translated, rewrite it.

Pricing in India: roughly **₹0.50–₹2 per word** for general content, more for legal or technical work; subtitles are usually priced per video minute.`,
    tip: "Exam ke liye jo comprehension aur essay practice ki hai, wahi skill hai. Aaj ek press release ka 150-word paragraph translate karo aur glossary mein 10 terms likho.",
  },
];

const CAREER_RE =
  /(govt\.? exam|government exam|sarkari|सरकारी|career switch|switch (my )?career|career change|gap year|gap in (my )?(resume|cv)|prep years|preparation years|backup (career|plan)|plan b|age limit|last attempt|attempts? (khatam|over|left)|private job|private sector|exam ke baad|after (my )?exams? (prep|preparation))/i;

/** True for gap-year / career-switch questions, and interview/job questions from aspirants. */
export function isAspirantCareerQuestion(text, user) {
  if (CAREER_RE.test(text)) return true;
  return Boolean(user?.aspirant) && /\b(interview|resume|cv|job|hr round|tell me about yourself|naukri)\b/i.test(text);
}

const examLine = (a) => (a?.examName ? `${a.examName}${a.prepYears ? `, ${a.prepYears} ${a.prepYears === 1 ? "year" : "years"} of prep` : ""}` : null);

export function aspirantCareerReply(lang, user) {
  const a = user?.aspirant;
  const first = (user?.name || "").split(" ")[0] || "";
  const exam = examLine(a);
  const hours = a?.studyHoursTotal ? a.studyHoursTotal.toLocaleString("en-IN") : null;
  const minutes = a?.dailyMinutes || 45;

  if (lang === "hi") {
    return `${first ? `${first}, ` : ""}सबसे पहले एक बात साफ़: **आपकी तैयारी बेकार नहीं गई।** ${exam ? `${exam} — ` : ""}इतने साल रोज़ पढ़ना, mock tests देना और खुद को सुधारना, यही discipline private companies ढूँढती हैं।

**एक practical plan:**

1. **रोज़ ${minutes} मिनट, तैयारी के साथ।** यह backup है, distraction नहीं। सुबह या रात का एक fixed slot चुनिए।
2. **अपने strongest subject से skill चुनिए।** Quant/DI → Excel और MIS, English/Hindi → translation, Banking awareness → Tally और GST।
3. **3 proof pieces बनाइए** — mentor-reviewed assignments और एक छोटा paid micro-gig। Certificate से ज़्यादा काम दिखता है।
4. **अपनी decision date खुद तय कीजिए।** Age limit और बचे attempts देखकर एक तारीख़ लिखिए — उस दिन तक दोनों रास्ते साथ चलाइए, घबराहट में नहीं।

**Interview में prep years कैसे बताएँ:**

> "मैंने ${a?.prepYears || 3} साल ${a?.examName || "government exam"} की तैयारी की।${hours ? ` लगभग ${hours} घंटे की self-study,` : ""} रोज़ का schedule और mock tests से मैंने discipline और analysis सीखा। साथ ही मैंने Excel/Tally सीखा और ये काम करके दिखाया — यह मेरा portfolio है।"

माफ़ी मत माँगिए, explain कीजिए। Gap नहीं, training थी।

**काम की बात:** आज सिर्फ़ एक lesson पूरा कीजिए। छोटे कदम, रोज़ — जैसे तैयारी में किया था।`;
  }

  if (lang === "hinglish") {
    return `${first ? `${first}, ` : ""}pehli baat: **aapki taiyari waste nahi hui.** ${exam ? `${exam} — ` : ""}itne saal roz padhna, mocks dena aur apni galtiyan sudharna — yahi discipline private companies dhoondhti hain.

**Ek practical plan:**

1. **Roz ${minutes} minute, prep ke saath.** Yeh backup hai, distraction nahi. Subah ya raat ka ek fixed slot pakdo.
2. **Strongest subject se skill chuno.** Quant/DI → Excel & MIS, English/Hindi → translation, Banking awareness → Tally & GST.
3. **3 proof pieces banao** — mentor-reviewed assignments aur ek chhota paid micro-gig. Certificate se zyada kaam bolta hai.
4. **Apni decision date khud decide karo.** Age limit aur bache attempts dekh ke ek date likho — tab tak dono raaste saath chalao, panic mein nahi.

**Interview mein prep years kaise explain karein:**

> "I prepared for ${a?.examName || "a government exam"} for ${a?.prepYears || 3} years.${hours ? ` Around ${hours} hours of self-study,` : ""} a daily schedule and regular mock tests taught me discipline and analysis. Alongside, I learned Excel/Tally and here is the work I've done."

Sorry mat bolo, explain karo. Gap nahi tha, training thi.

**Kaam ki baat:** aaj bas ek lesson complete karo. Chhote steps, roz — bilkul prep ki tarah.`;
  }

  return `${first ? `${first}, ` : ""}first things first: **your preparation was not wasted.** ${exam ? `${exam} — ` : ""}years of daily study, mock tests and fixing your own mistakes is exactly the discipline private employers look for.

**A practical plan:**

1. **${minutes} minutes a day, alongside your prep.** This is insurance, not a distraction. Pick one fixed slot, morning or night.
2. **Pick a skill from your strongest subject.** Quant/DI → Excel & MIS, English/Hindi → translation, Banking awareness → Tally & GST.
3. **Build 3 proof pieces** — mentor-reviewed assignments and one small paid micro-gig. Work speaks louder than certificates.
4. **Set your own decision date.** Look at your age limit and attempts, write down a date, and run both paths together until then — calmly, not in panic.

**How to explain your prep years in an interview:**

> "I prepared for ${a?.examName || "a government exam"} for ${a?.prepYears || 3} years.${hours ? ` Around ${hours} hours of self-study,` : ""} a daily schedule and regular mock tests taught me discipline and analysis. Alongside, I learned Excel and here is the work I've done."

Don't apologise — explain. It wasn't a gap, it was training.

**Pro tip:** finish one lesson today. Small steps, every day — just like your preparation.`;
}
