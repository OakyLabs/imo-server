export function keys<T extends object>(object: T): Array<keyof T> {
  return Object.keys(object) as Array<keyof T>;
}

export function tuple<T extends object>(
  object: T
): Array<[keyof T & string, T[keyof T]]> {
  return Object.entries(object) as Array<[keyof T & string, T[keyof T]]>;
}
