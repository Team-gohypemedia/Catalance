/** Accounting, Tally & GST courses — seed content for the Campus demo. */
export default [
  {
    slug: "tally-prime-gst-essentials",
    title: "Tally Prime & GST for Aspirants",
    subtitle: "Turn your commerce and banking prep into a paying accounts job",
    description:
      "Every kirana store, CA firm and distributor in your town needs someone who can keep clean books, run Tally and file GST data on time. Sana Qureshi works with small-business finance and keeps the books for several of her D2C clients, and she teaches you journal entries, ledgers, trial balance, Tally Prime vouchers and GST returns the way an office actually uses them. Study 30 to 60 minutes a day alongside your preparation and finish with a week of real-looking kirana bookkeeping you can show in interviews.",
    level: "BEGINNER",
    languages: ["hi", "en", "hinglish"],
    cover: { from: "#065F46", to: "#B45309", pattern: "grid" },
    mentorId: "m_3",
    priceINR: 1499,
    rating: 4.8,
    ratingsCount: 1126,
    studentsCount: 7340,
    createdDaysAgo: 96,
    skills: ["Double-Entry Bookkeeping", "Journal & Ledger", "Trial Balance", "Tally Prime", "GST Basics", "GSTR-1 & GSTR-3B"],
    whatYouBuild: [
      "A set of 10 journal entries with a balanced trial balance for a Patna stationery shop",
      "A Tally Prime company with ledgers, stock items and GST tax ledgers set up correctly",
      "One full week of books for a Prayagraj kirana store: vouchers, ledger balances, trial balance and a GST summary",
      "A short interview-ready answer bank for accounts executive and Tally operator roles",
    ],
    requirements: [
      "A laptop or desktop (Windows) for Tally Prime; the free educational mode is enough for practice",
      "Excel or Google Sheets if you cannot install Tally yet",
      "No commerce background needed; class 10 maths is enough",
    ],
    modules: [
      {
        title: "Accounting Basics: Accounts, Golden Rules and Journal Entries",
        lessons: [
          {
            title: "Why every shop, CA firm and distributor hires an accounts executive",
            type: "VIDEO",
            durationMinutes: 9,
            isPreview: true,
            content: `> **Exam link:** IBPS Clerk and PO banking awareness asks about current accounts, cheques and GST basics; this course shows you how those same ideas run inside a real business office.

## Key points
- Every business that sells anything, from a kirana shop to a pharma distributor, must keep books of accounts and deal with GST, so accounts work never runs out.
- Small businesses usually hire one accounts executive or Tally operator, or outsource the work to a local CA firm that hires juniors in bulk.
- The core skill is double-entry bookkeeping: every transaction touches at least two accounts, and the debit side always equals the credit side.
- Your preparation habits (accuracy, revision, time-bound practice) are exactly what accounts offices value, because one wrong entry spoils a whole month of reports.
- By the end of this course you will have a week of books, a trial balance and a GST summary that you can show in an interview.

## Transcript
Namaste everyone, I am Sana. My main work is growth consulting for D2C brands, but very early I learnt one thing: a brand cannot grow if its books are a mess. So today I also look after the finance side and books for several of my small-business clients, and I work closely with their CA firms. That is the world I want to show you.

Dekho, think about your own town. Prayagraj, Patna, Indore, Jaipur, wherever you are preparing. Count the shops on one market road: medical stores, hardware shops, kirana stores, mobile dealers, wholesalers. Every single one of them has to record sales and purchases, pay GST, and give data to a CA at the end of the year. Most of them use Tally. And most of them are always looking for one reliable person who can sit with the books.

That person is the accounts executive. In a CA firm the same person is called an article assistant, a junior accountant or a GST assistant. In a distributor's office, it is often "Tally operator". The names change, but the work is the same: record transactions correctly, reconcile the bank, prepare GST data and keep reports ready.

Now, I want to say this clearly. Your preparation years already count here. You have practised quantitative aptitude for hours. You have read banking awareness. You know how to revise the same topic until it sticks. Accounting rewards exactly that discipline. There is no magic, only rules applied carefully every day.

This course is insurance, not a distraction. Thirty to sixty minutes a day is enough. We start with the golden rules, move to ledgers and trial balance, then open Tally Prime, then learn GST the practical way. At the end you will do one full week of books for a kirana store. Chalo, let us begin.`,
          },
          {
            title: "Types of accounts and the three golden rules",
            type: "ARTICLE",
            durationMinutes: 10,
            isPreview: true,
            content: `> **Exam link:** SSC and IBPS questions on "nature of account" or "which account is debited" are solved with exactly these golden rules; here you will use them on real shop transactions.

## Double entry in one line

Every transaction has two sides. When a shopkeeper pays rent in cash, rent (an expense) increases and cash decreases. Both are recorded: one account is **debited (Dr)**, another is **credited (Cr)**, and the amounts are always equal. Yeh wahi cheez hai jo balance sheet ko balance rakhti hai.

## The three types of accounts (traditional approach)

### 1. Personal accounts
Accounts of people and organisations. Examples: Sharma Traders A/c, State Bank of India A/c, Capital A/c (the owner), a customer like Hotel Annapurna A/c.

### 2. Real accounts
Accounts of things the business owns, tangible or intangible. Examples: Cash A/c, Furniture A/c, Machinery A/c, Building A/c, Goodwill A/c.

### 3. Nominal accounts
Accounts of expenses, losses, incomes and gains. Examples: Rent A/c, Salary A/c, Electricity A/c, Commission Received A/c, Interest Received A/c.

## The golden rules

- **Personal account:** Debit the receiver, credit the giver.
- **Real account:** Debit what comes in, credit what goes out.
- **Nominal account:** Debit all expenses and losses, credit all incomes and gains.

> Tip: Write these three lines on the first page of your notebook, exactly like you write formulas for quant revision. You will use them every day.

## Quick examples

- **Paid rent ₹8,000 in cash.** Rent is nominal (expense): debit. Cash is real (goes out): credit.
- **Received ₹5,000 from customer Mehta Ji.** Cash is real (comes in): debit. Mehta Ji is personal (giver): credit.
- **Bank is a personal account.** When you deposit cash, the bank receives it, so Bank A/c is debited.

## The modern (accounting equation) approach

Many CA firms and new textbooks teach the equation method:

\`\`\`text
Assets = Liabilities + Capital
\`\`\`

Rules in this approach:
- Increase in **assets** and **expenses**: debit. Decrease: credit.
- Increase in **liabilities**, **capital** and **income**: credit. Decrease: debit.

Both approaches always give the same entry. Use golden rules for quick exam-style thinking and the equation approach when you check whether the balance sheet will still balance.

## A common confusion

Purchases of goods for resale go to **Purchases A/c**, not "Goods A/c". Goods sold go to **Sales A/c**. Buying a table for the shop goes to **Furniture A/c**, because it is an asset you keep, not stock you sell. Dhyan se dekho: the same ₹10,000 can go to completely different accounts depending on why it was spent.`,
          },
          {
            title: "Journal entries with worked examples in ₹",
            type: "ARTICLE",
            durationMinutes: 11,
            content: `> **Exam link:** RRB and SSC commerce-style questions ask you to "pass the journal entry"; here each entry is written exactly as an accounts office writes it.

## What a journal entry looks like

The journal is the book of original entry: every transaction is first written here in date order. Format:

\`\`\`text
Date    Particulars                         Dr (₹)      Cr (₹)
        Account to be debited    Dr        xxxx
            To Account to be credited                   xxxx
        (Narration: short reason)
\`\`\`

The debit line comes first with "Dr". The credit line starts with "To" and is indented. The narration explains the transaction in plain words.

## Worked examples: Raju Kirana, Varanasi

**1 April: Raju started business with cash ₹2,00,000.**
Cash comes in (real, debit). Raju as owner gives capital (personal, credit).

\`\`\`text
01-Apr  Cash A/c                       Dr   2,00,000
            To Capital A/c                              2,00,000
        (Being business started with cash)
\`\`\`

**3 April: Bought goods from Sharma Traders on credit ₹50,000.**
Purchases is treated as nominal (expense side), so debit. Sharma Traders gives the goods (personal, credit).

\`\`\`text
03-Apr  Purchases A/c                  Dr     50,000
            To Sharma Traders A/c                         50,000
        (Being goods purchased on credit)
\`\`\`

**5 April: Paid rent ₹8,000 in cash.**

\`\`\`text
05-Apr  Rent A/c                       Dr      8,000
            To Cash A/c                                    8,000
        (Being shop rent paid for April)
\`\`\`

**7 April: Deposited ₹50,000 cash into the bank.**
Bank receives (personal, debit). Cash goes out (real, credit).

\`\`\`text
07-Apr  Bank A/c                       Dr     50,000
            To Cash A/c                                   50,000
        (Being cash deposited into SBI current account)
\`\`\`

**9 April: Sold goods for cash ₹15,000.**

\`\`\`text
09-Apr  Cash A/c                       Dr     15,000
            To Sales A/c                                  15,000
        (Being goods sold for cash)
\`\`\`

## A three-question check for every entry

1. **Which two accounts are affected?** Name them exactly.
2. **What type is each?** Personal, real or nominal.
3. **Which rule applies?** Then decide debit and credit.

> Tip: If your debit total and credit total do not match, the entry is wrong. Stop and fix it before moving on. Accounts offices hate "we will check later".

## Practice before the quiz

Try these on paper: paid salary ₹12,000 by cheque; received commission ₹2,000 in cash; bought furniture for ₹18,000 from Gupta Furniture on credit. (Answers: Salary Dr / To Bank; Cash Dr / To Commission Received; Furniture Dr / To Gupta Furniture.)`,
          },
          {
            title: "Quiz: golden rules and journal entries",
            type: "QUIZ",
            durationMinutes: 6,
            content: `> **Exam link:** These are the same "identify the debit" questions that appear in banking awareness and commerce sections, with a business twist.

Take your time and apply the three-question check to each one before choosing.`,
            quiz: {
              questions: [
                {
                  prompt: "Shop owner pays electricity bill ₹3,200 in cash. Which entry is correct?",
                  options: [
                    "Cash A/c Dr / To Electricity A/c",
                    "Electricity A/c Dr / To Cash A/c",
                    "Electricity A/c Dr / To Capital A/c",
                    "Capital A/c Dr / To Cash A/c",
                  ],
                  correct: 1,
                  explanation:
                    "Electricity is an expense (nominal), so it is debited. Cash goes out (real), so it is credited.",
                },
                {
                  prompt: "Goods worth ₹40,000 bought on credit from Agarwal Distributors. Which account is credited?",
                  options: ["Purchases A/c", "Cash A/c", "Agarwal Distributors A/c", "Sales A/c"],
                  correct: 2,
                  explanation:
                    "Agarwal Distributors is a personal account and is the giver of goods, so it is credited. Purchases A/c is debited.",
                },
                {
                  prompt: "Under which type does 'Commission Received A/c' fall, and which side does it go to when commission is earned?",
                  options: [
                    "Real account, debit",
                    "Personal account, credit",
                    "Nominal account, debit",
                    "Nominal account, credit",
                  ],
                  correct: 3,
                  explanation: "It is an income, so it is nominal, and incomes and gains are credited.",
                },
                {
                  prompt: "A shopkeeper buys a computer for the billing counter for ₹35,000 by cheque. What is debited?",
                  options: ["Purchases A/c", "Computer (or Office Equipment) A/c", "Bank A/c", "Capital A/c"],
                  correct: 1,
                  explanation:
                    "The computer is an asset kept for use, not stock for resale, so it goes to an asset account. Bank is credited because money goes out of the bank.",
                },
                {
                  prompt: "In the modern equation approach, an increase in a liability is recorded as:",
                  options: ["A debit", "A credit", "Either side, both are fine", "Not recorded until paid"],
                  correct: 1,
                  explanation:
                    "Liabilities, capital and income increase on the credit side. Assets and expenses increase on the debit side.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Ledgers, Trial Balance and Final Accounts",
        lessons: [
          {
            title: "Ledger posting, balancing and the trial balance",
            type: "ARTICLE",
            durationMinutes: 11,
            content: `> **Exam link:** Trial balance questions appear in commerce-based state PSC papers and in basic banking awareness; here you will build one step by step from Raju Kirana's entries.

## From journal to ledger

The journal tells you **what happened in date order**. The ledger tells you **what happened to each account**. Posting means copying every journal line into the correct ledger account.

Rule of posting: in the account that was debited, write on the **Dr side** "To (the other account)". In the account that was credited, write on the **Cr side** "By (the other account)".

## Example: Cash A/c of Raju Kirana

Entries affecting cash: capital ₹2,00,000 in, sales ₹15,000 in, rent ₹8,000 out, bank deposit ₹50,000 out.

\`\`\`text
                         Cash Account
Dr                                                          Cr
Date    Particulars        ₹           Date    Particulars        ₹
01-Apr  To Capital     2,00,000      05-Apr  By Rent            8,000
09-Apr  To Sales         15,000      07-Apr  By Bank           50,000
                                     30-Apr  By Balance c/d  1,57,000
                       --------                              --------
                       2,15,000                              2,15,000
01-May  To Balance b/d 1,57,000
\`\`\`

## How to balance an account

1. Total both sides.
2. Find the difference (here 2,15,000 minus 58,000 = 1,57,000).
3. Write the difference on the **smaller side** as "By Balance c/d" (carried down).
4. Both totals now match. Bring the balance to the opposite side on the next date as "To Balance b/d" (brought down).

Cash has a debit balance of ₹1,57,000. Cash and assets usually have debit balances; capital, creditors and sales usually have credit balances.

## The trial balance

A trial balance lists every ledger balance at a date. If double entry was done correctly, **total debits equal total credits**.

\`\`\`text
Trial Balance of Raju Kirana as on 30 April
Account                 Dr (₹)       Cr (₹)
Cash                  1,57,000
Bank                    50,000
Purchases               50,000
Rent                     8,000
Capital                             2,00,000
Sharma Traders                        50,000
Sales                                 15,000
                      --------      --------
Total                 2,65,000      2,65,000
\`\`\`

## What a trial balance does NOT catch

A matching trial balance does not prove your books are perfect. It will still balance if:
- a transaction was **missed completely**,
- the **wrong account** of the same type was used (rent posted to salary),
- the same wrong amount went to both sides.

> Tip: In an office, the trial balance is your daily health check. In Tally it is one click away, but you must still understand why it balances. Interviewers love asking "trial balance tally ho gaya, phir bhi galti ho sakti hai?" The answer is yes, and now you know why.`,
          },
          {
            title: "Trading account and P&L in plain words",
            type: "VIDEO",
            durationMinutes: 10,
            content: `> **Exam link:** Gross profit and net profit percentage questions from SSC quant are exactly the trading and P&L account; the formula is the same, only the format is accounting style.

## Key points
- The trading account finds gross profit: sales minus cost of goods sold, where cost of goods sold is opening stock plus purchases plus direct expenses minus closing stock.
- The profit and loss account starts from gross profit and subtracts indirect expenses like rent, salary and electricity to arrive at net profit.
- Closing stock matters a lot: forgetting it makes a profitable shop look like it is in loss.
- The balance sheet then shows what the business owns (assets) and owes (liabilities and capital) on one date.
- In Tally all of these are generated automatically, but owners will ask you to explain them in simple words.

## Transcript
Chalo, today a very practical lesson. One of my clients runs a small cosmetics store alongside her D2C website. Every month she asks me one question: "Sana, did I actually make money?" To answer, I use two statements: the trading account and the profit and loss account.

Let me take a simple shop. In one month it bought goods worth ₹50,000. It sold goods for ₹60,000. At the end of the month, goods worth ₹15,000 are still sitting on the shelf. That is closing stock.

\`\`\`text
Trading Account
Opening stock               0      Sales            60,000
Purchases              50,000      Closing stock    15,000
Gross profit c/d       25,000
                      -------                      -------
                       75,000                       75,000
\`\`\`

Dekho, cost of goods sold is only ₹35,000, because ₹15,000 worth is still unsold. So gross profit is ₹25,000. If you forget closing stock, you would wrongly say the shop made only ₹10,000. This is the most common mistake I see beginners make.

Now the P&L account. From gross profit we subtract running costs that are not directly part of buying goods: rent ₹8,000 and electricity ₹2,000.

\`\`\`text
Profit & Loss Account
Rent                    8,000      Gross profit b/d 25,000
Electricity             2,000
Net profit             15,000
                      -------                      -------
                       25,000                       25,000
\`\`\`

Net profit is ₹15,000. Net profit percentage on sales is 15,000 divided by 60,000, which is 25 percent. Yeh wahi percentage hai jo aap quant mein roz nikalte ho.

Finally, the net profit is added to the owner's capital in the balance sheet. The balance sheet lists assets like cash, bank, stock and debtors on one side, and capital, creditors and loans on the other. Both totals must match.

You will never prepare these by hand in a job, because Tally does it instantly. But when the owner asks "why is profit low this month?", you must be able to point at the line and explain it. That skill is what makes you trusted, not just employed.`,
          },
          {
            title: "Assignment: 10 journal entries and a trial balance",
            type: "ASSIGNMENT",
            durationMinutes: 60,
            content: `> **Exam link:** This is the classic "journalise, post to ledger, prepare trial balance" question from commerce papers, done end to end like an accounts office would.

In every interview for an accounts role, you will be asked to pass a few entries on paper. Doing ten correctly, with a trial balance that matches, proves you understand double entry and not just Tally shortcuts.`,
            assignment: {
              brief: `## The scenario
**Verma Stationers, Patna** started business in June. Record these transactions (ignore GST for this assignment):

1. 1 June: Mr Verma started business with cash ₹1,50,000.
2. 2 June: Opened a current account in the bank by depositing ₹50,000 cash.
3. 4 June: Purchased goods for cash ₹20,000.
4. 6 June: Bought goods on credit from Kumar Paper Mart ₹35,000.
5. 9 June: Sold goods for cash ₹18,000.
6. 12 June: Sold goods on credit to Sunrise Coaching Centre ₹22,000.
7. 15 June: Paid salary to shop assistant ₹9,000 in cash.
8. 18 June: Bought furniture for the shop by cheque ₹12,000.
9. 24 June: Received ₹15,000 from Sunrise Coaching Centre in cash.
10. 28 June: Paid ₹20,000 to Kumar Paper Mart by cheque.

## Steps
1. Write the journal entry for each transaction with a one-line narration.
2. Post them to ledger accounts and balance each account.
3. Prepare the trial balance as on 30 June.
4. In two or three lines, say which accounts are personal, real and nominal.

## Deliverable
Type everything in the text box (use simple aligned text), or paste a link to a Google Sheet. Clear, readable layout matters.

## Tips
- Your trial balance totals should come to ₹2,05,000 on both sides. If not, check cash first: it has six transactions.
- Purchases of goods for resale go to Purchases A/c; furniture goes to Furniture A/c.`,
              rubric: [
                { criterion: "All 10 journal entries are correct with sensible narrations", points: 40 },
                { criterion: "Ledger accounts are posted and balanced correctly", points: 25 },
                { criterion: "Trial balance is complete and totals match", points: 25 },
                { criterion: "Classification of accounts is correct and clearly presented", points: 10 },
              ],
              submissionType: "TEXT",
            },
          },
        ],
      },
      {
        title: "Tally Prime in Practice",
        lessons: [
          {
            title: "Creating a company, ledgers and groups in Tally Prime",
            type: "VIDEO",
            durationMinutes: 12,
            content: `> **Exam link:** Computer awareness sections in IBPS and SSC ask about shortcut keys and software basics; Tally Prime is the shortcut-driven software almost every Indian accounts office uses.

## Key points
- Create a company from the Company menu (Alt+K) and choose Create; fill in the name, state, financial year beginning and books beginning date.
- Tally comes with predefined groups such as Sundry Debtors, Sundry Creditors, Cash-in-Hand, Bank Accounts, Sales Accounts, Purchase Accounts, Duties & Taxes, Capital Account, Direct Expenses and Indirect Expenses.
- Every ledger you create must sit under the correct group, because groups decide where it appears in the balance sheet or P&L.
- Customers go under Sundry Debtors and suppliers under Sundry Creditors; rent and electricity go under Indirect Expenses.
- Use Alt+G (Go To) to jump to any screen or report quickly, and Ctrl+A to save a screen.

## Transcript
Namaste. Today we open Tally Prime. If you have not installed it, download it from the official Tally Solutions website; the educational mode is free and good enough for all our practice. Menus can look slightly different between releases, so focus on the logic, not the exact pixel.

First, creating a company. On the main screen, press Alt+K to open the Company menu and choose Create. Type the company name, let us say "Gupta General Store". Select the state, Uttar Pradesh. Set the financial year beginning, which in India is 1 April, and the books beginning date. Save with Ctrl+A. That is it, you now have a company.

Now the most important idea in Tally: groups. Tally already gives you a set of groups that match the balance sheet and P&L. Sundry Debtors is for customers who owe you money. Sundry Creditors is for suppliers you owe. Cash-in-Hand holds the cash ledger, which Tally creates automatically. Bank Accounts is for your SBI or HDFC current account. Sales Accounts and Purchase Accounts hold sales and purchase ledgers. Duties & Taxes is where GST ledgers will go later. Rent, electricity and salary usually go under Indirect Expenses.

To create a ledger, from the Gateway of Tally go to Create, then Ledger. Type "Shree Ram Wholesale", and under "Under" select Sundry Creditors. Save. Create "Hotel Annapurna" under Sundry Debtors, "SBI Current Account" under Bank Accounts, "Shop Rent" under Indirect Expenses, and "Purchase" and "Sales" under their groups.

Dekho, if you put a supplier under the wrong group, the balance sheet will still total, but it will be misleading. CA firms catch this in five seconds, and it does not look good. So always pause and ask: "Is this a person, an asset, an expense or an income?" Your golden rules help here too.

One more shortcut you will love: Alt+G, Go To. Type the name of any report or screen and jump straight there. Practise creating fifteen ledgers today until it feels natural.`,
          },
          {
            title: "Vouchers, stock items, Day Book, Balance Sheet and backup",
            type: "ARTICLE",
            durationMinutes: 12,
            content: `> **Exam link:** Just like you memorised shortcut keys for computer awareness, the F4 to F9 voucher keys below are what interviewers test first for a Tally operator role.

## What a voucher is

In Tally you do not write journal entries by hand. You record a **voucher**, and Tally posts it to the ledgers automatically. Go to **Gateway of Tally > Vouchers** (or press V from the Gateway), then choose the voucher type with a function key.

## The six voucher keys

- **F4 Contra:** movement between cash and bank only. Cash deposited into bank, cash withdrawn from bank, transfer between two bank accounts.
- **F5 Payment:** money going out. Rent paid by cash, supplier paid by NEFT.
- **F6 Receipt:** money coming in. Customer pays by UPI or cash.
- **F7 Journal:** adjustments with no cash or bank, such as depreciation or a correction entry.
- **F8 Sales:** goods or services sold, cash or credit.
- **F9 Purchase:** goods bought, cash or credit.

Credit notes and debit notes (sales and purchase returns) are under **Ctrl+F8** and **Ctrl+F9**.

\`\`\`text
F5 Payment voucher, 5 April
Account: Cash
Particulars: Shop Rent              8,000
Narration: Rent for April paid in cash
\`\`\`

Press **Ctrl+A** to accept (save) any voucher.

## Stock items

For a shop, you want quantities too, not just rupees.
1. Create units: **Create > Unit** (e.g. kg, pcs, pkt).
2. Optionally create stock groups: **Create > Stock Group** (e.g. Atta & Dal, Soaps & Detergents).
3. Create items: **Create > Stock Item**, set the group, unit and, once GST is enabled, the HSN and GST rate.

Now in a Sales or Purchase voucher you pick items, quantity and rate, and Tally updates stock automatically. For this you record Sales and Purchase vouchers in **Item Invoice** mode.

## Reports you will open daily

- **Day Book:** every voucher entered for a date. Open with **Alt+G > Day Book**. This is where you check the day's work before going home.
- **Balance Sheet** and **Profit & Loss A/c:** available directly from the Gateway reports.
- **Trial Balance:** under Display More Reports, or via Alt+G.
- **Stock Summary:** quantity and value of every item.

> Tip: In most reports, press Enter on a line to drill down to the vouchers behind it. This is how you hunt errors: start from the odd number and drill down.

## Backup, every single day

Data loss is the nightmare of every accounts office. In Tally Prime, open the **Data** menu with **Alt+Y**, choose **Backup**, select the company and a destination such as a pen drive or a cloud-synced folder. Restore is in the same menu.

Good habits:
- Take a backup at the end of every working day.
- Keep at least one copy outside the office computer.
- Name backup folders by date so you can go back to a specific day.

> Tip: Owners remember the accountant who saved their data when the computer crashed. Backup is a small habit with a big reputation.`,
          },
          {
            title: "Quiz: Tally Prime vouchers and reports",
            type: "QUIZ",
            durationMinutes: 6,
            content: `> **Exam link:** Shortcut-key and software-function questions, similar to computer awareness, but now tied to real accounting work.

Picture yourself at the billing counter of a busy shop while answering.`,
            quiz: {
              questions: [
                {
                  prompt: "The owner deposits ₹25,000 of the day's cash into the SBI current account. Which voucher do you use?",
                  options: ["F5 Payment", "F6 Receipt", "F4 Contra", "F7 Journal"],
                  correct: 2,
                  explanation: "Movement between cash and bank (in either direction) is recorded in a Contra voucher.",
                },
                {
                  prompt: "A new wholesale supplier from Kanpur should be created under which group?",
                  options: ["Sundry Debtors", "Sundry Creditors", "Purchase Accounts", "Indirect Expenses"],
                  correct: 1,
                  explanation:
                    "Suppliers you owe money to are Sundry Creditors. Purchase Accounts holds the purchase ledger itself, not the supplier.",
                },
                {
                  prompt: "Customer Hotel Annapurna pays ₹10,000 by UPI into the bank. Which voucher is correct?",
                  options: ["F6 Receipt", "F8 Sales", "F4 Contra", "F9 Purchase"],
                  correct: 0,
                  explanation:
                    "Money received from a party is a Receipt. The sale was already recorded earlier; this voucher only records the collection.",
                },
                {
                  prompt: "Which report shows every voucher entered on a particular date?",
                  options: ["Balance Sheet", "Stock Summary", "Trial Balance", "Day Book"],
                  correct: 3,
                  explanation: "The Day Book lists all vouchers for a date or period, which makes it the daily checking report.",
                },
                {
                  prompt: "Where do you take a backup of company data in Tally Prime?",
                  options: [
                    "Company menu (Alt+K) > Shut",
                    "Data menu (Alt+Y) > Backup",
                    "Gateway of Tally > Vouchers",
                    "F11 Features",
                  ],
                  correct: 1,
                  explanation: "Backup and Restore are in the Data menu, opened with Alt+Y.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "GST in Practice and Getting Hired",
        lessons: [
          {
            title: "GST basics: CGST, SGST, IGST, GSTIN and HSN",
            type: "ARTICLE",
            durationMinutes: 12,
            content: `> **Exam link:** GST is a favourite topic in UPSC economy, state PSC GS and banking awareness ("which tax replaced VAT?", "what is IGST?"); this lesson adds the calculations an office actually does.

## GST in one paragraph

Goods and Services Tax is a tax on the supply of goods and services, collected at every stage, where each business can usually set off the tax it paid on purchases. It replaced many older taxes like VAT, service tax and central excise (on most goods) from 1 July 2017.

## Intra-state vs inter-state

- **Intra-state supply** (seller and place of supply in the same state): charge **CGST + SGST**, each half of the rate. In Union Territories without legislature, UTGST replaces SGST.
- **Inter-state supply** (different states): charge **IGST** at the full rate.

Worked example, goods worth ₹10,000 at 18%:

\`\`\`text
Seller in Lucknow, buyer in Varanasi (both UP): intra-state
Taxable value            10,000
CGST @ 9%                   900
SGST @ 9%                   900
Invoice total            11,800

Seller in Lucknow, buyer in Patna (Bihar): inter-state
Taxable value            10,000
IGST @ 18%                1,800
Invoice total            11,800
\`\`\`

The total tax is the same. Only the split, and which government gets it, changes.

## GSTIN: 15 characters

Example format: \`09ABCDE1234F1Z5\`
- **First 2 digits:** state code. 09 is Uttar Pradesh, 10 Bihar, 08 Rajasthan, 23 Madhya Pradesh, 07 Delhi.
- **Next 10 characters:** PAN of the business.
- **13th character:** entity number for the same PAN in that state.
- **14th character:** usually "Z" by default.
- **15th character:** check code.

> Tip: The first two digits of the buyer's GSTIN instantly tell you intra-state or inter-state. Always match them with your own.

## HSN and SAC

- **HSN** (Harmonized System of Nomenclature) codes classify **goods**.
- **SAC** (Services Accounting Code) classifies **services**; these start with 99.

The GST rate depends on the HSN or SAC. Rates are revised from time to time, so always check the current rate on the GST portal or CBIC site before setting up items.

## Input tax credit (ITC)

GST paid on purchases for business can usually be set off against GST collected on sales.

\`\`\`text
Output GST on sales of 80,000 @18%:  CGST 7,200 + SGST 7,200
Input GST on purchases of 50,000 @18%: CGST 4,500 + SGST 4,500
Net payable:                          CGST 2,700 + SGST 2,700
\`\`\`

Basic conditions: you hold a valid tax invoice, you have received the goods or service, and the supplier has reported the invoice so it reflects in your auto-generated statement (GSTR-2B). Some items, like certain personal-use expenses, are blocked from ITC.

## Composition scheme in brief

Small businesses below a turnover limit can opt to pay tax at a low fixed rate on turnover. They **cannot collect GST from customers**, **cannot claim ITC**, issue a **bill of supply** instead of a tax invoice, and file simpler returns. Check the current limit on the GST portal, as it has been revised over the years.`,
          },
          {
            title: "Returns, e-invoice and setting up GST in Tally",
            type: "VIDEO",
            durationMinutes: 12,
            content: `> **Exam link:** "GSTR-1 is for what?" and "what is an e-way bill?" are common one-liners in banking and PSC papers; here you see where they come from in daily office work.

## Key points
- GSTR-1 is the return of outward supplies: invoice-wise details for B2B sales and summary details for B2C sales.
- GSTR-3B is the summary return where you report output tax and ITC and actually pay the net tax.
- E-invoicing (getting an IRN from the government portal) applies to businesses above a notified turnover, and an e-way bill is needed to move goods above a notified value; check current limits on the portal.
- In Tally, enable GST with F11 Company Features, then enter GSTIN and registration details.
- Create tax ledgers under Duties & Taxes with Type of duty as GST and tax type as Central Tax, State Tax or Integrated Tax.

## Transcript
Hello again. GST theory is useful, but in a job you will mostly hear two words every month: "GSTR-1" and "3B". Let me explain them simply.

GSTR-1 is the return of outward supplies, meaning your sales. For every B2B sale, where the buyer has a GSTIN, you report invoice-wise details: buyer GSTIN, invoice number, date, taxable value and tax. For B2C sales to normal customers, you report summary figures, mostly rate-wise and state-wise. Your buyers' input tax credit depends on your GSTR-1, so if you delay or make mistakes, their ITC is affected and they will call you, angry.

GSTR-3B is the summary return. Here you show total outward tax, total input tax credit, and you pay the net tax through the GST portal. Due dates and filing frequency depend on the type of taxpayer and schemes like quarterly filing, so always confirm on the portal or with your CA. I am not giving you dates to memorise because they do get changed.

Two more terms, briefly. E-invoice means larger businesses must register each B2B invoice on the government Invoice Registration Portal and get an IRN and QR code. E-way bill is a document generated online for moving goods above a certain value. Both have turnover or value limits that get revised, so check the current limit on the GST portal.

Now Tally. Open your company, press F11 for Company Features, and set "Enable Goods and Services Tax (GST)" to Yes. Enter state, registration type and GSTIN. Then create tax ledgers. Go to Create, Ledger, name it "CGST", put it under Duties & Taxes, set Type of duty or tax as GST and tax type as Central Tax. Repeat for "SGST" with State Tax and "IGST" with Integrated Tax. Many offices create separate input and output ledgers, like "Input CGST" and "Output CGST", which makes reconciliation easier. Follow whatever your CA firm prefers.

Finally, set the GST rate and HSN on stock items or on sales and purchase ledgers. Once this is done, Tally calculates CGST, SGST or IGST automatically based on the party's state. Dekho, this is the moment Tally saves hours. Your job is to set it up correctly once and check reports every month.`,
          },
          {
            title: "Accounts executive, GST assistant and Tally operator jobs",
            type: "ARTICLE",
            durationMinutes: 9,
            content: `> **Exam link:** Your interview practice for SSC and bank interviews (clear answers, calm voice, honest examples) works just as well in a private accounts interview.

## The three common roles

### Tally operator / data entry accountant
Enters sales, purchase, payment and receipt vouchers, maintains stock, prints invoices. Found at distributors, wholesalers and retail chains. Typical starting pay in tier-2 towns: roughly ₹10,000 to ₹16,000 a month.

### Accounts executive / junior accountant
Owns the books: vouchers, bank reconciliation, ledger scrutiny, debtor follow-up, monthly GST data for the CA. Typical starting pay: roughly ₹15,000 to ₹25,000 a month, higher in metros. With 2 to 3 years of experience, ₹25,000 to ₹40,000 is common.

### GST assistant at a CA firm
Prepares GSTR-1 and GSTR-3B data for many clients, reconciles purchase registers with GSTR-2B, follows up on missing invoices. Starting pay is often ₹12,000 to ₹20,000, but you learn many businesses quickly.

These ranges vary a lot by city and employer, so treat them as a rough guide, not a promise.

## Where to find openings

- **Naukri, Indeed, Apna and WorkIndia:** search "accounts executive", "Tally operator", "GST executive".
- **Local CA firms:** walk in with a printed one-page CV. Many hire before the busy return season.
- **LinkedIn:** follow CA firms and finance managers in your city.
- **Catalance:** small part-time bookkeeping gigs for D2C sellers to build experience.

## Interview questions you should practise

1. **What are the golden rules of accounting?** Say all three with one example each.
2. **What is the difference between Contra and Payment vouchers?** Contra is only cash to bank or bank to cash; Payment is money paid to a party or for an expense.
3. **Intra-state sale of ₹20,000 at 18%: what tax do you charge?** CGST ₹1,800 and SGST ₹1,800, total ₹23,600.
4. **What is GSTR-1 vs GSTR-3B?** Outward supply details vs summary return with tax payment.
5. **Your trial balance does not tally. What do you do?** Check the Day Book for the period, look for one-sided or wrong-amount entries, drill down from the odd balances.
6. **What is bank reconciliation?** Matching the bank ledger in Tally with the bank statement and explaining differences like uncleared cheques or bank charges.

> Tip: When asked about the gap in your CV, say it honestly and with confidence: "I was preparing for government exams, and alongside I built practical accounting skills." Discipline from prep is a strength, and good employers know it.

## Make your CV practical

Mention Tally Prime, GST basics, Excel, and your project from the final assignment. Add a line like "Maintained one week of books for a kirana store with GST summary". Specific beats generic every time.`,
          },
          {
            title: "Quiz: GST and job-readiness",
            type: "QUIZ",
            durationMinutes: 6,
            content: `> **Exam link:** GST concept questions in the style of UPSC economy and banking awareness, plus the calculation interviewers love.

Do the maths on paper before you choose.`,
            quiz: {
              questions: [
                {
                  prompt: "A Jaipur trader sells goods worth ₹10,000 at 18% to a registered buyer in Indore. What tax is charged?",
                  options: ["CGST ₹900 + SGST ₹900", "IGST ₹1,800", "SGST ₹1,800", "No GST, because the buyer is registered"],
                  correct: 1,
                  explanation: "Rajasthan to Madhya Pradesh is an inter-state supply, so IGST is charged at the full 18%.",
                },
                {
                  prompt: "A buyer's GSTIN starts with 09. What does this tell you?",
                  options: ["The buyer is a composition dealer", "The buyer is registered in Uttar Pradesh", "The invoice is the 9th of the month", "The buyer pays 9% tax"],
                  correct: 1,
                  explanation: "The first two digits of a GSTIN are the state code; 09 is Uttar Pradesh.",
                },
                {
                  prompt: "Output GST for the month is ₹14,000 and eligible ITC is ₹9,500. How much GST is payable in cash?",
                  options: ["₹14,000", "₹23,500", "₹4,500", "₹9,500"],
                  correct: 2,
                  explanation: "Eligible input tax credit is set off against output tax: 14,000 minus 9,500 = ₹4,500.",
                },
                {
                  prompt: "Which statement about a composition dealer is correct?",
                  options: [
                    "Charges GST separately on every invoice",
                    "Claims full input tax credit on purchases",
                    "Cannot collect GST from customers and cannot claim ITC",
                    "Must file only GSTR-1 every month",
                  ],
                  correct: 2,
                  explanation:
                    "Composition dealers pay tax at a low fixed rate on turnover from their own pocket, issue a bill of supply and cannot claim ITC.",
                },
                {
                  prompt: "Which return is used to report summary figures and pay the net GST liability?",
                  options: ["GSTR-1", "GSTR-3B", "GSTR-2B", "Form 26AS"],
                  correct: 1,
                  explanation:
                    "GSTR-3B is the summary return with tax payment. GSTR-1 reports outward supplies, and GSTR-2B is an auto-generated ITC statement.",
                },
              ],
            },
          },
          {
            title: "Final assignment: one week of books for a kirana store",
            type: "ASSIGNMENT",
            durationMinutes: 90,
            content: `> **Exam link:** This brings together every topic from your commerce and banking awareness prep (journal, ledger, trial balance, GST) into one practical case.

This is exactly what a small-business owner or CA firm hands a new accounts executive on day one. A clean, well-presented submission becomes the strongest proof on your CV that you can do the job, not just pass a test.`,
            assignment: {
              brief: `## The scenario
**Gupta General Store**, Civil Lines, Prayagraj (GSTIN state code 09, Uttar Pradesh, regular GST taxpayer) wants you to keep its books for one week. Opening balances on Monday: Cash ₹20,000, SBI Current Account ₹80,000, Capital ₹1,00,000.

GST rates in this brief are given for practice. In real work, always check the current HSN rate on the GST portal.

## Transactions
1. **Mon:** Bought packaged atta and dal on credit from Shree Ram Wholesale, Prayagraj (GSTIN 09...), ₹30,000 + GST 5%.
2. **Tue:** Cash sales of groceries to walk-in customers ₹12,000 + GST 5%.
3. **Tue:** Bought soaps and detergents from Delhi Home Care Distributors (GSTIN 07...), ₹10,000 + GST 18%, paid by NEFT from SBI.
4. **Wed:** UPI sales of soaps and detergents ₹8,000 + GST 18%, received in SBI.
5. **Wed:** Paid shop rent ₹6,000 by UPI from SBI (landlord unregistered, no GST).
6. **Thu:** Credit sale to Hotel Annapurna, Prayagraj (GSTIN 09...) ₹15,000 + GST 5%.
7. **Fri:** Paid ₹20,000 to Shree Ram Wholesale by NEFT.
8. **Fri:** Paid electricity bill ₹2,400 in cash.
9. **Sat:** Received ₹10,000 from Hotel Annapurna by UPI into SBI.
10. **Sun:** Deposited ₹10,000 cash into SBI.

## Steps
1. In **Tally Prime** (preferred): create the company, enable GST, create party, sales, purchase, expense and tax ledgers under the correct groups, and record each transaction with the right voucher (F4, F5, F6, F8, F9). **Or in Excel/Google Sheets:** write journal entries with separate CGST, SGST and IGST lines.
2. Prepare closing **ledger balances** for Cash, SBI, Shree Ram Wholesale, Hotel Annapurna, Sales, Purchases, Rent, Electricity and each GST ledger.
3. Prepare the **trial balance** as on Sunday and make sure it tallies.
4. Prepare a **GST summary**: output CGST, SGST and IGST; input CGST, SGST and IGST; and net position. Note which sales would go in GSTR-1 as B2B and which as B2C.
5. Write a 3 to 5 line note to Mr Gupta explaining the week in simple words.

## Deliverable
Upload to Google Drive: Tally report exports (Day Book, Trial Balance, GST summary) as PDF or Excel, or your workbook. Submit the shared view link.

## Tips
- Transaction 3 is inter-state, so it carries IGST, not CGST + SGST.
- Transaction 10 is a Contra entry and has no GST.
- Cross-check: Day Book should show exactly 10 vouchers.`,
              rubric: [
                { criterion: "Ledgers created under correct groups and all 10 transactions recorded with the right voucher or entry", points: 30 },
                { criterion: "GST split (CGST/SGST vs IGST) and amounts are correct", points: 25 },
                { criterion: "Ledger balances and trial balance are accurate and tally", points: 25 },
                { criterion: "GST summary, B2B/B2C classification and owner note are clear", points: 20 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
    ],
  },
  {
    slug: "bookkeeping-for-small-shops",
    title: "Bookkeeping for Small Shops",
    subtitle: "Cash book, UPI matching and simple GST bills, the way a real shop runs",
    description:
      "A free, short course for aspirants who want a practical skill they can use from the very first week. Sana Qureshi, who looks after the books for several of her small D2C clients, shows you how to keep a daily cash register, match UPI and bank entries, and read or make a simple GST bill. Many students start by helping a family shop or a neighbour's store with exactly these tasks.",
    level: "BEGINNER",
    languages: ["hi", "en", "hinglish"],
    cover: { from: "#9A3412", to: "#4D7C0F", pattern: "dots" },
    mentorId: "m_3",
    priceINR: 0,
    rating: 4.7,
    ratingsCount: 642,
    studentsCount: 5480,
    createdDaysAgo: 58,
    skills: ["Cash Book", "Daily Register", "UPI Reconciliation", "Bank Reconciliation", "GST Invoices"],
    whatYouBuild: [
      "A daily cash register format for a small shop in Google Sheets",
      "A one-week UPI and bank matching sheet with differences explained",
      "Two correct GST bills: one intra-state and one inter-state",
    ],
    requirements: [
      "A smartphone or laptop with Google Sheets or Excel",
      "No accounting background needed",
    ],
    modules: [
      {
        title: "Cash Book and the Daily Register",
        lessons: [
          {
            title: "Why every shop needs a cash book",
            type: "VIDEO",
            durationMinutes: 7,
            isPreview: true,
            content: `> **Exam link:** The "cash book is both a journal and a ledger" fact from banking awareness MCQs is exactly what you will use here.

## Key points
- A cash book records every rupee that comes in or goes out, in date order.
- Receipts go on the debit side and payments on the credit side; the balance is cash in hand.
- Counting the drawer daily and matching it to the book catches mistakes and theft early.
- A clean cash book is the base for Tally entries, GST data and bank deposits.

## Transcript
Namaste, I am Sana. Let me start with a small story. One of my D2C clients also runs a little gift shop in Lucknow. Every evening the drawer was short by two or three hundred rupees, and nobody knew why. We started a simple cash book, and within a week we found it: small change given for UPI customers was never recorded.

A cash book is just this. On the left, the debit side, you write money received: cash sales, money from customers. On the right, the credit side, money paid: purchases in cash, tea, electricity, small expenses. At the end of the day, receipts minus payments, plus the opening balance, should equal the cash in the drawer.

Dekho, this is where your exam habits help. Daily revision, daily checking. Same discipline. If the shop owner sees that you close the book correctly every evening, trust is built very quickly.`,
          },
          {
            title: "Setting up a daily register in Google Sheets",
            type: "ARTICLE",
            durationMinutes: 7,
            isPreview: true,
            content: `> **Exam link:** Simple addition and subtraction under time pressure, like SSC arithmetic, is all the maths a daily register needs.

## Columns to use

Create a sheet with these columns: **Date, Particulars, Mode (Cash/UPI/Card), Receipt ₹, Payment ₹, Running Balance ₹, Remarks**.

\`\`\`text
Date    Particulars           Mode   Receipt   Payment   Balance
01-Jul  Opening balance       Cash                        5,000
01-Jul  Cash sales            Cash    6,400              11,400
01-Jul  Milk supplier paid    Cash              1,800     9,600
01-Jul  Tea and snacks        Cash                120     9,480
\`\`\`

## The running balance formula

In the first balance row type the opening amount. In the next row use \`=F2+D3-E3\` and drag down. Every row now shows cash that should be in the drawer.

## Daily routine

- Write every entry the moment it happens, not at night from memory.
- Count the drawer at closing time and write the actual amount in Remarks.
- If there is a difference, note it honestly; do not "adjust" it silently.

> Tip: Keep UPI and card receipts in the same register but mark the Mode. Only Cash rows affect the drawer balance, so use a separate column or filter for them.`,
          },
          {
            title: "Closing the day and handling differences",
            type: "ARTICLE",
            durationMinutes: 6,
            content: `> **Exam link:** Finding an error in the cash book works like spotting the odd one out in reasoning: compare, isolate, explain.

## The closing check

1. Total today's cash receipts and cash payments.
2. Book balance = opening cash + receipts minus payments.
3. Count the drawer note by note (500s, 200s, 100s, coins).
4. Compare book balance with the counted amount.

## Common reasons for a difference

- A cash expense (auto fare, tea, labour) was paid but not written.
- Change was given to a UPI customer and not recorded.
- An amount was written as ₹540 instead of ₹450 (transposition). If the difference divides exactly by 9, suspect this first.
- Owner took cash for home use. This is **drawings**, not an expense, and must be recorded separately.

## What to do

Write the difference as "Cash short" or "Cash excess" with a remark, and tell the owner the same day. Small differences explained today are better than a big mystery at month end.

> Tip: Keep the register and the bank deposit slip together. When cash is deposited in the bank, it leaves the drawer, so record it as a payment from cash.`,
          },
        ],
      },
      {
        title: "UPI and Bank Reconciliation Basics",
        lessons: [
          {
            title: "Matching UPI receipts with the bank statement",
            type: "VIDEO",
            durationMinutes: 8,
            content: `> **Exam link:** Bank reconciliation statement is a standard banking awareness and commerce topic; UPI makes it a daily task for every shop.

## Key points
- Most small shops now receive a large share of payments through UPI QR codes, which land directly in the bank account.
- Each UPI receipt in the bank statement has a reference number (UTR) and amount that you can match with the shop's sales record.
- Differences usually come from settlements in batches, payment app charges on some products, failed or reversed payments, or entries not yet recorded.
- Download the statement as Excel or CSV from net banking for easier matching.

## Transcript
Hello! Today, UPI. In most shops I visit, more than half the money now comes through the QR code stuck on the counter. That is great, but it means the shop's records and the bank statement must agree.

Here is my method. Each evening, or at least weekly, download the bank statement from net banking as Excel. In one sheet keep the shop's UPI sales list: date, amount, customer name if known. In the other, the bank credits. Then match one by one: same date, same amount. Tick the matched ones.

Whatever is left unticked is your work. Maybe a customer showed a "payment successful" screen but the payment failed. Maybe a soundbox missed one. Maybe a payment aggregator settles in one lump sum the next day, so many small sales become one bank entry. Chalo, find each reason and write it down.

This is what reconciliation means: not just making totals equal, but explaining every difference.`,
          },
          {
            title: "A simple bank reconciliation, step by step",
            type: "ARTICLE",
            durationMinutes: 8,
            content: `> **Exam link:** The classic BRS items from commerce MCQs (cheques issued but not presented, bank charges, direct deposits) appear here with real shop examples.

## Why balances differ

The shop's bank book (or bank ledger in Tally) and the bank statement are kept by two different people, so timing creates gaps.

Common items:
- **Cheque issued but not yet presented:** you recorded the payment, the bank has not.
- **Cheque deposited but not yet cleared:** you recorded the receipt, the bank has not credited it.
- **Bank charges, SMS charges, interest:** the bank recorded them, you have not.
- **Direct UPI or NEFT receipts** you have not entered yet.

## Example

\`\`\`text
Balance as per shop's bank book           42,500
Add: Cheque issued to supplier, not
     yet presented                         8,000
Less: Bank charges not in books             -150
Add: UPI receipt not yet recorded          1,200
Balance as per bank statement             51,550
\`\`\`

## After reconciling

Record the items that belong in your books (bank charges, missed UPI receipts). Timing items like uncleared cheques need no entry; they clear by themselves next month.

> Tip: Do this at least once a week for a busy shop. Monthly reconciliation of 600 UPI entries is painful; weekly is easy.`,
          },
          {
            title: "Quiz: cash book and reconciliation",
            type: "QUIZ",
            durationMinutes: 5,
            content: `> **Exam link:** Three quick BRS and cash book questions in the same style as banking awareness MCQs.

Answer as if you are closing the books of a real shop today.`,
            quiz: {
              questions: [
                {
                  prompt: "The cash register shows ₹9,480 but the drawer has ₹9,390. The difference is ₹90, which divides by 9. What should you check first?",
                  options: ["Whether the bank charged SMS fees", "Whether an amount was written with digits swapped", "Whether GST was charged", "Whether the opening balance was zero"],
                  correct: 1,
                  explanation: "A difference exactly divisible by 9 is a classic sign of transposed digits, like writing 540 instead of 450.",
                },
                {
                  prompt: "A cheque issued to a supplier has not yet been presented at the bank. Compared with the shop's bank book, the bank statement balance will be:",
                  options: ["Higher", "Lower", "The same", "Zero"],
                  correct: 0,
                  explanation: "The shop has already reduced its bank balance, but the bank has not paid yet, so the statement shows a higher balance.",
                },
                {
                  prompt: "The owner takes ₹2,000 from the drawer for household use. How should this be recorded?",
                  options: ["As a shop expense", "As a sale", "It need not be recorded", "As drawings"],
                  correct: 3,
                  explanation: "Money taken by the owner for personal use is drawings. It reduces capital and is not a business expense.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Simple GST Bills",
        lessons: [
          {
            title: "What a correct GST bill must show",
            type: "ARTICLE",
            durationMinutes: 7,
            content: `> **Exam link:** GSTIN structure and CGST/SGST vs IGST are frequent GST questions in banking and PSC papers; a shop bill shows them all on one page.

## Must-have details on a tax invoice

- Seller's name, address and **GSTIN**.
- Invoice number (unique, in a series) and date.
- Buyer's name, address and GSTIN (for B2B sales).
- Description, **HSN** code, quantity, rate and taxable value.
- GST rate and amount, split as **CGST + SGST** or **IGST**.
- Place of supply (state) and total amount in figures and words.

## Example: intra-state bill

\`\`\`text
Shiv Hardware, Indore  GSTIN 23ABCDE1234F1Z5
Bill No: SH/112   Date: 14-Jul
Buyer: Malwa Builders, Indore (GSTIN 23...)
Item: Wall putty 40 kg x 5 bags @ 800     4,000.00
CGST @ 9%                                   360.00
SGST @ 9%                                   360.00
Total                                     4,720.00
\`\`\`

If the buyer were in Jaipur (state code 08), the same bill would show **IGST @ 18% = ₹720** instead.

> Tip: Composition dealers do not issue tax invoices; they issue a **bill of supply** and cannot charge GST. Check the seller's registration type before billing.`,
          },
          {
            title: "Making GST bills in Sheets or a billing app",
            type: "VIDEO",
            durationMinutes: 7,
            content: `> **Exam link:** Percentage calculation from SSC quant (18% of ₹4,000) is the only maths a GST bill needs.

## Key points
- A simple Google Sheets template with fixed seller details and formula-based tax columns avoids calculation mistakes.
- Taxable value is quantity multiplied by rate; tax is taxable value multiplied by the rate divided by 100.
- Use an IF formula on the buyer's state code to choose CGST + SGST or IGST.
- Billing apps and Tally Prime do this automatically, but you should be able to check every figure by hand.

## Transcript
Hello! Many small shops do not have Tally yet. They use a billing app on the phone, or honestly, a Google Sheet. Let me show you a simple sheet I made for a client.

At the top, fixed details: shop name, address, GSTIN. Then rows for items with HSN, quantity and rate. Taxable value is quantity times rate. Then I keep the buyer's state code in one cell. If it matches the shop's code, the sheet splits tax into CGST and SGST, each half. If not, it shows IGST.

\`\`\`text
=IF(B3=B2, D10*9%, 0)     CGST
=IF(B3=B2, D10*9%, 0)     SGST
=IF(B3<>B2, D10*18%, 0)   IGST
\`\`\`

Here B2 is the seller's state code and B3 the buyer's. Dekho, simple, but it saves you from the most common GST mistake. Always keep a copy of every bill with a running invoice number.`,
          },
          {
            title: "Assignment: one week of records for a small shop",
            type: "ASSIGNMENT",
            durationMinutes: 45,
            content: `> **Exam link:** Cash book, BRS and GST, three exam topics in one small practical task.

Shop owners hire people they can trust with money. A neat week of records is the simplest proof you can show a neighbour's shop or your first employer.`,
            assignment: {
              brief: `## The task
**Sharma Medical and General Store, Varanasi** (state code 09) needs help for one week.

1. **Cash register:** record opening cash ₹4,000, cash sales of ₹3,200, ₹2,800 and ₹4,100 on three days, a cash payment of ₹1,500 to a supplier, ₹300 for tea and transport, and ₹5,000 deposited into the bank. Show the running balance.
2. **UPI matching:** the shop recorded UPI sales of ₹1,250, ₹840 and ₹2,300, but the bank shows ₹1,250, ₹2,300 and a ₹590 credit nobody recognises. List matched and unmatched items and suggest a reason for each difference.
3. **GST bills:** make two bills for wall clocks worth ₹6,000 at 18% (practice rate): one to a buyer in Varanasi, one to a buyer in Patna (state code 10).

## Deliverable
Make a Google Sheet with three tabs and submit the view link.

## Tips
- Only cash rows change the drawer balance.
- Check the state codes before splitting GST.`,
              rubric: [
                { criterion: "Cash register entries and running balance are correct", points: 40 },
                { criterion: "UPI matching is complete with sensible reasons for differences", points: 30 },
                { criterion: "Both GST bills are correct and contain the required details", points: 30 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
    ],
  },
];
