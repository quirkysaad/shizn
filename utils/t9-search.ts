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

  return contacts.filter((contact) => {
    // 1. Search by fuzzy phone number match (removing spaces and dashes)
    let phoneMatch = false;
    if (contact.phoneNumbers) {
      for (const phone of contact.phoneNumbers) {
        const cleanNumber = phone.number?.replace(/[\s-()]/g, "") || "";
        if (isFuzzyMatch(lowerQuery, cleanNumber)) {
          phoneMatch = true;
          break;
        }
      }
    }

    if (phoneMatch) return true;

    // 2. Search by T9 name fuzzy match
    if (contact.name) {
      const t9Name = nameToT9Sequence(contact.name);
      if (isFuzzyMatch(lowerQuery, t9Name)) {
        return true;
      }
    }

    return false;
  });
};
