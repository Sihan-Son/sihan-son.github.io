import config from '../data/site.yaml';

export const SITE_TITLE = config.site.title;
export const SITE_DESCRIPTION = config.site.description;
export const SITE_URL = config.site.url;

export const AUTHOR = config.author.name;
export const BIO = config.author.bio;
export const PROFILE_IMAGE = config.author.image;

export const SOCIAL_LINKS = config.social;
export const NAV_LINKS = config.nav;

export const ADSENSE_PUB_ID = config.integrations.adsense_pub_id;
export const GA_ID = config.integrations.ga_id;
export const GISCUS_REPO = config.integrations.giscus_repo;
export const GISCUS_REPO_ID = config.integrations.giscus_repo_id;
export const GISCUS_CATEGORY_ID = config.integrations.giscus_category_id;

export const POSTS_PER_PAGE = config.posts_per_page;

/** Derive slug from a content collection entry */
export function getPostSlug(post: { id: string; data: { slug?: string } }): string {
  return post.data.slug ?? post.id.replace(/\.md$/, '');
}
