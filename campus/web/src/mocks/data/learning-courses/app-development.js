/** App Development courses — seed content for the Campus demo. */

const flutterFirstApp = {
  slug: "flutter-first-app",
  title: "Flutter from Zero: Your First Android App",
  subtitle: "Learn Dart and Flutter by shipping a real expense tracker to the Play Store",
  description:
    "Start with zero Dart and finish with a signed Android app live on the Play Store. Kiran walks you through Dart, widgets, layouts, state, navigation and forms the way he uses them on paid client work, then you build a polished expense tracker step by step. Every module ends with something you can show a recruiter or a first client.",
  level: "BEGINNER",
  languages: ["en", "hi", "mr"],
  cover: { from: "#0D47A1", to: "#00BFA5", pattern: "waves" },
  mentorId: "m_7",
  priceINR: 1499,
  rating: 4.8,
  ratingsCount: 2143,
  studentsCount: 15870,
  createdDaysAgo: 164,
  skills: ["Dart", "Flutter", "Widgets & Layouts", "State Management", "Navigation & Forms", "Local Storage", "Play Store Publishing"],
  whatYouBuild: [
    "A bakery menu screen for a Jaipur shop using Rows, Columns, Cards and ListView",
    "A multi-screen expense tracker with add/edit forms and input validation",
    "Offline storage of expenses with shared_preferences and JSON",
    "A signed release App Bundle uploaded to Google Play Console for testing",
  ],
  requirements: [
    "A laptop with 8GB RAM (Windows, macOS or Linux) and about 15GB free disk space",
    "An Android phone with a USB cable, or patience for the emulator",
    "No prior coding needed, but you should be comfortable installing software",
  ],
  modules: [
    {
      title: "Dart Basics: The Language Behind Flutter",
      lessons: [
        {
          title: "Why Flutter, and setting up your machine",
          type: "VIDEO",
          durationMinutes: 11,
          isPreview: true,
          content: `## Key points
- Flutter lets you build Android, iOS and web apps from one Dart codebase, which is why small Indian startups and agencies love it.
- You need three things installed: the Flutter SDK, Android Studio (for the Android SDK and emulator) and VS Code with the Flutter extension.
- \`flutter doctor\` is your best friend; it tells you exactly which piece of the setup is missing.
- Enable Developer Options and USB debugging on your phone to run apps on a real device, which is faster than the emulator on low-RAM laptops.
- \`flutter create\` generates a working counter app, and hot reload (press \`r\`) shows your changes in under a second.

## Transcript
Namaste everyone, I'm Kiran. Over the last eight years I've shipped more than thirty apps with Flutter, from a delivery app for a Nashik grocery chain to a booking app for a Pune fitness studio. Almost every one of those started exactly the way we'll start today: an empty folder and one command.

Why Flutter? Dekho, most clients in India have a small budget. They want Android first, iOS maybe later. With Flutter I write the code once in Dart and I can ship both, plus a web version if they ask. That is a real cost saving you can pitch to clients.

Chalo, setup. Download the Flutter SDK from the official site and unzip it somewhere without spaces in the path, like \`C:\\src\\flutter\`. Add its \`bin\` folder to your PATH. Then install Android Studio, open the SDK Manager once, and accept the licences. Finally install VS Code and the Flutter extension.

Now open a terminal and run this:

\`\`\`bash
flutter doctor
flutter doctor --android-licenses
flutter create hello_kiran
cd hello_kiran
flutter run
\`\`\`

If \`flutter doctor\` shows a red cross, read the message slowly. Ninety percent of the time it is a missing licence or Android Studio not found. On a 4 or 8GB laptop, I strongly suggest using your own phone instead of the emulator. Go to Settings, About phone, tap Build number seven times, then turn on USB debugging.

When the counter app opens on your phone, change the title text in \`lib/main.dart\`, save, and press \`r\` in the terminal. That instant update is hot reload, and it is the reason you will enjoy this course. See you in the next lesson.`,
        },
        {
          title: "Dart essentials: variables, types and null safety",
          type: "ARTICLE",
          durationMinutes: 10,
          isPreview: true,
          content: `## Dart in one sentence

Dart is a typed, object-oriented language that feels familiar if you have seen Java, JavaScript or C. You can practise everything in this article on **dartpad.dev** without installing anything.

## Variables: var, final and const

Every Dart program starts at \`main()\`. Inside it you declare variables in three main ways:

\`\`\`dart
void main() {
  var city = 'Pune';          // type inferred as String
  final int orders = 42;      // assigned once, can be decided at runtime
  const gstRate = 0.18;       // compile-time constant
  double price = 1499;        // ints are promoted to double here

  print('Course in $city costs Rs. $price');
  final total = price * (1 + gstRate);
  print('With GST: Rs. $total');
}
\`\`\`

- Use \`final\` by default for values that should not change after being set.
- Use \`const\` for values known while writing code, like tax rates or padding sizes. Flutter rewards \`const\` with better performance.
- Use \`var\` or an explicit type only when the value will change.

> **Tip:** \`$name\` inserts a variable into a string. For anything more complex than a plain variable, compute it into a local variable first (like \`total\` above) and insert that; it keeps strings readable.

## The core types

- \`int\` and \`double\` for numbers, \`num\` if you accept either.
- \`String\` for text, with single or double quotes.
- \`bool\` for \`true\` / \`false\`.
- \`List<T>\` for ordered items and \`Map<K, V>\` for key-value pairs.

\`\`\`dart
final menu = <String>['Samosa', 'Vada Pav', 'Poha'];
final prices = <String, int>{'Samosa': 20, 'Vada Pav': 25, 'Poha': 30};

for (final item in menu) {
  final itemPrice = prices[item];
  print('$item: Rs. $itemPrice');
}
\`\`\`

## Null safety: the feature that saves your app

In Dart, a normal variable **cannot be null**. If something might be missing, you say so with a \`?\`:

\`\`\`dart
String? upiId;                    // may be null
print(upiId?.length);             // safe access, prints null
print(upiId ?? 'UPI not set');    // fallback value
upiId = 'kiran@okaxis';
print(upiId!.toUpperCase());      // ! means "trust me, not null"
\`\`\`

The compiler forces you to handle the null case before using the value. That one rule removes the most common crash in Android apps: the null pointer exception.

### Rules of thumb

1. Prefer \`?.\` and \`??\` over \`!\`. Every \`!\` is a promise; break it and the app crashes.
2. Use \`late\` only when a value is guaranteed to be set before it is read, such as in \`initState\`.
3. Keep types explicit in public APIs (function parameters, class fields) and let inference handle local variables.

Try changing \`upiId\` back to \`null\` before the last line and watch DartPad throw the error. Breaking things on purpose is how these rules stick.`,
        },
        {
          title: "Functions, classes and async code in Dart",
          type: "ARTICLE",
          durationMinutes: 12,
          content: `## Functions

Functions in Dart have a return type, a name and parameters. Short ones can use the arrow syntax:

\`\`\`dart
double addGst(double amount, {double rate = 0.18}) => amount * (1 + rate);

String greet(String name, [String? city]) {
  return city == null ? 'Hi $name' : 'Hi $name from $city';
}

void main() {
  print(addGst(1000));             // 1180.0
  print(addGst(1000, rate: 0.05)); // 1050.0
  print(greet('Asha', 'Nagpur'));
}
\`\`\`

- **Named parameters** go inside \`{}\` and are passed as \`rate: 0.05\`. Flutter uses them everywhere.
- Mark a named parameter \`required\` if the caller must supply it.
- **Optional positional parameters** go inside \`[]\`.

## Classes

Our expense tracker will revolve around one class. Here is a first version:

\`\`\`dart
class Expense {
  final String title;
  final double amount;
  final DateTime date;
  final String category;

  const Expense({
    required this.title,
    required this.amount,
    required this.date,
    this.category = 'Other',
  });

  bool get isBig => amount >= 1000;

  Expense copyWith({String? title, double? amount}) => Expense(
        title: title ?? this.title,
        amount: amount ?? this.amount,
        date: date,
        category: category,
      );
}
\`\`\`

Things to notice:

- \`this.title\` in the constructor assigns the field directly, no boilerplate.
- A **getter** (\`isBig\`) looks like a field but is computed.
- \`copyWith\` returns a modified copy instead of changing the original. Immutable objects make Flutter state much easier to reason about.

### Inheritance in one line

\`class FoodExpense extends Expense\` reuses everything from \`Expense\`. In Flutter you will mostly *extend* \`StatelessWidget\` or \`StatefulWidget\` rather than build deep hierarchies yourself.

## Async: Future, async and await

Network calls and disk reads take time. Dart represents a value that arrives later as a \`Future\`:

\`\`\`dart
Future<double> fetchTodaySpend() async {
  await Future.delayed(const Duration(seconds: 1)); // pretend network call
  return 845.5;
}

Future<void> main() async {
  print('Loading...');
  final spend = await fetchTodaySpend();
  print('Today you spent Rs. $spend');
}
\`\`\`

- Mark a function \`async\` to use \`await\` inside it.
- \`await\` pauses *that function* only; the UI keeps running smoothly.
- Wrap risky calls in \`try { ... } catch (e) { ... }\` so a failed request shows a friendly message instead of crashing.

> **Tip:** If you forget \`await\`, you get a \`Future<double>\` instead of a \`double\`. When a value prints as "Instance of Future", that is the bug.

Practise by writing a \`totalFor(List<Expense> items)\` function that adds up all amounts. Hint: \`items.fold(0.0, (sum, e) => sum + e.amount)\`.`,
        },
        {
          title: "Quiz: Dart fundamentals",
          type: "QUIZ",
          durationMinutes: 6,
          content: `Five questions on variables, null safety, functions and async. If you miss one, revisit the article and try the snippet in DartPad.`,
          quiz: {
            questions: [
              {
                prompt: "You fetch a user's name from a server once when a screen opens and never change it. Which declaration fits best?",
                options: ["const name = await fetchName();", "final name = await fetchName();", "var name = await fetchName();", "String name; // assign later"],
                correct: 1,
                explanation: "final is for values set once at runtime. const only works for values known at compile time, so it cannot hold a network result.",
              },
              {
                prompt: "Given String? phone; what does print(phone ?? 'Not added') print when phone is null?",
                options: ["null", "An error is thrown", "Not added", "An empty string"],
                correct: 2,
                explanation: "The ?? operator returns the right-hand value whenever the left side is null.",
              },
              {
                prompt: "Why is using the ! operator on a nullable variable considered risky?",
                options: [
                  "It makes the app slower",
                  "It is not allowed inside classes",
                  "It converts the value to a String",
                  "If the value is actually null at runtime, the app throws an error",
                ],
                correct: 3,
                explanation: "! tells the compiler to trust you. If the value turns out to be null, Dart throws at runtime, which is exactly the crash null safety tries to prevent.",
              },
              {
                prompt: "A function is declared as double addGst(double amount, {double rate = 0.18}). Which call is valid?",
                options: ["addGst(500, rate: 0.12)", "addGst(500, 0.12)", "addGst(rate: 0.12)", "addGst(amount: 500)"],
                correct: 0,
                explanation: "amount is positional and required; rate is named, so it must be passed as rate: value.",
              },
              {
                prompt: "You print the result of fetchTodaySpend() and see 'Instance of Future<double>'. What is the most likely fix?",
                options: [
                  "Change the return type to String",
                  "Add await before the call inside an async function",
                  "Remove the async keyword from fetchTodaySpend",
                  "Wrap the call in a for loop",
                ],
                correct: 1,
                explanation: "Without await you get the Future itself, not the value it eventually completes with.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "Widgets and Layouts",
      lessons: [
        {
          title: "Everything is a widget: StatelessWidget and the widget tree",
          type: "VIDEO",
          durationMinutes: 12,
          content: `## Key points
- In Flutter every visible thing, and many invisible ones like padding and alignment, is a widget.
- Widgets nest inside each other to form a tree; \`MaterialApp\` and \`Scaffold\` usually sit near the top.
- A \`StatelessWidget\` describes UI that depends only on its inputs, and its \`build\` method returns a widget tree.
- Mark widgets \`const\` when nothing inside changes so Flutter can skip rebuilding them.
- The widget inspector in VS Code or Android Studio shows the tree visually, which is the fastest way to debug layouts.

## Transcript
Chalo, let's delete the counter app and write our own from scratch. This is the moment Flutter usually clicks for students.

The big idea is simple: everything is a widget. Text is a widget. An icon is a widget. Padding is a widget. Even centring something is a widget called \`Center\`. You build screens by putting widgets inside widgets, like Russian dolls.

Here is the smallest real app I write for every new client project:

\`\`\`dart
import 'package:flutter/material.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kharcha',
      theme: ThemeData(colorSchemeSeed: Colors.teal, useMaterial3: true),
      home: Scaffold(
        appBar: AppBar(title: const Text('Kharcha')),
        body: const Center(child: Text('No expenses yet')),
      ),
    );
  }
}
\`\`\`

Dekho, read it from top to bottom. \`MaterialApp\` gives us theming and navigation. \`Scaffold\` gives the standard page structure: app bar, body, floating button. Inside the body we centre a text.

\`MyApp\` is a \`StatelessWidget\`. Stateless means it has no memory of its own; whatever you pass in, it draws. The \`build\` method is called whenever Flutter needs to paint it, so keep \`build\` fast and free of side effects like network calls.

Notice the \`const\` keywords. When a widget is const, Flutter knows it will never change and reuses it instead of rebuilding. Your IDE will even suggest where to add const; accept those suggestions.

Now open the Flutter inspector and click on the text. You will see the whole tree: MaterialApp, Scaffold, Center, Text. Whenever a layout looks wrong, the inspector tells you which widget is responsible. In the next lesson we will arrange many widgets using rows and columns.`,
        },
        {
          title: "Layouts that work on every phone: Row, Column, Expanded and friends",
          type: "ARTICLE",
          durationMinutes: 11,
          content: `## The layout mindset

Indian users have everything from a 5-inch budget Redmi to a large Samsung. Never place widgets at fixed pixel positions. Instead, describe **relationships**: "these go side by side", "this takes the remaining space".

## Column and Row

- \`Column\` stacks children **vertically**.
- \`Row\` places children **horizontally**.
- \`mainAxisAlignment\` controls spacing along the main direction; \`crossAxisAlignment\` controls the other direction.

\`\`\`dart
Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [
    Text('Shree Ram Bakery', style: Theme.of(context).textTheme.headlineSmall),
    const SizedBox(height: 4),
    const Text('Johari Bazaar, Jaipur'),
  ],
)
\`\`\`

> **Tip:** Use \`SizedBox(height: 8)\` or \`SizedBox(width: 8)\` for gaps. It is cleaner than padding every child.

## Expanded and Flexible

The most common beginner error is the yellow-and-black striped "RenderFlex overflowed" banner. It means children asked for more space than the row has. The fix is usually \`Expanded\`:

\`\`\`dart
Row(
  children: [
    const Icon(Icons.cake_outlined),
    const SizedBox(width: 12),
    Expanded(
      child: Text(
        'Mawa Kachori with extra dry fruits',
        overflow: TextOverflow.ellipsis,
      ),
    ),
    const Text('Rs. 40'),
  ],
)
\`\`\`

\`Expanded\` tells the text: "take whatever space is left, no more". The price stays visible on every screen size. Use \`flex: 2\` on one \`Expanded\` and \`flex: 1\` on another to split space in a ratio.

## Padding, Container and Card

- \`Padding\` adds space around one child.
- \`Container\` combines padding, margin, colour, borders and rounded corners. Use it when you need decoration, not just for spacing.
- \`Card\` gives a Material surface with elevation, perfect for list items.

\`\`\`dart
Card(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: Row(
      children: [
        const CircleAvatar(child: Icon(Icons.bakery_dining)),
        const SizedBox(width: 12),
        const Expanded(child: Text('Ghevar (250g)')),
        Text('Rs. 180', style: TextStyle(fontWeight: FontWeight.bold)),
      ],
    ),
  ),
)
\`\`\`

## Stack for overlays

\`Stack\` places children on top of each other. Use it for a "Bestseller" badge on a product image, with \`Positioned(top: 8, right: 8, ...)\` for the badge.

## A debugging checklist

1. Overflow in a Row? Wrap the flexible child in \`Expanded\`.
2. Column inside a scroll view not showing? Check you did not put an unbounded \`ListView\` inside a \`Column\` without \`Expanded\`.
3. Not sure where space comes from? Turn on "Show guidelines" in the Flutter inspector.

Master these few widgets and you can build roughly eighty percent of the screens clients will ever ask for.`,
        },
        {
          title: "Scrolling lists with ListView.builder",
          type: "VIDEO",
          durationMinutes: 10,
          content: `## Key points
- Use \`ListView.builder\` for lists of any real length because it only builds the items visible on screen.
- Keep your data in a plain Dart list of model objects, and let the builder turn each item into a widget.
- \`ListTile\` gives you a ready-made row with leading icon, title, subtitle and trailing widget.
- A \`ListView\` inside a \`Column\` must be wrapped in \`Expanded\` or it will throw an unbounded height error.
- Use \`ListView.separated\` when you want dividers between items without adding them to your data.

## Transcript
Last month a client in Jaipur, a bakery with around sixty items, asked me for a simple menu app. Sixty items is too many to write by hand, and in real apps your data comes from a list anyway. So let's learn \`ListView.builder\`.

First, the data. I keep it as a list of simple objects:

\`\`\`dart
class MenuItem {
  final String name;
  final int price;
  const MenuItem(this.name, this.price);
}

const menu = [
  MenuItem('Ghevar (250g)', 180),
  MenuItem('Mawa Kachori', 40),
  MenuItem('Pyaaz Kachori', 25),
  MenuItem('Besan Laddoo (500g)', 260),
];

ListView.builder(
  itemCount: menu.length,
  itemBuilder: (context, index) {
    final item = menu[index];
    final price = item.price;
    return ListTile(
      leading: const Icon(Icons.bakery_dining),
      title: Text(item.name),
      trailing: Text('Rs. $price'),
    );
  },
)
\`\`\`

Dekho what's happening. \`itemCount\` tells Flutter how many items exist. \`itemBuilder\` is called only for the rows currently on screen, plus a few extra. Scroll down and old rows are recycled. That is why the list stays smooth on a cheap phone even with a thousand items.

\`ListTile\` saves a lot of Row and Padding work. It has \`leading\`, \`title\`, \`subtitle\` and \`trailing\` slots, and an \`onTap\` callback we will use for navigation in the next module.

One error you will definitely see: "Vertical viewport was given unbounded height". This happens when you put a ListView directly inside a Column. The Column says "take as much as you want" and the ListView says "I want infinite". Wrap the ListView in \`Expanded\` and the problem is gone.

If you want dividers, swap to \`ListView.separated\` and return a \`Divider\` from \`separatorBuilder\`. Now go build the bakery menu in the assignment.`,
        },
        {
          title: "Assignment: Menu app for a Jaipur bakery",
          type: "ASSIGNMENT",
          durationMinutes: 75,
          content: `Small shops are some of the easiest first clients to land, and almost every one of them needs a clean menu or catalogue screen. This assignment is exactly the kind of screen you would deliver in a ₹5,000 to ₹10,000 starter project.`,
          assignment: {
            brief: `## The client

Shree Ram Bakery in Johari Bazaar, Jaipur wants a simple app their customers can open to see today's menu before calling to order on WhatsApp.

## Your task

Build a single-screen Flutter app with:

1. An \`AppBar\` with the bakery name and a phone icon in \`actions\`.
2. A header section (a \`Card\` or \`Container\`) with the address, opening hours and a short tagline.
3. A scrolling menu built with \`ListView.builder\` showing **at least 12 items** from a Dart list of model objects. Each row shows name, weight or quantity, and price in rupees.
4. A "Bestseller" badge on at least two items using \`Stack\` or a \`Chip\`.
5. No overflow errors on a small screen. Test with the emulator set to a 5-inch device or rotate your phone.

## Steps

- Create a \`MenuItem\` class with \`name\`, \`unit\`, \`price\` and \`isBestseller\` fields.
- Keep data in a separate file, \`lib/data/menu.dart\`.
- Build the screen in \`lib/screens/menu_screen.dart\` and keep \`main.dart\` short.
- Use \`const\` wherever your IDE suggests it.

## Deliverable

Push the project to a public GitHub repository. Add two screenshots (normal and small screen) to the README. Submit the repository link.

## Tips

- Pick a warm seed colour in \`ThemeData\`; bakeries look great in orange or brown tones.
- Use \`ListView.separated\` for neat dividers.
- Write the README as if the bakery owner will read it: what the app does, in two lines.`,
            rubric: [
              { criterion: "Menu list built with ListView.builder from a model class, 12+ items", points: 30 },
              { criterion: "Layout uses Row/Column/Expanded correctly with no overflow on small screens", points: 25 },
              { criterion: "Header, bestseller badges and overall visual polish", points: 20 },
              { criterion: "Clean file structure and use of const", points: 15 },
              { criterion: "README with screenshots and clear description", points: 10 },
            ],
            submissionType: "LINK",
          },
        },
      ],
    },
    {
      title: "State, Navigation and Forms",
      lessons: [
        {
          title: "Making screens interactive with StatefulWidget and setState",
          type: "VIDEO",
          durationMinutes: 13,
          content: `## Key points
- A \`StatefulWidget\` keeps data that can change over time in a separate \`State\` object.
- Call \`setState\` whenever you change that data so Flutter knows to rebuild the widget.
- Only change state inside \`setState\`; changing a field without it updates memory but not the screen.
- Use \`initState\` for one-time setup and \`dispose\` to clean up controllers and listeners.
- Keep state as low in the tree as possible so that only the part of the screen that changes gets rebuilt.

## Transcript
So far our screens just display things. Real apps react: you tap, something changes. That is state, and in Flutter the simplest tool for it is \`StatefulWidget\` with \`setState\`.

Let's build the heart of our expense tracker, a screen that adds expenses to a list and shows the total.

\`\`\`dart
class ExpenseListScreen extends StatefulWidget {
  const ExpenseListScreen({super.key});

  @override
  State<ExpenseListScreen> createState() => _ExpenseListScreenState();
}

class _ExpenseListScreenState extends State<ExpenseListScreen> {
  final List<Expense> _expenses = [];

  double get _total => _expenses.fold(0.0, (sum, e) => sum + e.amount);

  void _addSample() {
    setState(() {
      _expenses.add(Expense(title: 'Chai', amount: 15, date: DateTime.now()));
    });
  }

  @override
  Widget build(BuildContext context) {
    final total = _total.toStringAsFixed(0);
    return Scaffold(
      appBar: AppBar(title: Text('Total: Rs. $total')),
      body: ListView.builder(
        itemCount: _expenses.length,
        itemBuilder: (_, i) => ListTile(title: Text(_expenses[i].title)),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addSample,
        child: const Icon(Icons.add),
      ),
    );
  }
}
\`\`\`

Notice there are two classes. The widget itself stays immutable; the \`State\` class holds the list. When I tap the button, \`_addSample\` changes the list inside \`setState\`. That call is the signal: "data changed, please rebuild". Flutter calls \`build\` again, and the total in the app bar updates.

Try this experiment. Remove \`setState\` and just call \`_expenses.add\`. Tap the button. Nothing happens on screen, right? The data did change, but nobody told Flutter. Ek baar yeh galti karoge, phir kabhi nahi bhoologe.

Two lifecycle methods you will use often: \`initState\` runs once when the screen is created, perfect for loading saved data. \`dispose\` runs when the screen goes away; that is where you dispose text controllers. For bigger apps you will later learn Provider or Riverpod, but they are built on these same ideas.`,
        },
        {
          title: "Moving between screens: Navigator, routes and passing data",
          type: "ARTICLE",
          durationMinutes: 10,
          content: `## How navigation works

Flutter keeps screens in a **stack**. \`Navigator.push\` puts a new screen on top; \`Navigator.pop\` removes it and reveals the one below. The Android back button calls \`pop\` for you.

## Pushing a screen

\`\`\`dart
ListTile(
  title: Text(expense.title),
  onTap: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ExpenseDetailScreen(expense: expense),
      ),
    );
  },
)
\`\`\`

The data travels through the **constructor**. The detail screen simply declares what it needs:

\`\`\`dart
class ExpenseDetailScreen extends StatelessWidget {
  final Expense expense;
  const ExpenseDetailScreen({super.key, required this.expense});

  @override
  Widget build(BuildContext context) {
    final amount = expense.amount.toStringAsFixed(2);
    return Scaffold(
      appBar: AppBar(title: Text(expense.title)),
      body: Center(child: Text('Rs. $amount')),
    );
  }
}
\`\`\`

> **Tip:** Passing data through constructors keeps every screen easy to test and reuse. Avoid global variables for this.

## Getting a result back

The "Add expense" flow needs the new screen to **return** something. \`Navigator.push\` returns a \`Future\` that completes when the pushed screen pops:

\`\`\`dart
Future<void> _openAddScreen() async {
  final newExpense = await Navigator.push<Expense>(
    context,
    MaterialPageRoute(builder: (_) => const AddExpenseScreen()),
  );
  if (newExpense == null) return; // user pressed back
  setState(() => _expenses.add(newExpense));
}
\`\`\`

And on the add screen, after the user taps Save:

\`\`\`dart
Navigator.pop(context, expense);
\`\`\`

Note the null check. If the user presses back without saving, the result is \`null\`, and your code must handle that gracefully.

## Named routes vs direct routes

You will also see \`Navigator.pushNamed(context, '/settings')\` with a \`routes\` map in \`MaterialApp\`. It is fine for small apps, but passing typed data is clumsy. For larger client apps, most teams use the **go_router** package, which supports deep links like opening a specific order from a WhatsApp link.

For this course, \`MaterialPageRoute\` is all you need.

## Common mistakes

1. **Using context after an await.** If the screen was closed while waiting, \`context\` is no longer valid. Check \`if (!mounted) return;\` in a State class before using it.
2. **Pushing instead of popping.** After saving, beginners push the list screen again, creating duplicate screens in the stack. Always \`pop\` back.
3. **Replacing the login screen.** After login, use \`Navigator.pushReplacement\` so the back button does not return to the login page.

With push, pop and results, you can already build the full flow of the expense tracker: list, add, and detail.`,
        },
        {
          title: "Forms and validation that users trust",
          type: "ARTICLE",
          durationMinutes: 11,
          content: `## Why forms deserve care

Forms are where users give you data, and where most bad reviews come from: lost input, confusing errors, a number keyboard that never appears. Flutter's \`Form\` widget handles validation cleanly once you know the pattern.

## The pattern: Form + GlobalKey + TextFormField

\`\`\`dart
class AddExpenseScreen extends StatefulWidget {
  const AddExpenseScreen({super.key});
  @override
  State<AddExpenseScreen> createState() => _AddExpenseScreenState();
}

class _AddExpenseScreenState extends State<AddExpenseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  String _category = 'Food';

  @override
  void dispose() {
    _titleCtrl.dispose();
    _amountCtrl.dispose();
    super.dispose();
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    final expense = Expense(
      title: _titleCtrl.text.trim(),
      amount: double.parse(_amountCtrl.text),
      date: DateTime.now(),
      category: _category,
    );
    Navigator.pop(context, expense);
  }
\`\`\`

The \`GlobalKey\` lets you call \`validate()\` on the whole form at once. It runs every field's validator and shows the error text under each invalid field.

## Writing validators

A validator returns \`null\` when the value is fine, or an error message string:

\`\`\`dart
TextFormField(
  controller: _amountCtrl,
  decoration: const InputDecoration(labelText: 'Amount (Rs.)', prefixText: 'Rs. '),
  keyboardType: const TextInputType.numberWithOptions(decimal: true),
  validator: (value) {
    final amount = double.tryParse(value ?? '');
    if (amount == null) return 'Enter a valid amount';
    if (amount <= 0) return 'Amount must be more than zero';
    if (amount > 1000000) return 'That looks too large, please check';
    return null;
  },
)
\`\`\`

- Use \`double.tryParse\`, not \`double.parse\`, inside validators. \`tryParse\` returns \`null\` instead of crashing on input like "12a".
- Set the right \`keyboardType\` so users get a number pad.
- Write messages that say **how to fix** the problem, not just that it is wrong.

## Dropdowns and dates

For the category, use \`DropdownButtonFormField<String>\` with items like Food, Travel, Rent, Recharge and Shopping. For the date, call \`showDatePicker\` from an \`onTap\` and store the result in state.

\`\`\`dart
final picked = await showDatePicker(
  context: context,
  initialDate: DateTime.now(),
  firstDate: DateTime(2020),
  lastDate: DateTime.now(),
);
\`\`\`

## Small touches that feel professional

> **Tip:** Set \`autovalidateMode: AutovalidateMode.onUserInteraction\` on the \`Form\` so errors appear as soon as the user edits a field, not only after tapping Save.

1. Use \`textInputAction: TextInputAction.next\` so the keyboard's button jumps to the next field.
2. Disable the Save button while saving to prevent double entries.
3. Always \`dispose\` controllers to avoid memory leaks.

Clients rarely notice good forms, but they always notice bad ones. Getting this right is an easy way to stand out.`,
        },
        {
          title: "Quiz: State, navigation and forms",
          type: "QUIZ",
          durationMinutes: 7,
          content: `Test whether you can reason about rebuilds, screen flows and validation. These are the exact bugs that show up in real client apps.`,
          quiz: {
            questions: [
              {
                prompt: "You add an item to a list inside a State class, but the screen does not update. What is the most likely cause?",
                options: [
                  "The list should be declared const",
                  "The change was made without calling setState",
                  "StatefulWidget cannot show lists",
                  "The build method needs to be async",
                ],
                correct: 1,
                explanation: "setState tells Flutter the state changed and the widget must rebuild. Without it, the data changes in memory but the UI stays the same.",
              },
              {
                prompt: "Where should you dispose a TextEditingController created in a State class?",
                options: ["In build", "In initState", "In dispose", "Controllers never need disposing"],
                correct: 2,
                explanation: "dispose runs when the State is removed permanently, which is the right time to release controllers and listeners.",
              },
              {
                prompt: "An Add screen is opened with final result = await Navigator.push(...). The user presses the back button without saving. What is result?",
                options: ["The last saved expense", "An empty Expense object", "An exception is thrown", "null"],
                correct: 3,
                explanation: "Popping without a value completes the Future with null, so your code must check for null before using the result.",
              },
              {
                prompt: "Inside an amount validator, why prefer double.tryParse over double.parse?",
                options: [
                  "tryParse returns null for invalid input instead of throwing an exception",
                  "tryParse is faster on Android",
                  "parse cannot handle decimals",
                  "tryParse automatically adds GST",
                ],
                correct: 0,
                explanation: "Users will type invalid text. tryParse lets the validator return a friendly message instead of crashing.",
              },
              {
                prompt: "After a successful login, which call stops the back button from returning the user to the login screen?",
                options: ["Navigator.push", "Navigator.pushReplacement", "Navigator.pop", "setState"],
                correct: 1,
                explanation: "pushReplacement swaps the current route for the new one, so the login screen is no longer in the stack.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "Project: Build the Expense Tracker and Publish to the Play Store",
      lessons: [
        {
          title: "Planning the expense tracker: screens, model and folders",
          type: "VIDEO",
          durationMinutes: 9,
          content: `## Key points
- Spend fifteen minutes planning screens and data before coding; it saves hours of refactoring later.
- The app needs three screens: the expense list with a monthly total, an add/edit form, and a simple category summary.
- One \`Expense\` model with an \`id\`, title, amount, date and category is enough for version one.
- A predictable folder structure (\`models\`, \`screens\`, \`widgets\`, \`services\`) makes your project easy for clients and recruiters to read.
- Scope ruthlessly: ship a small app that works, then add features in later versions.

## Transcript
Welcome to the final module. Ab asli kaam shuru. We are going to build Kharcha, a personal expense tracker, and put it on the Play Store.

Before I write a single line for any client, I sketch the screens on paper. For Kharcha there are three. First, the home screen: this month's total at the top and a list of expenses below, newest first. Second, an add/edit screen with the form you built in the last module. Third, a summary screen that shows how much went to food, travel, rent, recharge and shopping.

Next, the data. One model is enough:

\`\`\`dart
class Expense {
  final String id;
  final String title;
  final double amount;
  final DateTime date;
  final String category;

  const Expense({
    required this.id,
    required this.title,
    required this.amount,
    required this.date,
    required this.category,
  });
}
\`\`\`

Why an \`id\`? Because to edit or delete an expense later we need to find exactly that one. I simply use \`DateTime.now().microsecondsSinceEpoch.toString()\`, which is unique enough for a single-user app.

Folders matter more than students think. When a recruiter opens your GitHub, they judge you in thirty seconds. Use \`lib/models\`, \`lib/screens\`, \`lib/widgets\` and \`lib/services\`. Storage code goes in services, and screens never talk to storage directly.

Last point, and this one is from experience: scope. Students want charts, login, cloud sync and dark mode in version one, and then they never finish. Version one is list, add, edit, delete, total and save offline. That's it. Ship it, then improve. A finished app on the Play Store beats ten half-built ones on your laptop.`,
        },
        {
          title: "Saving data offline with shared_preferences and JSON",
          type: "ARTICLE",
          durationMinutes: 12,
          content: `## Why offline first

Many of your users will be on patchy mobile data. An expense tracker must work with zero internet, and data must survive closing the app. For a small personal app, \`shared_preferences\` plus JSON is the simplest reliable option.

Add the package:

\`\`\`bash
flutter pub add shared_preferences
\`\`\`

## Step 1: Teach the model to become JSON

\`\`\`dart
import 'dart:convert';

class Expense {
  // fields and constructor from the previous lesson...

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'amount': amount,
        'date': date.toIso8601String(),
        'category': category,
      };

  factory Expense.fromJson(Map<String, dynamic> json) => Expense(
        id: json['id'] as String,
        title: json['title'] as String,
        amount: (json['amount'] as num).toDouble(),
        date: DateTime.parse(json['date'] as String),
        category: json['category'] as String,
      );
}
\`\`\`

- Store dates as **ISO 8601 strings**; they sort correctly and parse back exactly.
- Cast \`amount\` via \`num\` because JSON may decode \`150\` as an \`int\`.

## Step 2: A small storage service

\`\`\`dart
import 'package:shared_preferences/shared_preferences.dart';

class ExpenseStorage {
  static const _key = 'expenses_v1';

  Future<List<Expense>> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => Expense.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> save(List<Expense> expenses) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = jsonEncode(expenses.map((e) => e.toJson()).toList());
    await prefs.setString(_key, raw);
  }
}
\`\`\`

> **Tip:** The \`_v1\` in the key is deliberate. If you change the data format later, you can read the old key, migrate it and write \`expenses_v2\` without losing users' data.

## Step 3: Wire it into the screen

\`\`\`dart
final _storage = ExpenseStorage();

@override
void initState() {
  super.initState();
  _storage.load().then((items) {
    if (!mounted) return;
    setState(() => _expenses.addAll(items));
  });
}

void _add(Expense e) {
  setState(() => _expenses.insert(0, e));
  _storage.save(_expenses);
}
\`\`\`

Call \`save\` after every add, edit and delete. The list is small, so rewriting it each time is fast.

## When to move beyond shared_preferences

\`shared_preferences\` is meant for small amounts of data. It is perfect for a few hundred expenses. When you have thousands of records, need queries like "all food expenses in March", or relations between tables, move to **sqflite** (SQLite), **drift**, or **Isar**. If users need their data across devices, that is when a cloud backend like Firebase comes in, which is exactly what the next course covers.

Test it properly: add three expenses, swipe the app away from recents, reopen it. If your expenses are still there, your storage layer works.`,
        },
        {
          title: "From debug build to Play Store: signing, App Bundles and testing tracks",
          type: "ARTICLE",
          durationMinutes: 12,
          content: `## Debug vs release

The app you run with \`flutter run\` is a **debug** build: large, slow, and signed with a debug key. The Play Store needs a **release** build signed with your own upload key.

## Step 1: Pick a permanent application ID

Open \`android/app/build.gradle\` (or \`build.gradle.kts\` in newer projects) and change \`applicationId\` from \`com.example...\` to something you own, like \`in.kiranpatil.kharcha\`. You **cannot** change it after publishing, so choose carefully. Also set a proper app name in \`AndroidManifest.xml\` and generate launcher icons with the \`flutter_launcher_icons\` package.

## Step 2: Create an upload keystore

\`\`\`bash
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
\`\`\`

Keep this file and its passwords safe and **out of Git**. Create \`android/key.properties\`:

\`\`\`properties
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=upload
storeFile=../upload-keystore.jks
\`\`\`

Then follow the official Flutter "Build and release an Android app" guide to load \`key.properties\` in your Gradle file and add a \`release\` signing config. Add both \`key.properties\` and \`*.jks\` to \`.gitignore\`.

> **Tip:** Back up the keystore to a private cloud folder. With Play App Signing, Google holds the final app signing key, so a lost upload key can be reset, but it costs you days.

## Step 3: Build

\`\`\`bash
flutter build appbundle --release
flutter build apk --release --split-per-abi
\`\`\`

- The **.aab** (Android App Bundle) in \`build/app/outputs/bundle/release/\` is what you upload to Google Play. New apps must use App Bundles.
- The split **APKs** are handy for sharing a test build directly with a client over WhatsApp or Google Drive.

Bump \`version: 1.0.0+1\` in \`pubspec.yaml\` before every upload. The number after \`+\` is the version code and must always increase.

## Step 4: Google Play Console

1. Create a developer account. There is a one-time registration fee of 25 US dollars (roughly ₹2,100) and identity verification.
2. Create the app, fill in the store listing: short description, full description, screenshots, feature graphic and an icon.
3. Complete the **App content** section: privacy policy URL, data safety form, content rating questionnaire and target audience. A free privacy policy page on GitHub Pages works fine for a simple offline app.
4. Upload your \`.aab\` to a **testing track**.

## The testing requirement for new personal accounts

Google requires newly created personal developer accounts to run a **closed test** with a minimum number of testers (currently 12) opted in for 14 continuous days before you can apply for production access. Plan for this:

- Line up classmates, family and friends early and collect their Gmail IDs.
- Share the opt-in link in a WhatsApp group and ask testers to keep the app installed.
- Fix the feedback you get; this period makes your app better.

Once production access is approved, promote the release, and your app is live for anyone in India to install.`,
        },
        {
          title: "Final project: Ship Kharcha, your expense tracker",
          type: "ASSIGNMENT",
          durationMinutes: 90,
          content: `This is your portfolio piece. A working app with a real Play Store testing link or signed build tells clients and recruiters far more than any certificate, and it gives you a codebase you can reuse for paid projects.`,
          assignment: {
            brief: `## The task

Build and release version 1.0 of **Kharcha**, an offline expense tracker for students and young professionals.

## Required features

1. **Home screen** with the current month's total and a list of expenses (newest first) using \`ListView.builder\`.
2. **Add and edit** an expense through a validated form: title, amount, category (dropdown) and date (date picker).
3. **Delete** an expense with swipe-to-delete (\`Dismissible\`) and an Undo \`SnackBar\`.
4. **Category summary** screen showing totals per category.
5. **Offline persistence** with \`shared_preferences\` and JSON, so data survives app restarts.
6. A custom app name, launcher icon and \`applicationId\` (no \`com.example\`).

## Release steps

- Create an upload keystore and configure release signing (keystore **not** committed).
- Build a release App Bundle and a release APK.
- Upload the bundle to a Play Console internal or closed testing track. If you do not yet have a developer account, upload the signed release APK to Google Drive instead.

## Deliverable

Submit **one link** to your public GitHub repository. The README must include:

- Three or more screenshots
- A link to the Play testing track or the signed APK
- A short "What I would build next" section

## Tips

- Commit after each feature with clear messages; reviewers do read history.
- Test on the smallest screen you can find.
- Ask two friends to use the app without help, and fix whatever confuses them.`,
            rubric: [
              { criterion: "All core features work: list, add, edit, delete with undo, category summary", points: 35 },
              { criterion: "Data persists offline correctly across app restarts", points: 20 },
              { criterion: "Form validation, layout quality and overall user experience", points: 15 },
              { criterion: "Signed release build with custom app ID, name and icon; secrets kept out of Git", points: 20 },
              { criterion: "Repository structure and README with screenshots and release link", points: 10 },
            ],
            submissionType: "LINK",
          },
        },
      ],
    },
  ],
};

const firebaseForApps = {
  slug: "firebase-for-apps",
  title: "Firebase for App Developers",
  subtitle: "Add login, a live cloud database and push notifications to your Flutter apps",
  description:
    "Most client apps need users to sign in, data that syncs across devices and notifications that bring people back. In this focused course Kiran shows you how to add all three to a Flutter app with Firebase, and how to secure and ship it without surprise bills. You will build the backend for a Kochi homestay's booking app along the way.",
  level: "INTERMEDIATE",
  languages: ["en", "hi", "mr"],
  cover: { from: "#E65100", to: "#C2185B", pattern: "rings" },
  mentorId: "m_7",
  priceINR: 1999,
  rating: 4.7,
  ratingsCount: 846,
  studentsCount: 5310,
  createdDaysAgo: 72,
  skills: ["Firebase Auth", "Cloud Firestore", "Security Rules", "Firebase Cloud Messaging", "Crashlytics", "FlutterFire"],
  whatYouBuild: [
    "Email and Google sign-in with a persistent login flow",
    "A real-time booking system for a Kochi homestay on Cloud Firestore",
    "Security rules that keep each guest's bookings private",
    "Push notifications for booking confirmations, plus crash reporting before launch",
  ],
  requirements: [
    "Comfortable building basic Flutter screens, navigation and forms",
    "A Google account for the Firebase console",
    "An Android phone or emulator with Google Play services",
  ],
  modules: [
    {
      title: "Authentication: Letting Users Sign In",
      lessons: [
        {
          title: "Connecting Flutter to Firebase with the FlutterFire CLI",
          type: "VIDEO",
          durationMinutes: 9,
          isPreview: true,
          content: `## Key points
- The FlutterFire CLI registers your Android and iOS apps with Firebase and generates \`firebase_options.dart\` for you.
- Always call \`Firebase.initializeApp\` before \`runApp\`, after \`WidgetsFlutterBinding.ensureInitialized()\`.
- Add only the Firebase packages you actually use; each one increases app size.
- Start on the free Spark plan, and set a budget alert before ever switching to Blaze.

## Transcript
Hello again! In this course we'll give our apps a real backend without writing a server. Chalo, let's connect Flutter to Firebase.

Create a project in the Firebase console, then in your terminal:

\`\`\`bash
npm install -g firebase-tools
firebase login
dart pub global activate flutterfire_cli
flutterfire configure
flutter pub add firebase_core firebase_auth
\`\`\`

\`flutterfire configure\` asks which project and platforms to use, then writes \`lib/firebase_options.dart\`. Now update \`main\`:

\`\`\`dart
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MyApp());
}
\`\`\`

Run the app. No red errors means you're connected. One habit from client work: create two Firebase projects, one for development and one for production, so your testing never touches real customer data. Next, let's make users log in.`,
        },
        {
          title: "Email and Google sign-in with authStateChanges",
          type: "ARTICLE",
          durationMinutes: 9,
          content: `## Enable providers

In the Firebase console, open **Authentication > Sign-in method** and enable Email/Password. For Google sign-in, also add your SHA-1 fingerprint (\`cd android && ./gradlew signingReport\`) to the Android app settings.

## Sign up and sign in

\`\`\`dart
final auth = FirebaseAuth.instance;

Future<String?> signUp(String email, String password) async {
  try {
    await auth.createUserWithEmailAndPassword(email: email, password: password);
    return null;
  } on FirebaseAuthException catch (e) {
    return e.code == 'email-already-in-use'
        ? 'This email already has an account'
        : 'Sign-up failed, please try again';
  }
}
\`\`\`

## Let the stream decide the screen

\`\`\`dart
StreamBuilder<User?>(
  stream: FirebaseAuth.instance.authStateChanges(),
  builder: (context, snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const Center(child: CircularProgressIndicator());
    }
    return snapshot.hasData ? const HomeScreen() : const LoginScreen();
  },
)
\`\`\`

Firebase remembers the session, so returning users skip login automatically, and \`signOut()\` sends them back.

> **Tip:** Phone OTP login is popular with Indian users, but SMS verification is billed per message. Use test phone numbers during development.`,
        },
        {
          title: "Quiz: Firebase Auth",
          type: "QUIZ",
          durationMinutes: 4,
          content: `Three quick questions to check your setup and auth flow understanding.`,
          quiz: {
            questions: [
              {
                prompt: "Your app crashes on launch with 'No Firebase App has been created'. What is the likely fix?",
                options: [
                  "Add firebase_auth to pubspec.yaml",
                  "Await Firebase.initializeApp before runApp",
                  "Switch to the Blaze plan",
                  "Call signOut on startup",
                ],
                correct: 1,
                explanation: "Firebase must be initialized before any Firebase service is used, which means awaiting initializeApp in main before runApp.",
              },
              {
                prompt: "Why use a StreamBuilder on authStateChanges() instead of checking currentUser once?",
                options: [
                  "It is the only way to read the user's email",
                  "It makes login faster",
                  "The UI automatically switches screens whenever the user signs in or out",
                  "currentUser does not work on Android",
                ],
                correct: 2,
                explanation: "The stream emits on every sign-in and sign-out, so the right screen is always shown without manual navigation.",
              },
              {
                prompt: "Google sign-in works on your teammate's laptop build but fails on yours. What should you check first?",
                options: [
                  "Whether your machine's SHA-1 fingerprint is added in the Firebase console",
                  "Whether Firestore is enabled",
                  "Whether your phone has enough storage",
                  "Whether the app uses Material 3",
                ],
                correct: 0,
                explanation: "Each debug keystore has its own SHA-1. Google sign-in on Android fails if the fingerprint of the signing key is not registered.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "Cloud Firestore: Real-time Data",
      lessons: [
        {
          title: "Modelling data in Firestore: collections, documents and queries",
          type: "VIDEO",
          durationMinutes: 11,
          content: `## Key points
- Firestore stores documents (small JSON-like maps) inside collections, and documents can hold subcollections.
- Design your data around the screens and queries you need, not around SQL-style tables.
- Duplicating a little data, like a homestay name inside each booking, is normal and saves extra reads.
- You pay per document read, so avoid loading whole collections when a filtered query will do.

## Transcript
A homestay owner in Fort Kochi asked me for a booking app. Guests pick dates, the owner sees all bookings live. Perfect Firestore use case.

Dekho, Firestore is not SQL. Think about screens first. A guest needs "my bookings". The owner needs "all bookings for my property, by date". So I created a \`bookings\` collection where each document has \`guestId\`, \`homestayId\`, \`homestayName\`, \`checkIn\`, \`checkOut\` and \`status\`.

Yes, I copied \`homestayName\` into every booking. In SQL that's a sin; in Firestore it saves a read on every list screen, and reads cost money.

The guest's list is one query:

\`\`\`dart
FirebaseFirestore.instance
    .collection('bookings')
    .where('guestId', isEqualTo: uid)
    .orderBy('checkIn')
    .snapshots();
\`\`\`

Combining \`where\` and \`orderBy\` on different fields needs a composite index. Don't panic when you see the error; it includes a link that creates the index in one click.`,
        },
        {
          title: "Writing data and securing it with rules",
          type: "ARTICLE",
          durationMinutes: 10,
          content: `## Writing a booking

\`\`\`dart
await FirebaseFirestore.instance.collection('bookings').add({
  'guestId': FirebaseAuth.instance.currentUser!.uid,
  'homestayId': 'fort-kochi-01',
  'homestayName': 'Periyar Nest Homestay',
  'checkIn': Timestamp.fromDate(checkIn),
  'checkOut': Timestamp.fromDate(checkOut),
  'status': 'pending',
  'createdAt': FieldValue.serverTimestamp(),
});
\`\`\`

Use \`serverTimestamp()\` instead of the phone's clock, which users can change.

## Security rules are not optional

Test mode lets **anyone** read and write your database, and it expires. Before launch, write rules:

\`\`\`js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{bookingId} {
      allow read: if request.auth != null
        && request.auth.uid == resource.data.guestId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.guestId
        && request.resource.data.status == 'pending';
    }
  }
}
\`\`\`

- \`resource.data\` is the existing document; \`request.resource.data\` is the incoming one.
- Guests can only create *pending* bookings, so nobody can confirm their own stay.

> **Tip:** Test rules in the Rules Playground or the local emulator before deploying.`,
        },
        {
          title: "Assignment: Booking backend for a Kochi homestay",
          type: "ASSIGNMENT",
          durationMinutes: 80,
          content: `Booking and appointment apps are among the most common freelance requests, from salons to clinics to homestays. Getting the data model and rules right is what separates a demo from something a client can actually run.`,
          assignment: {
            brief: `## The task

Build a Flutter app for **Periyar Nest Homestay, Fort Kochi** with Firebase Auth and Firestore.

1. Email sign-in with an \`authStateChanges\` driven home screen.
2. A booking form: room type, check-in and check-out dates, number of guests. Reject check-out before check-in.
3. A "My bookings" screen using a real-time \`snapshots()\` query, showing status.
4. Security rules so guests only read their own bookings and can only create \`pending\` ones.

## Deliverable

A public GitHub link. Include \`firestore.rules\` in the repo, and in the README describe your data model and two screenshots.

## Tips

- Never commit service account keys.
- Try reading another user's booking in the Rules Playground to prove your rules work.`,
            rubric: [
              { criterion: "Auth flow and booking form work with sensible validation", points: 30 },
              { criterion: "Real-time bookings list with a clear Firestore data model", points: 30 },
              { criterion: "Security rules correctly restrict reads and creates", points: 30 },
              { criterion: "README documents data model with screenshots", points: 10 },
            ],
            submissionType: "LINK",
          },
        },
      ],
    },
    {
      title: "Push Notifications and Shipping",
      lessons: [
        {
          title: "Push notifications with Firebase Cloud Messaging",
          type: "ARTICLE",
          durationMinutes: 9,
          content: `## Setup

\`\`\`bash
flutter pub add firebase_messaging
\`\`\`

Android 13+ requires runtime permission for notifications, so ask politely, ideally right after a booking when the value is obvious:

\`\`\`dart
final messaging = FirebaseMessaging.instance;
await messaging.requestPermission();
final token = await messaging.getToken();
// save token to users/{uid} in Firestore so your backend can target this device
\`\`\`

## Handling messages

\`\`\`dart
@pragma('vm:entry-point')
Future<void> _onBackgroundMessage(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
}

FirebaseMessaging.onBackgroundMessage(_onBackgroundMessage);
FirebaseMessaging.onMessage.listen((message) {
  // app is open: show an in-app banner or SnackBar
});
\`\`\`

- The background handler must be a **top-level** function, not a class method.
- When the app is in the foreground, Android does not show the system notification automatically; you display it yourself.

> **Tip:** Send test messages from the console's Messaging section. In production, send from Cloud Functions when a booking status changes to "confirmed".`,
        },
        {
          title: "Shipping safely: Crashlytics, App Distribution and budgets",
          type: "VIDEO",
          durationMinutes: 8,
          content: `## Key points
- Crashlytics reports real crashes from users' phones with stack traces, so you fix problems before reviews mention them.
- Firebase App Distribution sends test builds to a client by email, without going through the Play Store.
- Set a budget alert in Google Cloud the day you move to the Blaze plan.
- Tighten security rules and remove test-mode access before handing over a project.

## Transcript
Last lesson, and it's the one that protects your reputation.

First, Crashlytics. Add \`firebase_crashlytics\` and route Flutter errors to it:

\`\`\`dart
FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
\`\`\`

Now every crash on a guest's phone in Kochi appears in your console with the exact line.

Second, App Distribution. When the homestay owner wants to try a build, I upload the APK there and add her email. No Play Store review, no waiting.

Third, money. Dekho, a missing \`where\` clause in a loop once cost a friend of mine a few thousand rupees overnight. Set a budget alert, even for ₹500.

Before handover, check your Firestore rules once more so nothing still allows open reads and writes, and transfer project ownership to the client's Google account while keeping yourself as an editor. Ship with all this in place, and clients will trust you with their next app too.`,
        },
        {
          title: "Quiz: Notifications and launch readiness",
          type: "QUIZ",
          durationMinutes: 5,
          content: `Final check before you ship a Firebase-powered app to a real client.`,
          quiz: {
            questions: [
              {
                prompt: "Your FCM background handler is defined as a method inside a widget class and never runs. Why?",
                options: [
                  "Background messages are not supported on Android",
                  "It needs to be marked async",
                  "The token has expired",
                  "The background handler must be a top-level function",
                ],
                correct: 3,
                explanation: "Background messages run in a separate isolate, which can only call a top-level or static function annotated with @pragma('vm:entry-point').",
              },
              {
                prompt: "A client wants to try your latest build today without waiting for Play Store review. What fits best?",
                options: [
                  "Firebase App Distribution",
                  "Crashlytics",
                  "Firestore security rules",
                  "Cloud Messaging topics",
                ],
                correct: 0,
                explanation: "App Distribution sends test builds directly to testers by email.",
              },
              {
                prompt: "Which step best protects you from an unexpected Firebase bill?",
                options: [
                  "Staying in test mode",
                  "Disabling Crashlytics",
                  "Setting a budget alert and using filtered queries",
                  "Storing all data in one document",
                ],
                correct: 2,
                explanation: "Firestore bills per read, so efficient queries plus a budget alert catch runaway costs early.",
              },
            ],
          },
        },
      ],
    },
  ],
};

export default [flutterFirstApp, firebaseForApps];
