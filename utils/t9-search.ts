import * as ContactsModule from "expo-contacts";

const t9Map: Record<string, string> = {
  1: "1",
  2: "abc",
  3: "def",
  4: "ghi",
  5: "jkl",
  6: "mno",
  7: "pqrs",
  8: "tuv",
  9: "wxyz",
  0: "0",
  "+": "+",
  "*": "*",
  "#": "#",
};

// Convert string to T9 digits
export const letterToT9 = (char: string): string => {
  const lowerChar = char.toLowerCase();
  for (const digit in t9Map) {
    if (t9Map[digit].includes(lowerChar)) {
      return digit;
    }
  }
  return ""; // Skip non-alphanumeric
};

export const nameToT9Sequence = (name: string): string => {
  return name.split("").map(letterToT9).join("");
};

export const searchContactsT9 = (query: string, contacts: ContactsModule.Contact[]): ContactsModule.Contact[] => {
  if (!query) return [];

  const lowerQuery = query.toLowerCase();

  const isFuzzyMatch = (searchQuery: string, target: string): boolean => {
    if (!searchQuery) return true;
    if (!target) return false;
    let qIdx = 0;
    for (let i = 0; i < target.length; i++) {
      if (target[i] === searchQuery[qIdx]) {
        qIdx++;
        if (qIdx === searchQuery.length) return true;
      }
    }
    return false;
  };

  const scoredContacts = contacts.map((contact) => {
    let score = 0;

    const t9Name = contact.name ? nameToT9Sequence(contact.name) : "";
    let cleanNumbers: string[] = [];

    if (contact.phoneNumbers) {
      cleanNumbers = contact.phoneNumbers.map(
        (phone) => phone.number?.replace(/[\s-()]/g, "") || ""
      );
    }

    // 1. Highest priority - number includes in contact number
    const numberIncludes = cleanNumbers.some((num) => num.includes(lowerQuery));
    
    // 2. Medium priority - name includes while typing in t9results
    const nameIncludes = t9Name.includes(lowerQuery);

    if (numberIncludes) {
      score = 3;
    } else if (nameIncludes) {
      score = 2;
    } else {
      // 3. Lowest priority - fuzzy match
      const fuzzyNumber = cleanNumbers.some((num) =>
        isFuzzyMatch(lowerQuery, num)
      );
      const fuzzyName = isFuzzyMatch(lowerQuery, t9Name);

      if (fuzzyNumber || fuzzyName) {
        score = 1;
      }
    }

    return { contact, score };
  });

  return scoredContacts
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.contact);
};
