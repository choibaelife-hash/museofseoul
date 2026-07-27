import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { presentationTool } from "sanity/presentation";
import { schemaTypes } from "./schemaTypes";
import { resolve } from "./presentation/resolve";

export default defineConfig({
  name: "museofseoul",
  title: "Muse of Seoul",

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "TODO",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  plugins: [
    structureTool(),
    visionTool(),
    presentationTool({
      resolve,
      previewUrl: {
        origin: process.env.SANITY_STUDIO_PREVIEW_ORIGIN || "http://localhost:3000",
        previewMode: {
          enable: "/api/draft-mode/enable",
        },
      },
    }),
  ],

  schema: {
    types: schemaTypes,
  },
});
