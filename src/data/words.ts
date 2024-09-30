export const words: string[] = [
  "나도",
  "아니",
  "제발",
  "뻥",
  "구라",
  "ㅇㅇ",
  "ㄴㄴ",
  "하필",
  "정말",
  "아주",
  "그냥",
  "잠시만",
  "그러게",
  "근데",
  "혹시",
  "진짜",
  "장난",
  "대박",
  "그래서",
  "오케이",
  "왜",
  "그럼",
  "진심",
  "아까",
  "완전",
  "음",
  "흠",
  "제대로",
  "나중에",
  "다음에",
  "오늘",
  "오히려",
  "참고로",
  "왜",
  "?",
];

export function getRandomWord() {
  const randomIndex = Math.floor(Math.random() * words.length);

  return words[randomIndex];
}
