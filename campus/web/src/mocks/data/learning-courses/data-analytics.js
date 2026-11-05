/** Data Analytics courses — seed content for the Campus demo. */
export default [
  {
    slug: "excel-sql-analytics",
    title: "Data Analytics with Excel & SQL",
    subtitle: "Turn messy sales exports into clear answers clients will pay for",
    description:
      "Learn the two tools every analyst job and freelance gig still runs on: Excel and SQL. You will clean a real-looking kirana and D2C sales dataset, summarise it with XLOOKUP, SUMIFS and pivot tables, then answer sharper questions with SQL joins and GROUP BY. We finish by turning numbers into a one-page insight report a small business owner actually reads.",
    level: "BEGINNER",
    languages: ["en", "ta", "te"],
    cover: { from: "#0F766E", to: "#2563EB", pattern: "grid" },
    mentorId: "m_4",
    priceINR: 999,
    rating: 4.8,
    ratingsCount: 2146,
    studentsCount: 14830,
    createdDaysAgo: 164,
    skills: ["Excel", "Data Cleaning", "XLOOKUP & SUMIFS", "Pivot Tables", "SQL", "SQL JOINs", "Insight Reporting"],
    whatYouBuild: [
      "A cleaned, analysis-ready version of a 3-month kirana store sales sheet",
      "A pivot-table summary of a D2C brand's orders by city, channel and product",
      "A set of SQL queries answering repeat-customer and top-product questions",
      "A one-page insight report for a Coimbatore D2C snack brand, ready to send on WhatsApp or email",
    ],
    requirements: [
      "A laptop with Microsoft Excel 2021/365 or free Excel for the web (XLOOKUP needs one of these)",
      "No coding experience needed; we use a free online SQL editor",
      "Comfort with basic school maths: percentages and averages",
    ],
    modules: [
      {
        title: "Excel Foundations: Cleaning and Core Formulas",
        lessons: [
          {
            title: "What analysts actually do for small businesses",
            type: "VIDEO",
            durationMinutes: 8,
            isPreview: true,
            content: `## Key points
- Most small-business clients do not need machine learning; they need clean numbers and three clear answers.
- A typical freelance analytics gig starts with a messy export from Tally, Shopify, Dukaan or a Google Sheet.
- Your value is in asking the right business question before touching a single formula.
- Excel handles cleaning and quick summaries, while SQL scales the same thinking to lakhs of rows.
- Every analysis in this course ends with a recommendation the owner can act on this week.

## Transcript
Vanakkam, hello everyone, I am Arvind. Before I went freelance, I spent years at Mu Sigma building analyses for large companies. But honestly, some of my most satisfying projects since then have been for small businesses: a kirana chain in Madurai, a D2C coffee brand in Bengaluru, a saree store in Hyderabad that sells on Instagram.

Let me tell you what these clients actually send me. It is usually an Excel file exported from Tally or Shopify, or a Google Sheet that three different people have typed into. Dates are in four formats. "Chennai" is also written as "chennai " with a trailing space and "Madras". Some prices have the rupee symbol typed in, so Excel treats them as text. And the owner's question is simple: "Which products are actually making me money?"

So dekho, the job is not fancy. The job is to take that mess, make it trustworthy, and answer the question clearly. That is exactly what this course trains you to do.

In the first two modules we live inside Excel. You will learn to clean data properly, use XLOOKUP to bring in product categories, use SUMIFS to total sales by any condition, and build pivot tables that summarise a whole month in seconds. Then in module three we move to SQL, because when a D2C brand has two lakh orders, Excel starts crying. SQL lets you ask the same questions, faster and repeatably.

Finally, we learn the part most courses skip: presenting. A client paying you ₹8,000 for an analysis does not want forty charts. They want three findings and what to do next.

One tip before we start: keep a notebook of every business question you hear. That list becomes your portfolio later. Chalo, let us open our first messy file.`,
          },
          {
            title: "Cleaning messy sales data in Excel",
            type: "ARTICLE",
            durationMinutes: 10,
            isPreview: true,
            content: `## Why cleaning comes first

If your data is wrong, every chart built on it is wrong too. Analysts spend a large share of their time cleaning, and clients rarely see it, but it is what makes your numbers trustworthy. Here is the checklist I run on every new sales file.

## Step 1: Make it a proper table

Select your data and press **Ctrl + T** to convert it into an Excel Table. Tables auto-expand when new rows are added, give each column a name, and make formulas easier to read, for example \`=[@Qty]*[@Price]\` instead of \`=C2*D2\`.

Rules for a clean table:
- **One header row**, no merged cells, no blank rows in between.
- **One fact per column**: do not put "Rice 5kg - ₹420" in one cell; split product, pack size and price.
- **One row per transaction**, never subtotal rows mixed into the data.

## Step 2: Fix text problems

- \`TRIM\` removes extra spaces: \`=TRIM(B2)\` turns "Chennai " into "Chennai".
- \`PROPER\` fixes casing: \`=PROPER(TRIM(B2))\` turns "cHENNAI" into "Chennai".
- Use **Find & Replace (Ctrl + H)** to standardise spellings, for example replace "Madras" with "Chennai" and "Bangalore" with "Bengaluru".

> Tip: never overwrite the raw data. Keep the original sheet untouched and do your cleaning in a copy or in helper columns. Clients will ask "where did this number come from?" and you need the trail.

## Step 3: Fix numbers stored as text

If prices were typed as "₹420" or "420 ", Excel sees text and \`SUM\` ignores them. Fix it with:

\`\`\`text
=VALUE(SUBSTITUTE(TRIM(D2),"₹",""))
\`\`\`

A quick check: numbers align right by default, text aligns left. If a "price" column is left-aligned, investigate.

## Step 4: Fix dates

Dates from different systems arrive as "03/04/2025", "2025-04-03" and "3 Apr". Use **Data → Text to Columns → Date (DMY)** to convert Indian-style day-first dates. Then add helper columns:
- \`=TEXT([@Date],"mmm-yyyy")\` for month labels
- \`=TEXT([@Date],"ddd")\` for weekday, useful for spotting weekend sales spikes

## Step 5: Remove duplicates carefully

**Data → Remove Duplicates** is powerful but dangerous. Two rows with the same customer and amount might be two genuine purchases. Only dedupe on a true unique key like **Order ID**.

## Step 6: Flag, do not delete, suspicious rows

Add a column \`Check\` with a formula like \`=IF(OR([@Qty]<=0,[@Price]=0),"Review","OK")\` and filter on it. Then ask the client about those rows instead of silently dropping them.

### Your cleaning log

Keep a small sheet called **Notes** listing every change: "Standardised 14 city spellings, removed 6 duplicate Order IDs, flagged 3 zero-price rows". This log turns into the first paragraph of your client report and builds a lot of trust.`,
          },
          {
            title: "XLOOKUP, SUMIFS and COUNTIFS on real data",
            type: "VIDEO",
            durationMinutes: 13,
            content: `## Key points
- XLOOKUP replaces VLOOKUP: it looks left or right, defaults to an exact match and lets you set a friendly "not found" value.
- SUMIFS adds up a column only where every condition you give it is true, so one formula can answer "sales of Snacks in Chennai in May".
- COUNTIFS counts rows matching conditions and is perfect for order counts and repeat-customer checks.
- Point your conditions at cells instead of typing them inside the formula so one formula can fill an entire summary grid.
- Use absolute references with $ (or Table column names) so formulas do not break when copied.

## Transcript
Okay, in this lesson we will use the three formulas I use in almost every client file.

First, XLOOKUP. Our kirana sales sheet has a product code in each row, but no category. The category lives in a separate Product Master sheet. So in a new column I write:

\`\`\`text
=XLOOKUP([@ProductCode], Products[Code], Products[Category], "Not found")
\`\`\`

Read it like a sentence: look for this product code in the Code column, and return the matching Category. If it is missing, write "Not found" instead of an ugly #N/A error. Then I filter for "Not found" and send that small list to the client. Usually it is new products they forgot to add to the master. Old VLOOKUP needed column numbers and could only look to the right; XLOOKUP has neither problem.

Next, SUMIFS. The owner asks, "How much Snacks did we sell in May?" I build a small summary grid: categories down the rows, months across the columns. In the first cell:

\`\`\`text
=SUMIFS(Sales[Amount], Sales[Category], $A2, Sales[Month], B$1)
\`\`\`

The first argument is what to add up. Then come pairs: which column to check, and what it should equal. Dekho, notice the dollar signs. $A2 locks the column so the category always comes from column A, and B$1 locks the row so the month always comes from row 1. Now I drag this formula across the whole grid and every cell is correct. One formula, forty answers.

Finally, COUNTIFS works the same way but counts rows. To count how many orders a customer placed, I use \`=COUNTIFS(Sales[Phone], [@Phone])\`. Any customer with a count above one is a repeat customer, and repeat rate is a number every D2C founder cares about.

Practice these three on the sample file before the quiz. Once they feel natural, you are already more useful than most people who list "Advanced Excel" on Naukri.`,
          },
          {
            title: "Quiz: cleaning and core formulas",
            type: "QUIZ",
            durationMinutes: 6,
            content: `Check that you can pick the right cleaning step and formula for common client problems. Think about why each answer works, not just which one it is.`,
            quiz: {
              questions: [
                {
                  prompt: "A price column shows values like \"₹420\" and SUM returns 0. What is the most likely cause?",
                  options: [
                    "The column is formatted as Currency",
                    "The values are stored as text because of the typed rupee symbol",
                    "SUM cannot add values above 100",
                    "The sheet has calculation set to Manual",
                  ],
                  correct: 1,
                  explanation:
                    "Typing the ₹ symbol makes Excel store the value as text, which SUM ignores. Remove the symbol with SUBSTITUTE and convert with VALUE.",
                },
                {
                  prompt: "You need total sales where Category is \"Snacks\" AND City is \"Chennai\". Which formula fits best?",
                  options: [
                    "=SUM(Sales[Amount])",
                    "=COUNTIFS(Sales[Category],\"Snacks\",Sales[City],\"Chennai\")",
                    "=SUMIFS(Sales[Amount],Sales[Category],\"Snacks\",Sales[City],\"Chennai\")",
                    "=XLOOKUP(\"Snacks\",Sales[Category],Sales[Amount])",
                  ],
                  correct: 2,
                  explanation:
                    "SUMIFS adds the Amount column only for rows meeting every condition. COUNTIFS would count orders, and XLOOKUP returns only the first match.",
                },
                {
                  prompt: "When is it safe to use Remove Duplicates on an order sheet?",
                  options: [
                    "When deduplicating on a true unique key such as Order ID",
                    "Whenever two rows have the same customer name",
                    "Whenever two rows have the same amount on the same day",
                    "Always, duplicates are never genuine",
                  ],
                  correct: 0,
                  explanation:
                    "The same customer can genuinely buy the same thing twice. Only an ID that should be unique per transaction proves a row is a duplicate.",
                },
                {
                  prompt: "Why write $A2 and B$1 in a SUMIFS formula you plan to drag across a grid?",
                  options: [
                    "Dollar signs make the result display in currency format",
                    "They lock the category column and the month row so every copied cell reads the correct labels",
                    "They make the formula calculate faster",
                    "They are required for SUMIFS to accept text criteria",
                  ],
                  correct: 1,
                  explanation:
                    "Mixed references keep the label lookups anchored: the column of categories stays fixed for $A2, and the row of months stays fixed for B$1.",
                },
                {
                  prompt: "XLOOKUP returns \"Not found\" for 12 rows. What should a good analyst do?",
                  options: [
                    "Delete those 12 rows so the totals look clean",
                    "Switch to VLOOKUP, which will find them",
                    "Fill in a category based on a guess from the product name",
                    "Filter those rows and confirm the missing product codes with the client",
                  ],
                  correct: 3,
                  explanation:
                    "Missing codes usually mean the product master is out of date. Asking the client keeps the analysis accurate and shows you are careful.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Pivot Tables and Excel Analysis",
        lessons: [
          {
            title: "Pivot tables in 10 minutes",
            type: "VIDEO",
            durationMinutes: 11,
            content: `## Key points
- A pivot table summarises thousands of rows by dragging fields into Rows, Columns, Values and Filters.
- Always build pivots from an Excel Table so new data is picked up with a simple Refresh.
- Change Value Field Settings to switch between Sum, Count and Average, and use "Show Values As % of Grand Total" for share-of-sales questions.
- Group dates by Month or Quarter and add Slicers so clients can click through cities or channels themselves.
- A pivot answers "what happened"; your job is to follow up with "why" and "so what".

## Transcript
Chalo, let us build our first pivot table. I have the cleaned D2C order sheet open: about six thousand rows of orders for a snack brand, with columns for Order Date, City, Channel, Product, Qty and Amount.

Click anywhere inside the Table, go to Insert, then PivotTable, and put it on a new sheet. On the right you see the field list. Think of it like this: Rows is what you want down the side, Columns is across the top, Values is what you want to measure, and Filters narrows everything.

Drag Product into Rows and Amount into Values. Instantly, total sales per product. Now sort it largest to smallest. Already we have a useful finding: in this data the top three products bring in more than half the revenue.

Now drag Channel into Columns. Suddenly you can see that Masala Makhana sells mostly on the website, but Banana Chips sell mostly through Amazon. That is a real business insight; the owner may want to price or promote differently on each channel.

Next, put Order Date into Rows above Product. Excel will offer to group it. Right-click, Group, and choose Months. Now you see monthly trends per product.

Two settings I use constantly. First, right-click the Amount values, choose Show Values As, then % of Grand Total. Owners understand "Makhana is 31% of sales" much faster than a raw rupee number. Second, add a Slicer for City from the PivotTable Analyze tab. Slicers are clickable buttons, and when you share the file, clients love playing with them.

One warning, dekho: when the client sends new data, paste it into the Table, then right-click the pivot and Refresh. If you built the pivot from a fixed range instead of a Table, new rows get ignored silently, and that is how wrong numbers end up in reports.

In the next lesson we will walk through a full kirana month analysis using exactly these moves.`,
          },
          {
            title: "Worked example: analysing a kirana store's quarter",
            type: "ARTICLE",
            durationMinutes: 11,
            content: `## The client and the question

Selvi Stores is a two-branch kirana in Coimbatore. The owner, Mr. Murugan, sent three months of billing exports and asked: **"Sales feel flat. Where should I focus?"** A vague question like this is normal. Your first job is to break it into answerable pieces.

### Turning a vague ask into questions
1. Is revenue actually flat, or is it shifting between branches or categories?
2. Which categories bring the most **margin**, not just revenue?
3. When do customers buy: which days and which hours?
4. Are digital payments (UPI) changing the picture?

## Building the analysis

After cleaning (see the previous module), add helper columns to the Table:
- \`Month\` with \`=TEXT([@BillDate],"mmm")\`
- \`Weekday\` with \`=TEXT([@BillDate],"ddd")\`
- \`Margin\` with \`=[@Amount]-[@Qty]*XLOOKUP([@SKU],Products[SKU],Products[CostPrice])\`

Now build four small pivots, each on its own sheet:

**Pivot 1: Branch by Month (Sum of Amount).** Total revenue barely moved, but Branch 2 grew while Branch 1 fell. "Flat" was hiding two opposite stories.

**Pivot 2: Category (Sum of Amount, Sum of Margin).** Staples like rice and atta are the biggest revenue, but margins are thin. Snacks, beverages and personal care are smaller in revenue yet bring a large share of the margin.

**Pivot 3: Weekday by Hour (Count of Bills).** Evenings between 6 and 9 pm and Sunday mornings are the peaks.

**Pivot 4: Payment Mode by Month.** UPI share is rising month on month.

> Tip: add a calculated field **Margin %** in the pivot (PivotTable Analyze → Fields, Items & Sets → Calculated Field) with \`=Margin/Amount\`. Owners think in margin, not revenue.

## From numbers to recommendations

Analysis is only useful when it changes a decision. For Selvi Stores the story becomes:

- **Branch 1 is losing customers, not prices.** Bill count fell while average bill value held steady. Worth checking for a new competitor or a quick-commerce dark store nearby.
- **Push high-margin categories at peak hours.** Place snacks and beverages near the counter between 6 and 9 pm.
- **Use UPI data for loyalty.** UPI bills often capture a phone number, which makes a WhatsApp Business broadcast list possible for repeat customers.

### What to deliver

Do not send the client your working file with ten sheets. Send a clean **Summary** sheet: three charts, three findings, three actions. Keep the pivots in the file for anyone who wants to dig deeper.`,
          },
          {
            title: "Assignment: clean and summarise a D2C order export",
            type: "ASSIGNMENT",
            durationMinutes: 75,
            content: `This is the most common paid analytics task on Internshala and freelance groups: "here is our export, tell us what is going on". Doing it end to end once gives you a portfolio piece you can show in interviews and client calls.`,
            assignment: {
              brief: `## The task
**Kaapi Kadai**, a Bengaluru D2C filter-coffee brand, has shared a 3-month order export (download the sample from the resources tab). It has inconsistent city names, prices typed as text, duplicate Order IDs and a separate Product Master sheet.

## Steps
1. Keep the raw sheet untouched; copy it to a new sheet and convert it to an Excel Table.
2. Clean city names (TRIM, PROPER, Find & Replace), fix text prices with \`VALUE\` and \`SUBSTITUTE\`, and convert dates.
3. Remove true duplicates on Order ID only. Flag any zero or negative quantity rows in a \`Check\` column.
4. Bring in the product category and cost price with \`XLOOKUP\`.
5. Build a SUMIFS grid of revenue by Category and Month.
6. Build at least two pivot tables: revenue by City and Channel, and monthly trend by Product. Add one Slicer.
7. Write a **Notes** sheet listing every cleaning change, with row counts.

## Deliverable
Upload the workbook to Google Drive or OneDrive and submit the view link. Include a **Summary** sheet with 3 findings written in plain English.

## Tips
- Name your sheets clearly: Raw, Clean, Products, Pivots, Summary, Notes.
- A finding has a number and a "so what", for example: "Mysuru orders doubled in March, mostly via Instagram; worth testing a city-specific offer."`,
              rubric: [
                { criterion: "Data cleaning is correct and documented in the Notes sheet", points: 30 },
                { criterion: "XLOOKUP and SUMIFS used correctly with sensible references", points: 25 },
                { criterion: "Pivot tables are accurate, well grouped and include a Slicer", points: 20 },
                { criterion: "Summary findings are specific, numeric and actionable", points: 25 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
      {
        title: "SQL Fundamentals for Analysts",
        lessons: [
          {
            title: "SELECT, WHERE and ORDER BY",
            type: "VIDEO",
            durationMinutes: 12,
            content: `## Key points
- SQL lets you ask questions of tables with lakhs of rows that would slow Excel down.
- SELECT chooses columns, FROM names the table, WHERE filters rows, and ORDER BY sorts the result.
- Text values go in single quotes, and dates are safest in the 'YYYY-MM-DD' format.
- Use IN for lists, BETWEEN for ranges and LIKE with % for partial text matches.
- Always use LIMIT while exploring a big table so you do not pull everything at once.

## Transcript
Welcome to SQL. If Excel is your calculator, SQL is how you talk to a database. Good news: the core of it reads almost like English.

Imagine our snack brand's orders are in a table called orders, with columns order_id, order_date, customer_id, city, channel and amount. Let us look at a few rows first:

\`\`\`sql
SELECT order_id, order_date, city, amount
FROM orders
LIMIT 10;
\`\`\`

SELECT says which columns, FROM says which table, and LIMIT keeps it small. I always start this way with a new client database, just to see what the data looks like.

Now the owner asks, "Show me big Chennai orders from April." That is a filter, so we use WHERE:

\`\`\`sql
SELECT order_id, order_date, amount
FROM orders
WHERE city = 'Chennai'
  AND order_date BETWEEN '2025-04-01' AND '2025-04-30'
  AND amount >= 1000
ORDER BY amount DESC;
\`\`\`

Dekho, a few things here. Text like 'Chennai' goes in single quotes. Dates are written year-month-day, which avoids all the day-first versus month-first confusion. AND means every condition must be true. ORDER BY amount DESC puts the biggest orders on top.

Two more filters you will use daily. IN checks a list, for example \`WHERE city IN ('Chennai', 'Coimbatore', 'Madurai')\`. And LIKE does partial matches: \`WHERE product_name LIKE '%Makhana%'\` finds every product with Makhana anywhere in the name.

One beginner mistake: writing \`WHERE city = NULL\`. It never works. Missing values need \`WHERE city IS NULL\`.

Practice in the free online editor linked in the resources. Write at least ten queries of your own before the next lesson. Typing them yourself is how SQL actually sticks.`,
          },
          {
            title: "GROUP BY and HAVING for business questions",
            type: "ARTICLE",
            durationMinutes: 10,
            content: `## From rows to summaries

Clients rarely want individual rows. They want totals and averages: revenue per city, orders per month, average bill per channel. In SQL, that is **GROUP BY** with **aggregate functions**. If you understood pivot tables, you already understand GROUP BY; it is the same idea in code.

### The aggregate functions
- \`COUNT(*)\` counts rows; \`COUNT(DISTINCT customer_id)\` counts unique customers
- \`SUM(amount)\` totals a column
- \`AVG(amount)\` gives the average
- \`MIN()\` and \`MAX()\` give the smallest and largest values

## Revenue by city

\`\`\`sql
SELECT city,
       COUNT(*)                     AS orders,
       COUNT(DISTINCT customer_id)  AS customers,
       SUM(amount)                  AS revenue,
       ROUND(AVG(amount), 0)        AS avg_order_value
FROM orders
GROUP BY city
ORDER BY revenue DESC;
\`\`\`

The rule to remember: **every column in SELECT must be either in GROUP BY or inside an aggregate.** If you select \`city\` and \`channel\` but group only by \`city\`, the database does not know which channel to show, so it throws an error (or worse, in some databases it silently picks one).

## Monthly trend

Most databases have a function to cut a date down to its month. In PostgreSQL:

\`\`\`sql
SELECT DATE_TRUNC('month', order_date) AS month,
       SUM(amount) AS revenue
FROM orders
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month;
\`\`\`

In MySQL you would use \`DATE_FORMAT(order_date, '%Y-%m')\` instead. Check which database your client uses before writing date logic.

## WHERE versus HAVING

This confuses almost everyone at first:
- **WHERE** filters rows *before* grouping.
- **HAVING** filters groups *after* aggregating.

"Show cities with more than ₹5 lakh revenue from Instagram orders" needs both:

\`\`\`sql
SELECT city, SUM(amount) AS revenue
FROM orders
WHERE channel = 'Instagram'
GROUP BY city
HAVING SUM(amount) > 500000
ORDER BY revenue DESC;
\`\`\`

> Tip: the logical order SQL runs in is FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY. Once you remember that, most "why is this not working" moments make sense, including why you cannot use a SELECT alias inside WHERE.

### Practice questions
1. Which channel has the highest average order value?
2. How many unique customers ordered each month?
3. Which products sold fewer than 50 units in the quarter? (Hint: HAVING.)`,
          },
          {
            title: "JOINs explained with orders and customers",
            type: "ARTICLE",
            durationMinutes: 12,
            content: `## Why JOINs exist

Real databases split information across tables so nothing is typed twice. A D2C brand might have:
- \`customers\`: customer_id, name, phone, city, signup_date
- \`orders\`: order_id, customer_id, order_date, channel, amount
- \`order_items\`: order_id, product_id, qty, price
- \`products\`: product_id, product_name, category, cost_price

A JOIN connects them using matching keys, exactly like XLOOKUP did in Excel, but for every row at once.

## INNER JOIN: only matching rows

\`\`\`sql
SELECT o.order_id, o.order_date, c.name, c.city, o.amount
FROM orders o
INNER JOIN customers c
        ON o.customer_id = c.customer_id;
\`\`\`

\`o\` and \`c\` are **aliases**, short names that keep queries readable. INNER JOIN returns only orders whose customer_id exists in customers. If an order has a missing or wrong customer_id, it silently disappears, which matters when you are totalling revenue.

## LEFT JOIN: keep everything on the left

\`\`\`sql
SELECT c.customer_id, c.name, COUNT(o.order_id) AS orders
FROM customers c
LEFT JOIN orders o
       ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name;
\`\`\`

This keeps **every customer**, even those with zero orders. Customers who signed up but never bought are a goldmine for a WhatsApp re-engagement campaign. Notice we use \`COUNT(o.order_id)\` not \`COUNT(*)\`, so customers with no orders show 0 instead of 1.

To find only the never-buyers, add \`WHERE o.order_id IS NULL\`.

## Joining several tables

Revenue and margin by category needs three tables:

\`\`\`sql
SELECT p.category,
       SUM(oi.qty * oi.price)                    AS revenue,
       SUM(oi.qty * (oi.price - p.cost_price))   AS margin
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category
ORDER BY margin DESC;
\`\`\`

## Common JOIN mistakes

- **Row explosion.** Joining orders to order_items repeats each order once per item. If you then \`SUM(o.amount)\`, revenue is double or triple counted. Sum at the item level, or aggregate before joining.
- **Forgetting the ON condition.** Without it you get every row matched with every other row: a cross join of millions of rows.
- **Wrong join type.** Ask yourself: "Do I need rows that have no match?" If yes, LEFT JOIN.

> Tip: after any join, compare the row count and total with the original table. If revenue suddenly jumped 40%, you have a duplication problem, not a great quarter.`,
          },
          {
            title: "Quiz: SQL fundamentals",
            type: "QUIZ",
            durationMinutes: 7,
            content: `These questions test whether you can choose the right SQL clause for a real business question. Read each query carefully before answering.`,
            quiz: {
              questions: [
                {
                  prompt: "You want cities whose total revenue exceeds ₹2,00,000. Where does the condition SUM(amount) > 200000 belong?",
                  options: ["In the WHERE clause", "In the ORDER BY clause", "In the HAVING clause", "In the FROM clause"],
                  correct: 2,
                  explanation:
                    "WHERE filters individual rows before grouping and cannot use aggregates. HAVING filters groups after SUM is calculated.",
                },
                {
                  prompt: "Which query finds customers who signed up but never placed an order?",
                  options: [
                    "customers c INNER JOIN orders o ON c.customer_id = o.customer_id WHERE o.order_id IS NULL",
                    "customers c LEFT JOIN orders o ON c.customer_id = o.customer_id WHERE o.order_id IS NULL",
                    "orders o LEFT JOIN customers c ON o.customer_id = c.customer_id WHERE c.name IS NULL",
                    "customers c LEFT JOIN orders o ON c.customer_id = o.customer_id WHERE o.order_id = NULL",
                  ],
                  correct: 1,
                  explanation:
                    "LEFT JOIN keeps every customer, and unmatched ones get NULL order columns. IS NULL (not = NULL) then filters to never-buyers. An INNER JOIN would drop them entirely.",
                },
                {
                  prompt: "After joining orders to order_items, SUM(o.amount) shows revenue 2.5x higher than expected. Why?",
                  options: [
                    "SUM rounds values up",
                    "Each order row is repeated once per item, so order amounts are counted multiple times",
                    "order_items contains refunds",
                    "The JOIN removed orders with no items",
                  ],
                  correct: 1,
                  explanation:
                    "A one-to-many join duplicates the 'one' side. Sum item-level values (qty * price) or aggregate orders before joining.",
                },
                {
                  prompt: "Which query runs without error in standard SQL?",
                  options: [
                    "SELECT city, channel, SUM(amount) FROM orders GROUP BY city",
                    "SELECT city, SUM(amount) AS revenue FROM orders WHERE revenue > 1000 GROUP BY city",
                    "SELECT city, SUM(amount) AS revenue FROM orders GROUP BY city ORDER BY revenue DESC",
                    "SELECT city, amount FROM orders GROUP BY city",
                  ],
                  correct: 2,
                  explanation:
                    "ORDER BY runs after SELECT so it can use the alias. The others select ungrouped columns or use an alias inside WHERE, which runs before SELECT.",
                },
                {
                  prompt: "What does COUNT(DISTINCT customer_id) tell you that COUNT(*) does not?",
                  options: [
                    "The number of unique customers rather than the number of rows or orders",
                    "The number of customers with missing IDs",
                    "The number of new customers this month",
                    "Nothing different; they always return the same value",
                  ],
                  correct: 0,
                  explanation:
                    "COUNT(*) counts every row, so a customer with five orders counts five times. DISTINCT counts each customer once, which you need for repeat-rate analysis.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "From Analysis to Client Insight",
        lessons: [
          {
            title: "Answering a D2C founder's questions with SQL",
            type: "VIDEO",
            durationMinutes: 14,
            content: `## Key points
- Founders ask business questions like "are customers coming back?"; your job is translating them into precise metrics.
- Repeat rate is the share of customers with two or more orders in a period, and it is often the most important D2C health metric.
- A CTE (WITH clause) breaks a hard question into readable steps, which makes your query easier to check and explain.
- Always sanity-check results against a number the client already knows, such as total monthly revenue from their Shopify dashboard.
- Save your queries with comments so you can rerun the same analysis next month as a retainer.

## Transcript
In this lesson I want to show you how a real client conversation becomes SQL. Last year, the founder of a Coimbatore snack brand called me and said, "Arvind, Instagram ads are getting expensive. Are my customers even coming back?"

That is a great question, but it is not yet a metric. So I asked two follow-ups: over what period, and what counts as "coming back"? We agreed: in the last six months, a returning customer is anyone with two or more orders.

Now we can write SQL. I like using a CTE, the WITH clause, because it lets me build the answer in steps:

\`\`\`sql
WITH customer_orders AS (
  SELECT customer_id,
         COUNT(*)    AS orders,
         SUM(amount) AS total_spent
  FROM orders
  WHERE order_date >= '2025-01-01'
  GROUP BY customer_id
)
SELECT COUNT(*) AS customers,
       SUM(CASE WHEN orders >= 2 THEN 1 ELSE 0 END) AS repeat_customers,
       ROUND(100.0 * SUM(CASE WHEN orders >= 2 THEN 1 ELSE 0 END) / COUNT(*), 1) AS repeat_rate_pct,
       ROUND(AVG(total_spent), 0) AS avg_spend
FROM customer_orders;
\`\`\`

Step one summarises each customer. Step two summarises those summaries. Dekho, the CASE WHEN is just an IF statement inside SQL. And I multiply by 100.0, not 100, so the division gives decimals instead of rounding down to zero in some databases.

For this brand the repeat rate came out around 22 percent. Then I split it by first-order channel with one more join, and found customers acquired through WhatsApp referrals came back far more often than Instagram-ad customers. That single finding moved part of their ad budget into a referral offer.

Before presenting anything, I always cross-check. I ran total revenue for January and compared it with their Shopify dashboard. It matched within a few hundred rupees, which I could explain by refunds. If it had been way off, I would fix my query before saying anything to the client.

Finally, save the query with comments. Next month they will ask the same question, and rerunning it in two minutes is how one project becomes a monthly retainer.`,
          },
          {
            title: "Presenting insights: the one-page client report",
            type: "ARTICLE",
            durationMinutes: 9,
            content: `## Clients buy decisions, not dashboards

A small business owner reading your report is busy, possibly on a phone, possibly between customers. If they need ten minutes to find the point, you have lost them. The fix is a **one-page insight report** built on a simple structure.

## The structure

### 1. Headline (one sentence)
Lead with the answer. Not "Sales Analysis Q1 2025", but:

> Repeat customers drive 48% of revenue, but only 22% of buyers come back. Improving retention is your biggest lever.

### 2. Three findings
Each finding gets a **number**, a **comparison**, and a **chart** at most.
- "Average order value on the website is ₹612 versus ₹438 on Amazon."
- "Sunday orders are 1.6x the weekday average, mostly between 7 and 10 pm."
- "Customers from WhatsApp referrals reorder at nearly twice the rate of Instagram-ad customers."

A number alone is not a finding. A number with a comparison is.

### 3. Recommendations
One action per finding, written so someone could start tomorrow:
- Offer free shipping above ₹599 on the website to lift order value further.
- Schedule Instagram posts and WhatsApp broadcasts for Sunday evening.
- Launch a "refer a friend, both get ₹100 off" offer via WhatsApp Business.

### 4. Data notes (small print)
Date range, data source, what was cleaned or excluded. This protects you and builds trust.

## Charts that work for owners

- **Bar charts** for comparing categories; sort them largest first.
- **Line charts** for trends over months.
- **Avoid** 3D charts, pie charts with more than four slices, and dual axes.
- Title every chart with the takeaway: "Website orders are worth 40% more than Amazon orders", not "AOV by Channel".
- Highlight the one bar that matters in a strong colour; keep others grey.

## Delivering it

- Export the page as a **PDF**; it opens cleanly on WhatsApp and email.
- Send a short message with it: the headline plus "happy to walk you through it in a 15-minute call".
- On the call, talk through recommendations, not methodology. Keep your Excel and SQL ready in case they ask "how did you get this?"

> Tip: end the call by asking, "Which of these would you like me to track every month?" That question is how analysts turn one-time projects into ₹5,000 to ₹15,000 monthly retainers.

## A quick self-check before sending
- Can the owner understand the headline without reading anything else?
- Does every chart title state a conclusion?
- Is every recommendation specific, cheap to test, and tied to a finding?`,
          },
          {
            title: "Capstone: insight report for a Coimbatore snack brand",
            type: "ASSIGNMENT",
            durationMinutes: 90,
            content: `This capstone mirrors a real first project: a founder shares their data and a worry, and you return answers they can act on. A strong submission here is exactly what you will show when pitching your first analytics client on LinkedIn or Catalance.`,
            assignment: {
              brief: `## The scenario
**Kongu Crunch** is a Coimbatore D2C snack brand selling on its website, Amazon and Instagram. The founder writes: *"Revenue grew last quarter but profit did not. Ad costs are up. What is going on and what should I do?"*

You get a SQLite database (resources tab) with \`customers\`, \`orders\`, \`order_items\` and \`products\` tables.

## Steps
1. Explore every table with \`SELECT ... LIMIT 10\` and note row counts.
2. Write SQL to answer at least four of these:
   - Revenue and margin by month and by channel
   - Margin by product category (join \`order_items\` and \`products\`)
   - Repeat rate overall and by acquisition channel (use a CTE)
   - Top 10 customers by total spend and their share of revenue
   - Average order value by channel
3. Cross-check one total against a simple Excel pivot of the exported orders table.
4. Build 3 clean charts in Excel or Google Sheets.
5. Write a one-page report: headline, three findings, three recommendations, data notes.

## Deliverable
Submit a Google Drive folder link containing: \`queries.sql\` (commented), the chart workbook, and the report as a PDF.

## Tips
- Comment each query with the business question it answers.
- Watch for row explosion when joining orders to order_items.
- Recommendations should be cheap to test, such as a free-shipping threshold or a WhatsApp referral offer.`,
              rubric: [
                { criterion: "SQL queries are correct, readable and commented with the business question", points: 30 },
                { criterion: "Results are cross-checked and data notes explain cleaning and scope", points: 15 },
                { criterion: "Findings are specific, numeric and compared against a baseline", points: 25 },
                { criterion: "Recommendations are actionable and tied to findings", points: 20 },
                { criterion: "Report and charts are clear enough for a busy owner to read in two minutes", points: 10 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
    ],
  },
  {
    slug: "power-bi-dashboards",
    title: "Power BI Dashboards for Clients",
    subtitle: "Build interactive, refreshable dashboards small businesses will pay for monthly",
    description:
      "Go beyond one-off Excel reports and build Power BI dashboards clients open every Monday. You will shape messy files with Power Query, write your first DAX measures for revenue, margin and growth, and design a clean single-page dashboard for a real-style Indian retail client. Ideal if you already know Excel basics and want a skill that turns into monthly retainers.",
    level: "INTERMEDIATE",
    languages: ["en", "ta"],
    cover: { from: "#B45309", to: "#7C3AED", pattern: "rings" },
    mentorId: "m_4",
    priceINR: 1999,
    rating: 4.7,
    ratingsCount: 738,
    studentsCount: 4210,
    createdDaysAgo: 72,
    skills: ["Power BI Desktop", "Power Query", "Data Modeling", "DAX", "Dashboard Design"],
    whatYouBuild: [
      "A repeatable Power Query pipeline that combines monthly sales files from a folder",
      "A star-schema model with a date table and core DAX measures",
      "A one-page sales dashboard for a Hyderabad apparel store, published and shareable",
    ],
    requirements: [
      "A Windows laptop with free Power BI Desktop installed (Mac users can use a Windows VM or cloud PC)",
      "Comfort with Excel tables, SUMIFS and pivot tables, or completion of the Excel & SQL course",
    ],
    modules: [
      {
        title: "Power Query: Getting and Shaping Data",
        lessons: [
          {
            title: "Why clients want Power BI, not another Excel file",
            type: "VIDEO",
            durationMinutes: 8,
            isPreview: true,
            content: `## Key points
- Power BI dashboards refresh with one click, so a client report becomes a recurring service instead of a one-off file.
- Power Query records every cleaning step, so next month's data is cleaned automatically.
- Power BI Desktop is free; sharing via the Power BI service needs a Pro licence or a workspace on the client's side.
- Clients judge a dashboard in seconds, so design matters as much as the numbers.

## Transcript
Hello again, Arvind here. If you did my Excel and SQL course, you know how to clean data and find insights. The problem? Next month, the client sends a new file, and you repeat everything by hand.

Power BI fixes that. In Power Query you record your cleaning steps once: trim city names, fix data types, remove duplicates. Next month, you drop the new file into the folder and click Refresh. Done.

That is why my clients, like a garment store in Hyderabad and a homestay group in Ooty, pay me every month. They open their dashboard on Monday morning, see sales by store and category, and call me only when something looks odd.

In this course we will build exactly that. Chalo, install Power BI Desktop from the Microsoft Store and let us start.`,
          },
          {
            title: "Combining monthly files with Power Query",
            type: "ARTICLE",
            durationMinutes: 8,
            isPreview: true,
            content: `## The folder trick

Most clients export one file per month: \`Sales_Apr.xlsx\`, \`Sales_May.xlsx\`. Instead of copy-pasting, use **Get Data → Folder**, pick the folder, then click **Combine & Transform Data**. Power Query stacks every file into one table, and any new file dropped in later is included on refresh.

## Essential cleaning steps

Inside the Power Query Editor, each action becomes a step in **Applied Steps**:
- **Use First Row as Headers**, then set **data types** (Date, Whole Number, Fixed Decimal for rupees).
- **Transform → Format → Trim** and **Capitalize Each Word** on text columns like City.
- **Replace Values** to fix spellings such as "Secunderabad " and "secunderabad".
- **Remove Duplicates** on Invoice No only.
- **Remove Rows → Remove Blank Rows**.

> Tip: rename every step (right-click → Rename) to something like "Fix city names". When the client's export format changes, you will find the broken step in seconds.

Click **Close & Apply** to load the clean table into your model.`,
          },
          {
            title: "Quiz: Power Query basics",
            type: "QUIZ",
            durationMinutes: 4,
            content: `A quick check on shaping data so that next month's refresh just works.`,
            quiz: {
              questions: [
                {
                  prompt: "A client sends a new sales file every month. What is the most refresh-friendly setup?",
                  options: [
                    "Copy-paste each month's rows into one master Excel file",
                    "Use Get Data from Folder and combine the files in Power Query",
                    "Create a separate Power BI report per month",
                    "Import only the latest file and delete older ones",
                  ],
                  correct: 1,
                  explanation: "A folder query picks up every file in the folder, so new months are included automatically on refresh.",
                },
                {
                  prompt: "Why does it help to rename Applied Steps in Power Query?",
                  options: [
                    "Renamed steps run faster",
                    "Power BI requires custom step names before publishing",
                    "Clear names make it quick to find and fix a step when the source format changes",
                    "It hides the steps from the client",
                  ],
                  correct: 2,
                  explanation: "Descriptive step names act as documentation, which saves time when debugging a failed refresh.",
                },
                {
                  prompt: "Which column type is best for rupee amounts like 1249.50?",
                  options: ["Text", "Whole Number", "Date", "Fixed Decimal Number"],
                  correct: 3,
                  explanation: "Fixed Decimal keeps currency precise to four decimal places without floating-point rounding surprises, and Whole Number would drop paise.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Data Modeling and DAX Basics",
        lessons: [
          {
            title: "Star schema and the date table",
            type: "VIDEO",
            durationMinutes: 10,
            content: `## Key points
- A star schema has one fact table (sales rows) in the middle and dimension tables (products, stores, dates) around it.
- Relationships go one-to-many from each dimension to the fact table.
- A dedicated date table, marked as a date table, unlocks time intelligence functions like TOTALYTD and SAMEPERIODLASTYEAR.
- Slicers and filters should come from dimension tables, never from the fact table.

## Transcript
Before writing any DAX, get the model right. Dekho, most broken dashboards I fix for clients have one giant flat table with everything in it.

Instead, we build a star. In the middle is the Sales fact table: invoice, date, product ID, store ID, quantity, amount. Around it sit Products, Stores and a Date table. In Model view, drag Products[ProductID] onto Sales[ProductID] to create a one-to-many relationship.

For dates, create a table with DAX:

\`\`\`text
Date = CALENDAR(DATE(2024,4,1), DATE(2026,3,31))
\`\`\`

I start it in April because Indian clients think in financial years. Add Month and FY columns, then use Table tools, Mark as date table. Now every month slicer and year-over-year comparison works properly.

One last habit: hide the ID columns in the Sales table from report view. Clients should only ever see friendly fields like Product Name and Store, never raw keys.`,
          },
          {
            title: "Your first DAX measures",
            type: "ARTICLE",
            durationMinutes: 9,
            content: `## Measures, not calculated columns

A **measure** is calculated on the fly for whatever is filtered: a store, a month, a category. Use measures for anything you sum or compare. Create one with **New measure** and keep them in a dedicated table called \`_Measures\`.

## The core four

\`\`\`text
Revenue = SUM(Sales[Amount])

Margin = SUMX(Sales, Sales[Qty] * (Sales[Price] - RELATED(Products[CostPrice])))

Margin % = DIVIDE([Margin], [Revenue])

Revenue LY = CALCULATE([Revenue], SAMEPERIODLASTYEAR('Date'[Date]))
\`\`\`

- \`SUMX\` works row by row, then adds up, which is needed when you multiply columns.
- \`RELATED\` fetches a value from a dimension table, like XLOOKUP across a relationship.
- \`DIVIDE\` safely returns blank instead of an error when revenue is zero.
- \`CALCULATE\` changes the filter context; here it shifts the dates back one year.

Then growth is simply:

\`\`\`text
YoY Growth % = DIVIDE([Revenue] - [Revenue LY], [Revenue LY])
\`\`\`

> Tip: build measures on top of other measures. If the client's margin definition changes, you fix it in one place.`,
          },
          {
            title: "Quiz: modeling and DAX",
            type: "QUIZ",
            durationMinutes: 5,
            content: `Test whether you can choose the right modeling approach and DAX function.`,
            quiz: {
              questions: [
                {
                  prompt: "Why should a month slicer come from the Date table rather than the Sales table?",
                  options: [
                    "The Sales table cannot be used in slicers",
                    "Dimension tables filter the fact table cleanly and time intelligence functions need a proper date table",
                    "It makes the file size smaller",
                    "Slicers only work with calculated columns",
                  ],
                  correct: 1,
                  explanation: "In a star schema, filters flow from dimensions to facts, and functions like SAMEPERIODLASTYEAR rely on a continuous, marked date table.",
                },
                {
                  prompt: "Which function safely handles division when revenue might be zero?",
                  options: ["SUM", "RELATED", "DIVIDE", "CALENDAR"],
                  correct: 2,
                  explanation: "DIVIDE returns blank (or an alternate value) instead of an error when the denominator is zero.",
                },
                {
                  prompt: "Margin needs Qty * (Price - CostPrice) for every row. Which approach is correct?",
                  options: [
                    "SUMX over Sales, using RELATED to fetch CostPrice from Products",
                    "SUM(Sales[Price]) - SUM(Products[CostPrice])",
                    "A slicer on CostPrice",
                    "CALCULATE([Revenue], Products[CostPrice])",
                  ],
                  correct: 0,
                  explanation: "SUMX evaluates the expression row by row before summing; subtracting two separate totals ignores quantity and gives a wrong answer.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Designing Dashboards Clients Love",
        lessons: [
          {
            title: "Dashboard design rules that win clients",
            type: "ARTICLE",
            durationMinutes: 8,
            content: `## Answer the Monday-morning question

Before placing a single visual, ask the owner: **"What do you want to know in the first ten seconds?"** For a retail store it is usually "How did we do last week, and where?"

## Layout

- **Top row: KPI cards.** Revenue, Margin %, Orders, YoY Growth %. Four at most.
- **Middle: one trend line** of revenue by week or month, with last year as a second line.
- **Bottom: breakdowns.** A sorted bar chart by store or category, and a table for detail.
- **Left or top: slicers** for date, store and category.

## Style

- Use one accent colour (the client's brand colour) and greys for everything else.
- Format rupees in lakhs or thousands with a ₹ prefix; nobody reads ₹12,48,392.67.
- Titles state the takeaway when possible: "Banjara Hills drives 41% of revenue".
- Remove gridlines, borders and default visual backgrounds.

> Tip: test on a phone. Use **View → Mobile layout**, because many owners will open the dashboard on WhatsApp-shared links between customers.`,
          },
          {
            title: "Building and publishing the dashboard",
            type: "VIDEO",
            durationMinutes: 12,
            content: `## Key points
- Build the KPI cards first, then the trend, then breakdowns, matching the order a reader scans.
- Use Edit interactions to stop a slicer or chart from filtering visuals where it would be confusing.
- Publish to a workspace in the Power BI service and set a scheduled refresh so data stays current.
- Share the report link with the client, or export a PDF for owners who prefer WhatsApp.

## Transcript
Chalo, let us build the dashboard for Nizam Threads, an apparel store with three branches in Hyderabad.

I start with four card visuals: Revenue, Margin %, Orders and YoY Growth %. Then a line chart with Revenue and Revenue LY by month. Below that, a bar chart of revenue by store, sorted descending, and a matrix of category by store.

Now add slicers for financial year and category. Dekho, select a slicer, go to Format, Edit interactions, and decide exactly which visuals it affects.

When it looks clean, click Publish, choose a workspace, then in the service set up scheduled refresh. If files live on the client's laptop, you will need the on-premises data gateway; OneDrive or SharePoint is simpler.

Finally, share the link and walk the owner through it once. That walkthrough is where the monthly retainer conversation begins.`,
          },
          {
            title: "Assignment: a client-ready sales dashboard",
            type: "ASSIGNMENT",
            durationMinutes: 90,
            content: `A polished, refreshable dashboard is the strongest portfolio piece for BI freelancing. Clients on LinkedIn and Catalance hire based on screenshots and a short walkthrough video, so this assignment builds both.`,
            assignment: {
              brief: `## The task
Build a one-page sales dashboard for **Nizam Threads**, a Hyderabad apparel store with three branches. Use the sample monthly files from the resources tab.

## Steps
1. Combine the monthly files with **Get Data → Folder** and clean them in Power Query with renamed steps.
2. Build a star schema: Sales, Products, Stores and a marked Date table starting 1 April.
3. Create measures: Revenue, Margin, Margin %, Revenue LY and YoY Growth %.
4. Design the page: KPI cards on top, a trend line, store and category breakdowns, and slicers.
5. Create a mobile layout.

## Deliverable
Submit a link to a Google Drive folder with the \`.pbix\` file, two screenshots (desktop and mobile), and a 2-minute Loom or screen recording explaining the dashboard as you would to the owner.

## Tips
- Format currency in lakhs with a ₹ prefix.
- Keep one accent colour and sort every bar chart.`,
              rubric: [
                { criterion: "Power Query pipeline combines files and is cleanly documented", points: 25 },
                { criterion: "Star schema, date table and DAX measures are correct", points: 30 },
                { criterion: "Dashboard layout and formatting are clear and client-ready", points: 30 },
                { criterion: "Walkthrough video explains insights in plain language", points: 15 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
    ],
  },
];
