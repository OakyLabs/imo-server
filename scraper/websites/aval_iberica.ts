// import { ParsingErrorV1 } from "../../events/errors/parsing-error";
// import { get_ctx, get_on_methods } from "../local-storage";
// import { scrape_main } from "../wrapper";

// const urls = (page = 1) =>
//   `https://www.avaliberica.pt/results-page.php?page=${page}&search%5BcategorySells%5D%5B6%5D=on&search%5BpartnerCountries%5D%5BPortugal%5D=on`;

// const url =
//   "https://www.avaliberica.pt/results-page.php?&search%5BcategorySells%5D%5B6%5D=on&search%5BpartnerCountries%5D%5BPortugal%5D=on";

// export const scrape_aval = scrape_main(
//   async ({ enqueue_links, internal, logger, page, service }) => {
//     logger.info("Starting to scrape avaliberica", { url });

//     await page.goto(url);

//     await page.waitForLoadState("networkidle");

//     const on = get_on_methods();

//     const page_section = await page.$(
//       "div.page-numbers ul li:nth-last-child(1)"
//     );

//     if (!page_section) {
//       on.error({
//         error: new ParsingErrorV1({
//           html: await page.content(),
//           message: "No pagination in this page anymore?",
//           url,
//           where: service.id,
//         }),
//         service,
//       });

//       return;
//     }

//     const last_page = await page_section.textContent();

//     if (!last_page) {
//       on.error({
//         error: new ParsingErrorV1({
//           html: await page.content(),
//           message: "No last page in this page anymore?",
//           url,
//           where: service.id,
//         }),
//         service,
//       });

//       return;
//     }

//     for (let i = 1; i <= +last_page; i++) {
//       //   logger.info(`Scraping page ${i} of aval`);
//       internal.queue.run(async () => {
//         const ctx = get_ctx();
//         const url = urls(i);

//         logger.info(`Starting to scrape page ${i} of avaliberica`, { page: i });

//         const p = await ctx.newPage();

//         await p.goto(url);
//         await p.waitForLoadState("networkidle");

//         const items = await p.$$("div.featured-item");

//         for (const listing of items) {
//         }
//       });
//     }
//   }
// );
