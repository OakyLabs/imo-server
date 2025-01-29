export function to_pascal_case(sentence: string = "") {
  return sentence
    .toLowerCase() // Convert the entire sentence to lowercase
    .split(/[\s_]+/) // Split by spaces or underscores
    .map((word) =>
      word
        .split("-")
        .map(
          (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join("-")
    ) // Capitalize the first letter of each word
    .join(" ")
    .trim(); // Join all words without spaces
}
