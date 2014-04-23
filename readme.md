# Normalize, clean and fix text

    npm install node-normalize

The simple app processes input and tries to make it consumable for a bot.

The order in which the processing happes is important.

* <xxx means sentence start then xxx
* 1. spelling corrections for common spelling errors
* 2. idiom conversions
* 3. junk word removal from sentence
* 5. special sentence effects (question, exclamation, revert question)
* 6. abbreviation expansion and canonization
* for abbreviations, do not use _ before the .
* for apostrophied left side, must follow tokenizing conventions
* for apostrophied right side, it means do not spell check the word, the apostrophe will disappear
* Format is left phrase separated by _ yields right phrase separated by +
* if right side is %value means set that bit on the sentence (%EXCLAMATIONMARK %QUESTIONMARK)
* if right side is a ~word its an interjection
* only proper names should have capital letters
* Right phrase missing means delete left phrase
* Substitutions files include:
* we use + because we dont want the resulting phrase recognized by the idiom processor and thus cause the processor to delete the phrase
* xxx> means sentence then end stop
* if you want to have the result NOT tokenized, put it in quotes