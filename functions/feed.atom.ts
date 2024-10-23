import { fetchComics } from "@/pikmin-cdn";
import { XMLBuilder } from "fast-xml-parser";
import packageMeta from "../package.json";

const xmlBuilder = new XMLBuilder({ ignoreAttributes: false, format: true });

export const onRequest: PagesFunction<Env> = async function ({ env }) {
  const comics = await fetchComics(env.PIKMIN_CDN_TOKEN);

  const entry = comics.map((c) => {
    const href = `https://pikmin.nintendo.com/en/comics/#!/${c.slug}`;
    const picture = c.images.map((i) => {
      return {
        source: [
          {
            "@_srcset": i.assetPath.replace(/\.\w*$/, ".avif"),
            "@_type": "image/avif",
          },
          {
            "@_srcset": i.assetPath.replace(/\.\w*$/, ".webp"),
            "@_type": "image/webp",
          },
        ],
        img: {
          "@_src": i.assetPath.replace(/\.\w*$/, ".jpg"),
          "@_alt": i.altText ?? "",
        },
      };
    });
    return {
      id: href,
      title: c.title,
      updated: c.updatedAt,
      content: {
        "@_type": "xhtml",
        div: {
          "@_xmlns": "http://www.w3.org/1999/xhtml",
          picture,
        },
      },
      link: {
        "@_rel": "alternate",
        "@_href": href,
      },
    };
  });

  const feed = {
    "?xml": { "@_version": "1.0", "@_encoding": "utf-8" },
    feed: {
      "@_xmlns": "http://www.w3.org/2005/Atom",
      id: env.FEED_ID,
      title: "Pikmin comic",
      subtitle:
        "Get a steady dose of Pikmin with the delightful manga-style comic strip.",
      author: { name: "Kino Takahashi" },
      icon: "https://pikmin.nintendo.com/favicons/favicon.svg",
      updated: comics[0]?.updatedAt ?? "1970-01-01T00:00:00Z",
      link: [
        {
          "@_rel": "self",
          "@_href": "https://pikmin-comic-feed.pages.dev/feed.atom",
        },
        {
          "@_rel": "alternate",
          "@_href": "https://pikmin.nintendo.com/en/comics/",
        },
      ],
      rights: "© 2023 Nintendo",
      generator: {
        "@_uri": packageMeta.homepage,
        "@_version": packageMeta.version,
        "#text": packageMeta.name,
      },
      entry,
    },
  };

  return new Response(
    new Blob([xmlBuilder.build(feed)], {
      type: "application/atom+xml; charset=utf-8",
    }),
  );
};
