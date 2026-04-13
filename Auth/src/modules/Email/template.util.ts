import fs from "fs";
import path from "path";

export function loadTemplate(
  templateName: string,
  variables: Record<string, string>,
): string {
  const filePath = path.join(
    process.cwd(),
    "src",
    "modules",
    "Email",
    "templates",
    templateName,
  );

  let html = fs.readFileSync(filePath, "utf-8");

  // Replace variables from teh static html.
  Object.keys(variables).forEach((key) => {
    const value = variables[key];

    html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
  });

  return html;
}
