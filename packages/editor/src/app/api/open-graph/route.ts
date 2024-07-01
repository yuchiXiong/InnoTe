import { NextRequest } from "next/server";
import { kv } from "@vercel/kv";
import * as cheerio from "cheerio";
import md5 from "md5";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const query = sp.get("url");

  if (!query) {
    return new Response("Missing url parameter", { status: 400 });
  }

  const key = `url_preview_${md5(query)}_v0.0.2`;
  const cache = await kv.get<string>(key);

  if (cache) {
    return Response.json({
      status: "ok",
      result: cache,
    });
  }

  const response = await fetch(query);

  const html = await response.text();
  const $ = cheerio.load(html);

  const obj: {
    title: string;
    description: string;
    siteName: string;
    url: string;
    image: string;
  } = {
    title: "",
    description: "",
    siteName: "",
    url: "",
    image: "",
  };

  $("meta")
    .toArray()
    .forEach((item: cheerio.Element) => {
      switch ($(item).attr("property") || $(item).attr("name")) {
        case "og:description":
        case "description":
          obj.description =
            obj.description || ($(item).attr("content") as string);
          break;
        case "og:site_name":
          obj.siteName = $(item).attr("content") as string;
          break;
        case "og:title":
          obj.title = $(item).attr("content") as string;
          break;
        case "og:url":
          obj.url = $(item).attr("content") as string;
          break;
        case "og:image":
          obj.image = $(item).attr("content") as string;
          break;
      }
    });

  kv.set(key, obj);
  console.log("set cache to " + key);

  return Response.json({
    status: "ok",
    result: obj,
  });
}
