/*
 * The cart link may carry the cart page's address for a "Back to cart" link.
 * It comes from the link, so it is only used for the company's own sites:
 * anything else could send visitors somewhere unexpected.
 */

/** Sites a "Back to cart" link may point to, with all their subdomains. */
export const RETURN_URL_DOMAINS: readonly string[] = ['clintonelectronics.com'];

/** The return address when it is an https page on an allowed site, otherwise undefined. */
export function allowedReturnUrl(returnUrl: string | undefined): string | undefined {
  if (!returnUrl) {
    return undefined;
  }
  let url: URL;
  try {
    url = new URL(returnUrl);
  } catch {
    return undefined;
  }
  const host = url.hostname.toLowerCase();
  const allowed = RETURN_URL_DOMAINS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`)
  );
  return url.protocol === 'https:' && allowed && !url.username && !url.password
    ? url.toString()
    : undefined;
}
