/** Excel for Aspirants courses — seed content for the Campus demo. */
export default [
  {
    slug: "excel-from-di-to-mis",
    title: "Excel for Aspirants: From DI Tables to MIS Reports",
    subtitle: "You've solved 1,000 DI tables. Now do it in Excel.",
    description:
      "Your years of SSC, banking and railway prep have already trained you in percentages, ratios, averages and reading tables fast. This course turns that exact skill into Excel: formulas, lookups, pivot tables, charts and a real monthly MIS report, all built on a DI-style dataset you will recognise instantly. Your mentor Arvind Krishnan is a data analyst turned freelance BI consultant who has coached many ex-aspirants into MIS and back-office roles, and he teaches at a pace that fits 30 to 60 minutes a day alongside your preparation.",
    level: "BEGINNER",
    languages: ["hi", "en", "hinglish"],
    cover: { from: "#166534", to: "#0E7490", pattern: "grid" },
    mentorId: "m_4",
    priceINR: 999,
    rating: 4.8,
    ratingsCount: 1124,
    studentsCount: 7380,
    createdDaysAgo: 86,
    skills: ["Excel Formulas", "Cell References", "VLOOKUP & XLOOKUP", "Pivot Tables", "Charts", "Data Cleaning", "MIS Reporting"],
    whatYouBuild: [
      "A DI-to-Excel workbook on state-wise wheat production with growth %, averages, ratios and lookups",
      "Pivot tables and the right chart for each DI question type, on the same dataset",
      "A cleaned, validated data-entry sheet that rejects wrong inputs",
      "A one-page monthly MIS report for a fictional Prayagraj distributor, ready to send to a manager",
    ],
    requirements: [
      "A laptop or desktop with Excel 2021/365, or free Excel for the web (a cyber cafe PC works too)",
      "Basic percentage and ratio skills, which your exam prep has already given you",
      "30 to 60 minutes a day; no prior computer course needed",
    ],
    modules: [
      {
        title: "Your Prep Meets the Excel Grid",
        lessons: [
          {
            title: "Why Excel is the #1 skill for MIS and back-office jobs",
            type: "VIDEO",
            durationMinutes: 9,
            isPreview: true,
            content: `> **Exam link:** Every SSC CGL Tier 1 and IBPS PO prelims paper has a DI set of 5 questions on one table; an MIS executive answers the same kind of questions all day, only in Excel.

## Key points
- MIS executive, data entry operator, back-office associate and operations analyst roles all list Excel as the first required skill on Naukri and Apna.
- Freshers in MIS roles typically earn ₹2.4–4.5 LPA, and experienced MIS analysts with pivot tables and dashboards reach ₹5–7 LPA within two to three years.
- Your exam preparation already trained the hardest part: reading a table, spotting the trend and calculating percentages accurately under time pressure.
- Excel simply removes the manual calculation, so your judgement and speed become the real value.
- This course uses one DI-style dataset throughout, so you always know what the numbers mean.

## Transcript
Namaste, I am Arvind. Before I became a freelance BI consultant, I spent years as a data analyst, and since then I have coached many aspirants who wanted a backup career while continuing their preparation. So let me say this clearly on day one: your prep years are not wasted. They are your advantage.

Think about what you did in your last mock test. You looked at a table of state-wise wheat production, found the year with the highest growth, calculated a ratio between two states and estimated an average. You did all that with a pen in maybe 90 seconds per question. That is exactly what an MIS executive does at a distributor in Lucknow or an insurance back office in Noida. The only difference is that they use Excel.

Dekho, companies do not hire MIS people because they can click buttons. They hire them because they can look at numbers and tell the manager, "Sales in Kanpur dropped 12% this month, mostly in one product." You already think like that. Excel just does the arithmetic for you.

What will you earn? Freshers in MIS and back-office roles usually start between ₹2.4 and ₹4.5 lakh per year depending on the city and company. With pivot tables, lookups and clean reports, which you will learn here, people move to ₹5 lakh and above in two or three years.

And this does not compete with your preparation. Thirty to sixty minutes a day is enough. Many of my students practise Excel in the evening after their mock analysis, and they say it actually makes their DI faster, because they start seeing tables as data.

In this module we start with the grid, cell references and the five formulas you will use every single day. Chalo, let us open Excel.`,
          },
          {
            title: "The grid, cell references and your first five formulas",
            type: "ARTICLE",
            durationMinutes: 10,
            isPreview: true,
            content: `> **Exam link:** SSC CHSL and RRB NTPC ask for "average production of State X over five years" or "percentage increase from 2019 to 2023"; here you write each of those as one Excel formula.

## The grid in two minutes
An Excel sheet is a grid. **Columns** are letters (A, B, C), **rows** are numbers (1, 2, 3), and each box is a **cell** with an address like \`B2\`. A **range** is a block of cells, written \`B2:F2\` (B2 to F2).

We will use this DI-style table throughout the course (rounded practice figures, wheat production in lakh tonnes). Type it in a new sheet with "State" in A1 and years 2019 to 2023 in B1 to F1:

\`\`\`text
State          2019  2020  2021  2022  2023
Uttar Pradesh   320   332   355   350   362
Madhya Pradesh  260   300   320   310   330
Punjab          178   176   172   148   166
Haryana         118   119   123   104   112
Rajasthan        98   102   108   100   112
\`\`\`

## The five everyday formulas
Every formula starts with \`=\`. In G2, H2 and so on, type:

\`\`\`text
=SUM(B2:F2)        total UP production over 5 years   -> 1719
=AVERAGE(B2:F2)    average per year                   -> 343.8
=MAX(B2:F2)        best year's production             -> 362
=MIN(B2:F2)        lowest year's production           -> 320
=COUNT(B2:F2)      how many numeric cells             -> 5
\`\`\`

Now select G2 and drag the small square at the bottom-right corner (the **fill handle**) down to G6. Excel copies the formula for every state.

## Relative vs absolute references
When you dragged, \`=SUM(B2:F2)\` became \`=SUM(B3:F3)\` in the next row. That is a **relative reference**: it moves with the formula.

Sometimes you want a cell to stay fixed. Suppose B8 holds the all-state total for 2019 and you want each state's share. You write in C10:

\`\`\`text
=B2/$B$8
\`\`\`

The \`$\` locks the column and row, so when you drag down, B2 becomes B3, B4..., but \`$B$8\` stays. Press **F4** after clicking a reference to add the dollar signs quickly. Mixed forms exist too: \`$B8\` locks only the column, \`B$8\` locks only the row.

## Percentage and percentage change
Yeh wahi cheez hai jo aap DI mein roz karte ho. Percentage change from 2019 to 2023 for UP:

\`\`\`text
=(F2-B2)/B2
\`\`\`

The result is 0.13125. Click **Home > %** (or press Ctrl+Shift+5) to show it as 13%, and use the "Increase Decimal" button to show 13.1%. Excel keeps the full value inside, so there is no rounding error like in hand calculation.

> **Tip:** Brackets matter exactly as in exam maths. \`=F2-B2/B2\` divides first and gives a wrong answer. Always bracket the difference.

## Practice
1. Compute 5-year average for every state.
2. Compute 2022 to 2023 percentage change for every state in one dragged formula.
3. Find which state had the highest 2023 share of the five-state total, using \`$\` on the total.`,
          },
          {
            title: "Module 1 quiz: references and core formulas",
            type: "QUIZ",
            durationMinutes: 6,
            content: `> **Exam link:** These questions mirror SSC DI percentage-change and average questions, but you answer them as an Excel user would.

Five quick questions on the grid, references and percentage formulas. Use the wheat table from the article if you want to check in Excel.`,
            quiz: {
              questions: [
                {
                  prompt: "You type =B2/$B$8 in C2 and drag it down to C3. What formula appears in C3?",
                  options: ["=B3/$B$9", "=B3/$B$8", "=B2/$B$8", "=C3/$B$8"],
                  correct: 1,
                  explanation: "B2 is relative so it moves to B3, while $B$8 is absolute and stays fixed.",
                },
                {
                  prompt: "Which formula correctly gives the percentage change from 2019 (B2) to 2023 (F2)?",
                  options: ["=F2-B2/B2", "=(B2-F2)/F2", "=(F2-B2)/B2", "=F2/B2-B2"],
                  correct: 2,
                  explanation: "Percentage change is (new minus old) divided by old, and the difference must be bracketed so it is calculated first.",
                },
                {
                  prompt: "Punjab's row is 178, 176, 172, 148, 166. What does =MIN(B4:F4) return?",
                  options: ["148", "166", "178", "172"],
                  correct: 0,
                  explanation: "MIN returns the smallest value in the range, which is 148 for 2022.",
                },
                {
                  prompt: "A cell shows 0.13125. What is the fastest way to display it as a percentage without changing the value?",
                  options: ["Multiply by 100 in a new formula", "Retype it as 13.1", "Apply Percent format with Ctrl+Shift+5", "Use =ROUND(F2,2)"],
                  correct: 2,
                  explanation: "Formatting changes only how the number looks; the full value stays for later calculations.",
                },
                {
                  prompt: "You want a reference where the column stays fixed but the row changes when dragged down. Which one?",
                  options: ["B$8", "$B$8", "B8", "$B8"],
                  correct: 3,
                  explanation: "The $ before B locks the column; without a $ before 8 the row number still changes as you drag.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Lookups, Logic and Your DI Dataset",
        lessons: [
          {
            title: "VLOOKUP and XLOOKUP: find any value in a second",
            type: "VIDEO",
            durationMinutes: 12,
            content: `> **Exam link:** In IBPS PO and SBI Clerk DI, you scan a table to find "production of Haryana in 2021"; VLOOKUP and XLOOKUP do that scan for you in big MIS sheets with thousands of rows.

## Key points
- A lookup finds a value in one column and returns the matching value from another column, like finding a state's row and reading the 2023 figure.
- VLOOKUP works in every Excel version but only looks to the right and needs a column number.
- XLOOKUP (Excel 2021, 365 and Excel for the web) is simpler, looks in any direction and has a built-in "not found" message.
- Always use exact match: FALSE in VLOOKUP, which is the default in XLOOKUP.
- #N/A means "not found"; wrap lookups in IFERROR or use XLOOKUP's fourth argument to show a clean message.

## Transcript
Chalo, open your wheat production sheet. In a real MIS job, the table will not have five states; it will have five thousand rows of orders or employees. Nobody scrolls through that. You use a lookup.

Let us build a small "search box". In H1 type "State", in H2 type "Haryana". In I1 type "2023 production". Now in I2 type this:

\`\`\`text
=VLOOKUP(H2,$A$2:$F$6,6,FALSE)
\`\`\`

Read it like a sentence. Look for H2, inside the table A2 to F6, return the 6th column, and FALSE means exact match only. The answer is 112. Column A is 1, B is 2, so the 2023 column F is 6. Notice the dollar signs, because you will usually drag this formula.

Now the same thing with XLOOKUP:

\`\`\`text
=XLOOKUP(H2,$A$2:$A$6,$F$2:$F$6,"State not found")
\`\`\`

Look for H2 in the state column, return from the 2023 column, and if it is missing, say "State not found". No column counting, and if someone inserts a new column, it does not break. If your office uses Excel 2021 or 365, prefer XLOOKUP. If they still use Excel 2016, VLOOKUP is your friend, so learn both. Interviewers ask about both.

Now type "Bihar" in H2. VLOOKUP shows #N/A. That is not a crash, it just means not found. Dhyan se dekho, a very common cause is a hidden extra space, like "Haryana " typed with a space at the end. We will fix that with TRIM in Module 3.

To hide the ugly error in VLOOKUP, wrap it:

\`\`\`text
=IFERROR(VLOOKUP(H2,$A$2:$F$6,6,FALSE),"Not in list")
\`\`\`

One more trick. To make the year selectable too, put 2021 in J2 and use XLOOKUP twice, once for the row and once for the header:

\`\`\`text
=XLOOKUP(H2,$A$2:$A$6,XLOOKUP(J2,$B$1:$F$1,$B$2:$F$6))
\`\`\`

Now you have a tiny DI calculator: pick any state, any year, and get the figure instantly. In the next lesson we add logic with IF and IFS.`,
          },
          {
            title: "IF, IFS and turning DI questions into formulas",
            type: "ARTICLE",
            durationMinutes: 10,
            content: `> **Exam link:** SSC CGL Tier 2 DI often asks "in how many years did production exceed the average?" or "which states grew more than 10%?"; IF and COUNTIF answer these without counting by hand.

## IF: a yes/no question in a cell
\`IF\` checks a condition and returns one value if true, another if false:

\`\`\`text
=IF(test, value_if_true, value_if_false)
\`\`\`

Using our wheat table (A1:F6), add a column G "Growth 2019-23" with \`=(F2-B2)/B2\` dragged down. Then in H2:

\`\`\`text
=IF(G2>=10%,"High growth","Low growth")
\`\`\`

UP (13.1%), MP (26.9%) and Rajasthan (14.3%) show "High growth"; Punjab (-6.7%) and Haryana (-5.1%) show "Low growth". Notice you can type \`10%\` directly in a formula.

## IFS: more than two outcomes
Older Excel needed nested IFs. Excel 2019 and later have \`IFS\`, which reads top to bottom and stops at the first true test:

\`\`\`text
=IFS(G2>=20%,"Strong",G2>=5%,"Moderate",G2>=0,"Flat",TRUE,"Declined")
\`\`\`

The final \`TRUE\` acts as "everything else". Results: MP Strong, UP and Rajasthan Moderate, Punjab and Haryana Declined. Always verify a couple of rows by hand, just like checking options in the exam.

## Turning DI questions into formulas
Here is the mindset shift. Every DI question you have practised is a formula waiting to be written.

**"What is the ratio of Punjab to Haryana production in 2023?"**
\`\`\`text
=F4/F5          -> 1.48, i.e. about 3:2
\`\`\`

**"What is the average production of all five states in 2021?"**
\`\`\`text
=AVERAGE(D2:D6)  -> 215.6
\`\`\`

**"In how many years was UP's production above its own 5-year average?"**
\`\`\`text
=COUNTIF(B2:F2,">"&AVERAGE(B2:F2))  -> 3
\`\`\`
The \`&\` joins the text ">" with the calculated average.

**"Which state had the highest growth?"**
\`\`\`text
=XLOOKUP(MAX(G2:G6),G2:G6,A2:A6)  -> Madhya Pradesh
\`\`\`

**"By what percent is MP's 2023 output less than UP's?"** (the classic "less than" trap)
\`\`\`text
=(F2-F3)/F2     -> 8.8%, base is UP
\`\`\`
Base matters in Excel exactly as in the exam: "less than UP" means divide by UP.

## Combining IF with AND / OR
\`\`\`text
=IF(AND(G2>0,F2>300),"Priority state","")
\`\`\`
Only states that grew and produced over 300 lakh tonnes in 2023 get flagged.

> **Tip:** Keep inputs (raw numbers) and calculations in separate columns, clearly labelled. Managers trust sheets they can follow, and you will find your own mistakes faster.

## Practice
Write formulas for five DI questions from your last mock test using this dataset. That is the warm-up for your assignment.`,
          },
          {
            title: "Assignment: build your DI-to-Excel workbook",
            type: "ASSIGNMENT",
            durationMinutes: 60,
            content: `> **Exam link:** This is a full SSC/IBPS DI set (growth, average, ratio, comparison) solved entirely in Excel, the same skill an MIS test round checks.

Your first portfolio piece. Interviewers for MIS and back-office roles often give a small table and say "calculate growth and averages"; a clean, well-labelled workbook shows you can do it calmly and correctly.`,
            assignment: {
              brief: `## The task
Build a workbook on the five-state wheat production table (2019 to 2023) from this module, then answer DI-style questions with formulas only. No typed answers, every result must come from a formula.

## Steps
1. **Data sheet:** enter the table exactly (A1:F6), with a "Total" row below that uses \`SUM\` for each year.
2. **Calculations sheet** (link to the Data sheet, do not retype):
   - 5-year total, average, max and min for each state.
   - Year-on-year growth % for every state and year (2020 vs 2019, and so on) in one dragged formula.
   - Overall growth 2019 to 2023 for each state.
   - Each state's share of the 2023 total, using an absolute reference.
   - Ratio of Punjab to Haryana and UP to Rajasthan for every year.
3. **Lookup sheet:** a dropdown-free search box where typing a state and a year returns the value using \`XLOOKUP\` (or \`VLOOKUP\` with \`IFERROR\` if you only have Excel 2016).
4. **Labels:** use \`IFS\` to label each state Strong / Moderate / Flat / Declined by overall growth.
5. **Questions sheet:** write five DI questions in your own words (like a mock test set) and answer each with a formula next to it.

## Deliverable
Upload the workbook to Google Drive or OneDrive, set sharing to "Anyone with the link can view", and submit the link.

## Tips
- Format percentages with one decimal place and add clear column headings.
- Test your lookup with a misspelt state to make sure it shows your message, not #N/A.
- Cross-check two answers by hand, exactly as you would in a mock.`,
              rubric: [
                { criterion: "All core calculations (totals, averages, growth %, share) are correct and formula-driven", points: 35 },
                { criterion: "Correct use of absolute/relative references so formulas drag cleanly", points: 20 },
                { criterion: "Lookup search box works and handles a missing state gracefully", points: 20 },
                { criterion: "IFS labels and the five DI questions are sensible and correctly answered", points: 15 },
                { criterion: "Workbook is clearly labelled, formatted and easy to follow", points: 10 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
      {
        title: "Pivot Tables, Charts and Clean Data",
        lessons: [
          {
            title: "Pivot tables: summarise any DI dataset in four clicks",
            type: "VIDEO",
            durationMinutes: 12,
            content: `> **Exam link:** IBPS Mains "caselet DI" gives data in paragraphs and asks totals by category; a pivot table builds that summary table automatically from raw rows.

## Key points
- Pivot tables need data in "long" format: one row per record, with columns like State, Year and Production.
- Drag fields into Rows, Columns and Values to get totals, averages or counts without a single formula.
- "Show Values As > % of Grand Total" or "% Difference From" gives shares and growth instantly.
- Always convert your data to a Table (Ctrl+T) first so the pivot picks up new rows after a Refresh.
- Pivot tables are the most asked Excel skill in MIS interviews after VLOOKUP.

## Transcript
Namaste again. Today we learn the feature that impresses every interviewer: the pivot table.

First, one important idea. Our wheat table is in "wide" format, years across the top. That is how DI tables are printed in exam books. But real office data comes in "long" format: one row per record. So make a new sheet with three columns, State, Year and Production, and 25 rows: Uttar Pradesh, 2019, 320; Uttar Pradesh, 2020, 332; and so on. In a real job, the company software exports it this way already.

Now click anywhere in the data and press Ctrl+T to make it a Table. Then go to Insert, PivotTable, New Worksheet, OK. You see an empty pivot and a field list on the right.

Drag State into Rows. Drag Year into Columns. Drag Production into Values. Bas, that is it. You have rebuilt the DI table, with Grand Totals for every state and every year, without typing one formula.

Ab interesting part. Right-click any number, choose Show Values As, then "% of Grand Total". Now every cell is a share of total production. This answers "what percent of total five-year production came from Punjab?" instantly. Change it to "% Difference From", base field Year, base item "previous", and you get year-on-year growth for every state.

Want averages instead of totals? Right-click, Summarize Values By, Average. Want only 2022 and 2023? Click the filter arrow on the Year header and untick the rest.

One habit to build: if the source data changes, the pivot does not update by itself. Right-click the pivot and choose Refresh. Because your data is a Table, new rows you add are included automatically.

In MIS work, you will pivot sales by region, product and month every single week. Practise until you can build one in under a minute, because many companies give a live Excel test in the interview and a pivot is almost always in it.`,
          },
          {
            title: "Charts: which chart for which DI question",
            type: "ARTICLE",
            durationMinutes: 8,
            content: `> **Exam link:** SSC and banking papers give DI as bar graphs, line graphs and pie charts; now you choose and build the right one for a manager instead of just reading it.

## The one rule
A chart should answer **one question** at a glance. Decide the question first, then the chart. You already know these chart types from DI practice; the trick is knowing which question each one answers best.

## Bar / column chart: comparing categories
Question: *"Which state produced the most wheat in 2023?"*
Select A1:A6 and F1:F6 (hold Ctrl to select both), then **Insert > Column Chart**. Sort the data largest to smallest first so the chart reads like a ranking. Use a **clustered column** to compare two or three years side by side for each state.

## Line chart: trends over time
Question: *"How has production changed from 2019 to 2023?"*
Select A1:F6 and insert a **Line Chart**. If the states appear on the x-axis instead of years, click **Chart Design > Switch Row/Column**. Lines show Punjab's 2022 dip and MP's steady rise immediately, which a table hides. Do not put more than 5 or 6 lines on one chart.

## Pie chart: parts of one whole, used carefully
Question: *"What share of 2023 production came from each state?"*
A pie works only when:
- the slices add up to a meaningful whole (all five states in one year),
- there are **5 or fewer** slices,
- the differences are large enough to see.

## When NOT to use a pie
- **Comparing years.** Two pies side by side are hard to compare; use a clustered column.
- **Trends.** Never show time with pies; use a line.
- **Many categories.** A pie of 20 districts is unreadable; use a sorted bar chart.
- **Values that do not add up**, such as growth percentages or averages.

> **Tip:** In DI, you have seen pies with 8 or 9 thin slices that force careful calculation. Examiners do that on purpose to make it hard. In office work you want the opposite: easy to read in five seconds.

## Make it manager-ready
1. **Title says the insight**, not just the topic: "MP overtook its own record in 2023" beats "Wheat Production".
2. Add **data labels** only where they help; remove gridlines you do not need.
3. Use one highlight colour for the point you want noticed and grey for the rest.
4. Label units: "lakh tonnes" on the axis title.

## Quick reference
- Compare items: bar / column
- Change over time: line
- Share of one total (few items): pie or, safer, a 100% stacked bar
- Two measures at once (production and growth %): combo chart with a secondary axis

## Practice
Build three charts on your workbook: a sorted column chart for 2023, a line chart for 2019 to 2023, and a pie for 2023 shares. Write a one-line insight title for each.`,
          },
          {
            title: "Data cleaning and data validation for real office sheets",
            type: "ARTICLE",
            durationMinutes: 11,
            content: `> **Exam link:** SSC CHSL's DEST and the CGL skill test reward error-free entry; in a job, cleaning and validation are how you keep thousands of rows error-free.

## Why cleaning comes first
In exam DI the table is always perfect. In office data, it never is. A distributor's sheet will have "prayagraj", "Prayagraj " and "PRAYAGRAJ" as three different cities, so your pivot shows three rows and your VLOOKUP returns #N/A. Cleaning is usually 60% of an MIS executive's time.

> Always keep the original sheet untouched. Copy it to a sheet called "Clean" and work there.

## TRIM and PROPER
\`TRIM\` removes extra spaces at the start, end and between words. \`PROPER\` makes the first letter of each word capital.

\`\`\`text
=TRIM(A2)            "  Prayagraj  "  -> "Prayagraj"
=PROPER(A2)          "uttar PRADESH"  -> "Uttar Pradesh"
=PROPER(TRIM(A2))    both in one go
=UPPER(B2)           for codes like PAN or vehicle numbers
\`\`\`

After the helper column is right, copy it and use **Paste Special > Values** over the original column, then delete the helper.

## Remove Duplicates
**Data > Remove Duplicates**, then tick only the columns that define a true duplicate (for example, Invoice No). If you tick every column, near-duplicates survive; if you tick only Name, you may delete two different people called "Rahul Verma". Note how many rows were removed in a Notes sheet.

## Text to Columns
When one column holds "Kanpur - Uttar Pradesh" or "Verma, Rahul", select it and use **Data > Text to Columns > Delimited**, pick the separator (comma, hyphen, space) and split it into two columns. It also fixes dates stored as text: choose **Date: DMY** in the last step.

## Flash Fill
Type the result you want for one or two rows, then press **Ctrl+E**. Excel copies the pattern. Example: column A has "ravi.kumar@gmail.com"; type "Ravi Kumar" in B2, press Ctrl+E, and the rest fill in. Always spot-check 10 rows, since Flash Fill guesses.

## Data validation: stop errors at entry
Cleaning fixes old mistakes; validation prevents new ones. Select the input column, then **Data > Data Validation**:
- **List**: a dropdown of allowed values, for example Source = \`Prayagraj,Varanasi,Kanpur,Lucknow\`.
- **Whole number** between 1 and 10000 for quantity.
- **Date** between 01-04-2026 and 31-03-2027 for the financial year.
- **Text length** equal to 10 for mobile numbers.

Fill in the **Error Alert** tab with a clear message such as "Enter a 10-digit mobile number". Use **Circle Invalid Data** to highlight wrong entries that existed before you added the rule.

## A 6-step cleaning routine
1. Copy raw data to a Clean sheet.
2. TRIM and PROPER text columns.
3. Split combined columns with Text to Columns.
4. Fix number and date types.
5. Remove true duplicates.
6. Add validation to columns that people will keep typing into.

## Practice
Take a messy list of 30 names, cities and mobile numbers (make one with typos and spaces), clean it with this routine and add validation to the City and Mobile columns.`,
          },
          {
            title: "Module 3 quiz: pivots, charts and cleaning",
            type: "QUIZ",
            durationMinutes: 6,
            content: `> **Exam link:** Like a DI set that tests chart reading, these questions test whether you can choose the right tool and chart for an office question.

Five questions on pivot tables, chart choice and data cleaning. Think about what a manager would actually need.`,
            quiz: {
              questions: [
                {
                  prompt: "Your raw data has columns State, Year and Production. You want each state's share of total 5-year production. What is the quickest way?",
                  options: [
                    "Make a pie chart for every year",
                    "Pivot with State in Rows, Production in Values, then Show Values As % of Grand Total",
                    "Use VLOOKUP for each state",
                    "Sort the data by Production",
                  ],
                  correct: 1,
                  explanation: "A pivot totals production by state, and % of Grand Total converts those totals to shares in one step.",
                },
                {
                  prompt: "A manager asks how Punjab's production moved from 2019 to 2023. Which chart fits best?",
                  options: ["Pie chart", "Line chart", "Doughnut chart", "100% stacked bar"],
                  correct: 1,
                  explanation: "Change over time is best shown with a line chart, where the 2022 dip stands out.",
                },
                {
                  prompt: "Your VLOOKUP for \"Varanasi\" returns #N/A, though Varanasi is clearly in the list. What is the most likely cause?",
                  options: [
                    "VLOOKUP cannot find text",
                    "The column number is too small",
                    "There is an extra space in one of the entries, fixable with TRIM",
                    "The sheet needs to be saved first",
                  ],
                  correct: 2,
                  explanation: "Hidden leading or trailing spaces make \"Varanasi \" different from \"Varanasi\"; TRIM removes them.",
                },
                {
                  prompt: "When should you avoid a pie chart?",
                  options: [
                    "When showing shares of one year's total across 4 states",
                    "When comparing the same categories across several years",
                    "When the slices add up to 100%",
                    "When there are only 3 categories",
                  ],
                  correct: 1,
                  explanation: "Side-by-side pies are hard to compare; a clustered column chart shows changes across years clearly.",
                },
                {
                  prompt: "You added 50 new rows to your source Table but the pivot still shows old totals. What should you do?",
                  options: ["Rebuild the pivot from scratch", "Right-click the pivot and choose Refresh", "Press Ctrl+E", "Use Remove Duplicates"],
                  correct: 1,
                  explanation: "Pivots do not update automatically; Refresh pulls in changes, and a Table source includes the new rows.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "MIS Reports and Getting Hired",
        lessons: [
          {
            title: "Conditional formatting, SUMIFS and COUNTIFS",
            type: "VIDEO",
            durationMinutes: 11,
            content: `> **Exam link:** Caselet DI in IBPS PO asks "total sales of product A in the North region"; SUMIFS answers exactly that, with any number of conditions.

## Key points
- SUMIFS adds numbers that meet one or more conditions, such as sales of one product in one city in one month.
- COUNTIFS counts rows that meet conditions, such as the number of orders above ₹10,000 from Varanasi.
- In SUMIFS the sum range comes first, then pairs of criteria range and criteria.
- Conditional formatting colours cells by rule, so a manager sees problems without reading every number.
- Use colour sparingly: one rule for "bad", one for "good" is usually enough.

## Transcript
Chalo, today we move from DI data to real business data. Imagine a sales sheet from a distributor: columns Date, City, Product, Salesperson and Amount, with about 2,000 rows for one month. Your manager asks, "How much Atta did we sell in Prayagraj?" Nobody filters and adds by hand. You write SUMIFS.

\`\`\`text
=SUMIFS(E:E, B:B, "Prayagraj", C:C, "Atta")
\`\`\`

The first argument, E:E, is what you add, the Amount. Then come pairs: the City column must equal Prayagraj, and the Product column must equal Atta. You can add more pairs, like a date range.

Better still, do not type "Prayagraj" inside the formula. Make a small grid with cities down column H and products across row 1, and write one formula you can drag:

\`\`\`text
=SUMIFS($E:$E, $B:$B, $H2, $C:$C, I$1)
\`\`\`

Dekho the mixed references. $H2 locks the column so the city stays in H, I$1 locks the row so the product stays in the header row. One formula fills the whole grid. This is exactly the skill from Module 1, now earning money.

COUNTIFS works the same way but counts rows. How many orders above ten thousand came from Varanasi?

\`\`\`text
=COUNTIFS(B:B, "Varanasi", E:E, ">10000")
\`\`\`

Now conditional formatting. Select your grid, go to Home, Conditional Formatting. Try Color Scales to shade high values green and low values red. Or use Highlight Cells Rules, Less Than, and type the target, say 50,000, to turn underperforming cells light red. For a growth column, use Icon Sets so arrows show up and down.

One rule I give every student: if everything is coloured, nothing stands out. Your manager should open the report and see the two red cells in three seconds.

Practise these on any data you have. In the next lesson we put SUMIFS, pivots, charts and formatting together into a real monthly MIS report.`,
          },
          {
            title: "Building a monthly MIS report managers actually read",
            type: "ARTICLE",
            durationMinutes: 12,
            content: `> **Exam link:** Descriptive papers like SBI PO Mains and state PSC Mains trained you to write a precise summary; an MIS report is the same skill, with numbers on top.

## What MIS really means
MIS stands for **Management Information System**. In most Indian companies, an MIS executive's core job is simple: collect data from sales, stock, attendance or collections, and send a clear report to managers every day, week or month. A good MIS report helps a manager decide something in five minutes.

## What managers expect to receive
A typical monthly MIS for a distributor or a coaching institute has:
1. **Headline numbers (KPIs):** total sales, number of orders, collections, outstanding payments, versus target and versus last month.
2. **Breakdown:** by region or branch, by product or course, by salesperson or counsellor.
3. **Trend:** this month against the last 3 to 6 months.
4. **Exceptions:** what went wrong (a branch 20% below target, a product with zero sales, payments overdue by 60 days).
5. **Three lines of commentary** in plain language.

## Sheet structure that works
- **Raw**: data pasted from Tally, the CRM or a Google Form. Never edit it by hand.
- **Clean**: the cleaned Table, with helper columns like Month (\`=TEXT(A2,"mmm-yy")\`).
- **Calc**: SUMIFS grids and pivot tables.
- **Dashboard**: the one page the manager sees.

## Key formulas for the KPI block
\`\`\`text
Total sales (this month):   =SUMIFS(Clean!F:F, Clean!B:B, "Sep-26")
Vs target %:                =C4/C5
Growth vs last month:       =(C4-D4)/D4
Orders count:               =COUNTIFS(Clean!B:B, "Sep-26")
Average order value:        =C4/C7
Outstanding > 60 days:      =SUMIFS(Clean!H:H, Clean!I:I, ">60")
\`\`\`

## The dashboard page
- Top row: 4 to 6 KPI boxes with big numbers and a small "vs last month" line.
- Middle: one column chart (sales by region versus target) and one line chart (6-month trend).
- Bottom: a small table of exceptions with conditional formatting.
- Fit it on one A4 page in landscape: **Page Layout > Size: A4, Orientation: Landscape, Fit to 1 page**.

## Writing the commentary
Write three sentences, each with a number and a reason:
- "September sales were ₹18.4 lakh, 6% above August, led by Atta in Prayagraj."
- "Varanasi branch is 22% below target for the second month; two retailers stopped ordering."
- "Overdue payments above 60 days rose to ₹2.1 lakh; recommend follow-up with 5 retailers listed below."

> **Tip:** Answer-writing practice from your Mains or descriptive paper helps here more than you think. Short, factual, structured.

## Sending it
Most managers receive MIS as an Excel attachment or PDF on email, and often a screenshot on WhatsApp. Save a PDF of the Dashboard sheet, name files clearly (\`MIS_Sales_Sep-26.xlsx\`), and send at the same time every month. Consistency builds trust fast.`,
          },
          {
            title: "Interview prep for MIS, data entry and back-office roles",
            type: "ARTICLE",
            durationMinutes: 10,
            content: `> **Exam link:** You have already cleared typing tests and interviews in your head a hundred times for SSC CHSL and bank exams; private-sector hiring uses the same discipline, just faster.

## Where to find these jobs
Search **Naukri, Apna, Indeed, LinkedIn and WorkIndia** for: "MIS Executive", "Data Entry Operator", "Back Office Executive", "Operations Associate", "Excel Executive". Big employers include distributors, NBFCs, insurance back offices, logistics firms, hospitals and coaching institutes, and many have offices in Lucknow, Jaipur, Indore, Patna and Noida. Typical fresher pay is ₹1.8–3 LPA for data entry and ₹2.4–4.5 LPA for MIS roles.

## Round 1: Typing test
Most data-entry and back-office roles test **English typing speed of 30–35 WPM with 95%+ accuracy**; some also test Hindi typing (Mangal / Kruti Dev). Keep practising on the same sites you used for CHSL DEST. Accuracy beats speed: one wrong digit in an invoice amount costs more than a slow entry.

## Round 2: Excel test
Usually 20 to 45 minutes on a company laptop. Expect:
- Clean a list (TRIM, PROPER, Remove Duplicates).
- VLOOKUP or XLOOKUP from a second sheet.
- SUMIFS or COUNTIFS by region and product.
- A pivot table with a filter, sometimes a chart.
- Basic formatting and conditional formatting.

Practise by setting a 30-minute timer on your Module 2 and Module 4 assignments, exactly like a mock test.

## Round 3: HR and manager interview
Common questions and how to approach them:
- **"What is the difference between VLOOKUP and XLOOKUP?"** XLOOKUP looks in any direction, does not need a column number and has a built-in not-found value.
- **"What is a pivot table used for?"** Summarising large data by categories without formulas, for example sales by region and month.
- **"How do you check your work?"** Cross-totals, spot-checking rows, and comparing with the previous report.

## How to talk about your prep years
Do not hide them or apologise for them. Frame them honestly and confidently:

> "For three years I prepared for SSC CGL. That trained me in quantitative aptitude, data interpretation and working to a strict daily schedule. Alongside, I learned Excel and built an MIS report project. I am now looking for an MIS role where I can use these skills every day."

Then show your portfolio link. Your preparation counts: speed with numbers, accuracy, patience with repetitive work and self-discipline are exactly what back-office managers struggle to find.

## Your resume, in short
- One page. Title: "MIS / Excel Executive".
- Skills: Excel (XLOOKUP, SUMIFS, Pivot Tables, Charts, Data Validation), typing speed with accuracy, Hindi and English.
- Projects: your two assignments from this course, with links.
- Education, then a line like "Competitive exam preparation (SSC CGL), 2022–2025: quantitative aptitude, reasoning, DI".

## Final checklist before applying
1. Typing test practice: 15 minutes a day for two weeks.
2. Both assignment workbooks shared via Drive links.
3. Resume as PDF named \`Firstname_Lastname_MIS.pdf\`.
4. Apply to 5 roles a day for two weeks rather than 50 in one day.`,
          },
          {
            title: "Final assignment: monthly MIS report for a Prayagraj distributor",
            type: "ASSIGNMENT",
            durationMinutes: 90,
            content: `> **Exam link:** Like a full DI caselet in IBPS Mains, you take raw data, compute what matters and present clear answers, but this time for a manager, not an answer sheet.

This is the project that gets you shortlisted. A one-page MIS dashboard with clean data, correct formulas and three sharp lines of commentary is exactly what an interviewer wants to see when you say "I know Excel".`,
            assignment: {
              brief: `## The scenario
**Sangam Foods Distributors**, Prayagraj, supplies atta, rice, mustard oil, sugar and pulses to about 60 retailers across Prayagraj, Kaushambi, Pratapgarh and Mirzapur through 4 salespersons. The owner, Mr. Awasthi, wants a monthly MIS report for September 2026.

## Your data
Create a realistic sheet yourself (or use the sample in the resources tab) with at least **150 rows** and columns: Date, Invoice No, Retailer, Area, Product, Salesperson, Quantity, Rate, Amount, Payment Status (Paid / Pending) and Days Outstanding. Include a few messy entries on purpose (extra spaces, a duplicate invoice, mixed-case area names). Add a small **Targets** sheet with a September target per area.

## Steps
1. **Raw and Clean sheets:** keep the raw data untouched; clean it with TRIM/PROPER, Remove Duplicates and correct number types. Add data validation to Area, Product and Payment Status.
2. **Calc sheet:** SUMIFS grid of sales by Area and Product; COUNTIFS of invoices per salesperson; outstanding amount over 30 and 60 days.
3. **Pivot table** of sales by Salesperson and Product, with a filter on Area.
4. **Dashboard sheet** on one A4 landscape page:
   - KPI boxes: total sales, orders, average invoice value, achievement vs target %, pending payments.
   - A column chart of area sales vs target and one more chart you choose (justify the choice in a note).
   - An exceptions table with conditional formatting (areas below 90% of target, invoices pending over 60 days).
5. **Commentary:** three sentences with numbers and one recommendation each.

## Deliverable
Upload the workbook to Google Drive or OneDrive with view access and submit the link. Also add a PDF of the Dashboard sheet in the same folder.

## Tips
- You may instead build it for a fictional Prayagraj coaching institute (fee collections by batch and counsellor) if that feels more familiar; the same steps apply.
- Check that your KPI totals match the pivot's Grand Total. If they do not, find out why before submitting.
- Keep colours minimal: one highlight colour and grey.`,
              rubric: [
                { criterion: "Data cleaned correctly, with validation on key input columns", points: 20 },
                { criterion: "SUMIFS/COUNTIFS, pivot and KPI formulas are correct and consistent with each other", points: 30 },
                { criterion: "Dashboard fits one page, charts are well chosen and conditional formatting highlights exceptions", points: 25 },
                { criterion: "Commentary is specific, numeric and actionable for the owner", points: 15 },
                { criterion: "Workbook structure (Raw, Clean, Calc, Dashboard) and naming are professional", points: 10 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
    ],
  },
  {
    slug: "excel-data-entry-essentials",
    title: "Data Entry Essentials: Excel and Google Sheets",
    subtitle: "Fast, accurate data entry skills for your first back-office job",
    description:
      "A free, practical starter for aspirants who want a quick backup skill: type data fast and accurately, use the keyboard shortcuts offices expect, stop errors with data validation, and work confidently in Google Sheets. Arvind Krishnan, a freelance BI consultant who has coached many ex-aspirants, keeps every lesson short enough to finish after your daily mock analysis.",
    level: "BEGINNER",
    languages: ["hi", "en", "hinglish"],
    cover: { from: "#9A3412", to: "#B45309", pattern: "dots" },
    mentorId: "m_4",
    priceINR: 0,
    rating: 4.7,
    ratingsCount: 642,
    studentsCount: 5210,
    createdDaysAgo: 58,
    skills: ["Data Entry", "Keyboard Shortcuts", "Data Validation", "Google Sheets", "Sheet Protection"],
    whatYouBuild: [
      "A validated data-entry form sheet that rejects wrong inputs",
      "A shared Google Sheet with protected ranges and view-only access",
      "A cleaned 50-row customer list ready for an office database",
    ],
    requirements: [
      "Any computer with Excel or a free Google account for Google Sheets",
      "Basic typing practice; no other experience needed",
    ],
    modules: [
      {
        title: "Speed and Accuracy",
        lessons: [
          {
            title: "Fast and accurate data entry: the office standard",
            type: "VIDEO",
            durationMinutes: 7,
            isPreview: true,
            content: `> **Exam link:** SSC CHSL's DEST asks for 8,000 key depressions per hour; office data entry needs similar speed, but with accuracy checked on every row.

## Key points
- Most data-entry roles expect 30–35 WPM in English with 95% or higher accuracy.
- Accuracy matters more than speed, because one wrong digit in an amount or mobile number creates real losses.
- Use the numeric keypad for numbers and Enter/Tab to move between cells instead of the mouse.
- Check your work in batches of 20 rows rather than at the end of the day.

## Transcript
Namaste, I am Arvind. If you prepared for SSC CHSL, you already know the DEST typing test. Good news: that practice is directly useful in data-entry and back-office jobs, where freshers typically start at ₹1.5–2.5 lakh per year and grow into MIS roles.

In an office, you will enter invoices, customer forms, attendance or stock counts. The rule is simple: right first time. So learn three habits. First, use the numeric keypad on the right side of the keyboard for numbers, with your right hand only. Second, type a value and press Tab to move right, Enter to go to the next row. Excel remembers where you started, so Enter brings you back to the first column of the next row. Third, never look at the keyboard; look at the source paper and the screen.

After every 20 rows, pause and compare totals. If the bill total on paper is ₹48,250 and your column sum is different, you find the mistake in 20 rows, not 500. Chalo, practise 15 minutes a day for two weeks and track your WPM.`,
          },
          {
            title: "Keyboard shortcuts every office expects",
            type: "ARTICLE",
            durationMinutes: 6,
            isPreview: true,
            content: `> **Exam link:** Like shortcut tricks in quantitative aptitude, keyboard shortcuts save seconds on every action, and those seconds add up across a 500-row sheet.

## Moving around
- \`Ctrl + Arrow\`: jump to the last filled cell in that direction.
- \`Ctrl + Home\` / \`Ctrl + End\`: go to A1 / the last used cell.
- \`Ctrl + Shift + Arrow\`: select till the end of the data.
- \`Ctrl + G\`: go to a specific cell like \`D250\`.

## Entering faster
- \`Ctrl + D\`: copy the cell above into the selected cells (fill down).
- \`Ctrl + ;\`: insert today's date.
- \`Alt + Enter\`: new line inside the same cell (useful for addresses).
- \`Ctrl + Enter\`: type one value into all selected cells at once.
- \`F2\`: edit a cell without retyping it.

## Fixing and finding
- \`Ctrl + Z\` / \`Ctrl + Y\`: undo / redo.
- \`Ctrl + F\` / \`Ctrl + H\`: find / find and replace (for example "Allahabad" to "Prayagraj").
- \`Ctrl + Shift + L\`: turn filters on or off.
- \`Ctrl + S\`: save. Do it every 10 minutes, power cuts are real.

> **Tip:** Learn five shortcuts a week and stop using the mouse for them. In two weeks your entry speed improves noticeably.`,
          },
          {
            title: "Quick quiz: speed, accuracy and shortcuts",
            type: "QUIZ",
            durationMinutes: 4,
            content: `> **Exam link:** Short and sharp, like a CHSL sectional test, these three questions check the habits from this module.

Three questions to lock in the basics before we move to validation.`,
            quiz: {
              questions: [
                {
                  prompt: "You want to copy the value in A2 into A3 to A50 quickly. Which shortcut helps after selecting A2:A50?",
                  options: ["Ctrl + E", "Ctrl + D", "Ctrl + L", "Alt + Enter"],
                  correct: 1,
                  explanation: "Ctrl + D fills the selected cells down with the value from the top cell.",
                },
                {
                  prompt: "Why should you compare totals after every 20 rows?",
                  options: [
                    "Excel requires it to save",
                    "It finds mistakes within a small batch instead of hundreds of rows",
                    "It increases typing speed",
                    "It removes duplicates automatically",
                  ],
                  correct: 1,
                  explanation: "Batch checks narrow down where an error is, so fixing it takes seconds.",
                },
                {
                  prompt: "You need to replace every \"Allahabad\" with \"Prayagraj\" in a sheet. What do you use?",
                  options: ["Ctrl + F", "Ctrl + G", "Ctrl + H", "Ctrl + Shift + L"],
                  correct: 2,
                  explanation: "Ctrl + H opens Find and Replace, which changes all matches at once.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Validation and Google Sheets",
        lessons: [
          {
            title: "Data validation: make wrong entries impossible",
            type: "ARTICLE",
            durationMinutes: 7,
            content: `> **Exam link:** OMR sheets only accept one bubble per question; data validation gives your Excel sheet the same strictness for every input cell.

## What it does
Data validation restricts what can be typed in a cell. Select the cells, then **Data > Data Validation** (Excel) or **Data > Data validation** (Google Sheets).

## Rules you will use most
- **List** for fixed choices: Gender, City, Payment Mode (\`Cash,UPI,Cheque\`). Users pick from a dropdown, so spelling is always the same.
- **Whole number** between 1 and 999 for quantity.
- **Date** within the current month for invoice dates.
- **Text length = 10** for mobile numbers, and **= 6** for PIN codes.
- **Custom formula** for things like "no duplicate invoice numbers":

\`\`\`text
=COUNTIF($B:$B,B2)=1
\`\`\`

## Messages that help
Use the **Input Message** tab to show a hint ("Enter 10-digit mobile, no +91") and the **Error Alert** tab to block wrong values with a clear message. A good message saves you from answering the same doubt from five colleagues.

> **Tip:** Build validation before anyone starts typing. Fixing 2,000 messy rows later takes days; preventing them takes five minutes.`,
          },
          {
            title: "Google Sheets basics for office work",
            type: "VIDEO",
            durationMinutes: 8,
            content: `> **Exam link:** Many coaching institutes share test-series results on Google Sheets; now you will be the one building and managing those sheets.

## Key points
- Google Sheets is free, runs in the browser and saves automatically, which is why many small offices use it.
- Most Excel formulas like SUM, AVERAGE, VLOOKUP, XLOOKUP and COUNTIF work the same way.
- Several people can type in one sheet at the same time, and Version History shows who changed what.
- Google Forms can feed entries directly into a Sheet, which reduces manual typing.

## Transcript
Chalo, open sheets.google.com with your Gmail account and click Blank. It looks almost like Excel, and that is intentional. Type a small list: Name, City, Mobile, Fees Paid. Write =SUM in the fees column and you will see it works exactly as in Excel.

Three things make Google Sheets special for office work. First, auto-save. There is no Save button; every change is saved to Drive. Second, collaboration. Your manager in Lucknow and you in Prayagraj can both work in the same sheet, and you will see their cursor moving. Third, Version History. Go to File, Version history, and you can see every change with name and time, and restore an old version if someone deletes data by mistake.

One more useful habit: Freeze the header row with View, Freeze, 1 row, so column names stay visible while you scroll through hundreds of entries. And if your office collects data from people, create a Google Form; responses arrive in a Sheet automatically, without typing.`,
          },
          {
            title: "Quick quiz: validation and Google Sheets",
            type: "QUIZ",
            durationMinutes: 4,
            content: `> **Exam link:** Three quick questions, like a mini sectional, to check you can apply validation and Sheets features in an office situation.

Answer these three before we move to sharing and the final task.`,
            quiz: {
              questions: [
                {
                  prompt: "Your team keeps typing city names in different spellings. What is the best fix going forward?",
                  options: ["Ask them to type carefully", "A List validation dropdown of allowed cities", "Use bold font for the City column", "Sort the column every day"],
                  correct: 1,
                  explanation: "A dropdown list makes every entry identical, which keeps lookups and pivots accurate.",
                },
                {
                  prompt: "A colleague deleted 40 rows in a Google Sheet yesterday. How do you recover them?",
                  options: ["Press Ctrl + S", "Re-type from memory", "Restore from File > Version history", "Download as PDF"],
                  correct: 2,
                  explanation: "Version history keeps earlier versions with names and times, so you can restore the data.",
                },
                {
                  prompt: "Which validation rule fits a mobile number column best?",
                  options: ["Whole number between 1 and 10", "Text length equal to 10", "Date within this month", "List of Yes,No"],
                  correct: 1,
                  explanation: "Indian mobile numbers have exactly 10 digits, so a text length of 10 blocks short or long entries.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Share, Protect and Deliver",
        lessons: [
          {
            title: "Sharing and protecting sheets safely",
            type: "ARTICLE",
            durationMinutes: 6,
            content: `> **Exam link:** Just as exam centres control who can access question papers, offices control who can view or edit sensitive data like fees, salaries and phone numbers.

## Sharing in Google Sheets
Click **Share** and choose access carefully:
- **Viewer**: can only see. Use for managers who need to read reports.
- **Commenter**: can add comments but not change data.
- **Editor**: can change everything. Give it only to people who enter data.

Avoid "Anyone with the link can edit" for office data. Customer mobile numbers and fee details are personal data and must be handled carefully.

## Protecting ranges
In Google Sheets: **Data > Protect sheets and ranges**, select the formula columns or the header row and allow only yourself to edit. In Excel: unlock input cells (**Format Cells > Protection > untick Locked**), then **Review > Protect Sheet** with a password. Now people can type in input cells but cannot break your formulas.

## Simple safety habits
- Keep a dated backup copy before big changes (\`Fees_Backup_16-10-2026\`).
- Hide helper columns instead of deleting them.
- Never share passwords on WhatsApp groups.

> **Tip:** Protect formulas on day one. The most common office complaint is "someone typed over the total".`,
          },
          {
            title: "Cleaning a messy list before it goes into the system",
            type: "VIDEO",
            durationMinutes: 7,
            content: `> **Exam link:** Checking answer options for silly errors in a mock is the same mindset as checking a list for spaces, wrong cases and duplicates before submitting it.

## Key points
- TRIM removes extra spaces and PROPER fixes capitalisation in names and cities.
- Remove Duplicates should use the column that truly identifies a record, like mobile number.
- Paste Special > Values turns your cleaned helper column into plain text before deleting the original.
- Always keep the raw data on a separate sheet.

## Transcript
Dekho, most data-entry work is not only typing; it is also cleaning lists that other people typed. Let us take a coaching institute's enquiry list: names like "  rahul VERMA", cities like "varanasi " and the same student entered twice.

Make a copy of the sheet first, and call it Clean. In a helper column write =PROPER(TRIM(A2)) and drag down. "  rahul VERMA" becomes "Rahul Verma". Do the same for city. Now copy the helper column, and use Paste Special, Values on the original column, then delete the helper.

Next, Data, Remove Duplicates, and tick only the Mobile column, because two different students can have the same name but not the same mobile number. Excel tells you how many duplicates it removed; note that number.

Finally, sort by City and scan once. Small checks like this make your list trustworthy, and trust is what gets you promoted from data entry to MIS.`,
          },
          {
            title: "Assignment: clean and validate a 50-row enquiry list",
            type: "ASSIGNMENT",
            durationMinutes: 40,
            content: `> **Exam link:** Like a CHSL skill test, this task checks speed with accuracy, but on a real office-style list instead of a passage.

A short, real task that shows an employer you can enter, clean and protect data properly. Add it to your resume as a mini project.`,
            assignment: {
              brief: `## The task
**Disha Coaching Centre, Patna** has a messy enquiry list. Create it yourself with **50 rows** and columns: Name, Mobile, City, Course (SSC, Banking, Railway), Enquiry Date, Fees Quoted. Include at least 8 errors on purpose: extra spaces, mixed-case names, 3 duplicate students, one 9-digit mobile number.

## Steps
1. Keep a **Raw** sheet; do all work in a **Clean** sheet.
2. Fix names and cities with \`TRIM\` and \`PROPER\`, then remove duplicates using the Mobile column.
3. Add validation: Course as a dropdown list, Mobile as text length 10, Enquiry Date within 2026.
4. Use **Circle Invalid Data** (Excel) or the red marker (Sheets) to find and fix the wrong mobile.
5. Protect the header row and share the sheet as **Viewer**.
6. In a **Notes** sheet, list every change you made with row counts.

## Deliverable
Submit the Google Sheets or OneDrive view link.`,
              rubric: [
                { criterion: "Names, cities and duplicates cleaned correctly", points: 40 },
                { criterion: "Validation rules set up correctly on Course, Mobile and Date", points: 30 },
                { criterion: "Sheet protected, shared as view-only, with a clear Notes sheet", points: 30 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
    ],
  },
];
