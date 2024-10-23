import * as z from "zod";

export type CDNComic = z.infer<typeof CDNComic>;
export const CDNComic = z.object({
  sys: z.object({
    id: z.string(),
    type: z.literal("Entry"),
    updatedAt: z.string().datetime(),
    contentType: z.object({
      sys: z.object({
        type: z.literal("Link"),
        linkType: z.literal("ContentType"),
        id: z.literal("comic"),
      }),
    }),
  }),
  fields: z.object({
    title: z.string(),
    slug: z.string(),
    // thumbnail: z.object({
    //   sys: z.object({
    //     type: z.literal("Link"),
    //     linkType: z.literal("Entry"),
    //     id: z.string(),
    //   }),
    // }),
    date: z.string(),
    images: z
      .object({
        sys: z.object({
          type: z.literal("Link"),
          linkType: z.literal("Entry"),
          id: z.string(),
        }),
      })
      .array(),
  }),
});

export type CDNImage = z.infer<typeof CDNImage>;
export const CDNImage = z.object({
  sys: z.object({
    id: z.string(),
    type: z.literal("Entry"),
    contentType: z.object({
      sys: z.object({
        type: z.literal("Link"),
        linkType: z.literal("ContentType"),
        id: z.literal("cloudinaryAsset"),
      }),
    }),
  }),
  fields: z.object({
    internalName: z.string(),
    assetPath: z.string().url(),
    altText: z.string().optional(),
  }),
});

type CDNEntries = z.infer<typeof CDNEntries>;
const CDNEntries = z.object({
  sys: z.object({
    type: z.literal("Array"),
  }),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int(),
  items: CDNComic.array(),
  includes: z.object({
    Entry: CDNImage.array(),
  }),
});

export interface Comic {
  id: string;
  updatedAt: string;
  title: string;
  slug: string;
  // thumbnail: ComicImage;
  date: string;
  images: ComicImage[];
}

export interface ComicImage {
  id: string;
  internalName: string;
  assetPath: string;
  altText?: string | undefined;
}

const CDN_URL =
  "https://cdn.contentful.com/spaces/xuwlxvgj0hyl/environments/master/entries?locale=en-US&content_type=comic&order=-fields.date";

async function* fetchEntriesPaged(token: string): AsyncGenerator<CDNEntries> {
  const firstResponse = await fetch(CDN_URL, {
    headers: { Authorization: token },
  });
  if (firstResponse.status !== 200) {
    throw new Error(await firstResponse.text());
  }
  const firstPage = CDNEntries.parse(await firstResponse.json());
  yield firstPage;

  const { limit, total } = firstPage;
  for (let skip = limit; skip < total; skip += limit) {
    const response = await fetch(
      `${CDN_URL}&skip=${String(skip)}&limit=${String(limit)}`,
      {
        headers: { Authorization: token },
      },
    );
    if (response.status !== 200) {
      throw new Error(await response.text());
    }
    const page = CDNEntries.parse(await response.json());
    yield page;
  }
}

function extractComics(entries: CDNEntries): Comic[] {
  const indexedImages = new Map<string, CDNImage>();
  for (const image of entries.includes.Entry) {
    indexedImages.set(image.sys.id, image);
  }
  return entries.items.map((comic) => ({
    id: comic.sys.id,
    updatedAt: comic.sys.updatedAt,
    title: comic.fields.title,
    slug: comic.fields.slug,
    date: comic.fields.date,
    images: comic.fields.images
      .map(({ sys: { id } }) => indexedImages.get(id))
      .filter((image) => !!image)
      .map((image) => ({
        id: image.sys.id,
        internalName: image.fields.internalName,
        assetPath: image.fields.assetPath,
        altText: image.fields.altText,
      })),
  }));
}

export async function fetchComics(token: string): Promise<Comic[]> {
  const result: Comic[] = [];
  for await (const entries of fetchEntriesPaged(token)) {
    result.push(...extractComics(entries));
  }
  return result;
}
