import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KEYWORDS = [
  "startup funding",
  "venture capital",
  "VC deal",
  "investment round",
  "seed round",
  "pre-seed",
  "Series A",
  "Series B",
  "angel investment",
  "early stage startup",
  "tech startup",
  "fundraising",
  "capital raise",
  "equity investment",
  "strategic investment",
  "M&A deal",
  "acquisition",
  "merger",
  "IPO",
  "exit",
  "unicorn startup",
  "valuation",
  "growth stage",
  "accelerator program",
  "incubator program",
  "demo day",
  "pitch event",
  "venture fund",
  "private equity",
  "tech ecosystem",
  "innovation hub",
  "стартап",
  "инвестиции в стартап",
  "венчурные инвестиции",
  "венчурный фонд",
  "инвестиционный раунд",
  "раунд инвестиций",
  "посевной раунд",
  "ангельские инвестиции",
  "привлечение инвестиций",
  "оценка стартапа",
  "сделка",
  "поглощение",
  "слияние",
  "выход на IPO",
  "единорог стартап",
  "акселератор стартапов",
  "инкубатор стартапов",
  "питч",
  "демо день",
  "стартап экосистема",
  "инновации",
  "стартап янгиликлари",
  "стартап инвестиция",
  "венчур сармоя",
  "инвестиция раунди",
  "сармоя жалб қилиш",
  "стартап баҳоси",
  "акселератор",
  "инкубатор",
  "питч тадбир",
  "технологик стартап",
  "инновация экотизими",
  "стартап жаңалықтары",
  "венчурлік капитал",
  "инвестиция раунды",
  "қаржы тарту",
  "стартап бағалау",
  "питч іс шара",
  "технологиялық стартап",
  "инновация экожүйесі",
];

async function main() {
  let added = 0;
  let skipped = 0;

  for (const text of KEYWORDS) {
    const normalized = text.toLowerCase().trim();
    if (!normalized) continue;

    try {
      await prisma.keyword.upsert({
        where: { text: normalized },
        create: { text: normalized, isActive: true },
        update: {},
      });
      added++;
      console.log(`✓ ${normalized}`);
    } catch (e: any) {
      if (e.code === "P2002") {
        skipped++;
        console.log(`- skip (exists): ${normalized}`);
      } else {
        throw e;
      }
    }
  }

  console.log(`\nDone. Added: ${added}, Skipped: ${skipped}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
