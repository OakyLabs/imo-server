import { scrape_main } from "../config/wrapper";

const url = "https://www.a4a.pt/pt/auction/list/v/c/t/1";

// TODO: still to do
export const scrape_a4a = scrape_main(async (props) => {
  await props.page.goto(url);

  const listing = props.page.locator(".auction-list-wrapper");
  const listings_children = listing.locator(":scope > *");

  const children = await listings_children.count();

  if (!children) {
    return;
  }

  for (let i = 0; i < children; ++i) {
    // @ts-ignore
    const item = listings_children.nth(i);

    // const anchor =
  }
});
