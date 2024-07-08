import { delay } from "https://deno.land/std@0.224.0/async/delay.ts";
import { IUser, IItem } from "https://esm.sh/hacker-news-api-types@2.0.0";

const API = "https://hacker-news.firebaseio.com/v0";
const USER = "whoishiring"

type Stat = {
  hiring?: number
  hired?: number
}

async function getSubmissions() {
  const response = await fetch(`${API}/user/${USER}.json`);
  const json: IUser = await response.json();

  const ids = json.submitted ?? [];

  const submissions: Array<IItem> = await Promise.all(
    ids.map(async (id) => {
      // Small delay + jitter out of kindness (there's no rate limit)
      // https://github.com/HackerNews/API#uri-and-versioning
      await delay(25 + Math.floor(Math.random() * 25));
      const response = await fetch(
        `${API}/item/${id}.json`
      );
      return await response.json();
    })
  );

  return submissions
    .filter((s) => s.type && s.type === "story")
    .filter((s) => s.title && (s.title.includes("hiring?") || s.title.includes("hired?")))
    .filter((s) => !s.dead && !s.deleted)
    // 2 items per month * 12 months in a year * 5 years
    .slice(0, 120)
    .reverse()
}

async function main() {
  const submissions = await getSubmissions();
  const stats: Record<string, Stat> = {}

  for (const submission of submissions) {
    const date = submission.title!.slice(submission.title!.indexOf("(")+1, submission.title!.indexOf(")"))
    if (!stats[date])
      stats[date] = {}
    if (submission.title?.includes("hiring?"))
      stats[date].hiring = submission.kids?.length ?? 0
    else
      stats[date].hired = submission.kids?.length ?? 0
  }

  // Helper to get the data in a convenient format for ChartJS
  const data = Object.entries(stats).map(([date, stat]) => {
    return {
      date: date,
      hired: stat.hired,
      hiring: stat.hiring
    }
  })

  console.log(data)
}

main();
