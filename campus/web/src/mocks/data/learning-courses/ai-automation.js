/** AI & Automation courses — seed content for the Campus demo. */
export default [
  {
    slug: "python-ai-automation",
    title: "Python Automation with AI APIs",
    subtitle: "Automate spreadsheets, reports and replies with Python and LLM APIs",
    description:
      "Learn just enough Python to make boring office work disappear: cleaning CSVs, building formatted Excel reports and calling an LLM API to read, summarise and reply. Every module is built around real small-business problems, from a Coimbatore textile shop's sales sheet to a Hyderabad CA firm's invoice pile. By the end you will have a working FAQ bot and an invoice summarizer you can demo to paying clients.",
    level: "BEGINNER",
    languages: ["en", "ta", "te"],
    cover: { from: "#0F766E", to: "#4F46E5", pattern: "grid" },
    mentorId: "m_4",
    priceINR: 1499,
    rating: 4.7,
    ratingsCount: 1137,
    studentsCount: 8460,
    createdDaysAgo: 96,
    skills: ["Python", "pandas", "openpyxl", "REST APIs", "Prompt design", "JSON", "Automation"],
    whatYouBuild: [
      "A script that turns a messy monthly sales CSV into a formatted, multi-sheet Excel report",
      "A reusable Python helper that calls any LLM API over HTTP and returns validated JSON",
      "A WhatsApp-style FAQ bot for a Kochi homestay that answers from the owner's own FAQ sheet",
      "An invoice summarizer that reads 50 invoice texts and produces a GST-ready Excel summary",
    ],
    requirements: [
      "A laptop with Windows, macOS or Linux (4GB RAM is fine)",
      "Comfort with Excel or Google Sheets; no prior coding needed",
      "An API key from any LLM provider (free tiers work for this course)",
    ],
    modules: [
      {
        title: "Python basics for automation",
        lessons: [
          {
            title: "Why Python is the automation tool clients pay for",
            type: "VIDEO",
            durationMinutes: 9,
            isPreview: true,
            content: `## Key points
- Most small businesses lose hours every week to copy-paste work in Excel, WhatsApp and email, and that repetitive work is exactly what Python automates well.
- Python is readable enough for beginners and has mature libraries like pandas, openpyxl and requests that do the heavy lifting for you.
- An automation is only valuable if it saves measurable time, so always ask a client how many hours a task takes today before you build anything.
- LLM APIs add a new layer: Python moves and cleans the data, and the model reads, summarises or drafts text that used to need a human.
- In this course you will build four portfolio-ready projects that map directly to services you can sell on Internshala, LinkedIn or through referrals.

## Transcript
Vanakkam, namaste, hello everyone! I'm Arvind, and for the last eight years I have worked as a data and BI consultant for businesses in Chennai, Bengaluru and Hyderabad. Let me tell you about the client who made me take automation seriously.

A textile wholesaler in Coimbatore had one accountant, Lakshmi akka, who spent every Monday morning merging sales sheets from four branches into one report for the owner. Four hours, every single week. I wrote a forty-line Python script that did it in eleven seconds. The owner paid me ₹8,000 for it, and honestly, he was happy to, because he got back two hundred hours a year of his accountant's time.

That is the mindset I want you to leave with. Clients don't pay for code. They pay for hours saved and mistakes avoided.

Why Python and not something else? Three reasons. First, it reads almost like English, so you can learn the basics in a weekend. Second, the libraries: pandas handles tables like a super-powered Excel, openpyxl writes properly formatted Excel files, and requests talks to any web API. Third, every AI provider gives you a simple HTTP API, and Python is the most common language used to call them.

Here's what a tiny automation looks like:

\`\`\`python
import pandas as pd

sales = pd.read_csv("branch_sales.csv")
print(sales.groupby("branch")["amount"].sum())
\`\`\`

Three lines, and you have branch-wise totals. Dekho, that is the power we are going to build on.

The plan for the course is simple. Module one: Python basics you actually need. Module two: files, CSV and Excel. Module three: calling LLM APIs and getting clean JSON back. Module four: two real projects for small businesses. Chalo, let's set up your laptop in the next lesson.`,
          },
          {
            title: "Setting up Python, VS Code and virtual environments",
            type: "ARTICLE",
            durationMinutes: 8,
            isPreview: true,
            content: `## Get a clean, repeatable setup

A good setup saves you from the classic "it works on my laptop" problem when you hand a script to a client. Do this once and every project in the course will run smoothly.

### 1. Install Python

Download Python 3.11 or newer from **python.org**. On Windows, tick **"Add python.exe to PATH"** on the first installer screen; this one checkbox prevents most beginner errors. Then open a terminal and check:

\`\`\`bash
python --version
pip --version
\`\`\`

On macOS or Linux you may need \`python3\` and \`pip3\` instead.

### 2. Install VS Code

Install **Visual Studio Code** and add the official **Python** extension from Microsoft. It gives you syntax highlighting, error hints and a Run button.

### 3. Create a project folder and a virtual environment

A virtual environment (venv) is a private box of libraries for one project. Client A's project can use one version of pandas while client B's uses another, without conflicts.

\`\`\`bash
mkdir sales-automation
cd sales-automation
python -m venv .venv

# Windows
.venv\\Scripts\\activate
# macOS / Linux
source .venv/bin/activate
\`\`\`

When it is active, your terminal prompt shows \`(.venv)\`.

### 4. Install the libraries for this course

\`\`\`bash
pip install pandas openpyxl requests python-dotenv
pip freeze > requirements.txt
\`\`\`

The \`requirements.txt\` file lists exact versions. When you deliver a project, the client (or their IT person) runs \`pip install -r requirements.txt\` and gets the same setup you tested with.

> **Tip:** Never install project libraries globally with plain \`pip\` outside a venv. It works today and breaks mysteriously six months later.

### 5. Keep secrets out of your code

Later we will use an API key. It must never be pasted inside your \`.py\` file or pushed to GitHub. Create a file called \`.env\`:

\`\`\`bash
LLM_API_KEY=paste-your-key-here
\`\`\`

And a \`.gitignore\` containing:

\`\`\`bash
.venv/
.env
__pycache__/
\`\`\`

### Quick checklist

- \`python --version\` prints 3.11 or newer
- VS Code shows your \`.venv\` interpreter in the bottom bar
- \`pip list\` shows pandas, openpyxl, requests and python-dotenv
- \`.env\` exists and is listed in \`.gitignore\`

If all four are true, you are ready to automate.`,
          },
          {
            title: "Python essentials: variables, lists, dicts, loops and functions",
            type: "ARTICLE",
            durationMinutes: 11,
            content: `## Only the Python you actually need

You don't need to master all of Python to automate office work. You need five ideas, used again and again.

### Variables and strings

\`\`\`python
shop = "Sri Murugan Textiles"
gst_rate = 0.05
amount = 12400
print(f"{shop}: GST due is Rs {amount * gst_rate:.2f}")
\`\`\`

The \`f"..."\` string (an **f-string**) lets you drop values into text. The \`:.2f\` part formats a number to two decimals, which is perfect for money.

### Lists: an ordered collection

\`\`\`python
branches = ["Coimbatore", "Tiruppur", "Erode"]
branches.append("Salem")
print(len(branches))  # 4
\`\`\`

### Dictionaries: labelled data

A dictionary maps keys to values. Think of it as one row of a spreadsheet.

\`\`\`python
invoice = {"number": "INV-1042", "customer": "Ravi Traders", "total": 18500}
print(invoice["customer"])
\`\`\`

Most API responses, including LLM responses, arrive as dictionaries, so get comfortable with them.

### Loops and conditions

\`\`\`python
invoices = [
    {"number": "INV-1042", "total": 18500, "paid": True},
    {"number": "INV-1043", "total": 7200, "paid": False},
    {"number": "INV-1044", "total": 32000, "paid": False},
]

pending = 0
for inv in invoices:
    if not inv["paid"]:
        pending += inv["total"]
        print("Follow up:", inv["number"])

print("Total pending:", pending)
\`\`\`

This is already a real automation: a pending-payments list that an accountant would otherwise build by hand.

### Functions: package logic for reuse

\`\`\`python
def gst_breakup(amount, rate=0.18):
    """Return taxable value and GST for a GST-inclusive amount."""
    taxable = round(amount / (1 + rate), 2)
    return {"taxable": taxable, "gst": round(amount - taxable, 2)}

print(gst_breakup(1180))  # {'taxable': 1000.0, 'gst': 180.0}
\`\`\`

A function has a name, inputs (parameters, which can have defaults like \`rate=0.18\`) and a \`return\` value. Write a function the second time you copy-paste the same logic.

### Handling errors gracefully

Client data is messy. Use \`try\` / \`except\` so one bad row doesn't crash the whole script:

\`\`\`python
raw_amounts = ["1200", "850", "N/A", "4300"]
clean = []
for value in raw_amounts:
    try:
        clean.append(float(value))
    except ValueError:
        print("Skipping bad value:", value)
\`\`\`

> **Tip:** Print what you skip. A client trusts an automation more when it tells them what it could not process.

### Practice

Write a function \`late_fee(days_late)\` that returns ₹50 per day, capped at ₹1,000, and loop over a list of five numbers to test it. If you can do this comfortably, you are ready for pandas.`,
          },
          {
            title: "Check-in: Python fundamentals",
            type: "QUIZ",
            durationMinutes: 6,
            content: `A quick check on the Python ideas you will use in every automation. Read the code carefully; these mirror bugs I see in real client scripts.`,
            quiz: {
              questions: [
                {
                  prompt: "Why should each automation project get its own virtual environment?",
                  options: [
                    "It makes Python code run faster",
                    "It keeps each project's library versions isolated so projects don't break each other",
                    "It is required to use f-strings",
                    "It hides the API key from GitHub automatically",
                  ],
                  correct: 1,
                  explanation:
                    "A venv is a private set of installed libraries per project. It doesn't speed up code or hide secrets; .gitignore and .env handle secrets.",
                },
                {
                  prompt: "invoice = {\"number\": \"INV-7\", \"total\": 500}. Which expression gets the total?",
                  options: ["invoice.total", "invoice[1]", "invoice[\"total\"]", "invoice(\"total\")"],
                  correct: 2,
                  explanation: "Dictionaries are accessed by key with square brackets: invoice[\"total\"].",
                },
                {
                  prompt:
                    "A loop converts strings to float, and one value is \"N/A\". What is the best way to keep the script running and still be transparent?",
                  options: [
                    "Wrap the conversion in try/except ValueError and log the skipped value",
                    "Delete the row from the client's file before running",
                    "Use int() instead of float()",
                    "Ignore it; Python skips bad values automatically",
                  ],
                  correct: 0,
                  explanation:
                    "try/except lets you handle the error for that one value, and logging it tells the client exactly what could not be processed.",
                },
                {
                  prompt: "What does gst_breakup(1180) return if rate defaults to 0.18 and the amount is GST-inclusive?",
                  options: [
                    "{'taxable': 1180, 'gst': 212.4}",
                    "{'taxable': 967.6, 'gst': 212.4}",
                    "{'taxable': 1000.0, 'gst': 180.0}",
                    "An error, because rate was not passed",
                  ],
                  correct: 2,
                  explanation:
                    "1180 / 1.18 = 1000 taxable value, so GST is 180. Default parameters mean you don't have to pass rate.",
                },
                {
                  prompt: "Where should your LLM API key live in a project you will push to GitHub?",
                  options: [
                    "As a string at the top of main.py",
                    "In a comment so you remember it",
                    "In requirements.txt",
                    "In a .env file that is listed in .gitignore",
                  ],
                  correct: 3,
                  explanation:
                    "Keys belong in environment variables loaded from a .env file that never gets committed. Anything inside .py files ends up in Git history.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Files, CSV and Excel automation",
        lessons: [
          {
            title: "Reading and writing CSV files with pandas",
            type: "VIDEO",
            durationMinutes: 12,
            content: `## Key points
- pandas loads a CSV into a DataFrame, which behaves like an Excel sheet you can filter, group and sum with code.
- Always inspect new data with head(), info() and value_counts() before transforming it, because client files rarely match what they describe.
- Use the dtype, parse_dates and encoding options of read_csv to avoid silent mistakes with phone numbers, dates and regional text.
- glob plus pd.concat merges many branch or month files into one table in a single step.
- Write results back with to_csv(index=False) so the output opens cleanly in Excel.

## Transcript
Okay, let's open the actual file from that Coimbatore client. I've anonymised it, but the mess is real. Four branches, each sending a CSV every month with columns like date, invoice_no, customer, phone, item, qty and amount.

First rule of client data: never trust it. So the first thing I do is load and look.

\`\`\`python
import pandas as pd
from pathlib import Path

files = sorted(Path("data").glob("sales_*.csv"))
frames = []
for f in files:
    df = pd.read_csv(f, dtype={"phone": str}, parse_dates=["date"], dayfirst=True)
    df["branch"] = f.stem.replace("sales_", "")
    frames.append(df)

sales = pd.concat(frames, ignore_index=True)
print(sales.head())
sales.info()
\`\`\`

See that dtype phone as string? Without it, pandas reads a phone number like 09876543210 as a number and drops the leading zero. And dayfirst=True matters because Indian files write 05/03/2025 meaning the fifth of March, not May third. These two small options have saved me from very embarrassing reports.

The branch column comes from the file name, so sales_tiruppur.csv becomes tiruppur. Now one DataFrame holds all four branches.

Next I run sales["branch"].value_counts() and sales.isna().sum(). This tells me how many rows each branch sent and where values are missing. Last month one branch had two hundred empty amount cells because the billing software crashed. If I had not checked, the report would have quietly under-reported their sales.

If a file has Tamil or Telugu customer names and shows strange characters, try encoding="utf-8-sig" or encoding="cp1252". Excel exports are often not plain UTF-8.

Finally, saving:

\`\`\`python
sales.to_csv("output/all_branches.csv", index=False)
\`\`\`

index=False avoids an extra unnamed column that confuses everyone. Chalo, in the next lesson we'll clean this and build the actual summary.`,
          },
          {
            title: "Cleaning and summarising sales data with pandas",
            type: "ARTICLE",
            durationMinutes: 12,
            content: `## From raw rows to answers the owner cares about

Owners don't want 4,000 rows. They want three answers: How much did we sell? Which branch or product is doing well? Who owes us money? Here is the cleaning-then-summarising pattern I use on almost every project.

### Step 1: Standardise text

\`\`\`python
sales["item"] = sales["item"].str.strip().str.title()
sales["customer"] = sales["customer"].str.strip()
sales["branch"] = sales["branch"].str.title()
\`\`\`

"cotton saree ", "Cotton Saree" and "COTTON SAREE" become one product. Without this, your group-by shows three rows for the same thing.

### Step 2: Fix numbers

Amounts often arrive as text like "1,250" or "Rs 980".

\`\`\`python
sales["amount"] = (
    sales["amount"].astype(str)
    .str.replace(r"[^0-9.]", "", regex=True)
)
sales["amount"] = pd.to_numeric(sales["amount"], errors="coerce")
bad = sales[sales["amount"].isna()]
print(f"{len(bad)} rows have unreadable amounts")
\`\`\`

\`errors="coerce"\` turns anything unparseable into \`NaN\` instead of crashing, and then we count those rows so we can report them.

### Step 3: Remove duplicates

Billing software sometimes exports the same invoice twice.

\`\`\`python
sales = sales.drop_duplicates(subset=["branch", "invoice_no", "item"])
\`\`\`

### Step 4: Summarise with groupby and pivot_table

\`\`\`python
by_branch = sales.groupby("branch", as_index=False)["amount"].sum()
by_branch = by_branch.sort_values("amount", ascending=False)

top_items = (
    sales.groupby("item", as_index=False)
    .agg(qty=("qty", "sum"), revenue=("amount", "sum"))
    .nlargest(10, "revenue")
)

sales["month"] = sales["date"].dt.to_period("M").astype(str)
monthly = sales.pivot_table(
    index="branch", columns="month", values="amount",
    aggfunc="sum", fill_value=0,
)
\`\`\`

- \`groupby\` + \`sum\` gives branch totals.
- \`agg\` with named outputs gives clean column names like \`qty\` and \`revenue\`.
- \`pivot_table\` builds the classic branch-by-month grid that owners love.

### Step 5: Sanity-check before you share

Always compare one number with the client's own records:

\`\`\`python
print("Grand total:", round(sales["amount"].sum(), 2))
\`\`\`

If the owner says February was about ₹14 lakh and your script says ₹4 lakh, a branch file is missing. Catch it before they do.

> **Tip:** Put each step in its own function (\`clean_text\`, \`clean_amounts\`, \`summarise\`). When the client says "can you also add product category?", you change one function instead of untangling a long script.

### What you have now

Three DataFrames: \`by_branch\`, \`top_items\` and \`monthly\`. In the next lesson we write them into a proper Excel file with formatting, because a client will judge your work by how the report looks when they open it.`,
          },
          {
            title: "Formatted Excel reports with openpyxl",
            type: "ARTICLE",
            durationMinutes: 10,
            content: `## Make the report look like a professional made it

\`df.to_excel()\` dumps data. Clients want bold headers, rupee formatting, sensible column widths and a frozen header row. pandas writes the data and openpyxl polishes it.

### Write several sheets at once

\`\`\`python
import pandas as pd

with pd.ExcelWriter("output/sales_report.xlsx", engine="openpyxl") as writer:
    by_branch.to_excel(writer, sheet_name="Branch totals", index=False)
    top_items.to_excel(writer, sheet_name="Top items", index=False)
    monthly.to_excel(writer, sheet_name="Monthly")
\`\`\`

### Then format with openpyxl

\`\`\`python
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

wb = load_workbook("output/sales_report.xlsx")
header_fill = PatternFill("solid", fgColor="1F4E78")
rupee_format = '"Rs "#,##,##0.00'

for ws in wb.worksheets:
    for cell in ws[1]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")
    ws.freeze_panes = "A2"

    for col_idx, column in enumerate(ws.columns, start=1):
        longest = max(len(str(c.value or "")) for c in column)
        ws.column_dimensions[get_column_letter(col_idx)].width = min(longest + 4, 40)

    for row in ws.iter_rows(min_row=2):
        for cell in row:
            if isinstance(cell.value, (int, float)):
                cell.number_format = rupee_format

wb.save("output/sales_report.xlsx")
\`\`\`

What this does:

- **Header row:** white bold text on a dark blue fill, centred.
- **Freeze panes:** \`A2\` keeps the header visible while scrolling.
- **Column widths:** based on the longest value, capped at 40 so one long name doesn't create a giant column.
- **Indian number format:** \`#,##,##0.00\` shows 1450000 as 14,50,000.00, which is how Indian owners read numbers.

### Add a total row

\`\`\`python
ws = wb["Branch totals"]
last = ws.max_row
ws.cell(row=last + 1, column=1, value="Total").font = Font(bold=True)
ws.cell(row=last + 1, column=2, value=f"=SUM(B2:B{last})").font = Font(bold=True)
\`\`\`

Using a real Excel formula (\`=SUM(...)\`) instead of a pre-computed number means the accountant can edit a value and the total updates. Clients appreciate files that still behave like Excel.

### Name files by date

\`\`\`python
from datetime import date
filename = f"output/sales_report_{date.today():%Y_%m}.xlsx"
\`\`\`

Now every month produces a new file, and old reports are never overwritten.

> **Tip:** Highlight one insight. Fill the best branch's row in light green using \`PatternFill("solid", fgColor="C6EFCE")\`. A report that points at the answer gets read; a report that is only a grid gets forwarded and forgotten.

### Scheduling

On Windows, use **Task Scheduler** to run \`python make_report.py\` every Monday at 8 AM. On macOS or Linux, use \`cron\`. The owner wakes up to the report already in the shared folder, which is the moment they decide to keep paying you.`,
          },
          {
            title: "Assignment: Automate a monthly sales report",
            type: "ASSIGNMENT",
            durationMinutes: 75,
            content: `This is the single most requested automation from small businesses I work with. If you can deliver this cleanly, you already have something to sell on LinkedIn or to the shops in your own neighbourhood.`,
            assignment: {
              brief: `## The client

**Annapoorna Sweets**, a three-outlet sweet shop in Madurai, exports a sales CSV from each outlet's billing software every month. The owner wants one Excel report every Monday.

## Your task

Build a Python script \`make_report.py\` that:

1. Reads every \`sales_*.csv\` file in a \`data/\` folder (create at least 3 sample files with 60+ rows each; include messy values like \`"1,250"\`, \`"Rs 980"\`, extra spaces in item names and one duplicate invoice).
2. Cleans text, amounts and duplicates, and prints how many rows were skipped and why.
3. Produces an Excel file \`sales_report_YYYY_MM.xlsx\` with sheets: **Outlet totals**, **Top 10 items** and **Outlet x Month**.
4. Formats every sheet: styled header, frozen header row, auto column widths, Indian rupee number format and a \`=SUM\` total row on Outlet totals.

## Deliverable

A public GitHub repository link containing the script, sample \`data/\` files, \`requirements.txt\`, a generated report in \`output/\`, and a short \`README.md\` explaining how a non-technical owner runs it.

## Tips

- Use functions for each step; it makes the code easy to review.
- Test with a file that has a missing column and make sure your error message is understandable.
- Do not commit your \`.venv\` folder.`,
              rubric: [
                { criterion: "Script correctly merges all files and computes accurate totals", points: 35 },
                { criterion: "Cleaning handles messy amounts, text and duplicates with clear logging", points: 25 },
                { criterion: "Excel output is well formatted (headers, widths, rupee format, SUM row)", points: 25 },
                { criterion: "Repository has requirements.txt and a README a non-technical owner can follow", points: 15 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
      {
        title: "Calling LLM APIs from Python",
        lessons: [
          {
            title: "How an LLM API call actually works",
            type: "VIDEO",
            durationMinutes: 10,
            content: `## Key points
- An LLM API is just an HTTPS endpoint: you POST JSON containing a model name and messages, and you get JSON back containing the generated text.
- Authentication is done with an API key sent in a header, which you load from an environment variable and never hard-code.
- Messages usually have roles: a system message sets behaviour, and user messages carry the actual task and data.
- You are billed per token (roughly three-quarters of a word), for both input and output, so long prompts and long replies cost more.
- Because providers differ only in small details of URL and JSON shape, wrapping the call in one Python function lets you switch vendors by changing configuration.

## Transcript
So far we have used Python to move and clean data. Now we add the part that reads and writes language. And I want to remove the magic from it first, because once you see it is just an HTTP request, you'll stop being scared of it.

When you chat with any AI assistant in a browser, the website is sending a request to a server. As developers, we send that same kind of request directly from Python.

The request has four parts. One, a URL, the endpoint. Two, headers, including your API key and content type JSON. Three, a body in JSON with the model name and a list of messages. Four, some settings like the maximum number of tokens to generate and temperature.

Here is a typical body. The exact field names depend on your provider, so always check their docs, but most look very similar:

\`\`\`python
payload = {
    "model": "your-model-name",
    "max_tokens": 300,
    "temperature": 0.2,
    "messages": [
        {"role": "system", "content": "You are a polite assistant for a Kochi homestay."},
        {"role": "user", "content": "Is breakfast included in the room price?"},
    ],
}
\`\`\`

The system message is like briefing a new employee: who you are, how to talk, what not to do. The user message is the customer's actual question.

What comes back is also JSON. Somewhere inside it is the generated text, plus usage information telling you how many input and output tokens were used. That usage number is your bill, so I always log it.

Temperature controls randomness. For business automation, like extracting invoice fields or answering FAQs, keep it low, around 0 to 0.3. You want the same answer every time, not creativity.

One important habit: I put the endpoint URL, model name and key in environment variables. Dekho, when a client says "we have a contract with a different provider", I change three lines in a .env file and the code stays the same. In the next lesson we write that function properly, with timeouts and retries.`,
          },
          {
            title: "Calling an LLM API with requests: keys, timeouts and retries",
            type: "ARTICLE",
            durationMinutes: 11,
            content: `## One reliable function for every project

We will write a single helper, \`ask_llm()\`, and reuse it for the FAQ bot and the invoice summarizer. It is vendor-neutral: the endpoint, model and key come from environment variables.

### Configuration in .env

\`\`\`bash
LLM_API_URL=https://api.example-llm.com/v1/chat
LLM_MODEL=your-model-name
LLM_API_KEY=paste-your-key-here
\`\`\`

Replace the URL and model with the values from your provider's documentation.

### The helper

\`\`\`python
import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

API_URL = os.environ["LLM_API_URL"]
API_KEY = os.environ["LLM_API_KEY"]
MODEL = os.getenv("LLM_MODEL", "your-model-name")


def ask_llm(system, user, max_tokens=400, temperature=0.2, retries=3):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    for attempt in range(1, retries + 1):
        try:
            resp = requests.post(API_URL, json=payload, headers=headers, timeout=30)
        except requests.exceptions.RequestException as exc:
            print(f"Network error (attempt {attempt}): {exc}")
            time.sleep(2 ** attempt)
            continue

        if resp.status_code == 200:
            data = resp.json()
            return extract_text(data)
        if resp.status_code in (429, 500, 502, 503):
            time.sleep(2 ** attempt)
            continue
        raise RuntimeError(f"LLM API error {resp.status_code}: {resp.text[:300]}")

    raise RuntimeError("LLM API failed after retries")


def extract_text(data):
    # Adjust this to your provider's response shape.
    return data["choices"][0]["message"]["content"]
\`\`\`

### Why each part matters

- **\`os.environ[...]\`** fails loudly if a key is missing, which is better than a confusing 401 error later.
- **\`timeout=30\`** stops your script from hanging forever if the network drops. Without a timeout, \`requests\` can wait indefinitely.
- **Retries with exponential backoff** (2, 4, 8 seconds) handle rate limits (\`429\`) and temporary server errors. Do not retry \`400\` or \`401\`; those are your mistakes and retrying just wastes money.
- **\`extract_text\`** isolates the one provider-specific line. Some APIs return \`choices[0].message.content\`, others return a \`content\` list; you change only this function.

> **Tip:** Some providers expect the key in a different header (for example \`x-api-key\`). That is also a one-line change in \`headers\`.

### Log usage and cost

Most responses include a usage block with input and output token counts. Log it to a CSV:

\`\`\`python
import csv
from datetime import datetime

def log_usage(data, path="usage_log.csv"):
    usage = data.get("usage", {})
    with open(path, "a", newline="") as f:
        csv.writer(f).writerow([datetime.now().isoformat(), usage])
\`\`\`

When a client asks "how much is the AI costing us?", you will have the exact answer instead of a guess.

### Test it

\`\`\`python
print(ask_llm("Reply in one short sentence.", "What is UPI?"))
\`\`\`

If you get a sensible sentence back, your pipeline from Python to the model and back is working.`,
          },
          {
            title: "Prompt design and getting reliable JSON outputs",
            type: "ARTICLE",
            durationMinutes: 12,
            content: `## Prompts are specifications, not wishes

In automation, the model's output is read by code, not just by humans. So a prompt must be as precise as a function spec: the role, the task, the rules, and the exact output format.

### A prompt structure that works

1. **Role and context:** who the model is and who it serves.
2. **Task:** one clear job.
3. **Rules:** what to do when information is missing, tone, language.
4. **Output format:** exact JSON keys and types.
5. **Input data:** clearly separated, for example inside \`<invoice>\` tags.

### Example: extract fields from an invoice

\`\`\`python
SYSTEM = """You extract data from Indian GST invoices for an accounting firm.
Return ONLY a JSON object, no explanation, with exactly these keys:
- vendor_name (string)
- invoice_number (string)
- invoice_date (string, format YYYY-MM-DD)
- gstin (string or null)
- taxable_value (number)
- total_gst (number)
- grand_total (number)
If a value is not present in the text, use null. Never guess numbers."""

def build_user_prompt(invoice_text):
    return f"<invoice>\\n{invoice_text}\\n</invoice>"
\`\`\`

Note the instruction **"Never guess numbers"** and the explicit **null** rule. Without them, models sometimes invent a plausible GSTIN, which is a serious problem in accounting work.

### Parse and validate the JSON

Even with good prompts, always validate. Models occasionally wrap JSON in a code fence or add a sentence before it.

\`\`\`python
import json
import re

REQUIRED = ["vendor_name", "invoice_number", "invoice_date",
            "gstin", "taxable_value", "total_gst", "grand_total"]

def parse_json(text):
    match = re.search(r"\\{.*\\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found")
    data = json.loads(match.group(0))
    missing = [k for k in REQUIRED if k not in data]
    if missing:
        raise ValueError(f"Missing keys: {missing}")
    return data
\`\`\`

Then add a business check:

\`\`\`python
def check_totals(d):
    if None in (d["taxable_value"], d["total_gst"], d["grand_total"]):
        return "needs_review"
    diff = abs(d["taxable_value"] + d["total_gst"] - d["grand_total"])
    return "ok" if diff < 1 else "needs_review"
\`\`\`

If the numbers don't add up, flag the invoice for a human. This is how you build automations accountants actually trust.

### Many providers support structured output

Many APIs offer a "JSON mode" or a schema option that forces valid JSON. Use it when available, but **keep your validation anyway**. Valid JSON can still contain wrong values.

### Few-shot examples

If outputs are inconsistent, add one short example input and its exact expected output to the system prompt.

### Prompt checklist

- One task per call; split big jobs into steps.
- Tell the model what to do when data is missing.
- Specify language and tone for customer-facing replies (for example, "reply in the customer's language: English, Tamil or Malayalam").
- Keep temperature low for extraction.
- Version your prompts in code (\`PROMPT_V2\`) so you can compare results when you change them.

> **Tip:** Save 20 real examples and their correct outputs as a test set. Every time you edit a prompt, run all 20 and count how many still pass. That number is how you prove quality to a client.`,
          },
          {
            title: "Check-in: APIs, prompts and JSON",
            type: "QUIZ",
            durationMinutes: 7,
            content: `These questions are about the decisions that make LLM automations reliable and cheap. Think like the person who will be called when the script fails at 9 AM on a Monday.`,
            quiz: {
              questions: [
                {
                  prompt: "Your script gets HTTP 429 from the LLM API. What should ask_llm() do?",
                  options: [
                    "Raise an error immediately and stop",
                    "Wait with exponential backoff and retry a limited number of times",
                    "Retry instantly in an infinite loop",
                    "Switch temperature to 1.0 and resend",
                  ],
                  correct: 1,
                  explanation:
                    "429 means rate limited. Backing off (2s, 4s, 8s) and retrying a few times is the standard fix; infinite instant retries make it worse.",
                },
                {
                  prompt: "Why use a low temperature (0 to 0.3) for invoice field extraction?",
                  options: [
                    "It makes the API cheaper per token",
                    "It allows longer outputs",
                    "It produces more consistent, less random outputs for the same input",
                    "It is required for JSON mode",
                  ],
                  correct: 2,
                  explanation:
                    "Temperature controls randomness. Extraction needs the same answer every run; pricing and output length are unaffected.",
                },
                {
                  prompt:
                    "The model returns valid JSON where taxable_value + total_gst differs from grand_total by Rs 900. What is the best handling?",
                  options: [
                    "Trust the JSON since it parsed successfully",
                    "Overwrite grand_total with the sum",
                    "Delete the invoice from the batch",
                    "Mark it needs_review so a human checks it",
                  ],
                  correct: 3,
                  explanation:
                    "Valid JSON can still hold wrong values. A business-rule check that flags mismatches for human review is what makes accountants trust the system.",
                },
                {
                  prompt: "Which change makes your code easiest to move to a different LLM provider?",
                  options: [
                    "Keep URL, model and key in environment variables and isolate response parsing in one function",
                    "Copy the provider's sample code into every script",
                    "Hard-code the model name so it can't change accidentally",
                    "Use a higher max_tokens value",
                  ],
                  correct: 0,
                  explanation:
                    "Configuration in .env plus a single extract_text() function means a vendor switch touches a few lines instead of every script.",
                },
                {
                  prompt: "Why does the extraction prompt say \"If a value is not present, use null. Never guess numbers.\"?",
                  options: [
                    "JSON cannot store empty strings",
                    "Without it, the model may invent plausible but false values like a fake GSTIN",
                    "It reduces the number of input tokens",
                    "It is needed for requests to send the payload",
                  ],
                  correct: 1,
                  explanation:
                    "Models fill gaps with plausible text if allowed. Explicit missing-data rules prevent hallucinated values in financial records.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Projects: FAQ bot and invoice summarizer",
        lessons: [
          {
            title: "Building a WhatsApp-style FAQ bot for a Kochi homestay",
            type: "VIDEO",
            durationMinutes: 14,
            content: `## Key points
- A good FAQ bot answers only from the owner's own information, so you pass the FAQ sheet into the prompt and tell the model to say "I'll check with the owner" when the answer isn't there.
- Keep the FAQ in a simple Excel or Google Sheet the owner can edit without touching code.
- Shortlist the most relevant FAQ rows before calling the model to keep prompts short and costs low.
- Build and test the bot in the terminal first; connecting it to WhatsApp Business through an official API provider is a separate integration step.
- Log every question the bot could not answer, because that list tells the owner which FAQs to add next.

## Transcript
Our first project client is Meera chechi, who runs a six-room homestay near Fort Kochi. During the season she gets eighty to a hundred WhatsApp messages a day, and most are the same ten questions: check-in time, is breakfast included, how far is the beach, do you allow pets, how do I pay.

She keeps the answers in an Excel file with two columns, question and answer. That file is our knowledge base. Let's load it and pick the rows most related to the guest's message.

\`\`\`python
import pandas as pd

faq = pd.read_excel("homestay_faq.xlsx")

def shortlist(message, k=5):
    words = set(message.lower().split())
    scores = faq["question"].str.lower().apply(
        lambda q: len(words & set(q.split()))
    )
    return faq.loc[scores.nlargest(k).index]

def answer(message):
    rows = shortlist(message)
    context = "\\n".join(f"Q: {q}\\nA: {a}" for q, a in zip(rows["question"], rows["answer"]))
    system = (
        "You reply to guests of Sea Breeze Homestay, Fort Kochi, on WhatsApp. "
        "Answer ONLY using the FAQ below. Keep replies under 60 words, warm and polite. "
        "Reply in the same language the guest used. If the FAQ does not cover it, reply "
        "exactly: I'll check with Meera and get back to you shortly.\\n\\n" + context
    )
    return ask_llm(system, message, max_tokens=150)
\`\`\`

The shortlist is simple keyword overlap, and for a sixty-row FAQ it works surprisingly well. You can upgrade to embeddings later, but don't over-engineer for a homestay.

Now, the most important line is "Answer ONLY using the FAQ". Without it, the bot might confidently say "yes, we have a swimming pool" because many homestays do. That one hallucination can mean an angry guest and a one-star review.

Test in a loop in the terminal, try English, try Malayalam, try something not in the FAQ like "can you arrange a houseboat?" and check that it falls back politely.

When you go live, you'll connect this function to WhatsApp Business through Meta's official Cloud API or an approved provider, which sends each incoming message to a small web server you host. That's an integration job; the brain is this answer function. Chalo, now let's build project two.`,
          },
          {
            title: "Building the invoice summarizer end to end",
            type: "ARTICLE",
            durationMinutes: 12,
            content: `## The client problem

**Reddy and Associates**, a small CA firm in Hyderabad, receives invoices from clients as PDFs, photos and forwarded emails. Juniors type vendor, date, GSTIN and amounts into Excel by hand. In March, that is hundreds of invoices. We will automate the typing and leave the checking to humans.

### Pipeline overview

1. **Get text** from each invoice into a \`.txt\` file (from PDF text extraction or the OCR tool the firm already uses).
2. **Extract fields** with \`ask_llm()\` and the JSON prompt from Module 3.
3. **Validate** JSON and totals.
4. **Write** an Excel summary with a review column.

### The main loop

\`\`\`python
from pathlib import Path
import pandas as pd

rows = []
for path in sorted(Path("invoices").glob("*.txt")):
    text = path.read_text(encoding="utf-8")
    try:
        raw = ask_llm(SYSTEM, build_user_prompt(text), max_tokens=300, temperature=0)
        data = parse_json(raw)
        data["status"] = check_totals(data)
    except Exception as exc:
        data = {k: None for k in REQUIRED}
        data["status"] = f"error: {exc}"
    data["source_file"] = path.name
    rows.append(data)
    print(f"{path.name}: {data['status']}")

df = pd.DataFrame(rows)
\`\`\`

One failing invoice never stops the batch; it just gets an error status.

### Add the summary the partner wants

\`\`\`python
df["invoice_date"] = pd.to_datetime(df["invoice_date"], errors="coerce")
ok = df[df["status"] == "ok"]

vendor_summary = (
    ok.groupby("vendor_name", as_index=False)
    .agg(invoices=("invoice_number", "count"),
         taxable=("taxable_value", "sum"),
         gst=("total_gst", "sum"),
         total=("grand_total", "sum"))
    .sort_values("total", ascending=False)
)
review = df[df["status"] != "ok"]

with pd.ExcelWriter("output/invoice_summary.xlsx", engine="openpyxl") as w:
    df.to_excel(w, sheet_name="All invoices", index=False)
    vendor_summary.to_excel(w, sheet_name="By vendor", index=False)
    review.to_excel(w, sheet_name="Needs review", index=False)
\`\`\`

Then reuse your openpyxl formatting function from Module 2.

### Validate GSTINs cheaply

A GSTIN has a fixed 15-character pattern. Check it with code, not with the model:

\`\`\`python
import re
GSTIN_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")
df["gstin_valid"] = df["gstin"].fillna("").str.match(GSTIN_RE)
\`\`\`

> **Tip:** Use code for anything rule-based (formats, sums, dates) and the model only for reading messy text. It is cheaper, faster and fully predictable.

### Measuring the result

Run 50 invoices, then have a junior check every row of the **All invoices** sheet against the originals. Count correct fields out of total fields. If you report "96% of fields correct, all errors were caught in Needs review", the partner can make an informed decision. That accuracy number, plus hours saved, is what goes into your case study.`,
          },
          {
            title: "Costs, privacy and handing over to a client",
            type: "ARTICLE",
            durationMinutes: 8,
            content: `## Shipping is more than working code

Your script works on your laptop. Here is what turns it into a deliverable a client will pay for and keep using.

### 1. Estimate API cost before you quote

Count roughly: one invoice is about 600 input tokens and 150 output tokens. Multiply by monthly volume, then by your provider's published per-token prices. Add a 30% buffer for retries and longer documents. Share the estimate in rupees per month, for example "about ₹400 to ₹700 per month at 1,000 invoices". Clients hate surprise bills more than they hate the bill itself.

> **Tip:** Ask the client to create the API account and billing in **their own name**, then share a key with you. They own the account, the usage and the data relationship.

### 2. Respect privacy

Invoices and guest chats contain personal and financial data.

- Send only the text needed for the task; don't attach whole email threads.
- Read your provider's data usage and retention policy and tell the client in plain words what it says.
- Keep outputs in the client's own folder or drive, not on your personal laptop.
- Delete local test copies when the project ends.

India's **Digital Personal Data Protection Act, 2023** makes businesses responsible for how personal data is processed, so this is not just politeness; it protects your client.

### 3. Make it runnable without you

- \`requirements.txt\` with pinned versions.
- A \`.env.example\` file listing every variable name without real values.
- A \`README.md\` with three sections: setup, how to run, what to do when it shows an error.
- One command to run: \`python run.py\`. Non-technical users should never edit code.

### 4. Hand over properly

Record a 5 to 10 minute screen recording walking through setup and a real run. Do a live session with the person who will use it daily, and let them run it while you watch. Most "bugs" reported after handover are actually setup steps nobody demonstrated.

### 5. Offer maintenance

APIs change, files change, and prompts drift. A simple monthly retainer, such as ₹1,500 to ₹3,000 for monitoring and small fixes, gives the client peace of mind and gives you recurring income. Many of my long-term clients started with one ₹8,000 script and a retainer.

### Handover checklist

- Cost estimate shared in rupees
- Client owns the API account
- Secrets in \`.env\`, never in code or chat
- README and recording delivered
- Retainer terms written in the invoice or email`,
          },
          {
            title: "Capstone: Ship an AI automation for a real business",
            type: "ASSIGNMENT",
            durationMinutes: 90,
            content: `This capstone is your first portfolio piece in AI automation. Treat it like client work: a working tool, clear documentation and honest accuracy numbers are what convince a business owner to hire you.`,
            assignment: {
              brief: `## Choose one project

**Option A: FAQ bot.** Pick a real or realistic small business (a Kochi homestay, a Pune coaching centre, a Jaipur bakery). Write a 25+ row FAQ in Excel and build a terminal FAQ bot using \`ask_llm()\` that answers only from that FAQ and falls back politely when it can't.

**Option B: Invoice summarizer.** Create 20+ sample invoice text files (vary vendors, formats and include 3 deliberately broken ones). Build the extraction, validation and multi-sheet Excel summary pipeline.

## Requirements

1. Vendor-neutral API helper with URL, model and key loaded from environment variables, a timeout and retries.
2. A prompt with explicit output format and missing-data rules.
3. Validation in code (JSON keys for Option B; fallback detection for Option A).
4. A test set of at least 15 inputs with expected outputs, and a script that reports how many pass.
5. A \`README.md\` with setup, usage, estimated monthly API cost in rupees, and a short privacy note.

## Deliverable

A public GitHub repository link. Do **not** commit your \`.env\` file; include \`.env.example\` instead. Add a 2 to 3 minute screen recording link in the README.

## Tips

- Start with the test set; it tells you when you're done.
- Keep temperature low and log token usage.
- Write the README as if the owner, not a developer, will read it.`,
              rubric: [
                { criterion: "Working pipeline with a clean, reusable API helper (env vars, timeout, retries)", points: 30 },
                { criterion: "Prompt quality and validation logic that prevent made-up answers", points: 25 },
                { criterion: "Test set with a measured pass rate reported honestly", points: 20 },
                { criterion: "README with cost estimate, privacy note and owner-friendly instructions", points: 15 },
                { criterion: "No secrets committed; repository is tidy", points: 10 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
    ],
  },
  {
    slug: "no-code-ai-workflows",
    title: "No-code AI Workflows for Small Businesses",
    subtitle: "Build Zapier and Make style automations with Google Sheets and AI, no coding needed",
    description:
      "Learn to connect forms, Google Sheets, email and AI into workflows that reply to leads, sort enquiries and send follow-ups on their own. Rahul walks you through real setups for a Jaipur bakery and an Indore coaching institute, then shows you how to package and price this as a service. Perfect for commerce, BBA and arts students who want a practical, sellable skill.",
    level: "BEGINNER",
    languages: ["en", "hi", "hinglish"],
    cover: { from: "#EA580C", to: "#DB2777", pattern: "waves" },
    mentorId: "m_2",
    priceINR: 999,
    rating: 4.6,
    ratingsCount: 642,
    studentsCount: 5210,
    createdDaysAgo: 58,
    skills: ["Workflow automation", "Zapier", "Make", "Google Sheets", "Prompt templates", "Client pitching"],
    whatYouBuild: [
      "A lead-capture workflow: Google Form to Sheet to AI-drafted reply email",
      "A reusable prompt template library for common small-business messages",
      "A one-page automation service proposal with pricing for a local client",
    ],
    requirements: [
      "A laptop or desktop with Chrome",
      "A free Google account",
      "Free accounts on Zapier or Make (we use free tiers only)",
    ],
    modules: [
      {
        title: "Automation thinking: triggers and actions",
        lessons: [
          {
            title: "Triggers, actions and your first workflow",
            type: "VIDEO",
            durationMinutes: 8,
            isPreview: true,
            content: `## Key points
- Every no-code workflow is a trigger (something happens) followed by one or more actions (things the tool does automatically).
- Zapier calls a workflow a Zap, and Make calls it a scenario, but the idea is identical.
- Start with workflows that run many times a week, because small time savings multiply quickly.
- Free tiers have limits on tasks and steps, so design lean workflows before you pay for anything.

## Transcript
Namaste doston! Main Rahul hoon. I build web apps for clients, but honestly, some of my happiest clients never needed an app. They needed three apps talking to each other.

Take Kavya, who runs a home bakery in Jaipur. Customers fill a Google Form for cake orders. She used to open the sheet, copy each order, and type a confirmation on WhatsApp or email. Twenty orders a day, that's an hour gone.

The automation: trigger is "new row in Google Sheet". Action one: send the order details to an AI step to draft a friendly confirmation. Action two: email it to the customer. Action three: add a row to her baking schedule sheet. Ab dekho, she just bakes.

That's the whole mental model. When X happens, do Y and Z. Once you see it, you'll spot automations everywhere.`,
          },
          {
            title: "Mapping a small business workflow before you build",
            type: "ARTICLE",
            durationMinutes: 6,
            isPreview: true,
            content: `## Map first, click later

Beginners open Zapier and start clicking. Professionals spend fifteen minutes on paper first.

### Ask the owner four questions

1. **What repetitive task takes the most time each week?**
2. **Where does the data start?** (Google Form, Instagram DM, email, Razorpay payment)
3. **Where should it end up?** (Sheet, email, WhatsApp Business, invoice)
4. **What decision does a human make in between?**

### Write it as trigger and actions

For an Indore coaching institute:

- **Trigger:** new enquiry submitted on the website form
- **Action:** add row to "Leads" Google Sheet
- **Action:** AI drafts a reply with batch timings for the course asked about
- **Action:** send the email, and notify the counsellor on Slack or email

> **Tip:** Mark which step needs human approval. For anything involving money or refunds, keep a person in the loop.

### Estimate the value

Minutes per task × tasks per week × 4 = minutes saved per month. If it's 10 hours, you can confidently quote ₹3,000 to ₹6,000 for the setup.`,
          },
          {
            title: "Quiz: thinking in workflows",
            type: "QUIZ",
            durationMinutes: 4,
            content: `Three quick questions to check you can break a business task into triggers and actions.`,
            quiz: {
              questions: [
                {
                  prompt: "In \"When a Razorpay payment succeeds, add the customer to a Sheet and email a receipt\", what is the trigger?",
                  options: [
                    "Adding the customer to the Sheet",
                    "Emailing the receipt",
                    "The Razorpay payment succeeding",
                    "Opening Zapier",
                  ],
                  correct: 2,
                  explanation: "The trigger is the event that starts the workflow; the Sheet row and email are actions.",
                },
                {
                  prompt: "Which task is the best first automation for a small business?",
                  options: [
                    "A task that happens many times a week and follows the same steps",
                    "A yearly tax filing",
                    "Deciding new product prices",
                    "Negotiating with a supplier",
                  ],
                  correct: 0,
                  explanation: "High-frequency, rule-based tasks give the biggest time savings and are easiest to automate.",
                },
                {
                  prompt: "A workflow issues refunds based on AI reading complaint emails. What should you add?",
                  options: [
                    "Nothing, AI is accurate enough",
                    "A human approval step before any refund is processed",
                    "A second AI step to double the speed",
                    "Remove the Google Sheet log",
                  ],
                  correct: 1,
                  explanation: "Money decisions need a human in the loop; AI can draft and sort, but a person approves.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Google Sheets and AI prompt templates",
        lessons: [
          {
            title: "Form to Sheet to AI reply: building the lead workflow",
            type: "VIDEO",
            durationMinutes: 12,
            content: `## Key points
- Google Forms writes each response into a linked Google Sheet automatically, which makes the Sheet a perfect trigger.
- In Zapier or Make, map Sheet columns like name, course and phone into the AI step as variables.
- Add a status column in the Sheet so you can see which leads were replied to and which failed.
- Always run the workflow on test rows before switching it on for real customers.

## Transcript
Chalo, let's build the coaching institute workflow live. I've made a Google Form with name, email, phone, course interested in, and preferred batch. Responses go to a Sheet called Leads.

In Zapier, trigger: Google Sheets, "New Spreadsheet Row", pick the Leads sheet. Test it, and you'll see my test row come through with every column.

Next, the AI step. Most no-code tools now have a built-in AI action, or you can connect an AI provider with an API key. In the prompt box, I insert the mapped fields, like the name and course from the row. Notice I'm not typing the name, I'm inserting the variable, so every lead gets their own reply.

Then Gmail, "Send Email", with the AI output as body. Last step, update the row's Status column to "Replied".

Test with your own email first. Bilkul real customer pe test mat karna!`,
          },
          {
            title: "Writing prompt templates that sound like the business",
            type: "ARTICLE",
            durationMinutes: 7,
            content: `## A template, not a one-off prompt

In automation, the same prompt runs hundreds of times with different data. So write it like a form letter with blanks, written in \`{curly_braces}\` here to show where your tool inserts Sheet columns.

### A lead reply template

\`\`\`text
You are the front desk of Shiksha Classes, Indore.
Write a short, friendly email reply (under 120 words) to {name},
who enquired about {course} for the {batch} batch.
Facts you may use: fees and batch timings are listed below.
{course_facts}
Rules: Do not promise discounts. Do not invent timings.
End with: Call us at 98XXX-XXXXX or reply to this email.
\`\`\`

### What makes it work

- **Identity:** the business name and role, so the tone fits.
- **Length limit:** stops long, robotic emails.
- **Facts block:** pulled from a "Courses" Sheet, so the AI doesn't guess fees.
- **Rules:** what never to say.

> **Tip:** Keep a "Prompt Library" Google Doc with your best templates: order confirmation, lead reply, review thank-you, payment reminder. You'll reuse them across clients.

Test each template on five varied rows before going live, including one with a missing field.`,
          },
          {
            title: "Assignment: Build a lead reply workflow",
            type: "ASSIGNMENT",
            durationMinutes: 45,
            content: `Lead replies are the easiest automation to sell, because every business owner knows that a slow reply loses a customer. Building one end to end gives you a live demo for your pitch.`,
            assignment: {
              brief: `## Task

Build a workflow for a local business of your choice (a Jaipur bakery, a Pune gym, a Kochi homestay):

1. A Google Form for enquiries, linked to a Google Sheet.
2. A Zapier Zap or Make scenario: new row, then an AI step using a prompt template with at least 3 mapped fields, then email the reply.
3. A Status column updated to "Replied" after sending.

## Deliverable

Paste in the text box: your prompt template, a short description of each step, and 3 sample AI replies from test rows (one with a missing field).

## Tips

- Use only your own email for testing.
- Add a "never invent prices" rule.`,
              rubric: [
                { criterion: "Workflow has correct trigger and actions with mapped fields", points: 40 },
                { criterion: "Prompt template has identity, facts, rules and length limit", points: 35 },
                { criterion: "Sample replies are accurate and handle the missing field gracefully", points: 25 },
              ],
              submissionType: "TEXT",
            },
          },
        ],
      },
      {
        title: "Selling automation as a service",
        lessons: [
          {
            title: "Finding your first automation clients",
            type: "ARTICLE",
            durationMinutes: 6,
            content: `## Start close to home

Your first clients are probably within 5 km of you: coaching centres, clinics, salons, bakeries, CA offices. They feel the pain of repetitive work but don't know automation exists.

### A simple outreach plan

1. **List 20 businesses** you can visit or message on Instagram or WhatsApp Business.
2. **Spot one visible pain:** slow DM replies, manual order lists, no follow-up after enquiries.
3. **Send a short message:** "I noticed enquiries on your Instagram get replied to the next day. I set up auto-replies with order tracking for a Jaipur bakery; can I show you a 5-minute demo?"
4. **Demo your assignment workflow** on their own sample data.

> **Tip:** Offer the first setup at a lower price in exchange for a testimonial and permission to share the results on LinkedIn.

Also list your service on Internshala gigs, LinkedIn posts and freelancing platforms, with a short screen recording of your workflow in action.`,
          },
          {
            title: "Pricing setups and monthly retainers",
            type: "VIDEO",
            durationMinutes: 9,
            content: `## Key points
- Price by value delivered, starting from hours saved per month, not by how long the setup took you.
- Split pricing into a one-time setup fee and a small monthly retainer for monitoring and changes.
- Tool subscriptions and AI usage should be paid by the client on their own accounts.
- Put scope in writing: which workflows, how many changes per month, and response time.

## Transcript
Pricing pe sabse zyada confusion hota hai, so let's make it simple.

Say the bakery saves ten hours a month. If the owner values her time at even ₹300 an hour, that's ₹3,000 a month saved. A setup fee of ₹4,000 to ₹6,000 pays for itself in two months. Easy yes.

Then the retainer: ₹800 to ₹1,500 per month to monitor runs, fix broken steps when a form changes, and tweak prompts. Workflows break quietly, and owners happily pay someone to watch them.

One rule: the Zapier or Make plan and AI credits should be on the client's account and card. You never want to be paying their bills or holding their data.`,
          },
          {
            title: "Assignment: Write your automation service proposal",
            type: "ASSIGNMENT",
            durationMinutes: 40,
            content: `A clear one-page proposal is what turns a nice demo into a paid project. Owners decide fast when scope, price and outcome are written plainly.`,
            assignment: {
              brief: `## Task

Write a one-page proposal for a real or realistic local business.

## Include

1. **The problem** in the owner's words and the hours it costs per month.
2. **The workflow:** trigger and actions, tools used.
3. **Pricing:** setup fee and monthly retainer in ₹, and which costs the client pays directly.
4. **Scope:** what's included, number of revisions, support response time.
5. **Next step:** a clear call to action.

## Deliverable

Paste the proposal text in the submission box (under 400 words).`,
              rubric: [
                { criterion: "Problem and value are quantified clearly", points: 30 },
                { criterion: "Workflow is realistic and well explained", points: 25 },
                { criterion: "Pricing and scope are specific and fair", points: 30 },
                { criterion: "Writing is concise and professional", points: 15 },
              ],
              submissionType: "TEXT",
            },
          },
        ],
      },
    ],
  },
];
